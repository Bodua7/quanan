/* ============================================================
   BACKEND API CHO APP "QUẢN LÝ QUÁN ĂN" - DÙNG GOOGLE SHEETS
   Cách cài đặt:
   1. Tạo 1 Google Sheet mới (trống).
   2. Vào menu Tiện ích mở rộng (Extensions) > Apps Script.
   3. Xóa hết code mẫu, dán toàn bộ nội dung file này vào.
   4. Bấm Deploy > New deployment > chọn loại "Web app".
      - Execute as: Me
      - Who has access: Anyone
   5. Bấm Deploy, cấp quyền khi được hỏi, rồi copy "Web app URL".
   6. Dán URL đó vào biến API_URL trong file QuanAn.html.
   ============================================================ */

const SCHEMAS = {
  Menu:      ['id','name','price','category','available'],
  Orders:    ['id','table','items','total','note','status','createdAt','updatedAt'],
  Feedback:  ['id','orderId','table','rating','comment','createdAt'],
  Inventory: ['id','name','qty','unit','minQty'],
  Staff:     ['id','name','pin'],
  Checkin:   ['date','staffId','name','checkIn','checkOut'],
  Stocktake: ['date','itemId','systemQty','actualQty','diff'],
  Settings:  ['key','value']
};

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(SCHEMAS[name]);
  }
  return sh;
}

function initSheets() {
  Object.keys(SCHEMAS).forEach(name => getSheet(name));
  const s = getSheet('Settings');
  const keys = s.getDataRange().getValues().slice(1).map(r => r[0]);
  if (keys.indexOf('adminPin') === -1) s.appendRow(['adminPin', '1234']);
  if (keys.indexOf('staffPin') === -1) s.appendRow(['staffPin', '5678']);
  if (keys.indexOf('restaurantName') === -1) s.appendRow(['restaurantName', 'Quán Ăn']);
}

