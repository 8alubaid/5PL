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

  const activePlayers = state.players.filter(p => !p.suspended);
  const totalMatches = state.rounds.reduce((sum, r) => sum + r.matches.length, 0);
  let predictionsSubmitted = 0, exactPicksMade = 0, exactHits = 0;
  const predCountByPlayer = {};
  state.players.forEach(pl => {
    let count = 0;
    state.rounds.forEach(r => r.matches.forEach(m => {
      const pred = (state.predictions[pl.id] || {})[m.id];
      if(!pred || !pred.outcome) return;
      count++; predictionsSubmitted++;
      if(pred.exact){
        exactPicksMade++;
        if(m.finished && Number(pred.exact.home) === m.homeScore && Number(pred.exact.away) === m.awayScore) exactHits++;
      }
    }));
    predCountByPlayer[pl.id] = count;
  });
  const mostActivePredictor = state.players.reduce((best, p) => (predCountByPlayer[p.id]||0) > (best ? predCountByPlayer[best.id] : -1) ? p : best, null);
  const mostFrequentVisitor = state.players.reduce((best, p) => (p.visitCount||0) > (best ? (best.visitCount||0) : -1) ? p : best, null);
  const totalVisits = state.players.reduce((sum, p) => sum + (p.visitCount||0), 0);
  const totalPossible = activePlayers.length * totalMatches;
  const topScorer = computeStandings()[0] || null;

  const statRows = en ? [
    { Statistic: 'Total players', Value: state.players.length },
    { Statistic: 'Active players', Value: activePlayers.length },
    { Statistic: 'Suspended players', Value: state.players.length - activePlayers.length },
    { Statistic: 'Total rounds', Value: state.rounds.length },
    { Statistic: 'Total matches', Value: totalMatches },
    { Statistic: 'Total predictions submitted', Value: predictionsSubmitted },
    { Statistic: 'Prediction completion rate', Value: totalPossible ? `${Math.round(predictionsSubmitted/totalPossible*100)}%` : '—' },
    { Statistic: 'Exact-score bonuses picked', Value: exactPicksMade },
    { Statistic: 'Exact-score bonuses hit', Value: exactHits },
    { Statistic: 'Most active predictor', Value: mostActivePredictor ? `${mostActivePredictor.name} (${predCountByPlayer[mostActivePredictor.id]} predictions)` : '—' },
    { Statistic: 'Total site visits logged', Value: totalVisits },
    { Statistic: 'Most frequent visitor', Value: mostFrequentVisitor && mostFrequentVisitor.visitCount ? `${mostFrequentVisitor.name} (${mostFrequentVisitor.visitCount} visits)` : '—' },
    { Statistic: 'Top of the standings', Value: topScorer ? `${topScorer.player.name} (${topScorer.total} pts)` : '—' }
  ] : [
    { الإحصائية: 'إجمالي اللاعبين', القيمة: state.players.length },
    { الإحصائية: 'اللاعبون النشطون', القيمة: activePlayers.length },
    { الإحصائية: 'اللاعبون الموقوفون', القيمة: state.players.length - activePlayers.length },
    { الإحصائية: 'إجمالي الجولات', القيمة: state.rounds.length },
    { الإحصائية: 'إجمالي المباريات', القيمة: totalMatches },
    { الإحصائية: 'إجمالي التوقعات المُرسلة', القيمة: predictionsSubmitted },
    { الإحصائية: 'نسبة إكمال التوقعات', القيمة: totalPossible ? `${Math.round(predictionsSubmitted/totalPossible*100)}%` : '—' },
    { الإحصائية: 'عدد بونصات النتيجة الدقيقة المختارة', القيمة: exactPicksMade },
    { الإحصائية: 'عدد بونصات النتيجة الدقيقة المُصابة', القيمة: exactHits },
    { الإحصائية: 'أكثر لاعب توقع', القيمة: mostActivePredictor ? `${mostActivePredictor.name} (${predCountByPlayer[mostActivePredictor.id]} توقع)` : '—' },
    { الإحصائية: 'إجمالي زيارات الموقع المسجّلة', القيمة: totalVisits },
    { الإحصائية: 'أكثر لاعب زيارة', القيمة: mostFrequentVisitor && mostFrequentVisitor.visitCount ? `${mostFrequentVisitor.name} (${mostFrequentVisitor.visitCount} زيارة)` : '—' },
    { الإحصائية: 'صاحب المركز الأول', القيمة: topScorer ? `${topScorer.player.name} (${topScorer.total} نقطة)` : '—' }
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statRows), en ? 'Statistics' : 'الإحصائيات');

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
