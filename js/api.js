import { state, API_URL, FIXED_TITLE, FIXED_ADMIN_PIN } from './state.js';

export function fetchWithTimeout(url, opts, ms){
  return Promise.race([
    fetch(url, opts || {}),
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms || 20000))
  ]);
}

function friendlyNetworkError_(e){
  return (e && e.message === 'TIMEOUT') ? 'انتهى وقت الانتظار (الاتصال بطيء جدًا أو ما استجاب)' : ((e && e.message) ? e.message : String(e));
}

// Retries are only safe here because every caller of this helper either replaces
// a whole KV value outright or merges by id with the same payload each time —
// resending after a dropped response can never double-apply anything. Actions
// that mutate based on their OWN prior state (logVisit's counter, the avatar
// cooldown timestamp, changeAdminPin's currentPin check) do NOT go through this,
// since a retry there could double-count a visit or make a just-succeeded call
// look like it failed.
async function postWithRetry_(body, attempts){
  attempts = attempts || 3;
  let lastErr = null;
  for(let i = 0; i < attempts; i++){
    try {
      const res = await fetchWithTimeout(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch(e){
      lastErr = e;
      if(i < attempts - 1) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
  state.lastStorageError = friendlyNetworkError_(lastErr);
  return null;
}

// Same reasoning as postWithRetry_, but even simpler to justify: this is a pure
// read, so replaying it on failure has zero side effects. onAttempt (optional)
// lets the caller show "still trying" progress instead of one long silent wait —
// the backend has measured response times anywhere from ~2s to 50+s, so a single
// timed-out attempt used to mean an immediate dead-end error screen for what was
// often just a slow moment that a second try would clear.
async function getWithRetry_(url, attempts, onAttempt){
  attempts = attempts || 3;
  let lastErr = null;
  for(let i = 0; i < attempts; i++){
    if(onAttempt) onAttempt(i + 1, attempts);
    try {
      const res = await fetchWithTimeout(url, {}, 25000);
      return await res.json();
    } catch(e){
      lastErr = e;
      if(i < attempts - 1) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
  state.lastStorageError = friendlyNetworkError_(lastErr);
  return null;
}

export async function sGetAll(onAttempt){
  const data = await getWithRetry_(API_URL + '?key=all', 3, onAttempt);
  if(!data || data.value == null){
    // A backend that doesn't understand ?key=all yet returns {value:null}, same as
    // "key not found" — that's a stale/mismatched deploy, not an empty store. Treat it
    // as a failed connection rather than falling through to "no config, write defaults",
    // which would silently overwrite a real config with placeholder values. If `data`
    // itself is null, getWithRetry_ already set a network-failure message; don't stomp it.
    if(data) state.lastStorageError = 'الباك إند القديم — أعد نشر Apps Script';
    return { ok: false };
  }
  const all = data.value;
  return {
    ok: true,
    config: all.config ? JSON.parse(all.config) : null,
    players: all.players ? JSON.parse(all.players) : null,
    rounds: all.rounds ? JSON.parse(all.rounds) : null,
    predictions: all.predictions ? JSON.parse(all.predictions) : null,
    hanka: all.hanka ? JSON.parse(all.hanka) : null
  };
}
export async function sSet(key, value){
  const data = await postWithRetry_({ key, value: JSON.stringify(value) });
  return !!(data && data.ok);
}

export async function verifyAdminPin(pin){
  const data = await postWithRetry_({ action: 'verifyAdminPin', pin });
  return !!(data && data.ok);
}

// A prediction can't be redone once its match kicks off, so this gets a stronger
// guarantee than a plain retry: after the backend reports success, re-read the
// sheet and only report success once the exact picks we sent are actually there.
// That covers the gap retries alone can't — a request that times out on our end
// but still lands on the server moments later, or a response that got lost.
export async function savePrediction(playerId, matchPredictions){
  const data = await postWithRetry_({ action: 'savePrediction', playerId, matchPredictions });
  if(!data || !data.ok) return false;
  return await verifyPredictionSaved_(playerId, matchPredictions);
}

async function verifyPredictionSaved_(playerId, matchPredictions){
  try {
    const res = await fetchWithTimeout(API_URL + '?key=predictions');
    const data = await res.json();
    if(!data || data.value == null) return false;
    const all = JSON.parse(data.value);
    const mine = all[playerId] || {};
    return Object.keys(matchPredictions).every(matchId => {
      const want = matchPredictions[matchId];
      const got = mine[matchId];
      if(!got || got.outcome !== want.outcome) return false;
      if(!want.exact && !got.exact) return true;
      if(!want.exact || !got.exact) return false;
      return Number(got.exact.home) === Number(want.exact.home) && Number(got.exact.away) === Number(want.exact.away);
    });
  } catch(e){
    return false; // couldn't confirm — report it as unsaved rather than assume it's fine
  }
}

// Not retried: the backend increments visitCount from whatever it currently is,
// so replaying this after a lost response would double-count the visit.
export async function logVisit(playerId){
  try {
    const res = await fetchWithTimeout(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'logVisit', playerId })
    });
    const data = await res.json();
    return data || { ok: false };
  } catch(e){ return { ok: false }; }
}

// Not retried: the backend's cooldown check reads avatarChangedAt, which the
// first attempt just set — a retry right after a real success would see almost
// no elapsed time and come back "cooldown" even though the change already went through.
export async function setPlayerAvatar(playerId, avatarTeam){
  try {
    const res = await fetchWithTimeout(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'setPlayerAvatar', playerId, avatarTeam })
    });
    const data = await res.json();
    return data || { ok: false };
  } catch(e){
    state.lastStorageError = friendlyNetworkError_(e);
    return { ok: false };
  }
}

