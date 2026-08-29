import { state } from './state.js';
import { t } from './i18n.js';
import { makeEmptyDraftMatches } from './utils.js';
import { renderAdminRounds } from './ui-admin-rounds.js';
import { renderAdminPlayers } from './ui-admin-players.js';
import { renderAdminSettings } from './ui-admin-settings.js';
import { renderAdminHanka } from './ui-admin-hanka.js';
import { render } from './main.js';

export function renderAdminTab(content){
  content.innerHTML = `
    <div class="pr-card" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <div>
        <div class="pr-section-title" style="margin-bottom:2px">${t('backupTitle')}</div>
        <div class="pr-hint">${t('backupHint')}</div>
      </div>
      <button class="pr-btn" onclick="prExportExcel()">${t('downloadExcel')}</button>
    </div>
    <div class="pr-tabs" style="margin-bottom:16px">
      <button class="pr-tab ${state.adminSubTab==='rounds'?'active':''}" onclick="prAdminSub('rounds')">${t('adminTabRounds')}</button>
      <button class="pr-tab ${state.adminSubTab==='players'?'active':''}" onclick="prAdminSub('players')">${t('adminTabPlayers')}</button>
      <button class="pr-tab ${state.adminSubTab==='hanka'?'active':''}" onclick="prAdminSub('hanka')">${t('adminTabHanka')}</button>
      <button class="pr-tab ${state.adminSubTab==='settings'?'active':''}" onclick="prAdminSub('settings')">${t('adminTabSettings')}</button>
    </div>
    <div id="admin-body"></div>`;
  const body = document.getElementById('admin-body');
  if(state.adminSubTab === 'rounds') body.innerHTML = renderAdminRounds();
  else if(state.adminSubTab === 'players') body.innerHTML = renderAdminPlayers();
  else if(state.adminSubTab === 'hanka') body.innerHTML = renderAdminHanka();
  else body.innerHTML = renderAdminSettings();
}

window.prAdminSub = function(tab){
  state.adminSubTab = tab;
  state.draftMatches = makeEmptyDraftMatches();
  state.draftRoundName = '';
  state.importStatus = '';
  state.editingRoundId = null;
  state.roundEditDraft = {};
  render();
};
