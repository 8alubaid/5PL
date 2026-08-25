import { state } from './state.js';
import { t, toAr, toWest, roundDisplayName } from './i18n.js';
import { esc, uid, prToast, toLocalDatetimeValue, makeEmptyDraftMatches } from './utils.js';
import { SATEAMS, teamPairHTML, teamSelectOptions, stadiumSelectOptions, matchStadiumOptions, stadiumName } from './data.js';
import { fmtDT } from './scoring.js';
import { sSet } from './api.js';
import { render } from './main.js';

export function renderAdminRounds(){
  const newRoundForm = `
    <div class="pr-card">
      <div class="pr-section-title">${t('addNewRound')}</div>
      <div class="pr-hint" style="margin-bottom:8px">${t('pasteHint')}</div>
      <textarea class="pr-input" id="paste-fixtures" rows="5" placeholder="مثال:
الجولة 9
الجمعة 14/8 19:00
الهلال × النصر
الاتحاد × الأهلي 20:30"></textarea>
      <div style="margin-top:8px;display:flex;justify-content:flex-end">
        <button class="pr-btn ghost small" onclick="prParsePastedFixtures()">${t('convertText')}</button>
      </div>
      ${state.importStatus ? `<div class="pr-hint" style="margin-top:6px">${esc(state.importStatus)}</div>` : ''}
      <div style="border-top:1px dashed var(--card-border);margin:16px 0"></div>
      <label class="pr-label">${t('roundNameLabel')}</label>
      <input class="pr-input" id="ar-name" placeholder="مثلاً: الجولة 9" value="${esc(state.draftRoundName)}" style="margin-bottom:12px">
      <div id="ar-matches">${state.draftMatches.map((m,idx) => renderDraftMatch(m, idx)).join('')}</div>
      <button class="pr-btn ghost small" onclick="prAddDraftMatch()">${t('addMatchManually')}</button>
      <div style="margin-top:14px;display:flex;justify-content:flex-end">
        <button class="pr-btn" onclick="prSaveRound()">${t('saveRound')}</button>
      </div>
      <div id="ar-err" class="pr-error"></div>
    </div>`;
  const existing = state.rounds.slice().reverse().map(rnd => {
    const isEditing = state.editingRoundId === rnd.id;
    const matches = rnd.matches.map(m => {
      if(isEditing){
        const d = state.roundEditDraft[m.id] || makeRoundDraftEntry(m);
        return `<div class="pr-match-draft">
          <div class="pr-admin-form-row">
            <select class="pr-select" onchange="prUpdateRoundDraft('${m.id}','home',this.value)" style="flex:1;min-width:100px">${teamSelectOptions(d.home)}</select>
            <span style="color:var(--text-dim)">×</span>
            <select class="pr-select" onchange="prUpdateRoundDraft('${m.id}','away',this.value)" style="flex:1;min-width:100px">${teamSelectOptions(d.away)}</select>
          </div>
          <div class="pr-admin-form-row" style="margin-top:6px">
            <input class="pr-input" type="datetime-local" value="${d.kickoff}" oninput="prUpdateRoundDraft('${m.id}','kickoff',this.value)" style="flex:1;min-width:150px;font-family:'Segoe UI',Tahoma,Arial,sans-serif">
            <div class="pr-score-box">
              <input type="text" inputmode="numeric" maxlength="2" value="${toAr(d.homeScore)}" oninput="prDigitInput(this); prUpdateRoundDraft('${m.id}','homeScore',this.value)" style="width:34px">
              <span class="pr-score-dash">–</span>
              <input type="text" inputmode="numeric" maxlength="2" value="${toAr(d.awayScore)}" oninput="prDigitInput(this); prUpdateRoundDraft('${m.id}','awayScore',this.value)" style="width:34px">
            </div>
          </div>
          <select class="pr-select" onchange="prUpdateRoundDraft('${m.id}','stadium',this.value)" style="width:100%;margin-top:6px">${stadiumSelectOptions(d.stadium, d.home, d.away)}</select>
          <label style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12.5px;color:var(--text-dim)">
            <input type="checkbox" ${d.predictOpen?'checked':''} onchange="prUpdateRoundDraft('${m.id}','predictOpen',this.checked)">
            ${t('predictOpenLabel')}
          </label>
        </div>`;
      }
      const scoreTxt = m.finished ? `${toAr(m.homeScore)} - ${toAr(m.awayScore)}` : '–';
      const predictOpen = m.predictOpen !== false;
      return `
      <div class="pr-match" style="flex-wrap:wrap">
        <div style="flex:1;min-width:150px">
          <b class="pr-match-title">${teamPairHTML(m.home)} × ${teamPairHTML(m.away)}</b>
          <div class="pr-match-time">${fmtDT(m.kickoff)} — <span class="pr-tag ${m.finished?'closed':'open'}">${m.finished?t('finished'):t('resultPending')}</span></div>
          ${m.stadium ? `<div class="pr-match-time">🏟️ ${esc(stadiumName(m.stadium))}</div>` : ''}
          <label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12.5px;color:var(--text-dim)">
            <input type="checkbox" ${predictOpen?'checked':''} onchange="prToggleMatchPredictOpen('${rnd.id}','${m.id}',this.checked)">
            ${t('predictOpenLabel')}
          </label>
        </div>
        <div class="pr-score-readonly">${scoreTxt}</div>
      </div>`;
    }).join('');
    const headerButtons = isEditing
      ? `<button class="pr-btn ghost small" onclick="prCancelEditRound()">${t('cancel')}</button>
         <button class="pr-btn small" onclick="prSaveRoundEdits('${rnd.id}')">${t('saveEdit')}</button>`
      : `<button class="pr-btn ghost small" onclick="prStartEditRound('${rnd.id}')">${t('editRound')}</button>
         <button class="pr-btn danger small" onclick="prDeleteRound('${rnd.id}')">${t('deleteRound')}</button>`;
    return `<div class="pr-card">
      <div class="pr-flex-between"><div class="pr-section-title">${roundDisplayName(rnd.name)}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${headerButtons}</div></div>
      ${matches}
    </div>`;
  }).join('');
  return newRoundForm + existing;
}

