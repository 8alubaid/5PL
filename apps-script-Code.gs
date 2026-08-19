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

function doGet(e) {
  var key = e.parameter.key;
  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();
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

function doPost(e) {
  var body = JSON.parse(e.postData.contents);

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
