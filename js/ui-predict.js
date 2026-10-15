import { state } from './state.js';
import { t } from './i18n.js';
import { esc, prToast } from './utils.js';
import { toAr, toWest, roundDisplayName } from './i18n.js';
import { teamName, teamPairHTML, teamBadgeHTML, drawBadgeHTML, stadiumName, playerAvatarHTML, iconHTML, postponedNoteHTML, postponedPillHTML } from './data.js';
import { calcRoundScore, matchOutcome, findOpenRoundId, fmtDT, isMatchPredictable, isMatchStarted, countdownParts } from './scoring.js';
import { savePrediction } from './api.js';
import { render } from './main.js';

function initDraft(rnd){
  state.predictDraft = {};
  const myPreds = state.predictions[state.session.playerId] || {};
  rnd.matches.forEach(m => {
    const p = myPreds[m.id];
    state.predictDraft[m.id] = {
      outcome: p ? p.outcome || null : null,
      isExact: !!(p && p.exact),
      exactHome: p && p.exact ? p.exact.home : '',
      exactAway: p && p.exact ? p.exact.away : ''
    };
  });
  // Default to the read-only summary if every currently-open match already has a
  // saved pick — that's the common case of just checking back on a round you
  // already finished, not one you're still filling in.
  const predictable = rnd.matches.filter(m => isMatchPredictable(m));
  const allSaved = predictable.length > 0 && predictable.every(m => myPreds[m.id] && myPreds[m.id].outcome);
  state.predictViewMode = allSaved ? 'summary' : 'edit';
}
function outcomeLabel(side, m){
  if(side === 'draw') return t('draw');
  return side === 'home' ? esc(teamName(m.home)) : esc(teamName(m.away));
}

// What sits beside a match's teams: its kickoff — or, for a postponed game that
// hasn't been played yet, a badge saying it's postponed, with its new date.
const matchWhenHTML = m => (m.postponed && !m.finished)
  ? postponedPillHTML(m)
  : `<span class="pr-match-time">${fmtDT(m.kickoff)}</span>`;

// Only one match per round can carry the exact-score bonus. Matches close
// independently now, so a player can save an exact pick on an early match,
// then come back once later matches open up — that earlier match is already
// locked (no longer predictable) and its saved exact can never be changed
// again, so the round's exact bonus is considered "spent" on it.
function lockedExactMatchId(rnd, excludeId){
  const myPreds = state.predictions[state.session.playerId] || {};
  const m = rnd.matches.find(x => x.id !== excludeId && !isMatchPredictable(x) && myPreds[x.id] && myPreds[x.id].exact);
  return m ? m.id : null;
}

function renderRevealedRow(m){
  const matchDecided = m.finished && m.homeScore != null && m.awayScore != null;
  const realOutcome = matchDecided ? matchOutcome(m) : null;
  const allPicks = state.players.map(pl => {
    const pred = (state.predictions[pl.id] || {})[m.id];
    const isMe = pl.id === state.session.playerId;
    let txt = '—';
    let bg = isMe ? 'rgba(217,164,65,0.25)' : 'rgba(255,255,255,0.06)';
    let color = isMe ? 'var(--gold-bright)' : 'var(--text-dim)';
    let exactHit = false;
    if(pred && pred.outcome){
      txt = outcomeLabel(pred.outcome, m);
      const hasExact = pred.exact && pred.exact.home !== '' && pred.exact.home != null;
      if(hasExact){
        txt += ` (${iconHTML('target')} ${toAr(pred.exact.home)}-${toAr(pred.exact.away)})`;
      }
      if(matchDecided){
        const correct = pred.outcome === realOutcome;
        exactHit = correct && hasExact && Number(pred.exact.home) === m.homeScore && Number(pred.exact.away) === m.awayScore;
        bg = correct ? 'rgba(53,199,120,0.22)' : 'rgba(224,87,74,0.18)';
        color = correct ? 'var(--green-bright)' : '#ff9d90';
      }
    }
    const meBorder = isMe ? 'box-shadow:0 0 0 1.5px var(--gold-bright) inset;' : '';
    const exactClass = exactHit ? ' pr-exact-hit' : '';
    return `<span class="${exactClass}" style="display:inline-block;margin:3px 6px 3px 0;padding:3px 9px;border-radius:999px;font-size:12px;${exactHit ? '' : `background:${bg};color:${color};`}${meBorder}">${esc(pl.name)}: ${txt}</span>`;
  }).join('');
  const realTxt = m.finished ? `${toAr(m.homeScore)} - ${toAr(m.awayScore)}` : '';
  return `<div style="padding:12px 6px;border-bottom:1px dashed rgba(255,255,255,0.08)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px">
      <b class="pr-match-title">${teamPairHTML(m.home)} × ${teamPairHTML(m.away)}</b>
      ${m.finished ? `<span class="pr-match-time">${t('resultPrefix')}${realTxt}</span>` : matchWhenHTML(m)}
    </div>
    ${m.stadium ? `<div class="pr-hint" style="margin:-4px 0 8px">${esc(stadiumName(m.stadium))}</div>` : ''}
    <div>${allPicks || `<span class="pr-hint">${t('noOneYet')}</span>`}</div>
  </div>`;
}

