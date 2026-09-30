/**
 * الباك إند المجاني لموقع "دوري الخيمة" — يخزن البيانات في Google Sheet.
 */

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('KV');
  if (!sheet) {
    sheet = ss.insertSheet('KV');
    sheet.appendRow(['key', 'value']);
  }
  return sheet;
}

function stripAdminPin_(rawValue) {
  try {
    var obj = JSON.parse(rawValue);
    delete obj.adminPin;
    return JSON.stringify(obj);
  } catch (err) {
    return rawValue;
  }
}

// 'predictions' and 'rounds' used to each live in a single KV cell holding one big
// JSON blob for literally everyone/every round. That has a hard ceiling — Google
// Sheets caps a single cell at 50,000 characters — and 'predictions' (one player's
// picks for one round × every round × every player, all in one string) hit that
// wall exactly: every write silently failed once the cell was full, which is why
// predictions stopped saving. Both are now sharded — one row per player
// ('predictions_<playerId>') and one row per round ('round_<id>') — so each row
// only has to hold one player's or one round's worth of data, however long the
// season runs. doGet still answers '?key=predictions' and '?key=rounds' (and
// folds both into '?key=all') exactly as before by reassembling the shards, so
// nothing on the frontend has to change.
function predictionRowKey_(playerId) { return 'predictions_' + playerId; }
function roundRowKey_(roundId) { return 'round_' + roundId; }

function readShardedPredictions_(data) {
  var byPlayer = {};
  for (var i = 1; i < data.length; i++) {
    var k = String(data[i][0]);
    if (k.indexOf('predictions_') === 0) {
      var playerId = k.substring('predictions_'.length);
      try { byPlayer[playerId] = JSON.parse(data[i][1]); } catch (err) { /* skip a corrupt row rather than fail the whole read */ }
    }
  }
  return byPlayer;
}

function readShardedRounds_(data) {
  var rounds = [];
  for (var i = 1; i < data.length; i++) {
    var k = String(data[i][0]);
    if (k.indexOf('round_') === 0) {
      try { rounds.push(JSON.parse(data[i][1])); } catch (err) { /* skip a corrupt row */ }
    }
  }
  return rounds;
}

function doGet(e) {
  var key = e.parameter.key;
  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();

  if (key === 'all') {
    var all = {};
    for (var i = 1; i < data.length; i++) {
      var k = data[i][0];
      var v = data[i][1];
      if (k === 'config') v = stripAdminPin_(v);
      // Sharded rows are assembled below, not echoed as individual raw keys.
      if (String(k).indexOf('predictions_') === 0 || String(k).indexOf('round_') === 0) continue;
      all[k] = v;
    }
    all.predictions = JSON.stringify(readShardedPredictions_(data));
    all.rounds = JSON.stringify(readShardedRounds_(data));
    return ContentService.createTextOutput(JSON.stringify({ value: all }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (key === 'predictions') {
    return ContentService.createTextOutput(JSON.stringify({ value: JSON.stringify(readShardedPredictions_(data)) }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (key === 'rounds') {
    return ContentService.createTextOutput(JSON.stringify({ value: JSON.stringify(readShardedRounds_(data)) }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      var value = data[i][1];
      if (key === 'config') value = stripAdminPin_(value);
      return ContentService.createTextOutput(JSON.stringify({ value: value }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ value: null }))
    .setMimeType(ContentService.MimeType.JSON);
}

function verifyAdminPin_(pin) {
  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'config') {
      try {
        var cfg = JSON.parse(data[i][1]);
        return String(cfg.adminPin) === String(pin);
      } catch (err) {
        return false;
      }
    }
  }
  return false;
}

function changeAdminPin_(currentPin, newPin) {
  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'config') {
      var cfg;
      try {
        cfg = JSON.parse(data[i][1]);
      } catch (err) {
        return { ok: false };
      }
      if (String(cfg.adminPin) !== String(currentPin)) {
        return { ok: false, reason: 'wrong_pin' };
      }
      cfg.adminPin = newPin;
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(cfg));
      return { ok: true };
    }
  }
  return { ok: false };
}

function logVisit_(playerId) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'players') {
        var players = [];
        try { players = JSON.parse(data[i][1]) || []; } catch (err) { players = []; }
        var player = null;
        for (var j = 0; j < players.length; j++) {
          if (players[j].id === playerId) { player = players[j]; break; }
        }
        if (!player) return { ok: false, reason: 'not_found' };
        player.visitCount = (player.visitCount || 0) + 1;
        player.lastVisitAt = new Date().toISOString();
        sheet.getRange(i + 1, 2).setValue(JSON.stringify(players));
        return { ok: true, visitCount: player.visitCount };
      }
    }
    return { ok: false, reason: 'not_found' };
  } finally {
    lock.releaseLock();
  }
}