// Same reasoning as savePrediction — a حنكة guess is one-shot for the whole
// season, so it's worth confirming it actually landed rather than trusting the
// response alone.
export async function saveHankaGuess(playerId, guess){
  const data = await postWithRetry_({ action: 'saveHankaGuess', playerId, guess });
  if(!data || !data.ok) return data || { ok: false };
  const verified = await verifyHankaSaved_(playerId, guess);
  return verified ? data : { ok: false };
}

async function verifyHankaSaved_(playerId, guess){
  try {
    const res = await fetchWithTimeout(API_URL + '?key=hanka');
    const data = await res.json();
    if(!data || data.value == null) return false;
    const hanka = JSON.parse(data.value);
    const got = hanka.guesses && hanka.guesses[playerId];
    if(!got) return false;
    const sameSet = (a, b) => JSON.stringify((a||[]).slice().sort()) === JSON.stringify((b||[]).slice().sort());
    return got.champion === guess.champion && got.scorer === guess.scorer &&
      got.assist === guess.assist && got.contributor === guess.contributor &&
      sameSet(got.top3, guess.top3) && sameSet(got.relegated, guess.relegated);
  } catch(e){
    return false;
  }
}

// Not retried: currentPin is checked against whatever's stored right now — after
// a first attempt actually changes it, a retry sending the same (now-stale)
// currentPin would come back "wrong PIN" even though the change already succeeded.
export async function changeAdminPin(currentPin, newPin){
  try {
    const res = await fetchWithTimeout(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'changeAdminPin', currentPin, newPin })
    });
    const data = await res.json();
    return { ok: !!(data && data.ok), reason: data && data.reason };
  } catch(e){
    state.lastStorageError = friendlyNetworkError_(e);
    return { ok: false };
  }
}

export async function loadAll(onAttempt){
  try{
    const all = await sGetAll(onAttempt);
    if(!all.ok){ state.storageHealthy = false; return; }
    state.storageHealthy = true;
    state.config = all.config || { title: FIXED_TITLE, adminPin: FIXED_ADMIN_PIN, pointsExact: 3, pointsWinner: 1 };
    if(!all.config) await sSet('config', state.config);
    state.players = all.players || []; state.rounds = all.rounds || []; state.predictions = all.predictions || {};
    state.hanka = all.hanka || { locked: false, guesses: {}, answers: null };
    state.loadError = false;
  }catch(e){ state.loadError = true; }
}