function renderPendingRow(m){
  return `<div style="padding:12px 6px;border-bottom:1px dashed rgba(255,255,255,0.08)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px">
      <b class="pr-match-title">${teamPairHTML(m.home)} × ${teamPairHTML(m.away)}</b>
      ${matchWhenHTML(m)}
    </div>
    ${m.stadium ? `<div class="pr-hint" style="margin:-2px 0 6px">${esc(stadiumName(m.stadium))}</div>` : ''}
    ${postponedNoteHTML(m)}
    <div class="pr-hint">${iconHTML('lock')} ${t('predictionsNotOpenYet')}</div>
  </div>`;
}

// Renders a live-ticking D/H/M/S badge counting down to kickoff. The numbers
// are plain Western digits on purpose (never run through toAr) even in
// Arabic mode — a ticking countdown reads better with fixed-width digits than
// with Arabic-Indic ones. Its own setInterval in main.js keeps it updating by
// writing straight into these elements' text, without touching render() —
// re-rendering every second here would fight with someone mid-typing an
// exact score. data-deadline is what that interval reads to do the math.
function renderCountdown(m){
  if(!m.kickoff) return '';
  // Computed up front so the badge shows the correct numbers from the instant
  // it appears — main.js's ticking interval only has to take over from here,
  // never fill in a placeholder first.
  const p = countdownParts(m.kickoff);
  const pad = n => String(n).padStart(2,'0');
  const seg = (unit, val, label) => `<div class="pr-countdown-seg"><span class="pr-countdown-num" data-unit="${unit}">${pad(val)}</span><span class="pr-countdown-unit-label">${label}</span></div>`;
  return `<div class="pr-countdown ${p.remainingMs < 60*60*1000 ? 'urgent' : ''}" id="pr-countdown-${m.id}" data-deadline="${m.kickoff}">
    <span class="pr-countdown-title">${t('countdownLabel')}</span>
    <div class="pr-countdown-units">
      ${seg('d', p.days, t('countdownDays'))}<span class="pr-countdown-sep">:</span>
      ${seg('h', p.hours, t('countdownHours'))}<span class="pr-countdown-sep">:</span>
      ${seg('m', p.minutes, t('countdownMinutes'))}<span class="pr-countdown-sep">:</span>
      ${seg('s', p.seconds, t('countdownSeconds'))}
    </div>
  </div>`;
}

