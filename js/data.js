import { state } from './state.js';
import { esc } from './utils.js';
import { t } from './i18n.js';

export const SATEAMS = ["الهلال","النصر","الاتحاد","الأهلي","القادسية","الشباب","الفتح","الخليج","التعاون","أبها","نيوم","الفيحاء","الاتفاق","الحزم","الرياض","الدرعية","الخلود","الفيصلي"];
// Canonical English club names (verified against the official 2025–26 Roshn Saudi League roster).
export const TEAM_EN = {
  "الهلال":"Al-Hilal","النصر":"Al-Nassr","الاتحاد":"Al-Ittihad","الأهلي":"Al-Ahli",
  "القادسية":"Al-Qadsiah","الشباب":"Al-Shabab","الفتح":"Al-Fateh","الخليج":"Al-Khaleej",
  "التعاون":"Al-Taawoun","أبها":"Abha","نيوم":"Neom","الفيحاء":"Al-Fayha",
  "الاتفاق":"Al-Ettifaq","الحزم":"Al-Hazem","الرياض":"Al-Riyadh","الدرعية":"Al-Diriyah",
  "الخلود":"Al-Kholood","الفيصلي":"Al-Faisaly",
  "الرائد":"Al-Raed","ضمك":"Damac","الوحدة":"Al-Wehda","النجمة":"Al-Najma","الطائي":"Al-Taee"
};
// Compact crest badges — a short code + two-tone gradient per club, in the app's own visual
// language (not a reproduction of official club logos/trademarks).
export const TEAM_BADGE = {
  "الهلال":   { code:'HIL', c1:'#123a86', c2:'#2f6fe0' },
  "النصر":    { code:'NAS', c1:'#8a5a00', c2:'#f4c430' },
  "الاتحاد":  { code:'ITH', c1:'#1a1a1a', c2:'#b8860b' },
  "الأهلي":   { code:'AHL', c1:'#0b4d27', c2:'#1fae5c' },
  "القادسية": { code:'QAD', c1:'#7a0e0e', c2:'#d92626' },
  "الشباب":   { code:'SHB', c1:'#14213d', c2:'#5a76b8' },
  "الفتح":    { code:'FTH', c1:'#064e3b', c2:'#10b981' },
  "الخليج":   { code:'KHL', c1:'#0f4c3a', c2:'#2fbf8f' },
  "التعاون":  { code:'TAW', c1:'#1e2a5e', c2:'#f0b429' },
  "أبها":     { code:'ABH', c1:'#14532d', c2:'#4ade80' },
  "نيوم":     { code:'NEO', c1:'#0f4c4c', c2:'#2dd4bf' },
  "الفيحاء":  { code:'FAY', c1:'#1e3a8a', c2:'#7dd3fc' },
  "الاتفاق":  { code:'ETF', c1:'#4c0519', c2:'#9f1239' },
  "الحزم":    { code:'HAZ', c1:'#7f1d1d', c2:'#ef4444' },
  "الرياض":   { code:'RYD', c1:'#0c1e3e', c2:'#3454a0' },
  "الدرعية":  { code:'DIR', c1:'#5c3a10', c2:'#c48a2e' },
  "الخلود":   { code:'KHD', c1:'#4c1d75', c2:'#9333ea' },
  "الفيصلي":  { code:'FYS', c1:'#3b0a0a', c2:'#b91c1c' }
};
// Real home stadiums per club (2025–26 Roshn Saudi League), used to auto-suggest
// a match venue — organizer can still override per match.
export const TEAM_STADIUM = {
  "الهلال":"ملعب الهلال", "النصر":"ملعب النصر",
  "الاتحاد":"ملعب الاتحاد", "الأهلي":"ملعب الأهلي",
  "القادسية":"ملعب القادسية", "الشباب":"ملعب الشباب",
  "الفتح":"ملعب الفتح", "الخليج":"ملعب الخليج",
  "التعاون":"ملعب التعاون", "أبها":"ملعب أبها",
  "نيوم":"ملعب نيوم", "الفيحاء":"ملعب الفيحاء",
  "الاتفاق":"ملعب الاتفاق", "الحزم":"ملعب نادي الحزم",
  "الرياض":"ملعب الرياض", "الدرعية":"ملعب الدرعية",
  "الخلود":"ملعب الخلود", "الفيصلي":"ملعب الفيصلي"
};
export const STADIUM_EN = {
  "ملعب الهلال":"Al-Hilal Stadium",
  "ملعب النصر":"Al-Nassr Stadium",
  "ملعب الاتحاد":"Al-Ittihad Stadium",
  "ملعب الأهلي":"Al-Ahli Stadium",
  "ملعب القادسية":"Al-Qadsiah Stadium",
  "ملعب الشباب":"Al-Shabab Stadium",
  "ملعب الفتح":"Al-Fateh Stadium",
  "ملعب الخليج":"Al-Khaleej Stadium",
  "ملعب التعاون":"Al-Taawoun Stadium",
  "ملعب أبها":"Abha Stadium",
  "ملعب نيوم":"Neom Stadium",
  "ملعب الفيحاء":"Al-Fayha Stadium",
  "ملعب الاتفاق":"Al-Ettifaq Stadium",
  "ملعب نادي الحزم":"Al-Hazem Stadium",
  "ملعب الرياض":"Al-Riyadh Stadium",
  "ملعب الدرعية":"Al-Diriyah Stadium",
  "ملعب الخلود":"Al-Kholood Stadium",
  "ملعب الفيصلي":"Al-Faisaly Stadium",
  "استاد الملك فهد الدولي":"King Fahd International Stadium, Riyadh"
};
// Bigger venues the league sometimes uses for a match not tied to either club's own
// ground (renovation, high-demand fixture, etc.) — offered alongside the two teams'
// home stadiums in the picker.
export const NEUTRAL_STADIUMS = ["استاد الملك فهد الدولي"];
export const DRAW_BADGE = { code:'⚖', c1:'#3a3a3a', c2:'#8a8a8a' };

