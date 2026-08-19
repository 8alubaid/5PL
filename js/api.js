import { state, API_URL, FIXED_TITLE, FIXED_ADMIN_PIN } from './state.js';

export function fetchWithTimeout(url, opts, ms){
  return Promise.race([
    fetch(url, opts || {}),
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms || 20000))
  ]);
}
export async function sGet(key){
  try {
    const res = await fetchWithTimeout(API_URL + '?key=' + encodeURIComponent(key));
    const data = await res.json();
    return { ok: true, value: data && data.value ? JSON.parse(data.value) : null };
  } catch(e){
    state.lastStorageError = (e && e.message === 'TIMEOUT') ? 'انتهى وقت الانتظار (الاتصال بطيء جدًا أو ما استجاب)' : ((e && e.message) ? e.message : String(e));
    return { ok: false, value: null };
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
    const [c,p,r,pr] = await Promise.all([sGet('config'), sGet('players'), sGet('rounds'), sGet('predictions')]);
    if(!c.ok || !p.ok || !r.ok || !pr.ok){ state.storageHealthy = false; return; }
    state.storageHealthy = true;
    state.config = c.value || { title: FIXED_TITLE, adminPin: FIXED_ADMIN_PIN, pointsExact: 3, pointsWinner: 1 };
    if(!c.value) await sSet('config', state.config);
    state.players = p.value || []; state.rounds = r.value || []; state.predictions = pr.value || {};
    state.loadError = false;
  }catch(e){ state.loadError = true; }
}
