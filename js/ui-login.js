import { state, FIXED_TITLE_EN, saveSession } from './state.js';
import { t, toAr } from './i18n.js';
import { esc } from './utils.js';
import { root } from './dom.js';
import { langToggleBtn } from './ui-common.js';
import { render } from './main.js';
import { verifyAdminPin } from './api.js';

export function renderLogin(){
  root.innerHTML = `
    <div class="pr-center-screen"><div class="pr-card pr-login-card">
      ${langToggleBtn('pr-lang-toggle-corner')}
      <div class="pr-login-crest"><img src="logo.png" alt="" class="pr-logo pr-logo-lg"></div>
      <div class="pr-title pr-title-center">${state.lang==='en' ? FIXED_TITLE_EN : toAr(esc(state.config.title))}</div>
      <div class="pr-hint pr-login-sub">${t('subtitle')}</div>
      <div class="pr-tabs">
        <button class="pr-tab ${state.loginMode!=='admin'?'active':''}" onclick="prSetLoginMode('player')">${t('player')}</button>
        <button class="pr-tab ${state.loginMode==='admin'?'active':''}" onclick="prSetLoginMode('admin')">${t('organizer')}</button>
      </div>
      <div id="login-body"></div>
      <div id="login-err" class="pr-error"></div>
    </div></div>`;
  renderLoginBody();
}

function renderLoginBody(){
  const body = document.getElementById('login-body');
  if(state.loginMode === 'admin'){
    body.innerHTML = `
      <label class="pr-label">${t('adminPinLabel')}</label>
      <input class="pr-input" id="lg-pin" type="password" inputmode="numeric">
      <button class="pr-btn" id="admin-login-btn" onclick="prAdminLogin()">${t('enterAdmin')}</button>`;
  } else {
    body.innerHTML = `
      <label class="pr-label">${t('emailLabel')}</label>
      <input class="pr-input" id="lg-email" type="email" placeholder="${t('emailPlaceholder')}">
      <label class="pr-label">${t('pinLabel')}</label>
      <input class="pr-input" id="lg-pin" type="password" inputmode="numeric" placeholder="${t('pinPlaceholder')}">
      <button class="pr-btn" onclick="prPlayerLogin()">${t('loginBtn')}</button>`;
  }
}

window.prSetLoginMode = function(m){ state.loginMode = m; renderLogin(); };

window.prAdminLogin = async function(){
  const pin = document.getElementById('lg-pin').value.trim();
  const btn = document.getElementById('admin-login-btn');
  document.getElementById('login-err').textContent = '';
  if(btn) btn.disabled = true;
  const ok = await verifyAdminPin(pin);
  if(btn) btn.disabled = false;
  if(ok){ state.session.isAdmin = true; state.activeTab = 'admin'; saveSession(); render(); }
  else document.getElementById('login-err').textContent = t('errBadPin');
};

window.prPlayerLogin = async function(){
  const email = document.getElementById('lg-email').value.trim().toLowerCase();
  const pin = document.getElementById('lg-pin').value.trim();
  if(!email || !pin){ document.getElementById('login-err').textContent = t('errFillBoth'); return; }
  const existing = state.players.find(p => (p.email || '').trim().toLowerCase() === email);
  if(!existing){ document.getElementById('login-err').textContent = t('errEmailNotFound'); return; }
  if((existing.pin || '') !== pin){ document.getElementById('login-err').textContent = t('errWrongPin'); return; }
  if(existing.suspended){ document.getElementById('login-err').textContent = t('errSuspended'); return; }
  state.session.playerId = existing.id; state.session.playerName = existing.name;
  state.activeTab = 'predict';
  saveSession();
  render();
};
