import { state } from './state.js';
import { t } from './i18n.js';
import { esc, prToast } from './utils.js';
import { toAr, toWest, roundDisplayName } from './i18n.js';
import { teamName, teamPairHTML, teamBadgeHTML, drawBadgeHTML, stadiumName } from './data.js';
import { isRoundLocked, calcRoundScore, matchOutcome, findOpenRoundId, fmtDT } from './scoring.js';
import { sSet } from './api.js';
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
}
function outcomeLabel(side, m){
  if(side === 'draw') return t('draw');
  return side === 'home' ? esc(teamName(m.home)) : esc(teamName(m.away));
}

export function renderPredictTab(){
  if(!state.rounds.length) return `<div class="pr-card"><div class="pr-empty">${t('noRoundsYet')}</div></div>`;
  if(!state.selectedRoundId) state.selectedRoundId = findOpenRoundId();
  const roundChips = state.rounds.map(r => `<button class="pr-round-chip ${r.id===state.selectedRoundId?'active':''}" onclick="prSelectRound('${r.id}')">${roundDisplayName(r.name)}</button>`).join('');
  const rnd = state.rounds.find(r => r.id === state.selectedRoundId) || state.rounds[0];
  const locked = isRoundLocked(rnd);

  if(locked){
    const rows = rnd.matches.map(m => {
      const matchDecided = m.finished && m.homeScore != null && m.awayScore != null;
      const realOutcome = matchDecided ? matchOutcome(m) : null;
      const allPicks = state.players.map(pl => {
        const pred = (state.predictions[pl.id] || {})[m.id];
        const isMe = pl.id === state.session.playerId;
        let txt = '—';
        let bg = isMe ? 'rgba(217,164,65,0.25)' : 'rgba(255,255,255,0.06)';
        let color = isMe ? 'var(--gold-bright)' : 'var(--text-dim)';
        if(pred && pred.outcome){
          txt = outcomeLabel(pred.outcome, m);
          if(pred.exact && pred.exact.home !== '' && pred.exact.home != null){
            txt += ` (🎯 ${toAr(pred.exact.home)}-${toAr(pred.exact.away)})`;
          }
          if(matchDecided){
            const correct = pred.outcome === realOutcome;
            bg = correct ? 'rgba(53,199,120,0.22)' : 'rgba(224,87,74,0.18)';
            color = correct ? 'var(--green-bright)' : '#ff9d90';
          }
        }
        const meBorder = isMe ? 'box-shadow:0 0 0 1.5px var(--gold-bright) inset;' : '';
        return `<span style="display:inline-block;margin:3px 6px 3px 0;padding:3px 9px;border-radius:999px;font-size:12px;background:${bg};color:${color};${meBorder}">${esc(pl.name)}: ${txt}</span>`;
      }).join('');
      const realTxt = m.finished ? `${toAr(m.homeScore)} - ${toAr(m.awayScore)}` : '';
      return `<div style="padding:12px 6px;border-bottom:1px dashed rgba(255,255,255,0.08)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px">
          <b class="pr-match-title">${teamPairHTML(m.home)} × ${teamPairHTML(m.away)}</b>
          <span class="pr-match-time">${m.finished ? t('resultPrefix')+realTxt : fmtDT(m.kickoff)}</span>
        </div>
        ${m.stadium ? `<div class="pr-hint" style="margin:-4px 0 8px">🏟️ ${esc(stadiumName(m.stadium))}</div>` : ''}
        <div>${allPicks || `<span class="pr-hint">${t('noOneYet')}</span>`}</div>
      </div>`;
    }).join('');
    const myScore = calcRoundScore(state.session.playerId, rnd);
    const lockedHint = state.lang === 'en'
      ? `This round has started — predictions are locked and visible to everyone. Your points so far this round: <b style="color:var(--gold-bright)">${toAr(myScore.total)}</b> (${toAr(myScore.correctCount)}/${toAr(9)} correct${myScore.exactBonus?` + ${toAr(myScore.exactBonus)} exact bonus`:''})`
      : `الجولة بدأت — التوقعات مقفلة وظاهرة للجميع. نقاطك بهذي الجولة لحد الآن: <b style="color:var(--gold-bright)">${toAr(myScore.total)}</b> (${toAr(myScore.correctCount)}/${toAr(9)} صحيحة${myScore.exactBonus?` + ${toAr(myScore.exactBonus)} بونص دقيق`:''})`;
    return `
      <div class="pr-round-select">${roundChips}</div>
      <div class="pr-card">
        <div class="pr-section-title">${t('predictionsFor',{round:roundDisplayName(rnd.name)})} 🔒</div>
        <div class="pr-hint" style="margin-bottom:10px">${lockedHint}</div>
        ${rows}
      </div>`;
  }

  if(!state.predictDraftRoundId || state.predictDraftRoundId !== rnd.id){ initDraft(rnd); state.predictDraftRoundId = rnd.id; }

  const rows = rnd.matches.map(m => {
    const d = state.predictDraft[m.id] || { outcome:null, isExact:false, exactHome:'', exactAway:'' };
    const btn = (side, badge, label) => `<button type="button" class="pr-outcome-btn ${d.outcome===side?'active':''}" onclick="prPickOutcome('${m.id}','${side}')">${badge}<span class="pr-outcome-label">${label}</span></button>`;
    return `
    <div class="pr-match-predict">
      <div class="pr-flex-between" style="margin-bottom:8px">
        <b class="pr-match-title">${teamPairHTML(m.home)} × ${teamPairHTML(m.away)}</b>
        <span class="pr-match-time">${fmtDT(m.kickoff)}</span>
      </div>
      ${m.stadium ? `<div class="pr-hint" style="margin:-4px 0 8px">🏟️ ${esc(stadiumName(m.stadium))}</div>` : ''}
      <div class="pr-outcome-row">
        ${btn('home', teamBadgeHTML(m.home,'pr-team-badge-lg'), esc(teamName(m.home)))}
        ${btn('draw', drawBadgeHTML('pr-team-badge-lg'), t('draw'))}
        ${btn('away', teamBadgeHTML(m.away,'pr-team-badge-lg'), esc(teamName(m.away)))}
      </div>
      <label class="pr-exact-toggle">
        <input type="checkbox" ${d.isExact?'checked':''} onchange="prToggleExact('${m.id}', this.checked)">
        ${t('exactToggleLabel')}
      </label>
      ${d.isExact ? `
      <div class="pr-score-box" style="margin-top:8px">
        <input type="text" inputmode="numeric" maxlength="2" value="${toAr(d.exactHome)}" oninput="prDigitInput(this); prSetExactVal('${m.id}','home',this.value)">
        <span class="pr-score-dash">–</span>
        <input type="text" inputmode="numeric" maxlength="2" value="${toAr(d.exactAway)}" oninput="prDigitInput(this); prSetExactVal('${m.id}','away',this.value)">
      </div>` : ''}
    </div>`;
  }).join('');
  return `
    <div class="pr-round-select">${roundChips}</div>
    <div class="pr-card">
      <div class="pr-section-title">${t('matchesFor',{round:roundDisplayName(rnd.name)})}</div>
      <div class="pr-hint" style="margin-bottom:10px">${t('predictHint')}</div>
      ${rows}
      <div style="margin-top:14px;display:flex;justify-content:flex-end">
        <button class="pr-btn" id="predict-save-btn" onclick="prSavePredictions('${rnd.id}')">${t('savePredictions')}</button>
      </div>
      <div id="predict-msg" class="pr-hint"></div>
    </div>`;
}

