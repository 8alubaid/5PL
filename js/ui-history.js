import { state } from './state.js';
import { t, toAr, roundDisplayName } from './i18n.js';
import { teamPairHTML, stadiumName, teamName } from './data.js';
import { esc } from './utils.js';
import { calcRoundScore, matchOutcome } from './scoring.js';

function outcomeLabel(side, m){
  if(side === 'draw') return t('draw');
  return side === 'home' ? esc(teamName(m.home)) : esc(teamName(m.away));
}

export function renderHistoryTab(){
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