function makeRoundDraftEntry(m){
  return {
    home: m.home, away: m.away,
    kickoff: m.kickoff ? toLocalDatetimeValue(new Date(m.kickoff)) : '',
    homeScore: m.homeScore != null ? String(m.homeScore) : '',
    awayScore: m.awayScore != null ? String(m.awayScore) : '',
    stadium: m.stadium || matchStadiumOptions(m.home, m.away)[0] || '',
    predictOpen: m.predictOpen !== false
  };
}
window.prToggleMatchPredictOpen = async function(roundId, matchId, checked){
  const rnd = state.rounds.find(r => r.id === roundId);
  if(!rnd) return;
  const m = rnd.matches.find(x => x.id === matchId);
  if(!m) return;
  const prev = m.predictOpen;
  m.predictOpen = checked;
  const ok = await sSet('rounds', state.rounds);
  if(!ok){ m.predictOpen = prev; prToast(t('saveErrRetry'), true); }
  render();
};
window.prStartEditRound = function(roundId){
  const rnd = state.rounds.find(r => r.id === roundId);
  if(!rnd) return;
  state.editingRoundId = roundId;
  state.roundEditDraft = {};
  rnd.matches.forEach(m => { state.roundEditDraft[m.id] = makeRoundDraftEntry(m); });
  render();
};
window.prCancelEditRound = function(){ state.editingRoundId = null; state.roundEditDraft = {}; render(); };
window.prUpdateRoundDraft = function(matchId, field, val){
  const d = state.roundEditDraft[matchId];
  if(!d) return;
  if(field === 'homeScore' || field === 'awayScore') d[field] = toWest(val).replace(/[^0-9]/g,'');
  else if(field === 'predictOpen') d[field] = !!val;
  else d[field] = val;
  if(field === 'home' || field === 'away'){
    const opts = matchStadiumOptions(d.home, d.away);
    if(!d.stadium || !opts.includes(d.stadium)) d.stadium = opts[0] || '';
    render();
  }
};
window.prSaveRoundEdits = async function(roundId){
  const rnd = state.rounds.find(r => r.id === roundId);
  if(!rnd) return;
  for(const m of rnd.matches){
    const d = state.roundEditDraft[m.id];
    if(!d || !d.home.trim() || !d.away.trim()){ prToast(t('enterBothTeams'), true); return; }
  }
  const backups = rnd.matches.map(m => ({ id:m.id, home:m.home, away:m.away, kickoff:m.kickoff, homeScore:m.homeScore, awayScore:m.awayScore, finished:m.finished, stadium:m.stadium, predictOpen:m.predictOpen }));
  rnd.matches.forEach(m => {
    const d = state.roundEditDraft[m.id];
    // A match that's never had its switch touched (predictOpen left unset)
    // locks together with the rest of its round like normal. Explicitly
    // checking it back on for a match that *was* touched is a deliberate
    // reopen, so that one keeps ignoring the round's timing from here on —
    // otherwise re-checking the box after closing it would just silently
    // fall back to "untouched" and get swept into the round lock again.
    const wasTouched = m.predictOpen != null;
    m.home = d.home.trim(); m.away = d.away.trim();
    m.kickoff = d.kickoff ? new Date(d.kickoff).toISOString() : null;
    m.stadium = (d.stadium || '').trim();
    m.predictOpen = d.predictOpen === false ? false : (wasTouched ? true : undefined);
    if(d.homeScore !== '' && d.awayScore !== ''){
      m.homeScore = Number(d.homeScore); m.awayScore = Number(d.awayScore); m.finished = true;
    }
  });
  const ok = await sSet('rounds', state.rounds);
  if(!ok){
    rnd.matches.forEach(m => {
      const b = backups.find(x => x.id === m.id);
      m.home = b.home; m.away = b.away; m.kickoff = b.kickoff; m.homeScore = b.homeScore; m.awayScore = b.awayScore; m.finished = b.finished; m.stadium = b.stadium; m.predictOpen = b.predictOpen;
    });
    prToast(t('saveErrRetry'), true);
  } else {
    prToast(t('editSaved'));
    state.editingRoundId = null; state.roundEditDraft = {};
  }
  render();
};

