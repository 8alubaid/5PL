import { state } from './state.js';
import { toAr } from './i18n.js';

export function matchOutcome(m){
  if(m.homeScore === m.awayScore) return 'draw';
  return m.homeScore > m.awayScore ? 'home' : 'away';
}
export function calcRoundScore(playerId, rnd){
  const preds = state.predictions[playerId] || {};
  let correctCount = 0, exactBonus = 0, anyFinished = false;
  rnd.matches.forEach(m => {
    if(!m.finished || m.homeScore == null || m.awayScore == null) return;
    anyFinished = true;
    const pred = preds[m.id];
    if(!pred) return;
    const real = matchOutcome(m);
    if(pred.outcome === real) correctCount++;
    if(pred.exact && pred.exact.home !== '' && pred.exact.home != null && pred.exact.away !== '' && pred.exact.away != null){
      if(Number(pred.exact.home) === m.homeScore && Number(pred.exact.away) === m.awayScore) exactBonus += 1;
    }
  });
  let tierPoints = 0;
  if(correctCount >= 8) tierPoints = 5;
  else if(correctCount >= 5) tierPoints = 3;
  return { total: tierPoints + exactBonus, correctCount, tierPoints, exactBonus, anyFinished };
}

export function computeStandings(){
  return state.players.map(pl => {
    let total = 0, exactBonusTotal = 0, roundTotals = {};
    state.rounds.forEach(rnd => {
      const r = calcRoundScore(pl.id, rnd);
      total += r.total; exactBonusTotal += r.exactBonus;
      roundTotals[rnd.id] = r.total;
    });
    let bestRound = null, bestVal = -1;
    state.rounds.forEach(rnd => { if(roundTotals[rnd.id] > bestVal){ bestVal = roundTotals[rnd.id]; bestRound = rnd.name; } });
    return { player: pl, total, exactBonusTotal, bestRound: bestRound || '—', bestVal: bestVal < 0 ? 0 : bestVal };
  }).sort((a,b) => b.total - a.total);
}

export function findOpenRoundId(){
  for(let i = state.rounds.length - 1; i >= 0; i--){
    if(state.rounds[i].matches.some(m => !m.finished)) return state.rounds[i].id;
  }
  return state.rounds.length ? state.rounds[state.rounds.length-1].id : null;
}

// A match is only predictable while it hasn't kicked off, hasn't been marked
// finished, and the organizer hasn't explicitly closed it via its own switch
// (used to hold back a match, or one much later than the rest of its round).
export function isMatchStarted(m){
  if(!m.kickoff) return false;
  return new Date().getTime() >= new Date(m.kickoff).getTime();
}
export function isMatchPredictable(m){
  if(m.finished) return false;
  if(m.predictOpen === false) return false;
  return !isMatchStarted(m);
}

// Shared by the initial render (so a countdown badge never has to flash
// 00:00:00:00 before its first real tick) and main.js's once-a-second interval
// that keeps it updating afterward.
export function countdownParts(kickoffIso){
  const remainingMs = new Date(kickoffIso).getTime() - Date.now();
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  return {
    remainingMs,
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60
  };
}

export function fmtDT(iso){
  if(!iso) return '—';
  const d = new Date(iso);
  return toAr(d.toLocaleString(state.lang === 'en' ? 'en-US' : 'ar-SA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }));
}