export function teamName(ar){ return state.lang === 'en' ? (TEAM_EN[ar] || ar) : ar; }

export function stadiumName(ar){
  if(!ar) return '';
  return state.lang === 'en' ? (STADIUM_EN[ar] || ar) : ar;
}
export function matchStadiumOptions(home, away){
  const opts = [];
  const add = (ar) => { if(ar && !opts.includes(ar)) opts.push(ar); };
  add(TEAM_STADIUM[home]);
  add(TEAM_STADIUM[away]);
  NEUTRAL_STADIUMS.forEach(add);
  return opts;
}
export function stadiumSelectOptions(selected, home, away){
  const opts = matchStadiumOptions(home, away);
  if(selected && !opts.includes(selected)) opts.unshift(selected);
  return `<option value="" ${!selected?'selected':''}>${t('selectStadium')}</option>` +
    opts.map(s => `<option value="${esc(s)}" ${selected===s?'selected':''}>${esc(stadiumName(s))}</option>`).join('');
}
export function teamSelectOptions(selected){
  return `<option value="" ${!selected?'selected':''}>${t('selectTeam')}</option>` +
    SATEAMS.map(team => `<option value="${esc(team)}" ${selected===team?'selected':''}>${esc(teamName(team))}</option>`).join('');
}
export function teamBadgeHTML(ar, extraClass){
  const b = TEAM_BADGE[ar];
  const code = b ? b.code : esc((teamName(ar)||'?').trim().charAt(0));
  const c1 = b ? b.c1 : '#33413c', c2 = b ? b.c2 : '#5c716a';
  const cls = `pr-team-badge ${extraClass||''}`;
  if(b){
    // Falls back to the plain colored-code badge if a club's logo file is ever
    // missing (e.g. a promoted team without a crest in img/teams/ yet).
    return `<img src="img/teams/${b.code.toLowerCase()}.svg" alt="${esc(teamName(ar))}" class="${cls}" data-code="${code}" style="--bc1:${c1};--bc2:${c2}" onerror="prLogoFallback(this)">`;
  }
  return `<span class="${cls}" style="--bc1:${c1};--bc2:${c2}">${code}</span>`;
}
window.prLogoFallback = function(img){
  const span = document.createElement('span');
  span.className = img.className;
  span.style.cssText = img.style.cssText;
  span.textContent = img.dataset.code;
  img.replaceWith(span);
};
export function drawBadgeHTML(extraClass){
  return `<span class="pr-team-badge pr-draw-badge ${extraClass||''}" style="--bc1:${DRAW_BADGE.c1};--bc2:${DRAW_BADGE.c2}">${DRAW_BADGE.code}</span>`;
}
export function teamPairHTML(ar){
  return `<span class="pr-team-pair">${teamBadgeHTML(ar)}<span>${esc(teamName(ar))}</span></span>`;
}
