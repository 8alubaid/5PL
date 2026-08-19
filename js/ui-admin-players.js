import { state } from './state.js';
import { t, toAr } from './i18n.js';
import { esc, uid, prToast } from './utils.js';
import { sSet } from './api.js';
import { render } from './main.js';

function randPin(){ return String(Math.floor(1000 + Math.random()*9000)); }

export function renderAdminPlayers(){
  const addForm = `
    <div class="pr-card">
      <div class="pr-section-title">${t('addPlayer')}</div>
      <div class="pr-admin-form-row">
        <input class="pr-input" id="ap-name" placeholder="${t('namePlaceholder')}">
        <input class="pr-input" id="ap-email" type="email" placeholder="${t('emailPlaceholder2')}">
        <input class="pr-input" id="ap-pin" placeholder="${t('pinPlaceholder2')}" value="${randPin()}" style="max-width:150px">
        <button class="pr-btn small" onclick="prAdminAddPlayer()">${t('addBtn')}</button>
      </div>
      <div class="pr-hint">${t('addPlayerHint')}</div>
      <div id="ap-err" class="pr-error"></div>
    </div>`;
  if(!state.players.length) return addForm + `<div class="pr-card"><div class="pr-empty">${t('noPlayersAdded')}</div></div>`;
  const rows = state.players.map(p => {
    if(state.editingPlayerId === p.id){
      return `<div class="pr-match-draft">
        <div class="pr-admin-form-row">
          <input class="pr-input" id="ep-name" value="${esc(p.name)}" placeholder="${t('namePlaceholder')}">
          <input class="pr-input" id="ep-email" type="email" value="${esc(p.email||'')}" placeholder="${t('emailPlaceholder2')}">
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">
          <button class="pr-btn ghost small" onclick="prCancelEditPlayer()">${t('cancel')}</button>
          <button class="pr-btn small" onclick="prSaveEditPlayer('${p.id}')">${t('saveEdit')}</button>
        </div>
      </div>`;
    }
    const suspended = !!p.suspended;
    return `<div class="pr-match" style="${suspended?'opacity:0.55':''}">
      <div style="flex:1; min-width:150px;">
        <b>${esc(p.name)}</b> ${suspended ? `<span class="pr-tag closed">${t('suspended')}</span>` : ''}
        <div class="pr-match-time" style="overflow-wrap:anywhere;">${esc(p.email||'')} — ${t('codeLabel')}${esc(p.pin||'—')}</div>
      </div>
      <button class="pr-btn ghost small" onclick="prStartEditPlayer('${p.id}')">${t('edit')}</button>
      <button class="pr-btn ${suspended?'':'ghost'} small" onclick="prToggleSuspendPlayer('${p.id}')">${suspended?t('activate'):t('suspend')}</button>
      <button class="pr-btn danger small" onclick="prRemovePlayer('${p.id}')">${t('remove')}</button>
    </div>`;
  }).join('');
  return addForm + `<div class="pr-card"><div class="pr-section-title">${t('participantsCount',{n:toAr(state.players.length)})}</div>${rows}</div>`;
}

window.prStartEditPlayer = function(id){ state.editingPlayerId = id; render(); };
window.prCancelEditPlayer = function(){ state.editingPlayerId = null; render(); };
window.prSaveEditPlayer = async function(id){
  const name = document.getElementById('ep-name').value.trim();
  const email = document.getElementById('ep-email').value.trim().toLowerCase();
  if(!name || !email){ prToast(t('validNameEmail'), true); return; }
  if(state.players.some(p => p.id !== id && (p.email||'').trim().toLowerCase() === email)){ prToast(t('emailTaken'), true); return; }
  const p = state.players.find(x => x.id === id);
  const backup = { name: p.name, email: p.email };
  p.name = name; p.email = email;
  const ok = await sSet('players', state.players);
  if(!ok){ p.name = backup.name; p.email = backup.email; prToast(t('saveErrRetry'), true); }
  else prToast(t('editSaved'));
  state.editingPlayerId = null;
  render();
};
window.prToggleSuspendPlayer = async function(id){
  const p = state.players.find(x => x.id === id);
  const prev = !!p.suspended;
  p.suspended = !prev;
  const ok = await sSet('players', state.players);
  if(!ok){ p.suspended = prev; prToast(t('saveErrRetry'), true); }
  else prToast(p.suspended ? t('playerSuspendedToast') : t('playerActivatedToast'));
  render();
};
window.prAdminAddPlayer = async function(){
  const name = document.getElementById('ap-name').value.trim();
  const email = document.getElementById('ap-email').value.trim().toLowerCase();
  const pin = document.getElementById('ap-pin').value.trim();
  const errEl = document.getElementById('ap-err');
  if(!name || !email || !pin){ errEl.textContent = t('validNameEmailPin'); return; }
  if(state.players.some(p => (p.email || '').trim().toLowerCase() === email)){ errEl.textContent = t('emailAlreadyAdded'); return; }
  state.players.push({ id: uid('pl'), name, email, pin, createdAt: new Date().toISOString() });
  const ok = await sSet('players', state.players);
  if(!ok){ errEl.textContent = t('genericSaveErr'); return; }
  render();
};
window.prRemovePlayer = async function(id){
  const playersBackup = state.players, predsBackup = state.predictions;
  state.players = state.players.filter(p => p.id !== id);
  state.predictions = {...state.predictions}; delete state.predictions[id];
  const ok1 = await sSet('players', state.players);
  const ok2 = await sSet('predictions', state.predictions);
  if(!ok1 || !ok2){ state.players = playersBackup; state.predictions = predsBackup; prToast(t('deleteErrRetry'), true); }
  render();
};