function readTable(name) {
  const sh = getSheet(name);
  const values = sh.getDataRange().getValues();
  const headers = values[0];
  return values.slice(1).filter(r => r[0] !== '').map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function findRowIndex(sh, id) {
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function safeParse(s) { try { return JSON.parse(s); } catch (e) { return []; } }
function jsonOut(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

function doGet(e) {
  initSheets();
  const action = (e.parameter.action) || 'getAll';
  let result = {};
  try {
    if (action === 'getAll') {
      result.menu = readTable('Menu');
      result.orders = readTable('Orders').map(o => { o.items = safeParse(o.items); return o; });
      result.inventory = readTable('Inventory');
      result.staff = readTable('Staff');
      const settingsArr = readTable('Settings');
      result.settings = {};
      settingsArr.forEach(s => result.settings[s.key] = s.value);
    } else if (action === 'getCheckin') {
      result.checkin = readTable('Checkin').filter(c => c.date === e.parameter.date);
    } else if (action === 'getStocktake') {
      result.stocktake = readTable('Stocktake').filter(c => c.date === e.parameter.date);
    }
    result.ok = true;
  } catch (err) {
    result = { ok: false, error: String(err) };
  }
  return jsonOut(result);
}

function doPost(e) {
  initSheets();
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return jsonOut({ ok: false, error: 'bad json' }); }
  let result = { ok: true };
  try {
    switch (body.action) {
      case 'addOrder': result = addOrder(body); break;
      case 'updateOrderStatus': result = updateOrderStatus(body); break;
      case 'addFeedback': result = addFeedback(body); break;
      case 'saveMenuItem': result = saveMenuItem(body); break;
      case 'deleteMenuItem': result = deleteRow('Menu', body.id); break;
      case 'saveInventoryItem': result = saveInventoryItem(body); break;
      case 'deleteInventoryItem': result = deleteRow('Inventory', body.id); break;
      case 'saveStocktake': result = saveStocktake(body); break;
      case 'addStaff': result = addStaff(body); break;
      case 'deleteStaff': result = deleteRow('Staff', body.id); break;
      case 'checkIn': result = staffCheckIn(body); break;
      case 'checkOut': result = staffCheckOut(body); break;
      case 'saveSettings': result = saveSettings(body); break;
      case 'login': result = checkLogin(body); break;
      default: result = { ok: false, error: 'unknown action' };
    }
  } catch (err) {
    result = { ok: false, error: String(err) };
  }
  return jsonOut(result);
}

function addOrder(body) {
  const sh = getSheet('Orders');
  const id = Utilities.getUuid();
  const now = Date.now();
  sh.appendRow([id, body.table, JSON.stringify(body.items), body.total, body.note || '', 'pending', now, now]);
  return { ok: true, id };
}

function updateOrderStatus(body) {
  const sh = getSheet('Orders');
  const row = findRowIndex(sh, body.id);
  if (row < 0) return { ok: false, error: 'not found' };
  sh.getRange(row, 6).setValue(body.status);
  sh.getRange(row, 8).setValue(Date.now());
  return { ok: true };
}

function addFeedback(body) {
  const sh = getSheet('Feedback');
  sh.appendRow([Utilities.getUuid(), body.orderId, body.table, body.rating, body.comment || '', Date.now()]);
  return { ok: true };
}

function saveMenuItem(body) {
  const sh = getSheet('Menu');
  if (body.id) {
    const row = findRowIndex(sh, body.id);
    if (row > 0) {
      sh.getRange(row, 1, 1, 5).setValues([[body.id, body.name, body.price, body.category, body.available]]);
      return { ok: true, id: body.id };
    }
  }
  const id = Utilities.getUuid();
  sh.appendRow([id, body.name, body.price, body.category, body.available]);
  return { ok: true, id };
}

function deleteRow(sheetName, id) {
  const sh = getSheet(sheetName);
  const row = findRowIndex(sh, id);
  if (row > 0) sh.deleteRow(row);
  return { ok: true };
}

function saveInventoryItem(body) {
  const sh = getSheet('Inventory');
  if (body.id) {
    const row = findRowIndex(sh, body.id);
    if (row > 0) {
      sh.getRange(row, 1, 1, 5).setValues([[body.id, body.name, body.qty, body.unit, body.minQty]]);
      return { ok: true, id: body.id };
    }
  }
  const id = Utilities.getUuid();
  sh.appendRow([id, body.name, body.qty, body.unit, body.minQty]);
  return { ok: true, id };
}

function saveStocktake(body) {
  const sh = getSheet('Stocktake');
  const invSh = getSheet('Inventory');
  const values = sh.getDataRange().getValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (values[i][0] === body.date) sh.deleteRow(i + 1);
  }
  body.entries.forEach(en => {
    sh.appendRow([body.date, en.itemId, en.systemQty, en.actualQty, en.actualQty - en.systemQty]);
    const row = findRowIndex(invSh, en.itemId);
    if (row > 0) invSh.getRange(row, 3).setValue(en.actualQty);
  });
  return { ok: true };
}

function addStaff(body) {
  const sh = getSheet('Staff');
  const id = Utilities.getUuid();
  sh.appendRow([id, body.name, body.pin]);
  return { ok: true, id };
}

function staffCheckIn(body) {
  const sh = getSheet('Checkin');
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === body.date && String(values[i][1]) === String(body.staffId)) {
      sh.getRange(i + 1, 4).setValue(Date.now());
      return { ok: true };
    }
  }
  sh.appendRow([body.date, body.staffId, body.name, Date.now(), '']);
  return { ok: true };
}

function staffCheckOut(body) {
  const sh = getSheet('Checkin');
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === body.date && String(values[i][1]) === String(body.staffId)) {
      sh.getRange(i + 1, 5).setValue(Date.now());
      return { ok: true };
    }
  }
  return { ok: false, error: 'Chưa check-in' };
}

function saveSettings(body) {
  const sh = getSheet('Settings');
  Object.keys(body).forEach(key => {
    if (key === 'action') return;
    const row = findRowIndex(sh, key);
    if (row > 0) sh.getRange(row, 2).setValue(body[key]);
    else sh.appendRow([key, body[key]]);
  });
  return { ok: true };
}

function checkLogin(body) {
  const settingsArr = readTable('Settings');
  const adminPin = settingsArr.find(s => s.key === 'adminPin');
  const staffPin = settingsArr.find(s => s.key === 'staffPin');
  const pin = String(body.pin);
  if (adminPin && String(adminPin.value) === pin) return { ok: true, role: 'admin' };
  if (staffPin && String(staffPin.value) === pin) return { ok: true, role: 'staff' };
  return { ok: false };
}
