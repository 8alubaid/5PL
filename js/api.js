import { state, API_URL, FIXED_TITLE, FIXED_ADMIN_PIN } from './state.js';

export function fetchWithTimeout(url, opts, ms){
  return Promise.race([
    fetch(url, opts || {}),
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms || 20000))
  ]);
}
export async function sGetAll(){
  try {
    const res = await fetchWithTimeout(API_URL + '?key=all');
    const data = await res.json();
    if(!data || data.value == null){
      // A backend that doesn't understand ?key=all yet returns {value:null}, same as
      // "key not found" — that's a stale/mismatched deploy, not an empty store. Treat it
      // as a failed connection rather than falling through to "no config, write defaults",
      // which would silently overwrite a real config with placeholder values.
      state.lastStorageError = 'الباك إند القديم — أعد نشر Apps Script';
      return { ok: false };
    }
    const all = data.value;
    return {
      ok: true,
      config: all.config ? JSON.parse(all.config) : null,
      players: all.players ? JSON.parse(all.players) : null,
      rounds: all.rounds ? JSON.parse(all.rounds) : null,
      predictions: all.predictions ? JSON.parse(all.predictions) : null
    };
  } catch(e){
    state.lastStorageError = (e && e.message === 'TIMEOUT') ? 'انتهى وقت الانتظار (الاتصال بطيء جدًا أو ما استجاب)' : ((e && e.message) ? e.message : String(e));
    return { ok: false };
  }
}
export async function sSet(key, value){
  try {
    const res = await fetchWithTimeout(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ key, value: JSON.stringify(value) })
    });
    const data = await res.json();
    return !!(data && data.ok);
  } catch(e){ state.lastStorageError = (e && e.message === 'TIMEOUT') ? 'انتهى وقت الانتظار (الاتصال بطيء جدًا أو ما استجاب)' : ((e && e.message) ? e.message : String(e)); return false; }
}

export async function verifyAdminPin(pin){
  try {
    const res = await fetchWithTimeout(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'verifyAdminPin', pin })
    });
    const data = await res.json();
    return !!(data && data.ok);
  } catch(e){
    state.lastStorageError = (e && e.message === 'TIMEOUT') ? 'انتهى وقت الانتظار (الاتصال بطيء جدًا أو ما استجاب)' : ((e && e.message) ? e.message : String(e));
    return false;
  }
}

export async function savePrediction(playerId, matchPredictions){
  try {
    const res = await fetchWithTimeout(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'savePrediction', playerId, matchPredictions })
    });
    const data = await res.json();
    return !!(data && data.ok);
  } catch(e){
    state.lastStorageError = (e && e.message === 'TIMEOUT') ? 'انتهى وقت الانتظار (الاتصال بطيء جدًا أو ما استجاب)' : ((e && e.message) ? e.message : String(e));
    return false;
  }
}

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
    state.lastStorageError = (e && e.message === 'TIMEOUT') ? 'انتهى وقت الانتظار (الاتصال بطيء جدًا أو ما استجاب)' : ((e && e.message) ? e.message : String(e));
    return { ok: false };
  }
}

export async function loadAll(){
  try{
    const all = await sGetAll();
    if(!all.ok){ state.storageHealthy = false; return; }
    state.storageHealthy = true;
    state.config = all.config || { title: FIXED_TITLE, adminPin: FIXED_ADMIN_PIN, pointsExact: 3, pointsWinner: 1 };
    if(!all.config) await sSet('config', state.config);
    state.players = all.players || []; state.rounds = all.rounds || []; state.predictions = all.predictions || {};
    state.loadError = false;
  }catch(e){ state.loadError = true; }
}
