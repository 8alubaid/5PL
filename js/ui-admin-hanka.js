import { state } from './state.js';
import { t, toAr } from './i18n.js';
import { esc, prToast } from './utils.js';
import { SATEAMS, teamName, teamSelectOptions } from './data.js';
import { sSet } from './api.js';
import { render } from './main.js';

function teamCheckboxes(cls, selected){
  return SATEAMS.map(team => `
    <label style="display:inline-flex;align-items:center;gap:4px;margin:4px 12px 4px 0;font-size:12.5px">
      <input type="checkbox" class="${cls}" value="${esc(team)}" ${selected.includes(team)?'checked':''}>
      ${esc(teamName(team))}
    </label>`).join('');
}

export function renderAdminHanka(){
  const activeCount = state.players.filter(p => !p.suspended).length;
  const guessedCount = Object.keys(state.hanka.guesses).length;
  const answers = state.hanka.answers || { champion:null, top3:[], relegated:[], scorer:'', assist:'', contributor:'' };
  return `<div class="pr-card">
    <div class="pr-flex-between"><div class="pr-section-title">${t('hankaAdminTitle')}</div>
      <span class="pr-hint">${t('hankaGuessedCount',{n:toAr(guessedCount),total:toAr(activeCount)})}</span>
    </div>
    <div class="pr-hint" style="margin-bottom:10px">${state.hanka.locked ? t('hankaLockedStatus') : t('hankaUnlockedStatus')}</div>
    <button class="pr-btn ${state.hanka.locked?'ghost':''}" onclick="prToggleHankaLock()">${state.hanka.locked ? t('hankaUnlockBtn') : t('hankaLockBtn')}</button>
  </div>
  <div class="pr-card">
    <div class="pr-section-title">${t('hankaAnswersTitle')}</div>
    <div class="pr-hint" style="margin-bottom:14px">${t('hankaAnswersHint')}</div>

    <label class="pr-label">${t('hankaChampionLabel')}</label>
    <select class="pr-input" id="ha-champion" style="margin-bottom:14px">${teamSelectOptions(answers.champion)}</select>

    <label class="pr-label">${t('hankaTop3Label')}</label>
    <div style="margin-bottom:14px">${teamCheckboxes('ha-top3-cb', answers.top3 || [])}</div>

    <label class="pr-label">${t('hankaRelegatedLabel')}</label>
    <div style="margin-bottom:14px">${teamCheckboxes('ha-relegated-cb', answers.relegated || [])}</div>

    <label class="pr-label">${t('hankaScorerLabel')}</label>
    <input class="pr-input" id="ha-scorer" value="${esc(answers.scorer||'')}" placeholder="${t('hankaNamePlaceholder')}" style="margin-bottom:14px">
    <label class="pr-label">${t('hankaAssistLabel')}</label>
    <input class="pr-input" id="ha-assist" value="${esc(answers.assist||'')}" placeholder="${t('hankaNamePlaceholder')}" style="margin-bottom:14px">
    <label class="pr-label">${t('hankaContributorLabel')}</label>
    <input class="pr-input" id="ha-contributor" value="${esc(answers.contributor||'')}" placeholder="${t('hankaNamePlaceholder')}" style="margin-bottom:14px">

    <button class="pr-btn" id="ha-save-btn" onclick="prSaveHankaAnswers()">${t('hankaSaveAnswersBtn')}</button>
  </div>`;
}

window.prToggleHankaLock = async function(){
  const next = { ...state.hanka, locked: !state.hanka.locked };
  const ok = await sSet('hanka', next);
  if(ok){ state.hanka = next; prToast(state.hanka.locked ? t('hankaLockedStatus') : t('hankaUnlockedStatus')); render(); }
  else prToast(t('saveErrRetry'), true);
};

window.prSaveHankaAnswers = async function(){
  const champion = document.getElementById('ha-champion').value || null;
  const top3 = [...document.querySelectorAll('.ha-top3-cb:checked')].map(el => el.value);
  const relegated = [...document.querySelectorAll('.ha-relegated-cb:checked')].map(el => el.value);
  const scorer = document.getElementById('ha-scorer').value.trim();
  const assist = document.getElementById('ha-assist').value.trim();
  const contributor = document.getElementById('ha-contributor').value.trim();
  const btn = document.getElementById('ha-save-btn');
  const originalLabel = btn.textContent;
  btn.disabled = true; btn.textContent = t('savingPredictions');
  const next = { ...state.hanka, answers: { champion, top3, relegated, scorer, assist, contributor } };
  const ok = await sSet('hanka', next);
  btn.disabled = false; btn.textContent = originalLabel;
  if(ok){ state.hanka = next; prToast(t('hankaAnswersSaved')); render(); }
  else prToast(t('saveErrRetry'), true);
};
