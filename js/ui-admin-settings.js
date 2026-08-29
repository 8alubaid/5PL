import { state, FIXED_TITLE_EN } from './state.js';
import { t, toAr } from './i18n.js';
import { esc, prToast } from './utils.js';
import { changeAdminPin } from './api.js';
import { render } from './main.js';

export function renderAdminSettings(){
  return `<div class="pr-card">
    <div class="pr-section-title">${t('settingsTitle')}</div>
    <label class="pr-label">${t('compNameLabel')}</label>
    <input class="pr-input" value="${state.lang==='en' ? FIXED_TITLE_EN : toAr(esc(state.config.title))}" disabled style="margin-bottom:12px;opacity:0.7">
    <div class="pr-hint">${t('pointsRulesHint')}</div>
  </div>
  <div class="pr-card">
    <div class="pr-section-title">${t('changeAdminPinTitle')}</div>
    <label class="pr-label">${t('currentPinLabel')}</label>
    <input class="pr-input" id="cap-current" type="password" inputmode="numeric" style="margin-bottom:12px">
    <label class="pr-label">${t('newPinLabel')}</label>
    <input class="pr-input" id="cap-new" type="password" inputmode="numeric" style="margin-bottom:12px">
    <label class="pr-label">${t('confirmNewPinLabel')}</label>
    <input class="pr-input" id="cap-confirm" type="password" inputmode="numeric" style="margin-bottom:12px">
    <button class="pr-btn" id="cap-btn" onclick="prChangeAdminPin()">${t('changePinBtn')}</button>
    <div id="cap-err" class="pr-error"></div>
  </div>`;
}

window.prChangeAdminPin = async function(){
  const currentPin = document.getElementById('cap-current').value.trim();
  const newPin = document.getElementById('cap-new').value.trim();
  const confirmPin = document.getElementById('cap-confirm').value.trim();
  const errEl = document.getElementById('cap-err');
  errEl.textContent = '';
  if(!currentPin || !newPin || !confirmPin){ errEl.textContent = t('fillAllPinFields'); return; }
  if(newPin !== confirmPin){ errEl.textContent = t('pinMismatch'); return; }
  const btn = document.getElementById('cap-btn');
  const originalLabel = btn.textContent;
  btn.disabled = true; btn.textContent = t('changingPin');
  const result = await changeAdminPin(currentPin, newPin);
  btn.disabled = false; btn.textContent = originalLabel;
  if(result.ok){
    prToast(t('pinChanged'));
    render();
  } else if(result.reason === 'wrong_pin'){
    errEl.textContent = t('wrongCurrentPin');
  } else {
    errEl.textContent = t('saveErrRetry');
  }
};
