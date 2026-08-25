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

export function isMatchStarted(m){
  if(!m.kickoff) return false;
  return new Date().getTime() >= new Date(m.kickoff).getTime();
}

// Matches the organizer has never touched (predictOpen left unset) lock
// together as a whole round, exactly like the app has always done — once the
// earliest of them kicks off, the rest are revealed too, even if their own
// kickoff hasn't happened yet. This is what stops a normal round from leaking
// predictions match-by-match as each one starts.
//
// A match the organizer has explicitly opened or closed (predictOpen
// true/false) ignores this curtain entirely and is judged purely on its own
// switch state and kickoff — that's what lets one match much later than the
// rest of its round be held back, then reopened independently, without
// waiting on (or being dragged along by) everything else in the round.
export function isRoundCurtainPassed(rnd){
  const untouched = rnd.matches.filter(m => m.predictOpen == null && m.kickoff);
  const pool = untouched.length ? untouched : rnd.matches.filter(m => m.kickoff);
  if(!pool.length) return false;
  const earliest = Math.min(...pool.map(m => new Date(m.kickoff).getTime()));
  return new Date().getTime() >= earliest;
}

export function getMatchState(m, curtainPassed){
  if(m.finished) return 'revealed';
  if(isMatchStarted(m)) return 'revealed';
  if(m.predictOpen === false) return 'pending';
  if(m.predictOpen === true) return 'predict';
  return curtainPassed ? 'revealed' : 'predict';
}

export function fmtDT(iso){
  if(!iso) return '—';
  const d = new Date(iso);
  return toAr(d.toLocaleString(state.lang === 'en' ? 'en-US' : 'ar-SA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }));
}
