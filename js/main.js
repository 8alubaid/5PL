import { state, FIXED_TITLE_EN, API_URL, loadLang, clearSession, loadSession } from './state.js';
import { t, toAr } from './i18n.js';
import { esc } from './utils.js';
import { root } from './dom.js';
import { langToggleBtn, toggleLang, applyDirAttrs } from './ui-common.js';
import { loadAll } from './api.js';
import { renderLogin } from './ui-login.js';
import { renderPredictTab } from './ui-predict.js';
import { renderLeaderboardTab } from './ui-leaderboard.js';
import { renderHistoryTab } from './ui-history.js';
import { renderAdminTab } from './ui-admin.js';
import './export-excel.js';
import { SATEAMS } from './data.js';

export function render(){
  if(!state.storageHealthy){
    // We can't tell yet whether this browser belongs to the admin (session hasn't
    // loaded — storage is what failed), so fall back to the last locally-remembered
    // role. Only that case gets the technical detail; everyone else sees a plain,
    // non-technical message.
    const knownAdmin = !!((loadSession() || {}).isAdmin);
    root.innerHTML = `<div class="pr-center-screen"><div class="pr-card" style="max-width:440px;text-align:center">
      <div class="pr-section-title" style="justify-content:center">${knownAdmin ? t('storageNotConnected') : t('connectionError')}</div>
      <div class="pr-hint" style="margin-bottom:14px">${knownAdmin ? t('storageNotConnectedHint') : t('connectionErrorHint')}</div>
      ${knownAdmin && state.lastStorageError ? `<div class="pr-hint" style="margin-bottom:14px;direction:ltr;text-align:left;background:rgba(0,0,0,0.25);padding:8px;border-radius:8px;font-size:11px;word-break:break-all">${esc(state.lastStorageError)}</div>` : ''}
      <button class="pr-btn" onclick="prBoot()">${t('retry')}</button>
    </div></div>`;
    return;
  }
  if(state.loadError){
    root.innerHTML = `<div class="pr-center-screen"><div style="text-align:center">
      <div style="margin-bottom:10px">${t('loadFailed')}</div>
      <button class="pr-btn" onclick="prBoot()">${t('retry')}</button>
    </div></div>`;
    return;
  }
  if(!state.session.playerId && !state.session.isAdmin){ renderLogin(); return; }
  renderApp();
}

function renderApp(){
  const badgeName = state.session.isAdmin ? t('organizer') : state.session.playerName;
  root.innerHTML = `
    <div class="pr-header">
      <div class="pr-title-row">
        <img src="logo.png" alt="" class="pr-logo pr-logo-header">
        <span class="pr-title-text">${state.lang==='en' ? FIXED_TITLE_EN : toAr(esc(state.config.title))}</span>
      </div>
      <div class="pr-header-right">
        ${langToggleBtn()}
        <div class="pr-user-badge"><span class="pr-avatar">${esc((badgeName||'?').trim().charAt(0))}</span><b>${esc(badgeName)}</b> <button class="pr-logout" onclick="prLogout()">${t('logout')}</button></div>
      </div>
      <div class="pr-subtitle">${t('subtitle')}</div>
    </div>
    <div class="pr-tabs" id="pr-tabs"></div>
    <div id="pr-content"></div>
  `;
  const tabsEl = document.getElementById('pr-tabs');
  const tabs = state.session.isAdmin
    ? [['admin', t('tabControlPanel')],['leaderboard', t('tabStandings')],['history', t('tabHistory')]]
    : [['predict', t('tabPredict')],['leaderboard', t('tabStandings')],['history', t('tabPrevious')]];
  tabsEl.innerHTML = tabs.map(([k,l]) => `<button class="pr-tab ${state.activeTab===k?'active':''}" onclick="prSetTab('${k}')">${l}</button>`).join('');
  const content = document.getElementById('pr-content');
  if(state.activeTab === 'predict') content.innerHTML = renderPredictTab();
  else if(state.activeTab === 'leaderboard') content.innerHTML = renderLeaderboardTab();
  else if(state.activeTab === 'history') content.innerHTML = renderHistoryTab();
  else if(state.activeTab === 'admin') renderAdminTab(content);
}

// findOpenRoundId is used when switching to the predict tab so the first open round
// is pre-selected — imported lazily here to avoid a circular top-level dependency.
import { findOpenRoundId } from './scoring.js';

window.prSetTab = function(tab){ state.activeTab = tab; if(tab !== 'admin') state.selectedRoundId = state.selectedRoundId || findOpenRoundId(); render(); };
window.prLogout = function(){ state.session = { playerId:null, playerName:null, isAdmin:false }; state.loginMode = 'player'; clearSession(); render(); };
window.prToggleLang = function(){ toggleLang(); render(); };

function injectDatalist(){
  let dl = document.getElementById('pr-teams');
  if(!dl){ dl = document.createElement('datalist'); dl.id = 'pr-teams'; document.body.appendChild(dl); }
  dl.innerHTML = SATEAMS.map(team => `<option value="${esc(team)}">`).join('');
}

window.prBoot = async function(){
  state.lang = loadLang();
  applyDirAttrs();
  root.innerHTML = `<div class="pr-center-screen"><div class="pr-loader"><span></span><span></span><span></span></div></div>`;
  injectDatalist();
  if(API_URL.indexOf('PASTE_YOUR') === 0){ state.storageHealthy = false; render(); return; }
  await loadAll();
  if(!state.storageHealthy){ render(); return; }
  const saved = loadSession();
  if(saved){
    if(saved.isAdmin){ state.session.isAdmin = true; state.activeTab = 'admin'; }
    else if(saved.playerId){
      const p = state.players.find(x => x.id === saved.playerId);
      if(p && !p.suspended){ state.session.playerId = p.id; state.session.playerName = p.name; state.activeTab = 'predict'; }
      else clearSession();
    } else { clearSession(); }
  }
  render();
};

window.prBoot();
setInterval(() => {
  // Skip while the organizer is on the admin tab — its forms (match edit, score entry,
  // add player, etc.) aren't wired to a live draft, so an auto re-render here would
  // silently wipe whatever they're mid-typing before they hit save.
  if(state.session.isAdmin && state.activeTab === 'admin') return;
  if(state.config && (state.session.playerId || state.session.isAdmin)) render();
}, 30000);
