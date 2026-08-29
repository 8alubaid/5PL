import { state } from './state.js';
import { t, toAr } from './i18n.js';
import { esc, prToast } from './utils.js';
import { SATEAMS, teamName, teamBadgeHTML, teamPairHTML, playerAvatarHTML } from './data.js';
import { computeHankaScore, computeHankaStandings } from './scoring.js';
import { saveHankaGuess } from './api.js';
import { render } from './main.js';

function emptyGuess(){
  return { champion: null, top3: [], relegated: [], scorer: '', assist: '', contributor: '' };
}

function initHankaDraft(){
  const existing = state.hanka.guesses[state.session.playerId];
  state.hankaDraft = existing ? {
    champion: existing.champion || null,
    top3: (existing.top3 || []).slice(),
    relegated: (existing.relegated || []).slice(),
    scorer: existing.scorer || '',
    assist: existing.assist || '',
    contributor: existing.contributor || ''
  } : emptyGuess();
  state.hankaViewMode = existing ? 'summary' : 'edit';
}

function teamPickGrid(selected, handler){
  return `<div class="pr-avatar-grid">${SATEAMS.map(team => `
    <button type="button" class="pr-avatar-option ${selected.includes(team)?'active':''}" onclick="${handler}('${team}')" title="${esc(teamName(team))}">
      ${teamBadgeHTML(team, 'pr-team-badge-lg')}
    </button>`).join('')}</div>`;
}

function renderEditForm(){
  const d = state.hankaDraft;
  return `<div class="pr-card">
    <div class="pr-section-title">${t('tabHanka')}</div>
    <div class="pr-hint" style="margin-bottom:14px">${t('hankaHint')}</div>

    <div class="pr-hanka-field">
      <div class="pr-flex-between"><b>${t('hankaChampionLabel')}</b><span class="pr-hint">${t('hankaPickChampionHint')}</span></div>
      ${teamPickGrid(d.champion ? [d.champion] : [], 'prHankaPickChampion')}
    </div>

    <div class="pr-hanka-field">
      <div class="pr-flex-between"><b>${t('hankaTop3Label')}</b><span class="pr-hint">${t('hankaPickThreeHint')} (${toAr(d.top3.length)}/٣)</span></div>
      ${teamPickGrid(d.top3, 'prHankaToggleTop3')}
    </div>

    <div class="pr-hanka-field">
      <div class="pr-flex-between"><b>${t('hankaRelegatedLabel')}</b><span class="pr-hint">${t('hankaPickThreeHint')} (${toAr(d.relegated.length)}/٣)</span></div>
      ${teamPickGrid(d.relegated, 'prHankaToggleRelegated')}
    </div>

    <div class="pr-hanka-field">
      <label class="pr-label">${t('hankaScorerLabel')}</label>
      <input class="pr-input" value="${esc(d.scorer)}" placeholder="${t('hankaNamePlaceholder')}" oninput="prHankaSetText('scorer', this.value)">
    </div>
    <div class="pr-hanka-field">
      <label class="pr-label">${t('hankaAssistLabel')}</label>
      <input class="pr-input" value="${esc(d.assist)}" placeholder="${t('hankaNamePlaceholder')}" oninput="prHankaSetText('assist', this.value)">
    </div>
    <div class="pr-hanka-field">
      <label class="pr-label">${t('hankaContributorLabel')}</label>
      <input class="pr-input" value="${esc(d.contributor)}" placeholder="${t('hankaNamePlaceholder')}" oninput="prHankaSetText('contributor', this.value)">
    </div>

    <div id="hanka-msg" class="pr-hint"></div>
    <div style="margin-top:10px;display:flex;justify-content:flex-end">
      <button class="pr-btn" id="hanka-save-btn" onclick="prHankaSave()">${t('hankaSaveBtn')}</button>
    </div>
  </div>`;
}

function renderSummary(guess){
  const teamsList = arr => arr.map(team => teamPairHTML(team)).join(' ');
  return `<div class="pr-card">
    <div class="pr-section-title">${t('hankaSavedTitle')}</div>
    <div class="pr-hanka-summary-row"><b>${t('hankaChampionLabel')}</b>: ${teamPairHTML(guess.champion)}</div>
    <div class="pr-hanka-summary-row"><b>${t('hankaTop3Label')}</b>: ${teamsList(guess.top3)}</div>
    <div class="pr-hanka-summary-row"><b>${t('hankaRelegatedLabel')}</b>: ${teamsList(guess.relegated)}</div>
    <div class="pr-hanka-summary-row"><b>${t('hankaScorerLabel')}</b>: ${esc(guess.scorer)}</div>
    <div class="pr-hanka-summary-row"><b>${t('hankaAssistLabel')}</b>: ${esc(guess.assist)}</div>
    <div class="pr-hanka-summary-row"><b>${t('hankaContributorLabel')}</b>: ${esc(guess.contributor)}</div>
    ${state.hanka.locked ? `<div class="pr-hint" style="margin-top:10px">${t('hankaLockedHint')}</div>` : `
    <div style="margin-top:14px;display:flex;justify-content:flex-end">
      <button class="pr-btn ghost" onclick="prHankaEdit()">${t('hankaEditBtn')}</button>
    </div>`}
  </div>`;
}

