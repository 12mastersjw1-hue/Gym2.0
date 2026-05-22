/**
 * Football + Tennis Trainer — Google Apps Script endpoint (v2)
 *
 * Bidirectional sync: read from + write to your Sheet.
 * Sheet becomes the single source of truth.
 *
 * Tabs:
 *  - Log    : every set you log
 *  - Plan   : the locked 6-week mesocycle (one row per slot per day per week)
 *  - State  : current_week, mesocycle_start, days_per_week, style_pref, etc.
 *  - Goals  : 6-week targets with current/target/unit/rationale
 *
 * Setup:
 *  1. Open the Sheet you want logs in.
 *  2. Extensions → Apps Script.
 *  3. Replace the default Code.gs with this file's contents.
 *  4. Save, Deploy → New deployment:
 *     - Type: Web app
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  5. Copy the generated /exec URL → paste it into the app under
 *     Settings → Google Sheet sync.
 *  6. First time you'll see an "unverified app" warning — that's because
 *     it's YOUR private script. Click Advanced → Go to (your project) → Allow.
 *
 * If you re-deploy after editing, INCREMENT the deployment version (Manage
 * deployments → Edit → Version: New) — the /exec URL stays the same but
 * the new code only runs after the new version is deployed.
 */

const TABS = {
  LOG:   'Log',
  PLAN:  'Plan',
  STATE: 'State',
  GOALS: 'Goals',
};

const LOG_HEADERS = ['timestamp','date','week','weekLabel','day','slot','exerciseId','exerciseName','setIdx','totalSets','reps','weight','unit','rir','targetRepRange','targetRir','note'];
const PLAN_HEADERS = ['week','day','dayName','slotId','slotLabel','exerciseId','exerciseName','sets','repRange','tempo','rest','targetRir','isAnchor','priority','biasNote'];
const STATE_HEADERS = ['key','value'];
const GOALS_HEADERS = ['id','category','icon','metric','baseline','target','unit','rationale','currentValue','currentDate'];

// =============================================================
//  ROUTING
// =============================================================
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'ping';
  let result;
  try {
    switch (action) {
      case 'getPlan':  result = { ok: true, plan:  readPlan() };  break;
      case 'getLog':   result = { ok: true, log:   readLog() };   break;
      case 'getState': result = { ok: true, state: readState() }; break;
      case 'getGoals': result = { ok: true, goals: readGoals() }; break;
      case 'getAll':   result = { ok: true,
                                  plan:  readPlan(),
                                  log:   readLog(),
                                  state: readState(),
                                  goals: readGoals() };
                       break;
      case 'ping':
      default:         result = { ok: true, message: 'FT Trainer endpoint live.' };
    }
  } catch (err) {
    result = { ok: false, error: String(err) };
  }
  return wrap(result, e);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return wrap({ ok: false, error: 'Bad JSON: ' + String(err) }, e);
  }
  const action = body.action || 'appendLog'; // default = backwards compatible
  try {
    let result;
    switch (action) {
      case 'appendLog':  result = appendLog(body.entries || []);            break;
      case 'savePlan':   result = savePlan(body.plan);                       break;
      case 'saveState':  result = saveState(body.state);                     break;
      case 'saveGoals':  result = saveGoals(body.goals);                     break;
      case 'updateLogEntry': result = updateLogEntry(body.entry);            break;
      default:           result = { ok: false, error: 'Unknown action: ' + action };
    }
    return wrap(result, e);
  } catch (err) {
    return wrap({ ok: false, error: String(err) }, e);
  }
}