function renderDraftMatch(m, idx){
  return `<div class="pr-match-draft">
    <div class="pr-admin-form-row">
      <select class="pr-select" onchange="prUpdateDraft(${idx},'home',this.value)" style="flex:1;min-width:110px">${teamSelectOptions(m.home)}</select>
      <span style="color:var(--text-dim)">×</span>
      <select class="pr-select" onchange="prUpdateDraft(${idx},'away',this.value)" style="flex:1;min-width:110px">${teamSelectOptions(m.away)}</select>
      <button class="pr-x-btn" onclick="prRemoveDraft(${idx})">✕</button>
    </div>
    <label class="pr-label">${t('kickoffLabel')}</label>
    <input class="pr-input" type="datetime-local" value="${m.kickoff||''}" oninput="prUpdateDraft(${idx},'kickoff',this.value)" style="font-family:'Segoe UI',Tahoma,Arial,sans-serif">
    <label class="pr-label">🏟️ ${t('stadiumLabel')}</label>
    <select class="pr-select" onchange="prUpdateDraft(${idx},'stadium',this.value)" style="width:100%">${stadiumSelectOptions(m.stadium, m.home, m.away)}</select>
    <label style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12.5px;color:var(--text-dim)">
      <input type="checkbox" ${m.predictOpen!==false?'checked':''} onchange="prUpdateDraft(${idx},'predictOpen',this.checked)">
      ${t('predictOpenLabel')}
    </label>
  </div>`;
}

window.prParsePastedFixtures = function(){
  const raw = document.getElementById('paste-fixtures').value;
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if(!lines.length){ state.importStatus = t('pasteFirst'); render(); return; }

  const roundRe = /الجولة\s*(\d+)/;
  const dateISORe = /(\d{4})-(\d{1,2})-(\d{1,2})/;
  const dateDMRe = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/;
  const timeRe = /(\d{1,2}):(\d{2})\s*(ص|م|am|pm|AM|PM)?/;

  let roundGuess = null, currentDate = null;
  const parsedMatches = [];
  let skipped = 0;

  lines.forEach(line => {
    if(!roundGuess){ const rm = line.match(roundRe); if(rm) roundGuess = rm[1]; }

    const found = [];
    SATEAMS.forEach(team => { const idx = line.indexOf(team); if(idx !== -1) found.push({ team, idx }); });
    found.sort((a,b) => a.idx - b.idx);
    const uniqueTeams = [];
    found.forEach(f => { if(!uniqueTeams.includes(f.team)) uniqueTeams.push(f.team); });

    const isoM = line.match(dateISORe);
    const dmM = !isoM ? line.match(dateDMRe) : null;
    if(isoM){ currentDate = { y:+isoM[1], mo:+isoM[2], d:+isoM[3] }; }
    else if(dmM){
      let y = dmM[3] ? (dmM[3].length === 2 ? 2000 + Number(dmM[3]) : Number(dmM[3])) : null;
      currentDate = { y, mo:+dmM[2], d:+dmM[1] };
    }
    const tm = line.match(timeRe);
    let timeStr = null;
    if(tm){
      let hh = Number(tm[1]); const mm = tm[2]; const marker = (tm[3]||'').toLowerCase();
      if((marker === 'م' || marker === 'pm') && hh < 12) hh += 12;
      if((marker === 'ص' || marker === 'am') && hh === 12) hh = 0;
      timeStr = String(hh).padStart(2,'0') + ':' + mm;
    }

    if(uniqueTeams.length >= 2){
      const home = uniqueTeams[0], away = uniqueTeams[1];
      let kickoff = '';
      if(currentDate){
        let { y, mo, d } = currentDate;
        if(!y){
          const now = new Date();
          y = now.getFullYear();
          if(mo < now.getMonth() + 1) y += 1; // date already passed this year → likely next year
        }
        const pad = n => String(n).padStart(2,'0');
        kickoff = `${y}-${pad(mo)}-${pad(d)}T${timeStr || '19:00'}`;
      }
      parsedMatches.push({ home, away, kickoff, stadium: matchStadiumOptions(home, away)[0] || '', predictOpen: true });
    } else if(!roundRe.test(line) && !isoM && !dmM){
      // a line with no teams, no round marker, no date — likely noise, ignore silently
    } else if(uniqueTeams.length === 1){
      skipped++;
    }
  });

  if(!parsedMatches.length){
    state.importStatus = t('parseFailed');
    render(); return;
  }
  state.draftMatches = parsedMatches;
  if(roundGuess) state.draftRoundName = 'الجولة ' + roundGuess;
  const missingTime = parsedMatches.filter(m => !m.kickoff).length;
  if(state.lang === 'en'){
    state.importStatus = `Extracted ${parsedMatches.length} match(es) from the text.` +
      (missingTime ? ` ⚠️ ${missingTime} of them had no clear date — set the time manually below.` : '') +
      (skipped ? ` (Ignored ${skipped} line(s) that only had one team.)` : '') +
      ' ' + t('reviewBeforeSave');
  } else {
    state.importStatus = `تم استخراج ${toAr(parsedMatches.length)} مباراة من النص.` +
      (missingTime ? ` ⚠️ ${toAr(missingTime)} منها بدون تاريخ واضح — حدد الموعد يدويًا لها بالأسفل.` : '') +
      (skipped ? ` (تجاهلت ${toAr(skipped)} سطر ما وضح فيه إلا فريق وحد).` : '') +
      ' ' + t('reviewBeforeSave');
  }
  render();
};