var AVATAR_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function setPlayerAvatar_(playerId, avatarTeam) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'players') {
        var players = [];
        try { players = JSON.parse(data[i][1]) || []; } catch (err) { players = []; }
        var player = null;
        for (var j = 0; j < players.length; j++) {
          if (players[j].id === playerId) { player = players[j]; break; }
        }
        if (!player) return { ok: false, reason: 'not_found' };
        var now = new Date();
        if (player.avatarChangedAt) {
          var elapsed = now.getTime() - new Date(player.avatarChangedAt).getTime();
          if (elapsed < AVATAR_COOLDOWN_MS) {
            return { ok: false, reason: 'cooldown', nextAllowedAt: new Date(new Date(player.avatarChangedAt).getTime() + AVATAR_COOLDOWN_MS).toISOString() };
          }
        }
        player.avatarTeam = avatarTeam || null;
        player.avatarChangedAt = now.toISOString();
        sheet.getRange(i + 1, 2).setValue(JSON.stringify(players));
        return { ok: true, avatarChangedAt: player.avatarChangedAt };
      }
    }
    return { ok: false, reason: 'not_found' };
  } finally {
    lock.releaseLock();
  }
}

function saveHankaGuess_(playerId, guess) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'hanka') {
        var hanka = {};
        try { hanka = JSON.parse(data[i][1]) || {}; } catch (err) { hanka = {}; }
        if (!hanka.guesses) hanka.guesses = {};
        // Locking happens here, not just in the UI — a request replayed after the
        // organizer locks shouldn't be able to sneak a change in underneath it.
        if (hanka.locked) return { ok: false, reason: 'locked' };
        hanka.guesses[playerId] = guess;
        sheet.getRange(i + 1, 2).setValue(JSON.stringify(hanka));
        return { ok: true };
      }
    }
    var fresh = { locked: false, guesses: {}, answers: null };
    fresh.guesses[playerId] = guess;
    sheet.appendRow(['hanka', JSON.stringify(fresh)]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function savePrediction_(playerId, matchPredictions) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var data = sheet.getDataRange().getValues();
    var rowKey = predictionRowKey_(playerId);
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === rowKey) {
        var mine = {};
        try { mine = JSON.parse(data[i][1]) || {}; } catch (err) { mine = {}; }
        for (var matchId in matchPredictions) {
          mine[matchId] = matchPredictions[matchId];
        }
        sheet.getRange(i + 1, 2).setValue(JSON.stringify(mine));
        return { ok: true };
      }
    }
    sheet.appendRow([rowKey, JSON.stringify(matchPredictions)]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents);

  if (body.action === 'savePrediction') {
    var saveResult = savePrediction_(body.playerId, body.matchPredictions);
    return ContentService.createTextOutput(JSON.stringify(saveResult))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (body.action === 'saveHankaGuess') {
    var hankaResult = saveHankaGuess_(body.playerId, body.guess);
    return ContentService.createTextOutput(JSON.stringify(hankaResult))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (body.action === 'logVisit') {
    var visitResult = logVisit_(body.playerId);
    return ContentService.createTextOutput(JSON.stringify(visitResult))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (body.action === 'setPlayerAvatar') {
    var avatarResult = setPlayerAvatar_(body.playerId, body.avatarTeam);
    return ContentService.createTextOutput(JSON.stringify(avatarResult))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (body.action === 'verifyAdminPin') {
    var ok = verifyAdminPin_(body.pin);
    return ContentService.createTextOutput(JSON.stringify({ ok: ok }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (body.action === 'changeAdminPin') {
    var result = changeAdminPin_(body.currentPin, body.newPin);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var key = body.key;
  var value = body.value;
  if (!key) {
    // An unrecognized action (or a request meant for an action this deployment
    // doesn't know about yet) has no "key" — refuse rather than silently appending
    // a garbage row keyed "undefined".
    return ContentService.createTextOutput(JSON.stringify({ ok: false, reason: 'unknown_request' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // The frontend still calls sSet('rounds', wholeArray) exactly like before — this
  // just shards that array across per-round rows on the way in, for the same reason
  // savePrediction_ shards by player: one growing shared blob for the whole season
  // was headed for the same 50,000-character cell limit that already broke
  // 'predictions' (~1,630 chars/round × 34 rounds ≈ 55,000, past the ceiling).
  if (key === 'rounds') {
    var saveRoundsResult = saveRounds_(value);
    return ContentService.createTextOutput(JSON.stringify(saveRoundsResult))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow([key, value]);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveRounds_(roundsJson) {
  var roundsArr;
  try { roundsArr = JSON.parse(roundsJson) || []; } catch (err) { return { ok: false, reason: 'bad_json' }; }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var data = sheet.getDataRange().getValues();
    var rowByRoundId = {};
    for (var i = 1; i < data.length; i++) {
      var k = String(data[i][0]);
      if (k.indexOf('round_') === 0) rowByRoundId[k.substring('round_'.length)] = i;
    }
    var seenIds = {};
    for (var j = 0; j < roundsArr.length; j++) {
      var rnd = roundsArr[j];
      seenIds[rnd.id] = true;
      var rowIdx = rowByRoundId[rnd.id];
      if (rowIdx != null) {
        sheet.getRange(rowIdx + 1, 2).setValue(JSON.stringify(rnd));
      } else {
        sheet.appendRow([roundRowKey_(rnd.id), JSON.stringify(rnd)]);
      }
    }
    // A round_<id> row whose id is no longer in the incoming array was deleted
    // (prDeleteRound) — blank it out rather than leaving stale data behind.
    for (var id in rowByRoundId) {
      if (!seenIds[id]) sheet.getRange(rowByRoundId[id] + 1, 1, 1, 2).clearContent();
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/**
 * تشغيلها مرة وحدة فقط — تفكّك الخليتين القديمتين الكبيرتين (predictions و rounds)
 * إلى صف مستقل لكل لاعب/جولة. تكتب البيانات الجديدة بس ما تمسح القديمة أبدًا — تضل
 * موجودة بس محد يقرأها بعد كذا (الكود الجديد يبني predictions/rounds من الصفوف
 * المجزّأة فقط ويتجاهل الخليتين القديمتين تمامًا). السبب: بين ما تشغّل هذي الدالة
 * وبين ما تسوي Deploy لنسخة جديدة فعليًا يطلع منها رابط /exec، الكود القديم المنشور
 * لسا شغال — ولو مسحنا القديم قبل ما الكود الجديد يطلع فعليًا، أي لاعب يفتح الموقع
 * بهذي الفترة بيشوف الموقع فاضي تمامًا. تركها زي ما هي يخلي الكود القديم يشتغل عادي
 * لين تسوي Deploy، وبعدها الكود الجديد يتجاهلها بنفسه — آمنة مئة بالمئة بدون أي فجوة.
 * آمنة التكرار أيضًا: أي صف انكتب قبل كذا يتجاهله ثاني مرة، ما يكرره.
 */
function migrateToShardedStorage() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet_();
    var data = sheet.getDataRange().getValues();
    var oldPredictions = {}, oldRounds = [];
    var existingShardKeys = {};
    for (var i = 1; i < data.length; i++) {
      var k = String(data[i][0]);
      if (k === 'predictions') { try { oldPredictions = JSON.parse(data[i][1]) || {}; } catch (e) { oldPredictions = {}; } }
      else if (k === 'rounds') { try { oldRounds = JSON.parse(data[i][1]) || []; } catch (e) { oldRounds = []; } }
      else if (k.indexOf('predictions_') === 0 || k.indexOf('round_') === 0) { existingShardKeys[k] = true; }
    }

    var playerIds = Object.keys(oldPredictions);
    var playersWritten = 0, playersSkipped = 0;
    playerIds.forEach(function (playerId) {
      var rowKey = predictionRowKey_(playerId);
      if (existingShardKeys[rowKey]) { playersSkipped++; return; }
      sheet.appendRow([rowKey, JSON.stringify(oldPredictions[playerId])]);
      playersWritten++;
    });

    var roundsWritten = 0, roundsSkipped = 0;
    oldRounds.forEach(function (rnd) {
      var rowKey = roundRowKey_(rnd.id);
      if (existingShardKeys[rowKey]) { roundsSkipped++; return; }
      sheet.appendRow([rowKey, JSON.stringify(rnd)]);
      roundsWritten++;
    });

    var summary = {
      playersFoundInOldBlob: playerIds.length,
      playersWrittenThisRun: playersWritten,
      playersAlreadyShardedFromBefore: playersSkipped,
      roundsFoundInOldBlob: oldRounds.length,
      roundsWrittenThisRun: roundsWritten,
      roundsAlreadyShardedFromBefore: roundsSkipped
    };
    Logger.log(JSON.stringify(summary, null, 2));
    return summary;
  } finally {
    lock.releaseLock();
  }
}

/**
 * مزامنة تلقائية من matchesio.com — بمجرد ما تخلص كل مباريات آخر جولة عندنا
 * (تصير "Played" في matchesio)، تضيف الجولة اللي بعدها تلقائيًا. وبكل تشغيلة
 * تحدّث أي نتيجة صارت "Played" بس ما زلنا مسجلينها ناقصة.
 *
 * تفعيلها مرة وحدة: من محرر Apps Script شغّل الدالة installMatchesioTrigger
 * (تنشئ trigger زمني يشغّل runMatchesioSync كل ساعة). قبلها جرّب runMatchesioSync
 * يدويًا مرة واحدة من قائمة Run عشان تتأكد كل شي يشتغل صح ويطلب صلاحية الوصول
 * لموقع matchesio.com.
 */

var MATCHESIO_JSON_URL = 'https://www.matchesio.com/competition/pro-league-sa/export/json/';

// أسماء الفرق كما تجي من matchesio → نفس الاسم العربي المستخدم في SATEAMS بالموقع.
var MATCHESIO_TEAM_MAP = {
  'Al-Hilal Saudi FC': 'الهلال',
  'Al-Nassr': 'النصر',
  'Al-Ittihad FC': 'الاتحاد',
  'Al-Ahli Jeddah': 'الأهلي',
  'Al-Qadisiyah FC': 'القادسية',
  'Al Shabab': 'الشباب',
  'Al-Fateh': 'الفتح',
  'Al Khaleej Saihat': 'الخليج',
  'Al Taawon': 'التعاون',
  'Abha': 'أبها',
  'NEOM': 'نيوم',
  'Al-Fayha': 'الفيحاء',
  'Al-Ettifaq': 'الاتفاق',
  'Al-Hazm': 'الحزم',
  'Al Riyadh': 'الرياض',
  'Al Diriyah': 'الدرعية',
  'Al Kholood': 'الخلود',
  'Al-Faisaly FC': 'الفيصلي'
};

// نفس TEAM_STADIUM في js/data.js — ملعب الفريق المضيف الافتراضي، مو ملعب matchesio
// المحدد، عشان يطابق نفس الأسلوب اللي الجولات الحالية متخزنة فيه أصلًا.
var MATCHESIO_TEAM_STADIUM = {
  'الهلال': 'ملعب الهلال', 'النصر': 'ملعب النصر',
  'الاتحاد': 'ملعب الاتحاد', 'الأهلي': 'ملعب الأهلي',
  'القادسية': 'ملعب القادسية', 'الشباب': 'ملعب الشباب',
  'الفتح': 'ملعب الفتح', 'الخليج': 'ملعب الخليج',
  'التعاون': 'ملعب التعاون', 'أبها': 'ملعب أبها',
  'نيوم': 'ملعب نيوم', 'الفيحاء': 'ملعب الفيحاء',
  'الاتفاق': 'ملعب الاتفاق', 'الحزم': 'ملعب نادي الحزم',
  'الرياض': 'ملعب الرياض', 'الدرعية': 'ملعب الدرعية',
  'الخلود': 'ملعب الخلود', 'الفيصلي': 'ملعب الفيصلي'
};

function uid_(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

function fetchMatchesioMatches_() {
  var resp = UrlFetchApp.fetch(MATCHESIO_JSON_URL, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) {
    throw new Error('matchesio HTTP ' + resp.getResponseCode());
  }
  return JSON.parse(resp.getContentText());
}

function roundMatchday_(name) {
  var m = /الجولة\s*(\d+)/.exec(name || '');
  return m ? Number(m[1]) : null;
}

function syncFromMatchesio_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var result = { changed: false, scoresUpdated: 0, roundImported: null, error: null };
  try {
    var fixtures;
    try {
      fixtures = fetchMatchesioMatches_();
    } catch (fetchErr) {
      result.error = 'fetch: ' + fetchErr;
      return result;
    }

    var sheet = getSheet_();
    var data = sheet.getDataRange().getValues();
    var roundsRowIndex = -1, rounds = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'rounds') {
        roundsRowIndex = i;
        try { rounds = JSON.parse(data[i][1]) || []; } catch (e) { rounds = []; }
        break;
      }
    }
    if (roundsRowIndex === -1) { result.error = 'no rounds key yet'; return result; }

    // فهرسة مباريات matchesio حسب "رقم الجولة|الفريق المضيف|الفريق الضيف" عشان
    // نستخدمها بتحديث النتائج، وحسب رقم الجولة لوحده عشان نجيب جولة كاملة جديدة.
    var byKey = {}, byMatchday = {};
    fixtures.forEach(function (f) {
      var home = MATCHESIO_TEAM_MAP[f.homeTeam], away = MATCHESIO_TEAM_MAP[f.awayTeam];
      if (!home || !away) return; // اسم فريق ما نعرفه — تجاهل هذي المباراة بدل ما نخمّن
      f._home = home; f._away = away;
      byKey[f.matchday + '|' + home + '|' + away] = f;
      (byMatchday[f.matchday] = byMatchday[f.matchday] || []).push(f);
    });

    // ١) عبّي نتيجة أي مباراة صارت "Played" في matchesio وعندنا لسه ناقصة أو غلط.
    rounds.forEach(function (rnd) {
      var md = roundMatchday_(rnd.name);
      if (md == null) return;
      rnd.matches.forEach(function (m) {
        var f = byKey[md + '|' + m.home + '|' + m.away];
        if (!f || f.status !== 'Played' || !f.result) return;
        var rm = /^(\d+)\s*[-–]\s*(\d+)$/.exec(String(f.result).trim());
        if (!rm) return;
        var hs = Number(rm[1]), as = Number(rm[2]);
        if (m.finished && m.homeScore === hs && m.awayScore === as) return; // متطابقة أصلًا
        m.homeScore = hs; m.awayScore = as; m.finished = true;
        result.scoresUpdated++;
        result.changed = true;
      });
    });

    // ٢) إذا آخر جولة عندنا خلصت كل مبارياتها، جيب الجولة اللي بعدها.
    var maxMd = null;
    rounds.forEach(function (rnd) {
      var md = roundMatchday_(rnd.name);
      if (md != null && (maxMd == null || md > maxMd)) maxMd = md;
    });
    if (maxMd != null) {
      var currentRound = rounds.filter(function (r) { return roundMatchday_(r.name) === maxMd; })[0];
      var currentFullyFinished = currentRound && currentRound.matches.length > 0 &&
        currentRound.matches.every(function (m) { return m.finished; });
      var nextMd = maxMd + 1;
      var nextAlreadyExists = rounds.some(function (r) { return roundMatchday_(r.name) === nextMd; });
      var nextFixtures = byMatchday[nextMd] || [];
      if (currentFullyFinished && !nextAlreadyExists && nextFixtures.length > 0) {
        var allMapped = fixtures.filter(function (f) { return f.matchday === nextMd; })
          .every(function (f) { return MATCHESIO_TEAM_MAP[f.homeTeam] && MATCHESIO_TEAM_MAP[f.awayTeam]; });
        if (allMapped) {
          var newMatches = nextFixtures
            .slice()
            .sort(function (a, b) { return new Date(a.dateTime) - new Date(b.dateTime); })
            .map(function (f) {
              return {
                id: uid_('mt'),
                home: f._home, away: f._away,
                kickoff: f.dateTime ? new Date(f.dateTime).toISOString() : null,
                stadium: MATCHESIO_TEAM_STADIUM[f._home] || '',
                predictOpen: true,
                homeScore: null, awayScore: null, finished: false
              };
            });
          rounds.push({ id: uid_('rd'), name: 'الجولة ' + nextMd, matches: newMatches });
          result.roundImported = nextMd;
          result.changed = true;
        } else {
          result.error = 'matchday ' + nextMd + ' has an unmapped team name — skipped this run';
        }
      }
    }

    if (result.changed) {
      sheet.getRange(roundsRowIndex + 1, 2).setValue(JSON.stringify(rounds));
    }
    return result;
  } finally {
    lock.releaseLock();
  }
}

function runMatchesioSync() {
  var result = syncFromMatchesio_();
  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();
  var logRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'matchesioSyncLog') { logRow = i; break; }
  }
  var logEntry = JSON.stringify({
    ranAt: new Date().toISOString(),
    scoresUpdated: result.scoresUpdated,
    roundImported: result.roundImported,
    error: result.error
  });
  if (logRow === -1) sheet.appendRow(['matchesioSyncLog', logEntry]);
  else sheet.getRange(logRow + 1, 2).setValue(logEntry);
  Logger.log(logEntry);
  return result;
}

function installMatchesioTrigger() {
  var existing = ScriptApp.getProjectTriggers().filter(function (t) {
    return t.getHandlerFunction() === 'runMatchesioSync';
  });
  existing.forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('runMatchesioSync').timeBased().everyHours(1).create();
  Logger.log('Installed hourly matchesio sync trigger.');
}