window.prSelectRound = function(id){ state.selectedRoundId = id; state.predictDraftRoundId = null; render(); };
window.prPickOutcome = function(matchId, side){
  if(!state.predictDraft[matchId]) state.predictDraft[matchId] = { outcome:null, isExact:false, exactHome:'', exactAway:'' };
  state.predictDraft[matchId].outcome = side;
  render();
};
window.prToggleExact = function(matchId, checked){
  if(checked){
    // only one match per round can be the exact pick — clear others
    Object.keys(state.predictDraft).forEach(id => { state.predictDraft[id].isExact = false; });
    state.predictDraft[matchId].isExact = true;
  } else {
    state.predictDraft[matchId].isExact = false;
  }
  render();
};
window.prSetExactVal = function(matchId, side, val){
  if(!state.predictDraft[matchId]) return;
  state.predictDraft[matchId][side === 'home' ? 'exactHome' : 'exactAway'] = toWest(val);
};
window.prSavePredictions = async function(roundId){
  const rnd = state.rounds.find(r => r.id === roundId);
  if(isRoundLocked(rnd)){ prToast(t('roundLockedToast'), true); render(); return; }
  const missing = rnd.matches.some(m => !state.predictDraft[m.id] || !state.predictDraft[m.id].outcome);
  if(missing){ document.getElementById('predict-msg').textContent = t('validationPickAll'); return; }
  const mine = state.predictions[state.session.playerId] ? {...state.predictions[state.session.playerId]} : {};
  rnd.matches.forEach(m => {
    const d = state.predictDraft[m.id];
    const hasExact = d.isExact && d.exactHome !== '' && d.exactHome != null && d.exactAway !== '' && d.exactAway != null;
    mine[m.id] = {
      outcome: d.outcome,
      exact: hasExact ? { home: Number(d.exactHome), away: Number(d.exactAway) } : null
    };
  });
  const btn = document.getElementById('predict-save-btn');
  const btnOriginalLabel = btn ? btn.textContent : '';
  if(btn){ btn.disabled = true; btn.textContent = t('savingPredictions'); }
  document.getElementById('predict-msg').textContent = '';
  state.predictions[state.session.playerId] = mine;
  const ok = await sSet('predictions', state.predictions);
  if(btn){ btn.disabled = false; btn.textContent = btnOriginalLabel; }
  document.getElementById('predict-msg').textContent = ok ? t('savedOk') : t('savedErr');
  prToast(ok ? t('savedOk') : t('savedErr'), !ok);
};