function renderSummaryRow(m){
  const d = state.predictDraft[m.id] || {};
  let txt = d.outcome ? outcomeLabel(d.outcome, m) : t('noPrediction');
  if(d.isExact && d.exactHome !== '' && d.exactHome != null && d.exactAway !== '' && d.exactAway != null){
    txt += ` (${iconHTML('target')} ${toAr(d.exactHome)}-${toAr(d.exactAway)})`;
  }
  return `<div style="padding:12px 6px;border-bottom:1px dashed rgba(255,255,255,0.08)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px">
      <b class="pr-match-title">${teamPairHTML(m.home)} × ${teamPairHTML(m.away)}</b>
      ${matchWhenHTML(m)}
    </div>
    ${m.stadium ? `<div class="pr-hint" style="margin:-2px 0 6px">${esc(stadiumName(m.stadium))}</div>` : ''}
    ${postponedNoteHTML(m)}
    <div class="pr-hint">${iconHTML('check-circle')} ${t('yourPredictionPrefix')}<b style="color:var(--text)">${txt}</b></div>
    ${renderCountdown(m)}
  </div>`;
}

function renderPredictRow(m, exactLocked){
  const d = state.predictDraft[m.id] || { outcome:null, isExact:false, exactHome:'', exactAway:'' };
  const btn = (side, badge, label) => `<button type="button" class="pr-outcome-btn ${d.outcome===side?'active':''}" onclick="prPickOutcome('${m.id}','${side}')">${badge}<span class="pr-outcome-label">${label}</span></button>`;
  return `
  <div class="pr-match-predict">
    <div class="pr-flex-between" style="margin-bottom:8px">
      <b class="pr-match-title">${teamPairHTML(m.home)} × ${teamPairHTML(m.away)}</b>
      ${matchWhenHTML(m)}
    </div>
    ${m.stadium ? `<div class="pr-hint" style="margin:-4px 0 8px">${esc(stadiumName(m.stadium))}</div>` : ''}
    ${postponedNoteHTML(m)}
    ${renderCountdown(m)}
    <div class="pr-outcome-row" style="margin-top:10px">
      ${btn('home', teamBadgeHTML(m.home,'pr-team-badge-lg'), esc(teamName(m.home)))}
      ${btn('draw', drawBadgeHTML('pr-team-badge-lg'), t('draw'))}
      ${btn('away', teamBadgeHTML(m.away,'pr-team-badge-lg'), esc(teamName(m.away)))}
    </div>
    ${exactLocked ? `
    <div class="pr-hint" style="margin-top:8px">${iconHTML('target')} ${t('exactUsedElsewhere')}</div>` : `
    <label class="pr-exact-toggle">
      <input type="checkbox" ${d.isExact?'checked':''} onchange="prToggleExact('${m.id}', this.checked)">
      ${iconHTML('target')} ${t('exactToggleLabel')}
    </label>
    ${d.isExact ? `
    <div class="pr-score-box" style="margin-top:8px">
      <input type="text" inputmode="numeric" maxlength="2" value="${toAr(d.exactHome)}" oninput="prDigitInput(this); prSetExactVal('${m.id}','home',this.value)">
      <span class="pr-score-dash">–</span>
      <input type="text" inputmode="numeric" maxlength="2" value="${toAr(d.exactAway)}" oninput="prDigitInput(this); prSetExactVal('${m.id}','away',this.value)">
    </div>` : ''}`}
  </div>`;
}

// Shown once every match in a round has a final result — a simple "who did
// best this round" table, separate from the season-long standings tab.
function renderRoundLeaderboard(rnd){
  const rows = state.players
    .map(pl => ({ player: pl, score: calcRoundScore(pl.id, rnd) }))
    .sort((a,b) => b.score.total - a.score.total || b.score.correctCount - a.score.correctCount);
  const medalColors = ['var(--gold-bright)', '#c9ced6', '#c98a52'];
  const tableRows = rows.map((r,i) => `
    <tr class="${r.player.id===state.session.playerId?'pr-row-me':''}">
      <td class="pr-rank">${i < 3 ? iconHTML('medal','',`color:${medalColors[i]}`) : toAr(i+1)}</td>
      <td><span class="pr-player-cell">${playerAvatarHTML(r.player,'pr-avatar-sm')}<span>${esc(r.player.name)}</span></span></td>
      <td class="pr-total">${toAr(r.score.total)}</td>
      <td>${toAr(r.score.correctCount)}/${toAr(rnd.matches.length)}</td>
      <td>${r.score.exactBonus ? iconHTML('target')+' +'+toAr(r.score.exactBonus) : '—'}</td>
    </tr>`).join('');
  return `<div class="pr-card" style="margin-top:16px">
    <div class="pr-section-title">${iconHTML('medal')} ${t('roundLeaderboardTitle',{round:roundDisplayName(rnd.name)})}</div>
    <div style="overflow-x:auto"><table class="pr-table">
      <thead><tr><th></th><th>${t('colPlayer')}</th><th>${t('colTotal')}</th><th>${t('colCorrect')}</th><th>${iconHTML('target')} ${t('colExactBonus')}</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table></div>
  </div>`;
}

