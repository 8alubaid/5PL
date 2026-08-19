import { state } from './state.js';
import { esc } from './utils.js';

export const I18N = {
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
  changeAdminPinTitle: { ar:'تغيير الرمز السري للمنظم 🔑', en:'Change Organizer PIN 🔑' },
  currentPinLabel: { ar:'الرمز الحالي', en:'Current PIN' },
  newPinLabel: { ar:'الرمز الجديد', en:'New PIN' },
  confirmNewPinLabel: { ar:'تأكيد الرمز الجديد', en:'Confirm New PIN' },
  changePinBtn: { ar:'تغيير الرمز', en:'Change PIN' },
  changingPin: { ar:'جارٍ التغيير...', en:'Changing...' },
  fillAllPinFields: { ar:'عبّي كل الحقول.', en:'Fill in all fields.' },
  pinMismatch: { ar:'الرمز الجديد وتأكيده غير متطابقين.', en:"The new PIN and its confirmation don't match." },
  wrongCurrentPin: { ar:'الرمز الحالي غير صحيح.', en:'The current PIN is incorrect.' },
  pinChanged: { ar:'تم تغيير الرمز السري ✅', en:'PIN changed ✅' },
  retry: { ar:'إعادة المحاولة', en:'Try Again' },
  storageNotConnected: { ar:'⚠️ التخزين غير مربوط', en:'⚠️ Storage not connected' },
  storageNotConnectedHint: { ar:'لازم تربط الموقع بجدول Google Sheets أول (خطوة تسويها مرة وحدة بس) — رابط الـ Apps Script لسا ما انحط بالكود، أو الرابط المحطوط ما يشتغل.', en:'You need to connect the site to a Google Sheet first (a one-time setup step) — the Apps Script URL isn\'t set in the code yet, or the one that\'s there isn\'t working.' },
  connectionError: { ar:'⚠️ صار خطأ بالاتصال', en:'⚠️ Connection error' },
  connectionErrorHint: { ar:'ما قدرنا نوصل للبيانات حاليًا. جرّب تحدّث الصفحة بعد شوي.', en:'We couldn\'t reach the data right now. Try refreshing in a moment.' },
  loadFailed: { ar:'تعذّر تحميل البيانات.', en:'Failed to load data.' }
};

export function t(key, vars){
  const entry = I18N[key];
  let s = entry ? (entry[state.lang] || entry.ar) : key;
  if(vars) Object.keys(vars).forEach(k => { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}

export const AR_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
export const toAr = (x) => state.lang === 'en' ? String(x==null?'':x) : String(x==null?'':x).replace(/[0-9]/g, d => AR_DIGITS[+d]);
export const toWest = (x) => String(x==null?'':x).replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d)));

window.prDigitInput = function(el){ el.value = toAr(toWest(el.value).replace(/[^0-9]/g,'')); };

export function roundDisplayName(rawName){
  const safe = esc(rawName);
  const m = safe.match(/^الجولة\s*([0-9٠-٩]+)$/);
  if(m){
    const num = toWest(m[1]);
    return state.lang === 'en' ? ('Round ' + num) : ('الجولة ' + toAr(num));
  }
  return state.lang === 'en' ? safe : toAr(safe);
}
