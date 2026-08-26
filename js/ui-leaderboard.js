import { state } from './state.js';
import { t, toAr, roundDisplayName } from './i18n.js';
import { esc } from './utils.js';
import { computeStandings } from './scoring.js';
import { playerAvatarHTML } from './data.js';

export function renderLeaderboardTab(){
  if(!state.players.length) return `<div class="pr-card"><div class="pr-empty">${t('noPlayersYet')}</div></div>`;
  const standings = computeStandings();
  const medals = ['🥇','🥈','🥉'];
  const rows = standings.map((s,i) => `
    <tr class="${s.player.id===state.session.playerId?'pr-row-me':''}">
      <td class="pr-rank">${medals[i] || toAr(i+1)}</td>
      <td><span class="pr-player-cell">${playerAvatarHTML(s.player, 'pr-avatar-sm')}<span>${esc(s.player.name)}</span></span></td>
      <td class="pr-total">${toAr(s.total)}</td>
      <td>${toAr(s.exactBonusTotal)}</td>
      <td>${roundDisplayName(s.bestRound)} (${toAr(s.bestVal)})</td>
    </tr>`).join('');
  return `<div class="pr-card">
    <div class="pr-section-title">${t('overallStandings')}</div>
    <div style="overflow-x:auto"><table class="pr-table">
      <thead><tr><th></th><th>${t('colPlayer')}</th><th>${t('colTotal')}</th><th>${t('colExactBonus')}</th><th>${t('colBestRound')}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>`;
}
