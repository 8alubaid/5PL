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

const sleep_ = ms => new Promise(r => setTimeout(r, ms));

// One POST attempt: the parsed reply, or null when there was no usable answer
// (timeout, dropped connection, an error page instead of JSON).
async function postOnce_(body, ms){
  try {
    const res = await fetchWithTimeout(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    }, ms);
    return await res.json();
  } catch(e){
    state.lastStorageError = friendlyNetworkError_(e);
    return null;
  }
}

// Saves something a player can't easily redo, and never reports a failure it can't
// back up. The backend's response time swings from ~2s to 20s+, and a request that
// times out on OUR side has very often still gone through — so after every attempt,
// answered or not, the saved data is read back before anything is called a failure.
// Sending again is always safe: every save here merges by id or replaces outright.
//
// Resolves to one of:
//   saved   — the read-back shows it, or the backend said ok and a read-back wasn't possible
//   refused — the backend gave a definite "no" with a reason (e.g. حنكة is locked)
//   failed  — the read-back worked and the data really isn't there
//   unknown — nothing could be confirmed either way; the save may well have gone through
// readBack(ms) must resolve true / false / null (null = couldn't read).
async function saveAndConfirm_(body, readBack, opts){
  const o = Object.assign({ budgetMs: 70000, postMs: 30000, readMs: 20000, minStartMs: 15000, pauseMs: 2000, floorMs: 5000 }, opts || {});
  const deadline = Date.now() + o.budgetMs;
  const slice = cap => Math.min(cap, Math.max(o.floorMs, deadline - Date.now()));
  let acked = false, lastRead = null, attempts = 0;
  while(attempts === 0 || deadline - Date.now() >= o.minStartMs){
    attempts++;
    const reply = await postOnce_(body, slice(o.postMs));
    if(reply && reply.ok === false && reply.reason) return { status: 'refused', reply };
    if(reply && reply.ok) acked = true;
    lastRead = await readBack(slice(o.readMs));
    if(lastRead === true) return { status: 'saved' };
    if(acked && lastRead === null) return { status: 'saved' };
    if(deadline - Date.now() >= o.minStartMs) await sleep_(o.pauseMs);
  }
  if(!acked && lastRead === false) return { status: 'failed' };
  return { status: 'unknown' };
}

// Resolves to 'saved' | 'failed' | 'unknown' (see saveAndConfirm_) — not a yes/no,
// because "we couldn't tell" is a real and common answer on a slow connection and
// telling someone "error" when the pick actually saved just sends them round in
// circles. `opts` only exists so tests can shrink the timeouts.
export async function savePrediction(playerId, matchPredictions, opts){
  const r = await saveAndConfirm_({ action: 'savePrediction', playerId, matchPredictions },
    ms => readBackPredictions_(playerId, matchPredictions, ms), opts);
  return r.status === 'refused' ? 'failed' : r.status;
}

// true = every pick is there exactly as sent, false = the read worked and it isn't,
// null = the read itself didn't complete, so nothing can be said.
async function readBackPredictions_(playerId, matchPredictions, ms){
  try {
    const res = await fetchWithTimeout(API_URL + '?key=predictions&cb=' + Date.now(), {}, ms);
    const data = await res.json();
    if(!data || data.value == null) return null;
    const mine = JSON.parse(data.value)[playerId] || {};
    return Object.keys(matchPredictions).every(matchId => {
      const want = matchPredictions[matchId];
      const got = mine[matchId];
      if(!got || got.outcome !== want.outcome) return false;
      if(!want.exact && !got.exact) return true;
      if(!want.exact || !got.exact) return false;
      return Number(got.exact.home) === Number(want.exact.home) && Number(got.exact.away) === Number(want.exact.away);
    });
  } catch(e){
    return null;
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
// season, so a slow answer must not be reported as a failed save. Resolves to
// { ok:true } when saved, the backend's own refusal (e.g. { ok:false, reason:'locked' }),
// or { ok:false, unknown:true } when nothing could be confirmed either way.
export async function saveHankaGuess(playerId, guess, opts){
  const r = await saveAndConfirm_({ action: 'saveHankaGuess', playerId, guess },
    ms => readBackHanka_(playerId, guess, ms), opts);
  if(r.status === 'saved') return { ok: true };
  if(r.status === 'refused') return r.reply;
  return { ok: false, unknown: r.status === 'unknown' };
}

async function readBackHanka_(playerId, guess, ms){
  try {
    const res = await fetchWithTimeout(API_URL + '?key=hanka&cb=' + Date.now(), {}, ms);
    const data = await res.json();
    if(!data || data.value == null) return null;
    const hanka = JSON.parse(data.value);
    const got = hanka.guesses && hanka.guesses[playerId];
    if(!got) return false;
    const sameSet = (a, b) => JSON.stringify((a||[]).slice().sort()) === JSON.stringify((b||[]).slice().sort());
    return got.champion === guess.champion && got.scorer === guess.scorer &&
      got.assist === guess.assist && got.contributor === guess.contributor &&
      sameSet(got.top3, guess.top3) && sameSet(got.relegated, guess.relegated);
  } catch(e){
    return null;
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