// JSONP wrapper if callback param present, else JSON
function wrap(obj, e) {
  const cb = e && e.parameter && e.parameter.callback;
  if (cb) {
    return ContentService
      .createTextOutput(cb + '(' + JSON.stringify(obj) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// =============================================================
//  SHEET HELPERS
// =============================================================
function getSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}

function readSheet(name, headers) {
  const sh = getSheet(name, headers);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const hdr = data[0];
  return data.slice(1).map(row => {
    const o = {};
    for (let i = 0; i < hdr.length; i++) o[hdr[i]] = row[i];
    return o;
  });
}

function clearAndWrite(name, headers, rows) {
  const sh = getSheet(name, headers);
  sh.clear();
  sh.appendRow(headers);
  sh.setFrozenRows(1);
  if (rows.length) {
    sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

// =============================================================
//  LOG (append-only)
// =============================================================
function appendLog(entries) {
  if (!entries || !entries.length) return { ok: true, written: 0 };
  const sh = getSheet(TABS.LOG, LOG_HEADERS);
  const rows = entries.map(en => LOG_HEADERS.map(h => h === 'timestamp' ? new Date() : (en[h] != null ? en[h] : '')));
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, LOG_HEADERS.length).setValues(rows);
  return { ok: true, written: rows.length };
}

function readLog() {
  return readSheet(TABS.LOG, LOG_HEADERS).map(r => {
    // normalize date field
    return {
      date: r.date instanceof Date ? r.date.toISOString() : r.date,
      week: Number(r.week) || r.week,
      weekLabel: r.weekLabel || '',
      day: r.day || '',
      slot: r.slot || '',
      exerciseId: r.exerciseId || '',
      exerciseName: r.exerciseName || '',
      setIdx: Number(r.setIdx) || r.setIdx,
      totalSets: Number(r.totalSets) || r.totalSets,
      reps: r.reps,
      weight: r.weight,
      unit: r.unit || '',
      rir: r.rir,
      targetRepRange: r.targetRepRange || '',
      targetRir: r.targetRir,
      note: r.note || '',
    };
  });
}

// Optional: update an existing log row (matched by date+slot+setIdx)
function updateLogEntry(entry) {
  if (!entry) return { ok: false, error: 'no entry' };
  const sh = getSheet(TABS.LOG, LOG_HEADERS);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const r = {};
    LOG_HEADERS.forEach((h, j) => r[h] = row[j]);
    if (String(r.date).slice(0,10) === String(entry.date).slice(0,10)
        && r.slot === entry.slot && Number(r.setIdx) === Number(entry.setIdx)) {
      sh.getRange(i+1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS.map(h => entry[h] != null ? entry[h] : '')]);
      return { ok: true, updated: true };
    }
  }
  return appendLog([entry]);
}

// =============================================================
//  PLAN — 6-week mesocycle stored as one row per slot
// =============================================================
function savePlan(plan) {
  if (!plan) return { ok: false, error: 'no plan' };
  const rows = [];
  for (const w of Object.keys(plan)) {
    for (const d of Object.keys(plan[w])) {
      const sess = plan[w][d];
      const dayName = sess.name || '';
      const anchors = sess._anchors || {};
      for (const slot of sess.slots) {
        rows.push([
          Number(w), d, dayName, slot.slotId, slot.label,
          slot.exercise.id, slot.exercise.name, slot.sets, slot.repRange,
          slot.tempo, slot.rest, slot.rir,
          slot.exercise._anchored ? 'TRUE' : 'FALSE',
          slot.priority, slot.biasNote || ''
        ]);
      }
    }
  }
  clearAndWrite(TABS.PLAN, PLAN_HEADERS, rows);
  return { ok: true, written: rows.length };
}

function readPlan() {
  const rows = readSheet(TABS.PLAN, PLAN_HEADERS);
  if (!rows.length) return null;
  const plan = {};
  // Group by week → day
  for (const r of rows) {
    const w = Number(r.week);
    const d = r.day;
    if (!plan[w]) plan[w] = {};
    if (!plan[w][d]) plan[w][d] = { day: d, week: w, name: r.dayName, slots: [] };
    plan[w][d].slots.push({
      slotId: r.slotId,
      label: r.slotLabel,
      exercise: { id: r.exerciseId, name: r.exerciseName, _anchored: String(r.isAnchor).toUpperCase() === 'TRUE' },
      sets: Number(r.sets) || r.sets,
      repRange: r.repRange,
      tempo: r.tempo,
      rest: r.rest,
      rir: Number(r.targetRir) || r.targetRir,
      priority: r.priority,
      biasNote: r.biasNote || '',
    });
  }
  return plan;
}

// =============================================================
//  STATE — single source for currentWeek, mesocycle start, etc.
// =============================================================
function saveState(state) {
  if (!state) return { ok: false, error: 'no state' };
  const rows = Object.entries(state).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]);
  clearAndWrite(TABS.STATE, STATE_HEADERS, rows);
  return { ok: true, written: rows.length };
}

function readState() {
  const rows = readSheet(TABS.STATE, STATE_HEADERS);
  const state = {};
  for (const r of rows) {
    let v = r.value;
    // Try to parse JSON; if not parseable, keep as string/number
    try {
      const parsed = JSON.parse(v);
      v = parsed;
    } catch (e) {
      if (!isNaN(Number(v))) v = Number(v);
    }
    state[r.key] = v;
  }
  return state;
}

// =============================================================
//  GOALS
// =============================================================
function saveGoals(goals) {
  if (!goals) return { ok: false, error: 'no goals' };
  const rows = goals.map(g => GOALS_HEADERS.map(h => g[h] != null ? g[h] : ''));
  clearAndWrite(TABS.GOALS, GOALS_HEADERS, rows);
  return { ok: true, written: rows.length };
}

function readGoals() {
  return readSheet(TABS.GOALS, GOALS_HEADERS);
}