window.prAddDraftMatch = function(){ state.draftMatches.push({ home:'', away:'', kickoff:'', predictOpen:true }); render(); };
window.prRemoveDraft = function(idx){ state.draftMatches.splice(idx,1); render(); };
window.prUpdateDraft = function(idx, field, val){
  state.draftMatches[idx][field] = field === 'predictOpen' ? !!val : val;
  if(field === 'kickoff' && val){
    // matches in a round are chronological — carry this kickoff forward as the
    // default for any later rows that don't have their own time set yet
    let changed = false;
    for(let i = idx + 1; i < state.draftMatches.length; i++){
      if(!state.draftMatches[i].kickoff){ state.draftMatches[i].kickoff = val; changed = true; }
    }
    if(changed) render();
  }
  if(field === 'home' || field === 'away'){
    const row = state.draftMatches[idx];
    const opts = matchStadiumOptions(row.home, row.away);
    if(!row.stadium || !opts.includes(row.stadium)) row.stadium = opts[0] || '';
    render();
  }
};
window.prSaveRound = async function(){
  const name = document.getElementById('ar-name').value.trim();
  if(!name || !state.draftMatches.length){ document.getElementById('ar-err').textContent = t('roundSaveValidation'); return; }
  for(const m of state.draftMatches){ if(!m.home.trim() || !m.away.trim()){ document.getElementById('ar-err').textContent = t('teamNamesValidation'); return; } }
  const newRound = {
    id: uid('rd'), name,
    // A freshly-created match has nothing to "reopen" — checked just means it
    // follows the round's normal timing (predictOpen left unset), unchecked
    // means the organizer is deliberately holding it closed from the start.
    matches: state.draftMatches.map(m => ({ id: uid('mt'), home: m.home.trim(), away: m.away.trim(), kickoff: m.kickoff ? new Date(m.kickoff).toISOString() : null, stadium: (m.stadium||'').trim(), predictOpen: m.predictOpen === false ? false : undefined, homeScore: null, awayScore: null, finished: false }))
  };
  state.rounds.push(newRound);
  const ok = await sSet('rounds', state.rounds);
  if(ok){ state.draftMatches = makeEmptyDraftMatches(); state.draftRoundName = ''; state.importStatus = ''; state.selectedRoundId = newRound.id; }
  else document.getElementById('ar-err').textContent = t('genericSaveErr');
  render();
};

window.prDeleteRound = async function(roundId){
  const backup = state.rounds;
  state.rounds = state.rounds.filter(r => r.id !== roundId);
  const ok = await sSet('rounds', state.rounds);
  if(!ok){ state.rounds = backup; prToast(t('deleteErrRetry'), true); }
  render();
};
