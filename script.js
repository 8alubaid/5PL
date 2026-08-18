(function(){
  const SATEAMS = ["الهلال","النصر","الاتحاد","الأهلي","القادسية","الشباب","الفتح","الخليج","التعاون","أبها","نيوم","الفيحاء","الاتفاق","الحزم","الرياض","الدرعية","الخلود","الفيصلي"];
  // Canonical English club names (verified against the official 2025–26 Roshn Saudi League roster).
  const TEAM_EN = {
    "الهلال":"Al-Hilal","النصر":"Al-Nassr","الاتحاد":"Al-Ittihad","الأهلي":"Al-Ahli",
    "القادسية":"Al-Qadsiah","الشباب":"Al-Shabab","الفتح":"Al-Fateh","الخليج":"Al-Khaleej",
    "التعاون":"Al-Taawoun","أبها":"Abha","نيوم":"Neom","الفيحاء":"Al-Fayha",
    "الاتفاق":"Al-Ettifaq","الحزم":"Al-Hazem","الرياض":"Al-Riyadh","الدرعية":"Al-Diriyah",
    "الخلود":"Al-Kholood","الفيصلي":"Al-Faisaly",
    "الرائد":"Al-Raed","ضمك":"Damac","الوحدة":"Al-Wehda","النجمة":"Al-Najma","الطائي":"Al-Taee"
  };
  // Compact crest badges — a short code + two-tone gradient per club, in the app's own visual
  // language (not a reproduction of official club logos/trademarks).
  const TEAM_BADGE = {
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
  const TEAM_STADIUM = {
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
  const STADIUM_EN = {
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
  const NEUTRAL_STADIUMS = ["استاد الملك فهد الدولي"];
  function stadiumName(ar){
    if(!ar) return '';
    return lang === 'en' ? (STADIUM_EN[ar] || ar) : ar;
  }
  function matchStadiumOptions(home, away){
    const opts = [];
    const add = (ar) => { if(ar && !opts.includes(ar)) opts.push(ar); };
    add(TEAM_STADIUM[home]);
    add(TEAM_STADIUM[away]);
    NEUTRAL_STADIUMS.forEach(add);
    return opts;
  }
  function stadiumSelectOptions(selected, home, away){
    const opts = matchStadiumOptions(home, away);
    if(selected && !opts.includes(selected)) opts.unshift(selected);
    return `<option value="" ${!selected?'selected':''}>${t('selectStadium')}</option>` +
      opts.map(s => `<option value="${esc(s)}" ${selected===s?'selected':''}>${esc(stadiumName(s))}</option>`).join('');
  }
  const DRAW_BADGE = { code:'⚖', c1:'#3a3a3a', c2:'#8a8a8a' };
  function teamBadgeHTML(ar, extraClass){
    const b = TEAM_BADGE[ar];
    const code = b ? b.code : esc((teamName(ar)||'?').trim().charAt(0));
    const c1 = b ? b.c1 : '#33413c', c2 = b ? b.c2 : '#5c716a';
    return `<span class="pr-team-badge ${extraClass||''}" style="--bc1:${c1};--bc2:${c2}">${code}</span>`;
  }
  function drawBadgeHTML(extraClass){
    return `<span class="pr-team-badge pr-draw-badge ${extraClass||''}" style="--bc1:${DRAW_BADGE.c1};--bc2:${DRAW_BADGE.c2}">${DRAW_BADGE.code}</span>`;
  }
  function teamPairHTML(ar){
    return `<span class="pr-team-pair">${teamBadgeHTML(ar)}<span>${esc(teamName(ar))}</span></span>`;
  }
  let importStatus = '';
  const FIXED_TITLE = 'دوري الخيمة ٢٠٢٦\\٢٠٢٧';
  const FIXED_TITLE_EN = 'Tent League 2026/2027';
  const FIXED_ADMIN_PIN = '13579';

  let config = null, players = [], rounds = [], predictions = {};
  let session = { playerId: null, playerName: null, isAdmin: false };
  let activeTab = 'predict';
  let selectedRoundId = null;
  let adminSubTab = 'rounds';
  let draftMatches = makeEmptyDraftMatches();
  let draftRoundName = '';
  let loadError = false;

  // ---------- LANGUAGE ----------
  let lang = 'ar';
  function loadLang(){ try { return localStorage.getItem('pr_lang') || 'ar'; } catch(e){ return 'ar'; } }
  function saveLang(){ try { localStorage.setItem('pr_lang', lang); } catch(e){} }
  function applyDirAttrs(){
    const html = document.documentElement;
    html.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
    html.setAttribute('lang', lang === 'en' ? 'en' : 'ar');
  }
  window.prToggleLang = function(){
    lang = lang === 'en' ? 'ar' : 'en';
    saveLang();
    applyDirAttrs();
    render();
  };
  function teamName(ar){ return lang === 'en' ? (TEAM_EN[ar] || ar) : ar; }
  function roundDisplayName(rawName){
    const safe = esc(rawName);
    const m = safe.match(/^الجولة\s*([0-9٠-٩]+)$/);
    if(m){
      const num = toWest(m[1]);
      return lang === 'en' ? ('Round ' + num) : ('الجولة ' + toAr(num));
    }
    return lang === 'en' ? safe : toAr(safe);
  }

  const I18N = {
    subtitle: { ar:'توقعات الدوري السعودي بينك وبين خوياك', en:'Saudi League predictions between you and your crew' },
    player: { ar:'لاعب', en:'Player' },
    organizer: { ar:'المنظم', en:'Organizer' },
    adminPinLabel: { ar:'الرمز السري للمنظم', en:'Organizer PIN' },
    enterAdmin: { ar:'دخول لوحة التحكم', en:'Enter Control Panel' },
    emailLabel: { ar:'بريدك الإلكتروني', en:'Your email' },
    emailPlaceholder: { ar:'الإيميل اللي سجّلك فيه المنظم', en:'The email the organizer registered you with' },
    pinLabel: { ar:'الرمز السري الخاص فيك', en:'Your PIN' },
    pinPlaceholder: { ar:'الرمز اللي عطاك إياه المنظم', en:'The PIN the organizer gave you' },
    loginBtn: { ar:'دخول', en:'Log in' },
    errBadPin: { ar:'الرمز غير صحيح.', en:'Incorrect PIN.' },
    errFillBoth: { ar:'عبّي الإيميل والرمز السري.', en:'Fill in your email and PIN.' },
    errEmailNotFound: { ar:'هذا الإيميل غير مسجل — خلّي المنظم يضيفك من لوحة التحكم.', en:"This email isn't registered — ask the organizer to add you from the control panel." },
    errWrongPin: { ar:'الرمز السري غير صحيح.', en:'Incorrect PIN.' },
    errSuspended: { ar:'حسابك موقوف مؤقتًا من المنظم — تواصل معه.', en:'Your account is temporarily suspended — contact the organizer.' },
    logout: { ar:'خروج', en:'Log out' },
    tabControlPanel: { ar:'لوحة التحكم', en:'Control Panel' },
    tabStandings: { ar:'الترتيب', en:'Standings' },
    tabHistory: { ar:'الجولات', en:'Rounds' },
    tabPredict: { ar:'التوقعات', en:'Predictions' },
    tabPrevious: { ar:'السابقة', en:'Previous' },
    noRoundsYet: { ar:'ما فيه جولات بعد — انتظر المنظم يضيف الجولة الأولى.', en:'No rounds yet — wait for the organizer to add the first one.' },
    predictionsFor: { ar:'توقعات {round}', en:'Predictions — {round}' },
    noOneYet: { ar:'محد توقع بعد', en:'No picks yet' },
    resultPrefix: { ar:'النتيجة: ', en:'Result: ' },
    matchesFor: { ar:'مباريات {round}', en:'Matches — {round}' },
    predictHint: { ar:'اختر فوز/تعادل/خسارة لكل مباراة. ٥ صحيحة أو أكثر = ٣ نقاط، ٨ أو أكثر = ٥ نقاط. اختر مباراة وحدة بس تكتب لها نتيجة دقيقة (بونص +١ منفصل). توقعاتك سرّية لين تبدأ أول مباراة بالجولة.', en:'Pick win / draw / loss for every match. 5+ correct = 3 points, 8+ correct = 5 points. Pick one match to also call its exact score (a separate +1 bonus). Your picks stay private until the round\'s first match kicks off.' },
    draw: { ar:'تعادل', en:'Draw' },
    exactToggleLabel: { ar:'🎯 اختر هذي كمباراة النتيجة الدقيقة (نقطة بونص إضافية)', en:'🎯 Pick this match for the exact-score bonus (+1 extra point)' },
    savePredictions: { ar:'حفظ التوقعات 💾', en:'Save Predictions 💾' },
    savingPredictions: { ar:'جارٍ الحفظ...', en:'Saving...' },
    validationPickAll: { ar:'اختر فوز/تعادل/خسارة لكل مباراة قبل الحفظ.', en:'Pick win / draw / loss for every match before saving.' },
    savedOk: { ar:'تم حفظ توقعاتك ✅', en:'Your predictions were saved ✅' },
    savedErr: { ar:'صار خطأ أثناء الحفظ، حاول مرة ثانية ⚠️', en:'Something went wrong saving — try again ⚠️' },
    roundLockedToast: { ar:'الجولة بدأت وانقفلت التوقعات', en:'This round has started — predictions are locked' },
    noPlayersYet: { ar:'ما فيه لاعبين مسجلين بعد.', en:'No players registered yet.' },
    overallStandings: { ar:'🏅 الترتيب العام', en:'🏅 Overall Standings' },
    colPlayer: { ar:'اللاعب', en:'Player' },
    colTotal: { ar:'المجموع', en:'Total' },
    colExactBonus: { ar:'بونص دقيق 🎯', en:'Exact Bonus 🎯' },
    colBestRound: { ar:'أفضل جولة', en:'Best Round' },
    noRoundsYetHistory: { ar:'ما فيه جولات بعد.', en:'No rounds yet.' },
    notFinished: { ar:'لم تنتهِ بعد', en:'Not finished yet' },
    noPrediction: { ar:'لا يوجد توقع', en:'No prediction' },
    yourPredictionPrefix: { ar:'توقعك: ', en:'Your pick: ' },
    pointsSuffix: { ar:'نقطة', en:'pts' },
    backupTitle: { ar:'نسخة احتياطية 💾', en:'Backup 💾' },
    backupHint: { ar:'حمّل كل البيانات (اللاعبين، المباريات، التوقعات، الترتيب) كملف إكسل عندك، احتياط لو صار أي شي بالموقع.', en:'Download all data (players, matches, predictions, standings) as an Excel file — a safety copy in case anything happens to the site.' },
    downloadExcel: { ar:'تنزيل نسخة Excel ⬇️', en:'Download Excel Backup ⬇️' },
    adminTabRounds: { ar:'الجولات والنتائج', en:'Rounds & Results' },
    adminTabPlayers: { ar:'اللاعبون', en:'Players' },
    adminTabSettings: { ar:'الإعدادات', en:'Settings' },
    addNewRound: { ar:'إضافة جولة جديدة ➕', en:'Add New Round ➕' },
    pasteHint: { ar:'انسخ جدول الجولة من أي مصدر رسمي تثق فيه (موقع دوري روشن، حساب الاتحاد، جوجل...) والصقه هنا، وراح يحوّله تلقائيًا لمباريات — أسماء الفرق لازم تكون بالعربي عشان يتعرف عليها:', en:'Copy the round schedule from any official source you trust (Roshn League site, federation account, Google...) and paste it here — it\'ll turn it into matches automatically. Team names must stay in Arabic for it to recognize them:' },
    convertText: { ar:'حوّل النص لمباريات 🪄', en:'Convert Text to Matches 🪄' },
    roundNameLabel: { ar:'اسم الجولة', en:'Round Name' },
    addMatchManually: { ar:'+ إضافة مباراة يدويًا', en:'+ Add Match Manually' },
    saveRound: { ar:'حفظ الجولة', en:'Save Round' },
    selectTeam: { ar:'-- اختر الفريق --', en:'-- Select Team --' },
    kickoffLabel: { ar:'موعد بداية المباراة', en:'Kickoff Time' },
    stadiumLabel: { ar:'الملعب', en:'Stadium' },
    selectStadium: { ar:'-- اختر الملعب --', en:'-- Select Stadium --' },
    cancel: { ar:'إلغاء', en:'Cancel' },
    saveEdit: { ar:'حفظ التعديل', en:'Save Changes' },
    finished: { ar:'منتهية', en:'Finished' },
    resultPending: { ar:'لم تُدخل النتيجة', en:'Result pending' },
    editRound: { ar:'تعديل الجولة ✏️', en:'Edit Round ✏️' },
    edit: { ar:'تعديل', en:'Edit' },
    deleteRound: { ar:'حذف الجولة', en:'Delete Round' },
    pasteFirst: { ar:'الصق نص الجولة أول.', en:'Paste the round text first.' },
    parseFailed: { ar:'ما قدرت ألقط أي مباراة من النص — تأكد إن أسماء الفرق مكتوبة بالعربي (مثل "الهلال × النصر") وحاول مرة ثانية، أو أضف المباريات يدويًا بالأسفل.', en:'Couldn\'t detect any matches in that text — make sure team names are written in Arabic (like "الهلال × النصر") and try again, or add matches manually below.' },
    reviewBeforeSave: { ar:'راجع كل شي قبل الحفظ.', en:'Review everything before saving.' },
    roundSaveValidation: { ar:'أدخل اسم الجولة وأضف مباراة واحدة على الأقل.', en:'Enter a round name and add at least one match.' },
    teamNamesValidation: { ar:'أكمل أسماء جميع الفرق.', en:'Fill in all team names.' },
    genericSaveErr: { ar:'صار خطأ أثناء الحفظ.', en:'Something went wrong saving.' },
    enterBothTeams: { ar:'أدخل اسمي الفريقين', en:'Enter both team names' },
    saveErrRetry: { ar:'صار خطأ أثناء الحفظ — حاول مرة ثانية', en:'Save failed — try again' },
    editSaved: { ar:'تم حفظ التعديل', en:'Changes saved' },
    deleteErrRetry: { ar:'صار خطأ أثناء الحذف — حاول مرة ثانية', en:'Delete failed — try again' },
    addPlayer: { ar:'إضافة متسابق ➕', en:'Add Player ➕' },
    namePlaceholder: { ar:'الاسم', en:'Name' },
    emailPlaceholder2: { ar:'الإيميل', en:'Email' },
    pinPlaceholder2: { ar:'رمز سري (٤ أرقام)', en:'PIN (4 digits)' },
    addBtn: { ar:'إضافة', en:'Add' },
    addPlayerHint: { ar:'الرمز معبّى تلقائيًا وتقدر تغيّره — لازم تعطيه للاعب مع إيميله عشان يقدر يدخل.', en:'The PIN is auto-filled and you can change it — give it to the player along with their email so they can log in.' },
    noPlayersAdded: { ar:'ما ضفت أي متسابق بعد.', en:"You haven't added any players yet." },
    suspended: { ar:'موقوف', en:'Suspended' },
    codeLabel: { ar:'الرمز: ', en:'PIN: ' },
    activate: { ar:'تفعيل', en:'Activate' },
    suspend: { ar:'إيقاف مؤقت', en:'Suspend' },
    remove: { ar:'إزالة', en:'Remove' },
    participantsCount: { ar:'المتسابقون ({n})', en:'Players ({n})' },
    validNameEmail: { ar:'أدخل الاسم والإيميل', en:'Enter name and email' },
    emailTaken: { ar:'هذا الإيميل مستخدم مسبقًا لمتسابق ثاني', en:'This email is already used by another player' },
    validNameEmailPin: { ar:'أدخل الاسم والإيميل والرمز السري.', en:'Enter name, email, and PIN.' },
    emailAlreadyAdded: { ar:'هذا الإيميل مضاف مسبقًا.', en:'This email is already added.' },
    playerSuspendedToast: { ar:'تم إيقاف المتسابق مؤقتًا', en:'Player suspended' },
    playerActivatedToast: { ar:'تم تفعيل المتسابق', en:'Player activated' },
    settingsTitle: { ar:'إعدادات المسابقة ⚙️', en:'Competition Settings ⚙️' },
    compNameLabel: { ar:'اسم المسابقة (ثابت)', en:'Competition Name (fixed)' },
    pointsRulesHint: { ar:'نظام النقاط ثابت بالموقع: فوز/تعادل/خسارة لكل مباراة من التسع — ٥-٧ صحيحة = ٣ نقاط، ٨-٩ صحيحة = ٥ نقاط، أقل من ٥ = صفر. زائد بونص +١ منفصل لو خمّنت النتيجة الدقيقة للمباراة اللي اخترتها.', en:'The points system is fixed: win/draw/loss for each of the 9 matches — 5-7 correct = 3 points, 8-9 correct = 5 points, fewer than 5 = zero. Plus a separate +1 bonus if you nailed the exact score of the match you picked.' },
    retry: { ar:'إعادة المحاولة', en:'Try Again' },
    storageNotConnected: { ar:'⚠️ التخزين غير مربوط', en:'⚠️ Storage not connected' },
    storageNotConnectedHint: { ar:'لازم تربط الموقع بجدول Google Sheets أول (خطوة تسويها مرة وحدة بس) — رابط الـ Apps Script لسا ما انحط بالكود، أو الرابط المحطوط ما يشتغل.', en:'You need to connect the site to a Google Sheet first (a one-time setup step) — the Apps Script URL isn\'t set in the code yet, or the one that\'s there isn\'t working.' },
    connectionError: { ar:'⚠️ صار خطأ بالاتصال', en:'⚠️ Connection error' },
    connectionErrorHint: { ar:'ما قدرنا نوصل للبيانات حاليًا. جرّب تحدّث الصفحة بعد شوي.', en:'We couldn\'t reach the data right now. Try refreshing in a moment.' },
    loadFailed: { ar:'تعذّر تحميل البيانات.', en:'Failed to load data.' }
  };
  function t(key, vars){
    const entry = I18N[key];
    let s = entry ? (entry[lang] || entry.ar) : key;
    if(vars) Object.keys(vars).forEach(k => { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }

  const root = document.getElementById('pr-app');
  const uid = (p) => p + '_' + Math.random().toString(36).slice(2,8) + Date.now().toString(36).slice(-4);
  const esc = (s) => (s||'').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const AR_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  const toAr = (x) => lang === 'en' ? String(x==null?'':x) : String(x==null?'':x).replace(/[0-9]/g, d => AR_DIGITS[+d]);
  const toWest = (x) => String(x==null?'':x).replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d)));
  window.prDigitInput = function(el){ el.value = toAr(toWest(el.value).replace(/[^0-9]/g,'')); };

  // ===== ضع رابط نشر Google Apps Script هنا بعد النشر (خطوات النشر بالأسفل في الشات) =====
  const API_URL = 'https://script.google.com/macros/s/AKfycbzOCqf1n2q79COXQG7GpdqFMOwHnE544QG-Hc1uoBKl53IVqixV_vygEK4yFZ76SE_I/exec';

  let lastStorageError = '';
  function fetchWithTimeout(url, opts, ms){
    return Promise.race([
      fetch(url, opts || {}),
      new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms || 20000))
    ]);
  }
  async function sGet(key){
    try {
      const res = await fetchWithTimeout(API_URL + '?key=' + encodeURIComponent(key));
      const data = await res.json();
      return { ok: true, value: data && data.value ? JSON.parse(data.value) : null };
    } catch(e){
      lastStorageError = (e && e.message === 'TIMEOUT') ? 'انتهى وقت الانتظار (الاتصال بطيء جدًا أو ما استجاب)' : ((e && e.message) ? e.message : String(e));
      return { ok: false, value: null };
    }
  }
  async function sSet(key, value){
    try {
      const res = await fetchWithTimeout(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ key, value: JSON.stringify(value) })
      });
      const data = await res.json();
      return !!(data && data.ok);
    } catch(e){ lastStorageError = (e && e.message === 'TIMEOUT') ? 'انتهى وقت الانتظار (الاتصال بطيء جدًا أو ما استجاب)' : ((e && e.message) ? e.message : String(e)); return false; }
  }

  async function loadAll(){
    try{
      const [c,p,r,pr] = await Promise.all([sGet('config'), sGet('players'), sGet('rounds'), sGet('predictions')]);
      if(!c.ok || !p.ok || !r.ok || !pr.ok){ storageHealthy = false; return; }
      storageHealthy = true;
      config = c.value || { title: FIXED_TITLE, adminPin: FIXED_ADMIN_PIN, pointsExact: 3, pointsWinner: 1 };
      if(!c.value) await sSet('config', config);
      players = p.value || []; rounds = r.value || []; predictions = pr.value || {};
      loadError = false;
    }catch(e){ loadError = true; }
  }

  function findOpenRoundId(){
    for(let i = rounds.length - 1; i >= 0; i--){
      if(rounds[i].matches.some(m => !m.finished)) return rounds[i].id;
    }
    return rounds.length ? rounds[rounds.length-1].id : null;
  }

  function earliestKickoff(rnd){
    const times = rnd.matches.filter(m => m.kickoff).map(m => new Date(m.kickoff).getTime());
    return times.length ? Math.min(...times) : null;
  }
  function isRoundLocked(rnd){
    const first = earliestKickoff(rnd);
    if(first == null) return false;
    return new Date().getTime() >= first;
  }

  function matchOutcome(m){
    if(m.homeScore === m.awayScore) return 'draw';
    return m.homeScore > m.awayScore ? 'home' : 'away';
  }
  function calcRoundScore(playerId, rnd){
    const preds = predictions[playerId] || {};
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

  function computeStandings(){
    return players.map(pl => {
      let total = 0, exactBonusTotal = 0, roundTotals = {};
      rounds.forEach(rnd => {
        const r = calcRoundScore(pl.id, rnd);
        total += r.total; exactBonusTotal += r.exactBonus;
        roundTotals[rnd.id] = r.total;
      });
      let bestRound = null, bestVal = -1;
      rounds.forEach(rnd => { if(roundTotals[rnd.id] > bestVal){ bestVal = roundTotals[rnd.id]; bestRound = rnd.name; } });
      return { player: pl, total, exactBonusTotal, bestRound: bestRound || '—', bestVal: bestVal < 0 ? 0 : bestVal };
    }).sort((a,b) => b.total - a.total);
  }

  function fmtDT(iso){
    if(!iso) return '—';
    const d = new Date(iso);
    return toAr(d.toLocaleString(lang === 'en' ? 'en-US' : 'ar-SA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }));
  }

  // ---------- RENDER ----------
  function render(){
    if(!storageHealthy){
      // We can't tell yet whether this browser belongs to the admin (session hasn't
      // loaded — storage is what failed), so fall back to the last locally-remembered
      // role. Only that case gets the technical detail; everyone else sees a plain,
      // non-technical message.
      const knownAdmin = !!((loadSession() || {}).isAdmin);
      root.innerHTML = `<div class="pr-center-screen"><div class="pr-card" style="max-width:440px;text-align:center">
        <div class="pr-section-title" style="justify-content:center">${knownAdmin ? t('storageNotConnected') : t('connectionError')}</div>
        <div class="pr-hint" style="margin-bottom:14px">${knownAdmin ? t('storageNotConnectedHint') : t('connectionErrorHint')}</div>
        ${knownAdmin && lastStorageError ? `<div class="pr-hint" style="margin-bottom:14px;direction:ltr;text-align:left;background:rgba(0,0,0,0.25);padding:8px;border-radius:8px;font-size:11px;word-break:break-all">${esc(lastStorageError)}</div>` : ''}
        <button class="pr-btn" onclick="prBoot()">${t('retry')}</button>
      </div></div>`;
      return;
    }
    if(loadError){
      root.innerHTML = `<div class="pr-center-screen"><div style="text-align:center">
        <div style="margin-bottom:10px">${t('loadFailed')}</div>
        <button class="pr-btn" onclick="prBoot()">${t('retry')}</button>
      </div></div>`;
      return;
    }
    if(!session.playerId && !session.isAdmin){ renderLogin(); return; }
    renderApp();
  }

  function langToggleBtn(extraClass){
    return `<button class="pr-lang-toggle ${extraClass||''}" onclick="prToggleLang()" title="${lang==='en'?'التبديل للعربية':'Switch to English'}">
      <span class="pr-lang-globe">🌐</span>${lang==='en' ? 'العربية' : 'English'}
    </button>`;
  }

  function renderLogin(){
    root.innerHTML = `
      <div class="pr-center-screen"><div class="pr-card pr-login-card">
        ${langToggleBtn('pr-lang-toggle-corner')}
        <div class="pr-login-crest"><img src="logo.png" alt="" class="pr-logo pr-logo-lg"></div>
        <div class="pr-title pr-title-center">${lang==='en' ? FIXED_TITLE_EN : toAr(esc(config.title))}</div>
        <div class="pr-hint pr-login-sub">${t('subtitle')}</div>
        <div class="pr-tabs">
          <button class="pr-tab ${loginMode!=='admin'?'active':''}" onclick="prSetLoginMode('player')">${t('player')}</button>
          <button class="pr-tab ${loginMode==='admin'?'active':''}" onclick="prSetLoginMode('admin')">${t('organizer')}</button>
        </div>
        <div id="login-body"></div>
        <div id="login-err" class="pr-error"></div>
      </div></div>`;
    renderLoginBody();
  }
  let loginMode = 'player';
  window.prSetLoginMode = function(m){ loginMode = m; renderLogin(); };
  function renderLoginBody(){
    const body = document.getElementById('login-body');
    if(loginMode === 'admin'){
      body.innerHTML = `
        <label class="pr-label">${t('adminPinLabel')}</label>
        <input class="pr-input" id="lg-pin" type="password" inputmode="numeric">
        <button class="pr-btn" onclick="prAdminLogin()">${t('enterAdmin')}</button>`;
    } else {
      body.innerHTML = `
        <label class="pr-label">${t('emailLabel')}</label>
        <input class="pr-input" id="lg-email" type="email" placeholder="${t('emailPlaceholder')}">
        <label class="pr-label">${t('pinLabel')}</label>
        <input class="pr-input" id="lg-pin" type="password" inputmode="numeric" placeholder="${t('pinPlaceholder')}">
        <button class="pr-btn" onclick="prPlayerLogin()">${t('loginBtn')}</button>`;
    }
  }
  function saveSession(){
    try { localStorage.setItem('pr_session', JSON.stringify(session)); } catch(e){}
  }
  function loadSession(){
    try {
      const raw = localStorage.getItem('pr_session');
      if(!raw) return null;
      return JSON.parse(raw);
    } catch(e){ return null; }
  }
  function clearSession(){
    try { localStorage.removeItem('pr_session'); } catch(e){}
  }
  window.prAdminLogin = function(){
    const pin = document.getElementById('lg-pin').value.trim();
    if(pin === config.adminPin){ session.isAdmin = true; activeTab = 'admin'; saveSession(); render(); }
    else document.getElementById('login-err').textContent = t('errBadPin');
  };
  window.prPlayerLogin = async function(){
    const email = document.getElementById('lg-email').value.trim().toLowerCase();
    const pin = document.getElementById('lg-pin').value.trim();
    if(!email || !pin){ document.getElementById('login-err').textContent = t('errFillBoth'); return; }
    const existing = players.find(p => (p.email || '').trim().toLowerCase() === email);
    if(!existing){ document.getElementById('login-err').textContent = t('errEmailNotFound'); return; }
    if((existing.pin || '') !== pin){ document.getElementById('login-err').textContent = t('errWrongPin'); return; }
    if(existing.suspended){ document.getElementById('login-err').textContent = t('errSuspended'); return; }
    session.playerId = existing.id; session.playerName = existing.name;
    activeTab = 'predict';
    saveSession();
    render();
  };

  function renderApp(){
    const badgeName = session.isAdmin ? t('organizer') : session.playerName;
    root.innerHTML = `
      <div class="pr-header">
        <div class="pr-title-row">
          <img src="logo.png" alt="" class="pr-logo pr-logo-header">
          <span class="pr-title-text">${lang==='en' ? FIXED_TITLE_EN : toAr(esc(config.title))}</span>
        </div>
        <div class="pr-header-right">
          ${langToggleBtn()}
          <div class="pr-user-badge"><span class="pr-avatar">${esc((badgeName||'?').trim().charAt(0))}</span><b>${esc(badgeName)}</b> <button class="pr-logout" onclick="prLogout()">${t('logout')}</button></div>
        </div>
        <div class="pr-subtitle">${t('subtitle')}</div>
      </div>
      <div class="pr-tabs" id="pr-tabs"></div>
      <div id="pr-content"></div>
    `;
    const tabsEl = document.getElementById('pr-tabs');
    const tabs = session.isAdmin
      ? [['admin', t('tabControlPanel')],['leaderboard', t('tabStandings')],['history', t('tabHistory')]]
      : [['predict', t('tabPredict')],['leaderboard', t('tabStandings')],['history', t('tabPrevious')]];
    tabsEl.innerHTML = tabs.map(([k,l]) => `<button class="pr-tab ${activeTab===k?'active':''}" onclick="prSetTab('${k}')">${l}</button>`).join('');
    const content = document.getElementById('pr-content');
    if(activeTab === 'predict') content.innerHTML = renderPredictTab();
    else if(activeTab === 'leaderboard') content.innerHTML = renderLeaderboardTab();
    else if(activeTab === 'history') content.innerHTML = renderHistoryTab();
    else if(activeTab === 'admin') renderAdminTab(content);
  }
  window.prSetTab = function(t){ activeTab = t; if(t !== 'admin') selectedRoundId = selectedRoundId || findOpenRoundId(); render(); };
  window.prLogout = function(){ session = { playerId:null, playerName:null, isAdmin:false }; loginMode='player'; clearSession(); render(); };

  let predictDraft = {};
  function initDraft(rnd){
    predictDraft = {};
    const myPreds = predictions[session.playerId] || {};
    rnd.matches.forEach(m => {
      const p = myPreds[m.id];
      predictDraft[m.id] = {
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

  function renderPredictTab(){
    if(!rounds.length) return `<div class="pr-card"><div class="pr-empty">${t('noRoundsYet')}</div></div>`;
    if(!selectedRoundId) selectedRoundId = findOpenRoundId();
    const roundChips = rounds.map(r => `<button class="pr-round-chip ${r.id===selectedRoundId?'active':''}" onclick="prSelectRound('${r.id}')">${roundDisplayName(r.name)}</button>`).join('');
    const rnd = rounds.find(r => r.id === selectedRoundId) || rounds[0];
    const locked = isRoundLocked(rnd);

    if(locked){
      const rows = rnd.matches.map(m => {
        const matchDecided = m.finished && m.homeScore != null && m.awayScore != null;
        const realOutcome = matchDecided ? matchOutcome(m) : null;
        const allPicks = players.map(pl => {
          const pred = (predictions[pl.id] || {})[m.id];
          const isMe = pl.id === session.playerId;
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
      const myScore = calcRoundScore(session.playerId, rnd);
      const lockedHint = lang === 'en'
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

    if(!predictDraftRoundId || predictDraftRoundId !== rnd.id){ initDraft(rnd); predictDraftRoundId = rnd.id; }

    const rows = rnd.matches.map(m => {
      const d = predictDraft[m.id] || { outcome:null, isExact:false, exactHome:'', exactAway:'' };
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
  let predictDraftRoundId = null;
  window.prSelectRound = function(id){ selectedRoundId = id; predictDraftRoundId = null; render(); };
  window.prPickOutcome = function(matchId, side){
    if(!predictDraft[matchId]) predictDraft[matchId] = { outcome:null, isExact:false, exactHome:'', exactAway:'' };
    predictDraft[matchId].outcome = side;
    render();
  };
  window.prToggleExact = function(matchId, checked){
    if(checked){
      // only one match per round can be the exact pick — clear others
      Object.keys(predictDraft).forEach(id => { predictDraft[id].isExact = false; });
      predictDraft[matchId].isExact = true;
    } else {
      predictDraft[matchId].isExact = false;
    }
    render();
  };
  window.prSetExactVal = function(matchId, side, val){
    if(!predictDraft[matchId]) return;
    predictDraft[matchId][side === 'home' ? 'exactHome' : 'exactAway'] = toWest(val);
  };
  window.prSavePredictions = async function(roundId){
    const rnd = rounds.find(r => r.id === roundId);
    if(isRoundLocked(rnd)){ prToast(t('roundLockedToast'), true); render(); return; }
    const missing = rnd.matches.some(m => !predictDraft[m.id] || !predictDraft[m.id].outcome);
    if(missing){ document.getElementById('predict-msg').textContent = t('validationPickAll'); return; }
    const mine = predictions[session.playerId] ? {...predictions[session.playerId]} : {};
    rnd.matches.forEach(m => {
      const d = predictDraft[m.id];
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
    predictions[session.playerId] = mine;
    const ok = await sSet('predictions', predictions);
    if(btn){ btn.disabled = false; btn.textContent = btnOriginalLabel; }
    document.getElementById('predict-msg').textContent = ok ? t('savedOk') : t('savedErr');
    prToast(ok ? t('savedOk') : t('savedErr'), !ok);
  };

  function renderLeaderboardTab(){
    if(!players.length) return `<div class="pr-card"><div class="pr-empty">${t('noPlayersYet')}</div></div>`;
    const standings = computeStandings();
    const medals = ['🥇','🥈','🥉'];
    const rows = standings.map((s,i) => `
      <tr class="${s.player.id===session.playerId?'pr-row-me':''}">
        <td class="pr-rank">${medals[i] || toAr(i+1)}</td>
        <td><span class="pr-player-cell"><span class="pr-avatar pr-avatar-sm">${esc((s.player.name||'?').trim().charAt(0))}</span><span>${esc(s.player.name)}</span></span></td>
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

  function renderHistoryTab(){
    if(!rounds.length) return `<div class="pr-card"><div class="pr-empty">${t('noRoundsYetHistory')}</div></div>`;
    return rounds.slice().reverse().map(rnd => {
      const myPreds = predictions[session.playerId] || {};
      const score = calcRoundScore(session.playerId, rnd);
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

  // ---------- ADMIN ----------
  function renderAdminTab(content){
    content.innerHTML = `
      <div class="pr-card" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div>
          <div class="pr-section-title" style="margin-bottom:2px">${t('backupTitle')}</div>
          <div class="pr-hint">${t('backupHint')}</div>
        </div>
        <button class="pr-btn" onclick="prExportExcel()">${t('downloadExcel')}</button>
      </div>
      <div class="pr-tabs" style="margin-bottom:16px">
        <button class="pr-tab ${adminSubTab==='rounds'?'active':''}" onclick="prAdminSub('rounds')">${t('adminTabRounds')}</button>
        <button class="pr-tab ${adminSubTab==='players'?'active':''}" onclick="prAdminSub('players')">${t('adminTabPlayers')}</button>
        <button class="pr-tab ${adminSubTab==='settings'?'active':''}" onclick="prAdminSub('settings')">${t('adminTabSettings')}</button>
      </div>
      <div id="admin-body"></div>`;
    const body = document.getElementById('admin-body');
    if(adminSubTab === 'rounds') body.innerHTML = renderAdminRounds();
    else if(adminSubTab === 'players') body.innerHTML = renderAdminPlayers();
    else body.innerHTML = renderAdminSettings();
  }
  window.prAdminSub = function(t){ adminSubTab = t; draftMatches = makeEmptyDraftMatches(); draftRoundName = ''; importStatus = ''; editingRoundId = null; roundEditDraft = {}; render(); };

  function renderAdminRounds(){
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
        ${importStatus ? `<div class="pr-hint" style="margin-top:6px">${esc(importStatus)}</div>` : ''}
        <div style="border-top:1px dashed var(--card-border);margin:16px 0"></div>
        <label class="pr-label">${t('roundNameLabel')}</label>
        <input class="pr-input" id="ar-name" placeholder="مثلاً: الجولة 9" value="${esc(draftRoundName)}" style="margin-bottom:12px">
        <div id="ar-matches">${draftMatches.map((m,idx) => renderDraftMatch(m, idx)).join('')}</div>
        <button class="pr-btn ghost small" onclick="prAddDraftMatch()">${t('addMatchManually')}</button>
        <div style="margin-top:14px;display:flex;justify-content:flex-end">
          <button class="pr-btn" onclick="prSaveRound()">${t('saveRound')}</button>
        </div>
        <div id="ar-err" class="pr-error"></div>
      </div>`;
    const existing = rounds.slice().reverse().map(rnd => {
      const isEditing = editingRoundId === rnd.id;
      const matches = rnd.matches.map(m => {
        if(isEditing){
          const d = roundEditDraft[m.id] || makeRoundDraftEntry(m);
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
          </div>`;
        }
        const scoreTxt = m.finished ? `${toAr(m.homeScore)} - ${toAr(m.awayScore)}` : '–';
        return `
        <div class="pr-match" style="flex-wrap:wrap">
          <div style="flex:1;min-width:150px">
            <b class="pr-match-title">${teamPairHTML(m.home)} × ${teamPairHTML(m.away)}</b>
            <div class="pr-match-time">${fmtDT(m.kickoff)} — <span class="pr-tag ${m.finished?'closed':'open'}">${m.finished?t('finished'):t('resultPending')}</span></div>
            ${m.stadium ? `<div class="pr-match-time">🏟️ ${esc(stadiumName(m.stadium))}</div>` : ''}
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
  let editingRoundId = null;
  let roundEditDraft = {}; // matchId -> { home, away, kickoff, homeScore, awayScore }
  function makeRoundDraftEntry(m){
    return {
      home: m.home, away: m.away,
      kickoff: m.kickoff ? toLocalDatetimeValue(new Date(m.kickoff)) : '',
      homeScore: m.homeScore != null ? String(m.homeScore) : '',
      awayScore: m.awayScore != null ? String(m.awayScore) : '',
      stadium: m.stadium || matchStadiumOptions(m.home, m.away)[0] || ''
    };
  }
  window.prStartEditRound = function(roundId){
    const rnd = rounds.find(r => r.id === roundId);
    if(!rnd) return;
    editingRoundId = roundId;
    roundEditDraft = {};
    rnd.matches.forEach(m => { roundEditDraft[m.id] = makeRoundDraftEntry(m); });
    render();
  };
  window.prCancelEditRound = function(){ editingRoundId = null; roundEditDraft = {}; render(); };
  window.prUpdateRoundDraft = function(matchId, field, val){
    const d = roundEditDraft[matchId];
    if(!d) return;
    if(field === 'homeScore' || field === 'awayScore') d[field] = toWest(val).replace(/[^0-9]/g,'');
    else d[field] = val;
    if(field === 'home' || field === 'away'){
      const opts = matchStadiumOptions(d.home, d.away);
      if(!d.stadium || !opts.includes(d.stadium)) d.stadium = opts[0] || '';
      render();
    }
  };
  window.prSaveRoundEdits = async function(roundId){
    const rnd = rounds.find(r => r.id === roundId);
    if(!rnd) return;
    for(const m of rnd.matches){
      const d = roundEditDraft[m.id];
      if(!d || !d.home.trim() || !d.away.trim()){ prToast(t('enterBothTeams'), true); return; }
    }
    const backups = rnd.matches.map(m => ({ id:m.id, home:m.home, away:m.away, kickoff:m.kickoff, homeScore:m.homeScore, awayScore:m.awayScore, finished:m.finished, stadium:m.stadium }));
    rnd.matches.forEach(m => {
      const d = roundEditDraft[m.id];
      m.home = d.home.trim(); m.away = d.away.trim();
      m.kickoff = d.kickoff ? new Date(d.kickoff).toISOString() : null;
      m.stadium = (d.stadium || '').trim();
      if(d.homeScore !== '' && d.awayScore !== ''){
        m.homeScore = Number(d.homeScore); m.awayScore = Number(d.awayScore); m.finished = true;
      }
    });
    const ok = await sSet('rounds', rounds);
    if(!ok){
      rnd.matches.forEach(m => {
        const b = backups.find(x => x.id === m.id);
        m.home = b.home; m.away = b.away; m.kickoff = b.kickoff; m.homeScore = b.homeScore; m.awayScore = b.awayScore; m.finished = b.finished; m.stadium = b.stadium;
      });
      prToast(t('saveErrRetry'), true);
    } else {
      prToast(t('editSaved'));
      editingRoundId = null; roundEditDraft = {};
    }
    render();
  };

  function teamSelectOptions(selected){
    return `<option value="" ${!selected?'selected':''}>${t('selectTeam')}</option>` +
      SATEAMS.map(team => `<option value="${esc(team)}" ${selected===team?'selected':''}>${esc(teamName(team))}</option>`).join('');
  }
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
    </div>`;
  }
  function makeEmptyDraftMatches(){
    return Array.from({ length: 9 }, () => ({ home:'', away:'', kickoff:'', stadium:'' }));
  }
  function toLocalDatetimeValue(d){
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  window.prParsePastedFixtures = function(){
    const raw = document.getElementById('paste-fixtures').value;
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if(!lines.length){ importStatus = t('pasteFirst'); render(); return; }

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
        parsedMatches.push({ home, away, kickoff, stadium: matchStadiumOptions(home, away)[0] || '' });
      } else if(!roundRe.test(line) && !isoM && !dmM){
        // a line with no teams, no round marker, no date — likely noise, ignore silently
      } else if(uniqueTeams.length === 1){
        skipped++;
      }
    });

    if(!parsedMatches.length){
      importStatus = t('parseFailed');
      render(); return;
    }
    draftMatches = parsedMatches;
    if(roundGuess) draftRoundName = 'الجولة ' + roundGuess;
    const missingTime = parsedMatches.filter(m => !m.kickoff).length;
    if(lang === 'en'){
      importStatus = `Extracted ${parsedMatches.length} match(es) from the text.` +
        (missingTime ? ` ⚠️ ${missingTime} of them had no clear date — set the time manually below.` : '') +
        (skipped ? ` (Ignored ${skipped} line(s) that only had one team.)` : '') +
        ' ' + t('reviewBeforeSave');
    } else {
      importStatus = `تم استخراج ${toAr(parsedMatches.length)} مباراة من النص.` +
        (missingTime ? ` ⚠️ ${toAr(missingTime)} منها بدون تاريخ واضح — حدد الموعد يدويًا لها بالأسفل.` : '') +
        (skipped ? ` (تجاهلت ${toAr(skipped)} سطر ما وضح فيه إلا فريق وحد).` : '') +
        ' ' + t('reviewBeforeSave');
    }
    render();
  };

  window.prAddDraftMatch = function(){ draftMatches.push({ home:'', away:'', kickoff:'' }); render(); };
  window.prRemoveDraft = function(idx){ draftMatches.splice(idx,1); render(); };
  window.prUpdateDraft = function(idx, field, val){
    draftMatches[idx][field] = val;
    if(field === 'kickoff' && val){
      // matches in a round are chronological — carry this kickoff forward as the
      // default for any later rows that don't have their own time set yet
      let changed = false;
      for(let i = idx + 1; i < draftMatches.length; i++){
        if(!draftMatches[i].kickoff){ draftMatches[i].kickoff = val; changed = true; }
      }
      if(changed) render();
    }
    if(field === 'home' || field === 'away'){
      const row = draftMatches[idx];
      const opts = matchStadiumOptions(row.home, row.away);
      if(!row.stadium || !opts.includes(row.stadium)) row.stadium = opts[0] || '';
      render();
    }
  };
  window.prSaveRound = async function(){
    const name = document.getElementById('ar-name').value.trim();
    if(!name || !draftMatches.length){ document.getElementById('ar-err').textContent = t('roundSaveValidation'); return; }
    for(const m of draftMatches){ if(!m.home.trim() || !m.away.trim()){ document.getElementById('ar-err').textContent = t('teamNamesValidation'); return; } }
    const newRound = {
      id: uid('rd'), name,
      matches: draftMatches.map(m => ({ id: uid('mt'), home: m.home.trim(), away: m.away.trim(), kickoff: m.kickoff ? new Date(m.kickoff).toISOString() : null, stadium: (m.stadium||'').trim(), homeScore: null, awayScore: null, finished: false }))
    };
    rounds.push(newRound);
    const ok = await sSet('rounds', rounds);
    if(ok){ draftMatches = makeEmptyDraftMatches(); draftRoundName = ''; importStatus = ''; selectedRoundId = newRound.id; }
    else document.getElementById('ar-err').textContent = t('genericSaveErr');
    render();
  };
  function prToast(msg, isError){
    let t = document.getElementById('pr-toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'pr-toast';
      t.className = 'pr-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.remove('pr-toast-error','pr-toast-ok','pr-toast-show');
    t.classList.add(isError ? 'pr-toast-error' : 'pr-toast-ok');
    void t.offsetWidth;
    t.classList.add('pr-toast-show');
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(() => { t.classList.remove('pr-toast-show'); }, 3500);
  }

  window.prDeleteRound = async function(roundId){
    const backup = rounds;
    rounds = rounds.filter(r => r.id !== roundId);
    const ok = await sSet('rounds', rounds);
    if(!ok){ rounds = backup; prToast(t('deleteErrRetry'), true); }
    render();
  };

  function randPin(){ return String(Math.floor(1000 + Math.random()*9000)); }
  function renderAdminPlayers(){
    const addForm = `
      <div class="pr-card">
        <div class="pr-section-title">${t('addPlayer')}</div>
        <div class="pr-admin-form-row">
          <input class="pr-input" id="ap-name" placeholder="${t('namePlaceholder')}">
          <input class="pr-input" id="ap-email" type="email" placeholder="${t('emailPlaceholder2')}">
          <input class="pr-input" id="ap-pin" placeholder="${t('pinPlaceholder2')}" value="${randPin()}" style="max-width:150px">
          <button class="pr-btn small" onclick="prAdminAddPlayer()">${t('addBtn')}</button>
        </div>
        <div class="pr-hint">${t('addPlayerHint')}</div>
        <div id="ap-err" class="pr-error"></div>
      </div>`;
    if(!players.length) return addForm + `<div class="pr-card"><div class="pr-empty">${t('noPlayersAdded')}</div></div>`;
    const rows = players.map(p => {
      if(editingPlayerId === p.id){
        return `<div class="pr-match-draft">
          <div class="pr-admin-form-row">
            <input class="pr-input" id="ep-name" value="${esc(p.name)}" placeholder="${t('namePlaceholder')}">
            <input class="pr-input" id="ep-email" type="email" value="${esc(p.email||'')}" placeholder="${t('emailPlaceholder2')}">
          </div>
          <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">
            <button class="pr-btn ghost small" onclick="prCancelEditPlayer()">${t('cancel')}</button>
            <button class="pr-btn small" onclick="prSaveEditPlayer('${p.id}')">${t('saveEdit')}</button>
          </div>
        </div>`;
      }
      const suspended = !!p.suspended;
      return `<div class="pr-match" style="${suspended?'opacity:0.55':''}">
        <div style="flex:1; min-width:150px;">
          <b>${esc(p.name)}</b> ${suspended ? `<span class="pr-tag closed">${t('suspended')}</span>` : ''}
          <div class="pr-match-time" style="overflow-wrap:anywhere;">${esc(p.email||'')} — ${t('codeLabel')}${esc(p.pin||'—')}</div>
        </div>
        <button class="pr-btn ghost small" onclick="prStartEditPlayer('${p.id}')">${t('edit')}</button>
        <button class="pr-btn ${suspended?'':'ghost'} small" onclick="prToggleSuspendPlayer('${p.id}')">${suspended?t('activate'):t('suspend')}</button>
        <button class="pr-btn danger small" onclick="prRemovePlayer('${p.id}')">${t('remove')}</button>
      </div>`;
    }).join('');
    return addForm + `<div class="pr-card"><div class="pr-section-title">${t('participantsCount',{n:toAr(players.length)})}</div>${rows}</div>`;
  }
  let editingPlayerId = null;
  window.prStartEditPlayer = function(id){ editingPlayerId = id; render(); };
  window.prCancelEditPlayer = function(){ editingPlayerId = null; render(); };
  window.prSaveEditPlayer = async function(id){
    const name = document.getElementById('ep-name').value.trim();
    const email = document.getElementById('ep-email').value.trim().toLowerCase();
    if(!name || !email){ prToast(t('validNameEmail'), true); return; }
    if(players.some(p => p.id !== id && (p.email||'').trim().toLowerCase() === email)){ prToast(t('emailTaken'), true); return; }
    const p = players.find(x => x.id === id);
    const backup = { name: p.name, email: p.email };
    p.name = name; p.email = email;
    const ok = await sSet('players', players);
    if(!ok){ p.name = backup.name; p.email = backup.email; prToast(t('saveErrRetry'), true); }
    else prToast(t('editSaved'));
    editingPlayerId = null;
    render();
  };
  window.prToggleSuspendPlayer = async function(id){
    const p = players.find(x => x.id === id);
    const prev = !!p.suspended;
    p.suspended = !prev;
    const ok = await sSet('players', players);
    if(!ok){ p.suspended = prev; prToast(t('saveErrRetry'), true); }
    else prToast(p.suspended ? t('playerSuspendedToast') : t('playerActivatedToast'));
    render();
  };
  window.prAdminAddPlayer = async function(){
    const name = document.getElementById('ap-name').value.trim();
    const email = document.getElementById('ap-email').value.trim().toLowerCase();
    const pin = document.getElementById('ap-pin').value.trim();
    const errEl = document.getElementById('ap-err');
    if(!name || !email || !pin){ errEl.textContent = t('validNameEmailPin'); return; }
    if(players.some(p => (p.email || '').trim().toLowerCase() === email)){ errEl.textContent = t('emailAlreadyAdded'); return; }
    players.push({ id: uid('pl'), name, email, pin, createdAt: new Date().toISOString() });
    const ok = await sSet('players', players);
    if(!ok){ errEl.textContent = t('genericSaveErr'); return; }
    render();
  };
  window.prRemovePlayer = async function(id){
    const playersBackup = players, predsBackup = predictions;
    players = players.filter(p => p.id !== id);
    predictions = {...predictions}; delete predictions[id];
    const ok1 = await sSet('players', players);
    const ok2 = await sSet('predictions', predictions);
    if(!ok1 || !ok2){ players = playersBackup; predictions = predsBackup; prToast(t('deleteErrRetry'), true); }
    render();
  };

  function renderAdminSettings(){
    return `<div class="pr-card">
      <div class="pr-section-title">${t('settingsTitle')}</div>
      <label class="pr-label">${t('compNameLabel')}</label>
      <input class="pr-input" value="${lang==='en' ? FIXED_TITLE_EN : toAr(esc(config.title))}" disabled style="margin-bottom:12px;opacity:0.7">
      <div class="pr-hint">${t('pointsRulesHint')}</div>
    </div>`;
  }

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
    if(typeof XLSX === 'undefined'){ alert(lang==='en' ? 'Could not load the export library — check your internet connection and try again.' : 'تعذر تحميل مكتبة التصدير، تأكد من اتصالك بالإنترنت وحاول مرة ثانية.'); return; }
    const wb = XLSX.utils.book_new();
    const en = lang === 'en';

    const playersRows = players.map(p => en ? ({ Name: p.name, Email: p.email || '', PIN: p.pin || '', Status: p.suspended ? 'Suspended' : 'Active', 'Registered On': p.createdAt || '' }) : ({ الاسم: p.name, الإيميل: p.email || '', 'الرمز السري': p.pin || '', الحالة: p.suspended ? 'موقوف' : 'نشط', 'تاريخ التسجيل': p.createdAt || '' }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(playersRows.length?playersRows:[{[en?'Name':'الاسم']:''}]), en ? 'Players' : 'اللاعبون');

    const matchRows = [];
    rounds.forEach(r => r.matches.forEach(m => matchRows.push(en ? {
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
    players.forEach(pl => rounds.forEach(r => r.matches.forEach(m => {
      const pred = (predictions[pl.id] || {})[m.id];
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

  // teams datalist
  function injectDatalist(){
    let dl = document.getElementById('pr-teams');
    if(!dl){ dl = document.createElement('datalist'); dl.id = 'pr-teams'; document.body.appendChild(dl); }
    dl.innerHTML = SATEAMS.map(t => `<option value="${esc(t)}">`).join('');
  }

  window.prBoot = async function(){
    lang = loadLang();
    applyDirAttrs();
    root.innerHTML = `<div class="pr-center-screen"><div class="pr-loader"><span></span><span></span><span></span></div></div>`;
    injectDatalist();
    if(API_URL.indexOf('PASTE_YOUR') === 0){ storageHealthy = false; render(); return; }
    await loadAll();
    if(!storageHealthy){ render(); return; }
    const saved = loadSession();
    if(saved){
      if(saved.isAdmin){ session.isAdmin = true; activeTab = 'admin'; }
      else if(saved.playerId){
        const p = players.find(x => x.id === saved.playerId);
        if(p && !p.suspended){ session.playerId = p.id; session.playerName = p.name; activeTab = 'predict'; }
        else clearSession();
      } else { clearSession(); }
    }
    render();
  };

  let storageHealthy = false;

  prBoot();
  setInterval(() => {
    // Skip while the organizer is on the admin tab — its forms (match edit, score entry,
    // add player, etc.) aren't wired to a live draft, so an auto re-render here would
    // silently wipe whatever they're mid-typing before they hit save.
    if(session.isAdmin && activeTab === 'admin') return;
    if(config && (session.playerId || session.isAdmin)) render();
  }, 30000);
})();
