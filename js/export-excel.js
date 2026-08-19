import { state } from './state.js';
import { roundDisplayName } from './i18n.js';
import { teamName, stadiumName } from './data.js';
import { fmtDT, matchOutcome, computeStandings } from './scoring.js';

let xlsxLoadPromise = null;
function loadXLSX(){
  if(typeof XLSX !== 'undefined') return Promise.resolve();
  if(xlsxLoadPromise) return xlsxLoadPromise;
  xlsxLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = resolve;
    s.onerror = () => { xlsxLoadPromise = null; reject(new Error('XLSX load failed')); };
    document.head.appendChild(s);
  });
  return xlsxLoadPromise;
}

window.prExportExcel = async function(){
  try { await loadXLSX(); } catch(e){}
  if(typeof XLSX === 'undefined'){ alert(state.lang==='en' ? 'Could not load the export library — check your internet connection and try again.' : 'تعذر تحميل مكتبة التصدير، تأكد من اتصالك بالإنترنت وحاول مرة ثانية.'); return; }
  const wb = XLSX.utils.book_new();
  const en = state.lang === 'en';

  const playersRows = state.players.map(p => en ? ({ Name: p.name, Email: p.email || '', PIN: p.pin || '', Status: p.suspended ? 'Suspended' : 'Active', 'Registered On': p.createdAt || '' }) : ({ الاسم: p.name, الإيميل: p.email || '', 'الرمز السري': p.pin || '', الحالة: p.suspended ? 'موقوف' : 'نشط', 'تاريخ التسجيل': p.createdAt || '' }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(playersRows.length?playersRows:[{[en?'Name':'الاسم']:''}]), en ? 'Players' : 'اللاعبون');

  const matchRows = [];
  state.rounds.forEach(r => r.matches.forEach(m => matchRows.push(en ? {
    Round: roundDisplayName(r.name), Home: teamName(m.home), Away: teamName(m.away),
    'Kickoff': m.kickoff ? fmtDT(m.kickoff) : '', Stadium: m.stadium ? stadiumName(m.stadium) : '',
    'Home Score': m.homeScore, 'Away Score': m.awayScore,
    Finished: m.finished ? 'Yes' : 'No'
  } : {
    الجولة: r.name, المضيف: m.home, الضيف: m.away,
    'موعد المباراة': m.kickoff ? fmtDT(m.kickoff) : '', الملعب: m.stadium ? stadiumName(m.stadium) : '',
    'نتيجة المضيف': m.homeScore, 'نتيجة الضيف': m.awayScore,
    منتهية: m.finished ? 'نعم' : 'لا'
  })));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(matchRows.length?matchRows:[{[en?'Round':'الجولة']:''}]), en ? 'Rounds & Matches' : 'الجولات والمباريات');

  const predRows = [];
  state.players.forEach(pl => state.rounds.forEach(r => r.matches.forEach(m => {
    const pred = (state.predictions[pl.id] || {})[m.id];
    if(!pred || !pred.outcome) return;
    const real = m.finished ? matchOutcome(m) : null;
    const exactHit = m.finished && pred.exact && Number(pred.exact.home) === m.homeScore && Number(pred.exact.away) === m.awayScore;
    if(en){
      const correct = m.finished ? (pred.outcome === real ? 'Correct' : 'Wrong') : 'Not finished';
      predRows.push({
        Player: pl.name, Round: roundDisplayName(r.name), Match: teamName(m.home) + ' vs ' + teamName(m.away),
        Pick: pred.outcome === 'draw' ? 'Draw' : (pred.outcome === 'home' ? teamName(m.home) : teamName(m.away)),
        'Exact Score (if any)': pred.exact ? `${pred.exact.home}-${pred.exact.away}` : '',
        'Exact Bonus Hit': pred.exact ? (exactHit ? 'Yes' : 'No') : '',
        Correct: correct
      });
    } else {
      const correct = m.finished ? (pred.outcome === real ? 'صحيح' : 'خطأ') : 'لم تنتهِ';
      predRows.push({
        اللاعب: pl.name, الجولة: r.name, المباراة: m.home + ' × ' + m.away,
        التوقع: pred.outcome === 'draw' ? 'تعادل' : (pred.outcome === 'home' ? m.home : m.away),
        'النتيجة الدقيقة (إن وُجدت)': pred.exact ? `${pred.exact.home}-${pred.exact.away}` : '',
        'إصابة البونص': pred.exact ? (exactHit ? 'نعم' : 'لا') : '',
        صحيح: correct
      });
    }
  })));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(predRows.length?predRows:[{[en?'Player':'اللاعب']:''}]), en ? 'Predictions' : 'التوقعات');

  const standings = computeStandings();
  const standRows = standings.map((s,i) => en ? ({
    Rank: i+1, Player: s.player.name, Total: s.total,
    'Exact Bonus': s.exactBonusTotal, 'Best Round': roundDisplayName(s.bestRound)
  }) : ({
    الترتيب: i+1, اللاعب: s.player.name, المجموع: s.total,
    'بونص دقيق 🎯': s.exactBonusTotal, 'أفضل جولة': s.bestRound
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(standRows.length?standRows:[{[en?'Rank':'الترتيب']:''}]), en ? 'Standings' : 'الترتيب');

  const stamp = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `${en?'backup':'نسخة_احتياطية'}_${stamp}.xlsx`);
};