function renderResultsView(){
  const answers = state.hanka.answers;
  const myGuess = state.hanka.guesses[state.session.playerId] || null;
  const myScore = computeHankaScore(myGuess, answers);
  const standings = computeHankaStandings();
  const teamsList = arr => (arr||[]).map(team => teamPairHTML(team)).join(' ');

  const answersCard = `<div class="pr-card">
    <div class="pr-section-title">${t('hankaResultsTitle')}</div>
    <div class="pr-hanka-summary-row"><b>${t('hankaChampionLabel')}</b>: ${answers.champion ? teamPairHTML(answers.champion) : '—'}</div>
    <div class="pr-hanka-summary-row"><b>${t('hankaTop3Label')}</b>: ${teamsList(answers.top3) || '—'}</div>
    <div class="pr-hanka-summary-row"><b>${t('hankaRelegatedLabel')}</b>: ${teamsList(answers.relegated) || '—'}</div>
    <div class="pr-hanka-summary-row"><b>${t('hankaScorerLabel')}</b>: ${esc(answers.scorer || '—')}</div>
    <div class="pr-hanka-summary-row"><b>${t('hankaAssistLabel')}</b>: ${esc(answers.assist || '—')}</div>
    <div class="pr-hanka-summary-row"><b>${t('hankaContributorLabel')}</b>: ${esc(answers.contributor || '—')}</div>
  </div>`;

  const myCard = myGuess ? `<div class="pr-card">
    <div class="pr-flex-between"><div class="pr-section-title">${t('hankaMyGuessTitle')}</div><span style="color:var(--gold-bright);font-weight:700">${t('hankaYourPoints')}: ${toAr(myScore.total)}</span></div>
    <div class="pr-hanka-summary-row">${t('hankaPtsChampion')}: ${teamPairHTML(myGuess.champion)} ${myScore.champion ? '✅ +٥' : '❌'}</div>
    <div class="pr-hanka-summary-row">${t('hankaPtsTop3')}: ${teamsList(myGuess.top3)} (+${toAr(myScore.top3)})</div>
    <div class="pr-hanka-summary-row">${t('hankaPtsRelegated')}: ${teamsList(myGuess.relegated)} (+${toAr(myScore.relegated)})</div>
    <div class="pr-hanka-summary-row">${t('hankaPtsScorer')}: ${esc(myGuess.scorer)} ${myScore.scorer ? '✅ +٥' : '❌'}</div>
    <div class="pr-hanka-summary-row">${t('hankaPtsAssist')}: ${esc(myGuess.assist)} ${myScore.assist ? '✅ +٥' : '❌'}</div>
    <div class="pr-hanka-summary-row">${t('hankaPtsContributor')}: ${esc(myGuess.contributor)} ${myScore.contributor ? '✅ +٥' : '❌'}</div>
  </div>` : '';

  const rows = standings.map((s,i) => `<tr class="${s.player.id===state.session.playerId?'pr-row-me':''}">
    <td class="pr-rank">${toAr(i+1)}</td>
    <td><span class="pr-player-cell">${playerAvatarHTML(s.player,'pr-avatar-sm')}<span>${esc(s.player.name)}</span></span></td>
    <td class="pr-total">${s.guess ? toAr(s.score.total) : `<span class="pr-hint">${t('hankaNoGuessYet')}</span>`}</td>
  </tr>`).join('');

  const standingsCard = `<div class="pr-card">
    <div class="pr-section-title">${t('hankaStandingsTitle')}</div>
    <div style="overflow-x:auto"><table class="pr-table">
      <thead><tr><th></th><th>${t('colPlayer')}</th><th>${t('colTotal')}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>`;

  return answersCard + myCard + standingsCard;
}

export function renderHankaTab(){
  if(state.hanka.answers) return renderResultsView();
  if(!state.hankaDraft) initHankaDraft();
  const myGuess = state.hanka.guesses[state.session.playerId];
  if(myGuess && state.hankaViewMode !== 'edit') return renderSummary(myGuess);
  if(state.hanka.locked && !myGuess) return `<div class="pr-card"><div class="pr-empty">${t('hankaLockedHint')}</div></div>`;
  return renderEditForm();
}

window.prHankaEdit = function(){ state.hankaViewMode = 'edit'; render(); };
window.prHankaSetText = function(field, val){ state.hankaDraft[field] = val; };
window.prHankaPickChampion = function(team){
  state.hankaDraft.champion = state.hankaDraft.champion === team ? null : team;
  render();
};
function toggleMulti(field, team){
  const arr = state.hankaDraft[field];
  const idx = arr.indexOf(team);
  if(idx >= 0){ arr.splice(idx, 1); render(); return; }
  if(arr.length >= 3){ prToast(t('hankaMaxThreeToast'), true); return; }
  arr.push(team);
  render();
}
window.prHankaToggleTop3 = function(team){ toggleMulti('top3', team); };
window.prHankaToggleRelegated = function(team){ toggleMulti('relegated', team); };

window.prHankaSave = async function(){
  const d = state.hankaDraft;
  if(!d.champion || d.top3.length !== 3 || d.relegated.length !== 3 || !d.scorer.trim() || !d.assist.trim() || !d.contributor.trim()){
    document.getElementById('hanka-msg').textContent = t('hankaValidation');
    return;
  }
  const btn = document.getElementById('hanka-save-btn');
  const originalLabel = btn ? btn.textContent : '';
  if(btn){ btn.disabled = true; btn.textContent = t('savingPredictions'); }
  document.getElementById('hanka-msg').textContent = '';
  const guess = {
    champion: d.champion, top3: d.top3.slice(), relegated: d.relegated.slice(),
    scorer: d.scorer.trim(), assist: d.assist.trim(), contributor: d.contributor.trim()
  };
  const result = await saveHankaGuess(state.session.playerId, guess);
  if(result.ok){
    state.hanka.guesses[state.session.playerId] = guess;
    state.hankaViewMode = 'summary';
    render();
    prToast(t('hankaSavedOk'));
    return;
  }
  if(btn){ btn.disabled = false; btn.textContent = originalLabel; }
  prToast(result.reason === 'locked' ? t('hankaLockedToast') : t('savedErr'), true);
};