// What sits under the Save button while a save is running or after it couldn't be
// confirmed. It lives in app state, not on the DOM node: the page re-renders itself
// every 30s and a save on a slow connection can easily outlast that, which used to
// quietly reset the button to an active "Save" (and wipe the message) mid-save.
function saveStatusHTML(rnd){
  const saving = state.predictSaving;
  if(saving && saving.roundId === rnd.id) return saving.slow ? `${iconHTML('hourglass')} ${t('savingSlow')}` : '';
  const n = state.predictSaveNotice;
  if(n && n.roundId === rnd.id){
    if(n.kind === 'unknown') return `<div>${iconHTML('warning')} ${t('savedUnknown')}</div><button type="button" class="pr-btn ghost small" style="margin-top:8px" onclick="location.reload()">${iconHTML('refresh')} ${t('refreshPage')}</button>`;
    if(n.kind === 'failed') return `${iconHTML('x-circle')} ${t('savedErr')}`;
  }
  return '';
}

// Round switcher: previous/next arrows around one big button showing the current
// round. That button is a native <select> made invisible on top of the styled
// label, so on a phone a tap opens the phone's own round picker. Replaces a row of
// chips that had to be scrolled sideways — already 9 wide, and 34 by season's end.
const chevronSVG = d => `<svg class="pr-chev" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
// Says how many games are still open rather than calling the round "open" — a
// round where only a postponed game is left must not look like every pick in it
// can still be changed. Arabic counts take different noun forms by number.
function openMatchesLabel(r){
  const n = r.matches.filter(m => isMatchPredictable(m)).length;
  if(!n) return '';
  if(n === 1) return t('openMatchesOne');
  if(n === 2) return t('openMatchesTwo');
  return t(n <= 10 ? 'openMatchesFew' : 'openMatchesMany', { n: toAr(n) });
}

function renderRoundNav(rnd){
  const idx = state.rounds.findIndex(r => r.id === rnd.id);
  const options = state.rounds.map(r => {
    const open = openMatchesLabel(r);
    return `<option value="${r.id}" ${r.id === rnd.id ? 'selected' : ''}>${roundDisplayName(r.name)}${open ? ' — ' + open : ''}</option>`;
  }).join('');
  const currentOpen = openMatchesLabel(rnd);
  return `<div class="pr-round-nav">
    <button type="button" class="pr-round-step" onclick="prStepRound(-1)" ${idx <= 0 ? 'disabled' : ''} aria-label="${t('prevRound')}" title="${t('prevRound')}">${chevronSVG('M15 6l-6 6 6 6')}</button>
    <label class="pr-round-current">
      <span class="pr-round-current-name">${roundDisplayName(rnd.name)}<svg class="pr-round-caret" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      ${currentOpen ? `<span class="pr-round-current-sub">${currentOpen}</span>` : ''}
      <select class="pr-round-native" onchange="prSelectRound(this.value)" aria-label="${t('chooseRound')}">${options}</select>
    </label>
    <button type="button" class="pr-round-step" onclick="prStepRound(1)" ${idx >= state.rounds.length - 1 ? 'disabled' : ''} aria-label="${t('nextRound')}" title="${t('nextRound')}">${chevronSVG('M9 6l6 6-6 6')}</button>
  </div>`;
}

export function renderPredictTab(){
  if(!state.rounds.length) return `<div class="pr-card"><div class="pr-empty">${t('noRoundsYet')}</div></div>`;
  if(!state.selectedRoundId) state.selectedRoundId = findOpenRoundId();
  const rnd = state.rounds.find(r => r.id === state.selectedRoundId) || state.rounds[0];

  if(!state.predictDraftRoundId || state.predictDraftRoundId !== rnd.id){ initDraft(rnd); state.predictDraftRoundId = rnd.id; }

  // Each match is judged on its own — finished or already kicked off means its
  // picks are revealed to everyone; otherwise it's either open for a prediction
  // or, if the organizer has explicitly closed it early (predictOpen:false),
  // shown as "not open yet". A match closes at its own kickoff regardless of
  // what else in the round has already started.
  const rows = rnd.matches.map(m => {
    if(m.finished || isMatchStarted(m)) return renderRevealedRow(m);
    if(!isMatchPredictable(m)) return renderPendingRow(m);
    return state.predictViewMode === 'summary' ? renderSummaryRow(m) : renderPredictRow(m, !!lockedExactMatchId(rnd, m.id));
  }).join('');

  const anyPredictable = rnd.matches.some(m => isMatchPredictable(m));
  const isSavingThis = !!(state.predictSaving && state.predictSaving.roundId === rnd.id);
  const anyRevealed = rnd.matches.some(m => m.finished || isMatchStarted(m));
  const roundFinished = rnd.matches.every(m => m.finished);

  let scoreHint = '';
  if(anyRevealed){
    const myScore = calcRoundScore(state.session.playerId, rnd);
    scoreHint = state.lang === 'en'
      ? `Your points so far this round: <b style="color:var(--gold-bright)">${toAr(myScore.total)}</b> (${toAr(myScore.correctCount)}/${toAr(rnd.matches.length)} correct${myScore.exactBonus?` + ${toAr(myScore.exactBonus)} exact bonus`:''})`
      : `نقاطك بهذي الجولة لحد الآن: <b style="color:var(--gold-bright)">${toAr(myScore.total)}</b> (${toAr(myScore.correctCount)}/${toAr(rnd.matches.length)} صحيحة${myScore.exactBonus?` + ${toAr(myScore.exactBonus)} بونص دقيق`:''})`;
  }

  return `
    ${renderRoundNav(rnd)}
    <div class="pr-card">
      <div class="pr-section-title">${t('matchesFor',{round:roundDisplayName(rnd.name)})}</div>
      <div class="pr-hint" style="margin-bottom:10px">${t('predictHint')}</div>
      ${scoreHint ? `<div class="pr-hint" style="margin-bottom:10px">${scoreHint}</div>` : ''}
      ${rows}
      ${anyPredictable && state.predictViewMode === 'summary' ? `
      <div style="margin-top:14px;display:flex;justify-content:flex-end">
        <button class="pr-btn ghost" onclick="prEditPredictions()">${iconHTML('edit')} ${t('editPredictions')}</button>
      </div>` : ''}
      ${anyPredictable && state.predictViewMode !== 'summary' ? `
      <div style="margin-top:14px;display:flex;justify-content:flex-end">
        <button class="pr-btn" id="predict-save-btn" ${isSavingThis ? 'disabled' : ''} onclick="prSavePredictions('${rnd.id}')">${isSavingThis ? t('savingPredictions') : `${iconHTML('save')} ${t('savePredictions')}`}</button>
      </div>
      <div id="predict-msg" class="pr-hint">${saveStatusHTML(rnd)}</div>` : ''}
    </div>
    ${roundFinished ? renderRoundLeaderboard(rnd) : ''}`;
}

window.prSelectRound = function(id){ state.selectedRoundId = id; state.predictDraftRoundId = null; render(); };
window.prStepRound = function(step){
  const idx = state.rounds.findIndex(r => r.id === state.selectedRoundId);
  const target = state.rounds[idx + step];
  if(target) window.prSelectRound(target.id);
};
window.prEditPredictions = function(){ state.predictViewMode = 'edit'; render(); };
// While a save is in flight the picks are frozen — the summary shown afterwards reads
// from this draft, so a change made mid-save would be displayed as if it had been saved.
window.prPickOutcome = function(matchId, side){
  if(state.predictSaving) return;
  if(!state.predictDraft[matchId]) state.predictDraft[matchId] = { outcome:null, isExact:false, exactHome:'', exactAway:'' };
  state.predictDraft[matchId].outcome = side;
  state.predictSaveNotice = null;
  render();
};
window.prToggleExact = function(matchId, checked){
  if(state.predictSaving){ render(); return; }
  if(checked){
    const rnd = state.rounds.find(r => r.id === state.selectedRoundId);
    if(rnd && lockedExactMatchId(rnd, matchId)){ prToast(t('exactUsedElsewhere'), true); render(); return; }
    // only one match per round can be the exact pick — clear others
    Object.keys(state.predictDraft).forEach(id => { state.predictDraft[id].isExact = false; });
    state.predictDraft[matchId].isExact = true;
  } else {
    state.predictDraft[matchId].isExact = false;
  }
  render();
};
window.prSetExactVal = function(matchId, side, val){
  if(state.predictSaving || !state.predictDraft[matchId]) return;
  state.predictDraft[matchId][side === 'home' ? 'exactHome' : 'exactAway'] = toWest(val);
};
window.prSavePredictions = async function(roundId){
  if(state.predictSaving) return; // a save is already running — a second click must not start another
  const rnd = state.rounds.find(r => r.id === roundId);
  const predictableMatches = rnd.matches.filter(m => isMatchPredictable(m));
  if(!predictableMatches.length){ prToast(t('roundLockedToast'), true); render(); return; }
  const missing = predictableMatches.some(m => !state.predictDraft[m.id] || !state.predictDraft[m.id].outcome);
  if(missing){ document.getElementById('predict-msg').textContent = t('validationPickAll'); return; }
  const matchPredictions = {};
  predictableMatches.forEach(m => {
    const d = state.predictDraft[m.id];
    // Defensive: the UI already hides the exact toggle once another match has
    // locked in the round's bonus, but never persist a conflicting one anyway.
    const wantsExact = d.isExact && d.exactHome !== '' && d.exactHome != null && d.exactAway !== '' && d.exactAway != null;
    const hasExact = wantsExact && !lockedExactMatchId(rnd, m.id);
    matchPredictions[m.id] = {
      outcome: d.outcome,
      exact: hasExact ? { home: Number(d.exactHome), away: Number(d.exactAway) } : null
    };
  });
  state.predictSaveNotice = null;
  state.predictSaving = { roundId, slow: false };
  // After a few seconds of waiting, say so — silence on a slow connection reads as
  // "frozen" and gets people to reload or tap Save again.
  const slowTimer = setTimeout(() => {
    if(state.predictSaving){ state.predictSaving.slow = true; render(); }
  }, 8000);
  render();
  // The backend merges just this player's picks into whatever's currently saved,
  // under a lock — so two players saving around the same time (very common right
  // before a round locks) can no longer silently overwrite each other.
  let status = 'unknown';
  try { status = await savePrediction(state.session.playerId, matchPredictions); } catch(e){ status = 'unknown'; }
  clearTimeout(slowTimer);
  state.predictSaving = null;
  if(status === 'saved'){
    const mine = state.predictions[state.session.playerId] ? {...state.predictions[state.session.playerId]} : {};
    Object.assign(mine, matchPredictions);
    state.predictions[state.session.playerId] = mine;
    // Switch to the read-only summary so the page visibly changes after a save —
    // seeing the exact same editable form was leaving players unsure whether
    // their click actually registered.
    state.predictViewMode = 'summary';
    render();
    prToast(t('savedOk'));
    return;
  }
  // 'failed' = we read it back and the picks really aren't there. 'unknown' = nothing
  // could be confirmed either way (the connection is slow) — the picks may well have
  // saved, so that case says to refresh and check rather than claiming an error.
  state.predictSaveNotice = { roundId, kind: status === 'failed' ? 'failed' : 'unknown' };
  render();
  prToast(t(status === 'failed' ? 'savedErr' : 'savedUnknown'), true);
};
