import { state } from './state.js';
import { t, toAr, roundDisplayName } from './i18n.js';
import { teamPairHTML, stadiumName, teamName } from './data.js';
import { esc } from './utils.js';
import { calcRoundScore, matchOutcome, isMatchPredictable } from './scoring.js';
import { loadAll } from './api.js';
import { render } from './main.js';

function outcomeLabel(side, m){
  if(side === 'draw') return t('draw');
  return side === 'home' ? esc(teamName(m.home)) : esc(teamName(m.away));
}

function fmtTime(ts){
  const d = new Date(ts);
  return toAr(d.toLocaleTimeString(state.lang === 'en' ? 'en-US' : 'ar-SA', { hour:'2-digit', minute:'2-digit' }));
}

function renderAdminLiveFeed(){
  if(!state.rounds.length) return `<div class="pr-card"><div class="pr-empty">${t('noRoundsYetHistory')}</div></div>`;
  const rnd = state.rounds[state.rounds.length - 1];
  const openMatches = rnd.matches.filter(m => isMatchPredictable(m));
  const activePlayers = state.players.filter(p => !p.suspended);

  const refreshRow = `<div class="pr-flex-between" style="margin-bottom:6px;flex-wrap:wrap;gap:8px">
    <div class="pr-section-title">${t('liveFeedTitle')} — ${roundDisplayName(rnd.name)}</div>
    <button class="pr-btn ghost small" onclick="prRefreshLiveFeed()">🔄 ${t('refreshNow')}</button>
  </div>
  <div class="pr-hint" style="margin-bottom:10px">${state.lastFeedRefresh ? t('lastUpdated',{time: fmtTime(state.lastFeedRefresh)}) : ''}</div>`;

  if(!openMatches.length){
    return `<div class="pr-card">${refreshRow}<div class="pr-empty">${t('noOpenMatches')}</div></div>`;
  }

  const statuses = activePlayers.map(p => {
    const preds = state.predictions[p.id] || {};
    const count = openMatches.filter(m => preds[m.id] && preds[m.id].outcome).length;
    const status = count === openMatches.length ? 'full' : count > 0 ? 'partial' : 'none';
    return { player: p, count, status };
  });
  const order = { none: 0, partial: 1, full: 2 };
  statuses.sort((a,b) => order[a.status] - order[b.status] || a.player.name.localeCompare(b.player.name, 'ar'));

  const rows = statuses.map(s => {
    const badge = s.status === 'full'
      ? `<span class="pr-tag closed" style="background:rgba(53,199,120,0.22);color:var(--green-bright)">✅ ${t('feedPredicted')}</span>`
      : s.status === 'partial'
      ? `<span class="pr-tag open" style="background:rgba(217,164,65,0.22);color:var(--gold-bright)">⏳ ${t('feedPartial',{n:toAr(s.count),total:toAr(openMatches.length)})}</span>`
      : `<span class="pr-tag open" style="background:rgba(224,87,74,0.18);color:#ff9d90">❌ ${t('feedNotPredicted')}</span>`;
    return `<div class="pr-match" style="flex-wrap:wrap">
      <div style="flex:1;min-width:150px"><b>${esc(s.player.name)}</b></div>
      ${badge}
    </div>`;
  }).join('');

  const fullCount = statuses.filter(s => s.status === 'full').length;
  const summary = t('feedSummary', { predicted: toAr(fullCount), total: toAr(activePlayers.length) });

  return `<div class="pr-card">
    ${refreshRow}
    <div class="pr-hint" style="margin-bottom:10px">${summary}</div>
    ${rows}
  </div>`;
}
window.prRefreshLiveFeed = async function(){
  await loadAll();
  state.lastFeedRefresh = Date.now();
  render();
};

export function renderHistoryTab(){
  if(state.session.isAdmin) return renderAdminLiveFeed();
  if(!state.rounds.length) return `<div class="pr-card"><div class="pr-empty">${t('noRoundsYetHistory')}</div></div>`;
  return state.rounds.slice().reverse().map(rnd => {
    const myPreds = state.predictions[state.session.playerId] || {};
    const score = calcRoundScore(state.session.playerId, rnd);
    const rows = rnd.matches.map(m => {
      const pred = myPreds[m.id];
      const real = m.finished ? matchOutcome(m) : null;
      const realTxt = m.finished ? `${toAr(m.homeScore)} - ${toAr(m.awayScore)}` : t('notFinished');
      const predTxt = pred && pred.outcome ? outcomeLabel(pred.outcome, m) : t('noPrediction');
      const correct = m.finished && pred && pred.outcome === real;
      const exactTxt = pred && pred.exact ? ` 🎯 ${toAr(pred.exact.home)}-${toAr(pred.exact.away)}` : '';
      const exactHit = m.finished && pred && pred.exact && Number(pred.exact.home) === m.homeScore && Number(pred.exact.away) === m.awayScore;
      const pill = !m.finished ? '' : correct ? `<span class="pr-pts-pill pr-pts-3">✅</span>` : `<span class="pr-pts-pill pr-pts-0">❌</span>`;
      const exactPill = exactHit ? `<span class="pr-pts-pill pr-pts-1">🎯 +١</span>` : '';
      return `<div class="pr-match" style="flex-wrap:wrap">
        <div style="flex:1;min-width:140px"><b class="pr-match-title">${teamPairHTML(m.home)} × ${teamPairHTML(m.away)}</b><div class="pr-match-time">${t('resultPrefix')}${realTxt}</div>${m.stadium ? `<div class="pr-match-time">🏟️ ${esc(stadiumName(m.stadium))}</div>` : ''}</div>
        <div style="text-align:end"><div class="pr-match-time">${t('yourPredictionPrefix')}${predTxt}${exactTxt}</div>${pill}${exactPill}</div>
      </div>`;
    }).join('');
    return `<div class="pr-card">
      <div class="pr-flex-between"><div class="pr-section-title">${roundDisplayName(rnd.name)}</div>
      <span style="color:var(--gold-bright);font-weight:700">${toAr(score.total)} ${t('pointsSuffix')}</span></div>
      ${rows}
    </div>`;
  }).join('');
}
