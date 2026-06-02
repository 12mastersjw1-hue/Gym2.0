// =============================================================
//  APP — UI, state, logging, bidirectional Google Sheets sync
//
//  Architecture:
//   - Google Sheets = source of truth
//   - localStorage  = cache for instant load + offline writes
//   - On app open  : try to hydrate from Sheets via JSONP. If it works,
//                    Sheet data overwrites local cache. If not, use cache.
//   - Every write  : update local immediately, fire-and-forget POST to Sheets.
//   - Plan         : pre-computed once per mesocycle and LOCKED (no muddling).
// =============================================================

const LS_KEY = 'fb_tn_trainer_v2';

const defaultState = {
  startDate: null,
  daysPerWeek: 4,
  currentWeek: 1,
  splitOrder: WEEKLY_SPLIT_4.slice(),
  history: {},
  log: [],
  plan: null,              // {[weekNum]: {[dayCode]: session}}
  planGeneratedAt: null,
  baseline: { ...DEFAULT_BASELINE },
  goals: [],
  settings: {
    equipAvailable: ['barbell','dumbbell','kettlebell','cable','machine','bodyweight','band','medball','smith','park'],
    kneeSafeOnly: true,
    ankleSafeOnly: false,
    favorites: [],
    weightUnit: 'kg',
    sheetWebAppUrl: 'https://script.google.com/macros/s/AKfycbxeTb8RIAVciREnR5tPIVlsFSd4rdRHEhyW3ABnEOXUQuj5PbRKbqLefrQ6Cyt-Kxg/exec',
    syncOnLog: true,
    stylePref: 'calisthenics',
    anchors: {},
    unilateralBias: true,
    guidedMode: true,        // new — show one slot at a time
  },
  currentSession: null,
  currentSlotIdx: 0,         // guided UI: which slot we're on
  hydratedAt: null,
  pendingSync: [],           // entries logged while offline
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultState));
    const parsed = JSON.parse(raw);
    const merged = Object.assign({}, JSON.parse(JSON.stringify(defaultState)), parsed);
    merged.settings = Object.assign({}, defaultState.settings, parsed.settings || {});
    merged.baseline = Object.assign({}, defaultState.baseline, parsed.baseline || {});
    // If the saved URL is empty but the default has one, use the default.
    // This rescues users who logged before the URL was baked in.
    if (!merged.settings.sheetWebAppUrl && defaultState.settings.sheetWebAppUrl) {
      merged.settings.sheetWebAppUrl = defaultState.settings.sheetWebAppUrl;
    }
    return merged;
  } catch {
    return JSON.parse(JSON.stringify(defaultState));
  }
}
function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

function applyFavorites() {
  for (const ex of EXERCISES) ex.fav = state.settings.favorites.includes(ex.id);
}

// =============================================================
//  SHEETS — JSONP read, fetch-POST write
// =============================================================
function jsonpGet(url, params) {
  return new Promise((resolve, reject) => {
    const cb = '__cb_' + Date.now() + '_' + Math.floor(Math.random()*1e6);
    const timer = setTimeout(() => {
      delete window[cb]; script.remove();
      reject(new Error('timeout'));
    }, 15000);
    window[cb] = (data) => {
      clearTimeout(timer);
      delete window[cb];
      script.remove();
      resolve(data);
    };
    const qs = new URLSearchParams({ ...params, callback: cb }).toString();
    const script = document.createElement('script');
    script.src = `${url}?${qs}`;
    script.onerror = () => {
      clearTimeout(timer);
      delete window[cb]; script.remove();
      reject(new Error('JSONP error'));
    };
    document.body.appendChild(script);
  });
}

async function sheetsGet(action) {
  if (!state.settings.sheetWebAppUrl) throw new Error('No sheet URL set');
  return jsonpGet(state.settings.sheetWebAppUrl, { action });
}

async function sheetsPost(action, body) {
  if (!state.settings.sheetWebAppUrl) return { ok: false, reason: 'no-url' };
  try {
    await fetch(state.settings.sheetWebAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...body }),
    });
    return { ok: true };
  } catch (e) { return { ok: false, reason: String(e) }; }
}

async function hydrateFromSheet() {
  if (!state.settings.sheetWebAppUrl) return;
  try {
    const r = await sheetsGet('getAll');
    if (!r || !r.ok) return;
    // Sheet wins for log + plan + goals
    if (Array.isArray(r.log))     state.log   = r.log;
    if (r.plan && typeof r.plan === 'object') state.plan  = r.plan;
    if (Array.isArray(r.goals) && r.goals.length) state.goals = r.goals;
    if (r.state && typeof r.state === 'object') {
      if (r.state.currentWeek)  state.currentWeek = Number(r.state.currentWeek);
      if (r.state.daysPerWeek)  state.daysPerWeek = Number(r.state.daysPerWeek);
      if (r.state.startDate)    state.startDate = r.state.startDate;
      if (r.state.baseline)     state.baseline = r.state.baseline;
    }
    state.hydratedAt = new Date().toISOString();
    // Flush any pending writes
    if (state.pendingSync.length) {
      await sheetsPost('appendLog', { entries: state.pendingSync });
      state.pendingSync = [];
    }
    saveState();
    render();
  } catch (e) {
    console.warn('Hydrate failed (using local cache):', e.message);
  }
}

async function pushStateToSheet() {
  await sheetsPost('saveState', { state: {
    currentWeek: state.currentWeek,
    daysPerWeek: state.daysPerWeek,
    startDate: state.startDate,
    baseline: state.baseline,
  }});
}

// =============================================================
//  PLAN MANAGEMENT
// =============================================================
async function startMesocycle(daysPerWeek) {
  applyFavorites();
  state.daysPerWeek = daysPerWeek || state.daysPerWeek;
  state.splitOrder = (state.daysPerWeek === 5 ? WEEKLY_SPLIT_5 : WEEKLY_SPLIT_4).slice();
  state.currentWeek = 1;
  state.startDate = new Date().toISOString().slice(0,10);
  state.plan = generateMesocyclePlan(state.settings, state.daysPerWeek);
  state.planGeneratedAt = new Date().toISOString();
  state.goals = buildGoals(state.baseline);
  saveState();
  await sheetsPost('savePlan', { plan: state.plan });
  await sheetsPost('saveGoals', { goals: state.goals });
  await pushStateToSheet();
  render();
}

function regeneratePlanInPlace() {
  // Keep current week/log/goals, just rebuild plan (e.g., after changing anchors)
  applyFavorites();
  state.plan = generateMesocyclePlan(state.settings, state.daysPerWeek);
  state.planGeneratedAt = new Date().toISOString();
  saveState();
  sheetsPost('savePlan', { plan: state.plan });
  render();
}

function pickToday() {
  const split = state.daysPerWeek === 5 ? WEEKLY_SPLIT_5 : WEEKLY_SPLIT_4;
  const loggedToday = loggedDaysInWeek(state.log, state.currentWeek);
  for (const d of split) {
    if (!loggedToday.includes(d)) return d;
  }
  return split[0]; // all logged → could advance
}

function startSession(dayCode) {
  if (!state.plan) {
    if (confirm('No locked plan yet. Generate a 6-week plan now?')) startMesocycle(state.daysPerWeek);
    return;
  }
  const sess = getPlannedSession(state.plan, dayCode, state.currentWeek, state.log);
  if (!sess) { alert('Could not find this session in the plan.'); return; }
  sess.slots = sess.slots.map(s => {
    // Unilateral: 2× set entries (L and R per round). Otherwise: regular set list.
    const totalEntries = s.isUnilateral ? s.sets * 2 : s.sets;
    const setLogs = Array.from({length: totalEntries}, (_, i) => {
      const side = s.isUnilateral ? (i % 2 === 0 ? 'L' : 'R') : null;
      const isFirstSet = s.isUnilateral ? i < 2 : i === 0;
      return {
        side,
        roundIdx: s.isUnilateral ? Math.floor(i / 2) + 1 : i + 1,
        reps:   isFirstSet && s.recommendation && s.recommendation.reps   ? String(s.recommendation.reps)   : '',
        weight: isFirstSet && s.recommendation && s.recommendation.weight != null ? String(s.recommendation.weight) : '',
        rir: '', done: false, note: ''
      };
    });
    return { ...s, setLogs };
  });
  // Group consecutive supersetGroup slots into blocks for the guided UI
  sess.blocks = groupSlotsIntoBlocks(sess.slots);
  state.currentSession = sess;
  state.currentSlotIdx = 0; // now means block index in guided mode
  saveState();
  go('session');
}

// Combine consecutive slots with the same supersetGroup into one block
function groupSlotsIntoBlocks(slots) {
  const blocks = [];
  let i = 0;
  while (i < slots.length) {
    const s = slots[i];
    if (s.supersetGroup) {
      // Collect all consecutive slots with same group
      const group = [s];
      let j = i + 1;
      while (j < slots.length && slots[j].supersetGroup === s.supersetGroup) {
        group.push(slots[j]); j++;
      }
      blocks.push({ type: group.length > 1 ? 'superset' : 'single', slots: group, supersetGroup: s.supersetGroup });
      i = j;
    } else {
      blocks.push({ type: 'single', slots: [s] });
      i++;
    }
  }
  return blocks;
}

function logSet(slotIdx, setIdx) {
  const sess = state.currentSession;
  const slot = sess.slots[slotIdx];
  const set = slot.setLogs[setIdx];
  set.done = true;
  const entry = {
    date: new Date().toISOString(),
    week: sess.week,
    weekLabel: WEEKS[sess.week].label,
    day: sess.day,
    slot: slot.label,
    exerciseId: slot.exercise.id,
    exerciseName: slot.exercise.name,
    setIdx: set.roundIdx || (setIdx + 1),
    totalSets: slot.sets,
    reps: set.reps,
    weight: set.weight,
    unit: state.settings.weightUnit,
    rir: set.rir,
    targetRepRange: slot.repRange,
    targetRir: slot.rir,
    note: set.note || '',
    side: set.side || '',            // L / R / blank
    measureUnit: slot.unit || 'reps',// reps or seconds
    isUnilateral: !!slot.isUnilateral,
    supersetGroup: slot.supersetGroup || '',
  };
  state.log.push(entry);
  saveState();
  if (state.settings.syncOnLog) {
    sheetsPost('appendLog', { entries: [entry] }).then(r => {
      if (!r.ok) state.pendingSync.push(entry);
      saveState();
    });
  } else {
    state.pendingSync.push(entry);
    saveState();
  }
  render();
}

function finishSession() {
  state.currentSession = null;
  state.currentSlotIdx = 0;
  saveState();
  go('home');
}

function advanceWeek() {
  const today = loggedDaysInWeek(state.log, state.currentWeek);
  const planned = state.plan && state.plan[state.currentWeek] ? Object.keys(state.plan[state.currentWeek]) : [];
  const missing = planned.filter(d => !today.includes(d));
  if (missing.length > 0) {
    if (!confirm(`Day(s) ${missing.join(', ')} of Week ${state.currentWeek} haven't been logged. Advance anyway?`)) return;
  }
  if (state.currentWeek < 6) state.currentWeek += 1;
  else { alert('Mesocycle complete! Start a new 6-week block from Settings.'); return; }
  saveState();
  pushStateToSheet();
  render();
}

function exportCSV() {
  const headers = ['date','week','weekLabel','day','slot','exerciseId','exerciseName','setIdx','totalSets','reps','weight','unit','rir','targetRepRange','targetRir','note'];
  const rows = [headers.join(',')];
  for (const e of state.log) rows.push(headers.map(h => JSON.stringify(e[h] == null ? '' : e[h])).join(','));
  const blob = new Blob([rows.join('\n')], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `training-log-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function bulkResyncAll() {
  if (!state.settings.sheetWebAppUrl) { alert('Paste your Apps Script Web App URL in Settings first.'); return; }
  if (!state.log.length) { alert('Nothing to sync.'); return; }
  const r = await sheetsPost('appendLog', { entries: state.log });
  alert(r.ok ? `Sent ${state.log.length} rows.` : 'Sync failed: ' + (r.reason||'unknown'));
}

// =============================================================
//  ROUTING + RENDER HELPERS
// =============================================================
function go(view) { location.hash = '#/' + view; render(); }
function currentView() { return location.hash.replace(/^#\//,'') || 'home'; }
window.addEventListener('hashchange', render);

function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === 'class') el.className = attrs[k];
    else if (k.startsWith('on') && typeof attrs[k] === 'function') el.addEventListener(k.slice(2), attrs[k]);
    else if (k === 'html') el.innerHTML = attrs[k];
    else if (attrs[k] != null) el.setAttribute(k, attrs[k]);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(c) : c);
  }
  return el;
}

function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  root.appendChild(renderHeader());
  const view = currentView();
  let body;
  switch (view) {
    case 'session':   body = renderSession(); break;
    case 'history':   body = renderHistory(); break;
    case 'program':   body = renderProgram(); break;
    case 'goals':     body = renderGoals(); break;
    case 'settings':  body = renderSettings(); break;
    default:          body = renderHome();
  }
  root.appendChild(body);
}

function renderHeader() {
  return h('header', {class:'topbar'},
    h('div', {class:'brand'},
      h('div', {class:'brand-mark'}, 'FT'),
      h('div', null,
        h('div', {class:'brand-name'}, 'Football + Tennis Trainer'),
        h('div', {class:'brand-sub'}, state.plan ? `Week ${state.currentWeek}/6 · ${WEEKS[state.currentWeek].label} · RIR ${WEEKS[state.currentWeek].rir}` : 'No plan loaded — generate one in Settings'),
      )
    ),
    h('nav', {class:'tabs'},
      tab('home','Today'),
      tab('goals','Goals'),
      tab('program','Plan'),
      tab('history','History'),
      tab('settings','Settings'),
    )
  );
}
function tab(view, label) {
  return h('a', {href:'#/'+view, class:'tab' + (currentView() === view ? ' active' : '')}, label);
}

// =============================================================
//  HOME
// =============================================================
function renderHome() {
  if (!state.plan) {
    return h('section', {class:'view'},
      h('div', {class:'card hero'},
        h('h1', {class:'hero-title'}, 'Welcome'),
        h('p', {class:'hero-note'}, 'Generate your 6-week mesocycle to start. Set your 1RMs in Goals first if you haven\'t (they shape the targets).'),
        h('div', {class:'row gap'},
          h('button', {class:'btn', onclick: () => go('goals')}, 'Set baseline → Generate plan'),
          h('button', {class:'btn ghost', onclick: () => startMesocycle(state.daysPerWeek)}, 'Generate with defaults'),
        )
      )
    );
  }

  const split = state.daysPerWeek === 5 ? WEEKLY_SPLIT_5 : WEEKLY_SPLIT_4;
  const today = pickToday();
  const loggedToday = loggedDaysInWeek(state.log, state.currentWeek);

  return h('section', {class:'view'},
    h('div', {class:'card hero'},
      h('div', {class:'hero-week'}, `WEEK ${state.currentWeek} OF 6`),
      h('h1', {class:'hero-title'}, WEEKS[state.currentWeek].label),
      h('p', {class:'hero-note'}, WEEKS[state.currentWeek].note),
      h('div', {class:'rir-pill'}, `Target RIR ${WEEKS[state.currentWeek].rir} · Load mod ${(WEEKS[state.currentWeek].loadMod*100>=0?'+':'')}${(WEEKS[state.currentWeek].loadMod*100).toFixed(1)}%`),
    ),
    h('div', {class:'card'},
      h('h2', null, `Week ${state.currentWeek} sessions`),
      h('p', {class:'muted small'}, `Tap a day to start. ${loggedToday.length}/${split.length} logged this week.`),
      h('div', {class:'day-grid'},
        ...split.map(code => {
          const t = DAY_TEMPLATES[code];
          const suggested = code === today;
          const done = loggedToday.includes(code);
          return h('button', {class:'day-card' + (suggested ? ' suggested' : '') + (done ? ' done' : ''),
                              onclick: () => startSession(code)},
            h('div', {class:'day-code'}, code),
            h('div', {class:'day-name'}, t.name.replace(/—.*/,'').trim()),
            h('div', {class:'day-focus'}, t.focus),
            done ? h('div', {class:'badge done-badge'}, '✓ done') : (suggested ? h('div', {class:'badge'}, 'Next up') : null),
          );
        })
      )
    ),
    h('div', {class:'card'},
      h('h2', null, 'Mesocycle controls'),
      h('div', {class:'row gap'},
        h('button', {class:'btn', onclick: advanceWeek}, 'Advance to next week →'),
        h('button', {class:'btn ghost', onclick: () => { if (confirm('Generate a new 6-week mesocycle? Logs are kept.')) startMesocycle(state.daysPerWeek); }}, 'Start fresh 6-week block'),
      ),
    ),
  );
}

// =============================================================
//  SESSION VIEW — guided (one at a time) or scrolling
// =============================================================
function renderSession() {
  const sess = state.currentSession;
  if (!sess) return h('section', {class:'view'}, h('div', {class:'card'}, 'No session in progress. Back to ', h('a',{href:'#/home'}, 'Today'),'.'));

  if (state.settings.guidedMode) return renderSessionGuided(sess);
  return renderSessionScroll(sess);
}

function blockComplete(block) {
  return block.slots.every(s => s.setLogs.every(x => x.done));
}
function blockPartial(block) {
  const has = block.slots.some(s => s.setLogs.some(x => x.done));
  return has && !blockComplete(block);
}

function renderSessionGuided(sess) {
  if (!sess.blocks) sess.blocks = groupSlotsIntoBlocks(sess.slots);
  const blocks = sess.blocks;
  const idx = Math.max(0, Math.min(state.currentSlotIdx, blocks.length - 1));
  const block = blocks[idx];
  const total = blocks.length;
  const done = blockComplete(block);

  return h('section', {class:'view'},
    h('div', {class:'card hero session-hero'},
      h('div', {class:'hero-week'}, `Week ${sess.week} · ${sess.weekLabel} · Day ${sess.day}`),
      h('h1', {class:'hero-title'}, DAY_TEMPLATES[sess.day].name),
      h('div', {class:'progress-bar'}, h('div', {class:'progress-fill', style:`width:${((idx + (done ? 1 : 0)) / total * 100).toFixed(0)}%`})),
      h('div', {class:'progress-text muted small'}, `Step ${idx + 1} of ${total}${block.type === 'superset' ? ' · SUPERSET' : ''}`),
    ),
    renderBlock(block, sess),
    h('div', {class:'card row gap'},
      h('button', {class:'btn ghost', onclick: () => { state.currentSlotIdx = Math.max(0, idx - 1); saveState(); render(); }, disabled: idx === 0 ? 'disabled' : null}, '← Previous'),
      block.slots.every(s => s.skippable) ? h('button', {class:'btn ghost', onclick: () => { state.currentSlotIdx = Math.min(blocks.length - 1, idx + 1); saveState(); render(); }}, 'Skip (no kit)') : null,
      idx < total - 1
        ? h('button', {class:'btn', onclick: () => { state.currentSlotIdx = idx + 1; saveState(); render(); }}, done ? 'Next →' : 'Skip to next →')
        : h('button', {class:'btn', onclick: finishSession}, '✓ Finish session'),
    ),
    h('div', {class:'card slot-overview'},
      h('h3', null, 'Session overview'),
      ...blocks.map((b, i) => {
        const d = blockComplete(b);
        const p = blockPartial(b);
        const label = b.type === 'superset'
          ? `${b.supersetGroup}: ${b.slots.map(s => shortLabel(s.label)).join(' + ')}`
          : b.slots[0].label;
        const exNames = b.slots.map(s => s.exercise.name).join(' / ');
        return h('div', {class:'overview-row' + (i === idx ? ' current' : '') + (d ? ' done' : '') + (p ? ' partial' : ''),
                          onclick: () => { state.currentSlotIdx = i; saveState(); render(); }},
          h('span', {class:'overview-num'}, String(i+1)),
          h('span', {class:'overview-label'},
            label,
            b.type === 'superset' ? h('span', {class:'superset-mini'}, '↔') : null
          ),
          h('span', {class:'overview-ex muted small'}, exNames),
          d ? h('span', {class:'overview-status'}, '✓') : (p ? h('span', {class:'overview-status partial'}, '○') : null)
        );
      })
    ),
  );
}
function shortLabel(s) { return s.replace(/ \(.+\)/g, '').replace(/—.*/g, '').trim(); }

function renderSessionScroll(sess) {
  if (!sess.blocks) sess.blocks = groupSlotsIntoBlocks(sess.slots);
  return h('section', {class:'view'},
    h('div', {class:'card hero session-hero'},
      h('div', {class:'hero-week'}, `Week ${sess.week} · ${sess.weekLabel}`),
      h('h1', {class:'hero-title'}, `Day ${sess.day} — ${DAY_TEMPLATES[sess.day].name}`),
      h('p', {class:'hero-note'}, sess.weekNote),
    ),
    ...sess.blocks.map(block => renderBlock(block, sess)),
    h('div', {class:'card row gap'},
      h('button', {class:'btn', onclick: finishSession}, '✓ Finish session'),
    )
  );
}

function renderBlock(block, sess) {
  if (block.type === 'superset') return renderSuperset(block, sess);
  return renderSlot(block.slots[0], sess.slots.indexOf(block.slots[0]));
}

function renderSuperset(block, sess) {
  const [A, B] = block.slots;
  const sets = Math.max(A.sets, B.sets);
  return h('div', {class:'card superset-card'},
    h('div', {class:'superset-header'},
      h('span', {class:'superset-tag'}, '↔ SUPERSET'),
      h('span', {class:'muted small'}, 'Alternate sets. Minimal rest between A and B; rest after both.'),
    ),
    h('div', {class:'superset-pair'},
      renderSupersetExercise(A, sess.slots.indexOf(A), 'A'),
      renderSupersetExercise(B, sess.slots.indexOf(B), 'B'),
    ),
    h('div', {class:'superset-rounds'},
      ...Array.from({length: sets}, (_, r) => renderSupersetRound(A, B, sess, r))
    )
  );
}

function renderSupersetExercise(slot, slotIdx, tag) {
  const rec = slot.recommendation;
  return h('div', {class:'ss-ex'},
    h('div', {class:'ss-ex-head'},
      h('span', {class:'ss-tag'}, tag),
      h('div', null,
        h('div', {class:'slot-label'}, slot.label, slot.exercise._anchored ? h('span', {class:'anchor-badge'}, '⚓') : null),
        h('h3', {class:'slot-ex'}, slot.exercise.name),
        h('div', {class:'muted small'}, `${slot.sets} × ${slot.repRange} · Tempo ${slot.tempo} · RIR ${slot.rir}`),
      ),
    ),
    slot.biasNote ? h('div', {class:'note-tip'}, slot.biasNote) : null,
    rec && rec.weight != null
      ? h('div', {class:'rec-tip'},
          h('span', {class:'rec-arrow'}, rec.delta > 0 ? '↑' : (rec.delta < 0 ? '↓' : '→')),
          h('span', null, h('strong', null, `Try ${rec.weight} ${state.settings.weightUnit}`), ' · ', h('span', {class:'muted small'}, rec.rationale)))
      : null
  );
}

function renderSupersetRound(A, B, sess, roundIdx) {
  return h('div', {class:'ss-round'},
    h('div', {class:'ss-round-label'}, `Round ${roundIdx + 1}`),
    h('div', {class:'ss-round-rows'},
      renderRoundRow(A, sess.slots.indexOf(A), roundIdx, 'A'),
      renderRoundRow(B, sess.slots.indexOf(B), roundIdx, 'B'),
    ),
  );
}

function renderRoundRow(slot, slotIdx, roundIdx, tag) {
  // For unilateral, there are 2 entries per round (L and R)
  if (slot.isUnilateral) {
    const lIdx = roundIdx * 2;
    const rIdx = roundIdx * 2 + 1;
    const lSet = slot.setLogs[lIdx];
    const rSet = slot.setLogs[rIdx];
    if (!lSet || !rSet) return null;
    return h('div', {class:'ss-row uni'},
      h('span', {class:'ss-tag-mini'}, tag),
      h('div', {class:'uni-block'},
        renderSetRow(lSet, slot, slotIdx, lIdx, 'L'),
        renderSetRow(rSet, slot, slotIdx, rIdx, 'R'),
      )
    );
  }
  const set = slot.setLogs[roundIdx];
  if (!set) return null;
  return h('div', {class:'ss-row'},
    h('span', {class:'ss-tag-mini'}, tag),
    renderSetRow(set, slot, slotIdx, roundIdx, null)
  );
}

function renderSetRow(set, slot, slotIdx, setIdx, sideLabel) {
  const measureLabel = slot.unit === 'seconds' ? 'Sec' : 'Reps';
  return h('div', {class:'set-row' + (set.done ? ' done' : '')},
    sideLabel ? h('span', {class:'side-badge'}, sideLabel) : null,
    h('div', {class:'set-row-inputs'},
      labeled(`Wt (${state.settings.weightUnit})`, inputCell(set, 'weight')),
      labeled(measureLabel, inputCell(set, 'reps')),
      labeled('RIR', inputCell(set, 'rir')),
    ),
    h('button', {class:'mini-btn' + (set.done?' done':''), onclick: () => logSet(slotIdx, setIdx)}, set.done ? '✓' : 'Log'),
  );
}
function labeled(label, input) {
  return h('label', {class:'set-input-wrap'},
    h('span', {class:'set-input-label'}, label),
    input,
  );
}

function renderSlot(slot, slotIdx) {
  const rec = slot.recommendation;
  const measureLabel = slot.unit === 'seconds' ? 'Sec' : 'Reps';
  return h('div', {class:'card slot pri-' + slot.priority},
    h('div', {class:'slot-head'},
      h('div', null,
        h('div', {class:'slot-label'},
          slot.label,
          slot.exercise._anchored ? h('span', {class:'anchor-badge'}, '⚓ ANCHOR') : null,
          slot.skippable ? h('span', {class:'skip-badge'}, 'Optional') : null,
        ),
        h('h3', {class:'slot-ex'}, slot.exercise.name),
      ),
      h('div', {class:'slot-meta'},
        h('div', null, `${slot.sets} × ${slot.repRange}`),
        h('div', {class:'muted small'}, `Tempo ${slot.tempo} · Rest ${slot.rest} · RIR ${slot.rir}`),
      ),
    ),
    slot.biasNote ? h('div', {class:'note-tip'}, slot.biasNote) : null,
    rec && rec.weight != null
      ? h('div', {class:'rec-tip'},
          h('span', {class:'rec-arrow'}, rec.delta > 0 ? '↑' : (rec.delta < 0 ? '↓' : '→')),
          h('span', null, h('strong', null, `Try ${rec.weight} ${state.settings.weightUnit}`), ' · ', h('span', {class:'muted small'}, rec.rationale)))
      : (rec ? h('div', {class:'rec-tip muted small'}, rec.rationale) : null),
    // Sets — render each setLog. For unilateral, pairs of L/R show together.
    slot.isUnilateral ? renderUnilateralSets(slot, slotIdx, measureLabel)
                      : renderStandardSets(slot, slotIdx, measureLabel),
  );
}

function renderStandardSets(slot, slotIdx, measureLabel) {
  return h('div', {class:'set-grid'},
    h('div', {class:'set-header'}, 'Set'),
    h('div', {class:'set-header'}, `Wt (${state.settings.weightUnit})`),
    h('div', {class:'set-header'}, measureLabel),
    h('div', {class:'set-header'}, 'RIR'),
    h('div', {class:'set-header'}, ''),
    ...slot.setLogs.flatMap((set, setIdx) => [
      h('div', {class:'set-cell idx'}, String(set.roundIdx || (setIdx+1))),
      inputCell(set, 'weight'),
      inputCell(set, 'reps'),
      inputCell(set, 'rir'),
      h('button', {class:'mini-btn' + (set.done?' done':''), onclick: () => logSet(slotIdx, setIdx)}, set.done ? '✓' : 'Log'),
    ]),
  );
}

function renderUnilateralSets(slot, slotIdx, measureLabel) {
  // Pair L and R
  const rounds = [];
  for (let r = 0; r < slot.sets; r++) {
    rounds.push({ L: slot.setLogs[r*2], R: slot.setLogs[r*2 + 1], roundIdx: r });
  }
  return h('div', {class:'uni-set-grid'},
    ...rounds.map(({L, R, roundIdx}) => {
      if (!L || !R) return null;
      const lDone = L.done, rDone = R.done;
      // Compute imbalance for completed rounds
      let imbalance = null;
      if (lDone && rDone) {
        const lReps = Number(L.reps) || 0, rReps = Number(R.reps) || 0;
        if (lReps > 0 && rReps > 0) {
          const diff = Math.abs(lReps - rReps);
          const pct = Math.round((diff / Math.max(lReps, rReps)) * 100);
          if (pct >= 15) imbalance = { pct, strong: rReps > lReps ? 'R' : 'L' };
        }
      }
      return h('div', {class:'uni-round'},
        h('div', {class:'uni-round-head'},
          h('span', null, `Round ${roundIdx + 1}`),
          imbalance ? h('span', {class:'imbalance-tag'}, `⚠ ${imbalance.strong} stronger by ${imbalance.pct}%`) : null,
        ),
        renderSetRow(L, slot, slotIdx, roundIdx*2, 'L'),
        renderSetRow(R, slot, slotIdx, roundIdx*2 + 1, 'R'),
      );
    })
  );
}

function inputCell(set, key) {
  return h('input', { type:'number', step:'0.5', inputmode:'decimal', value: set[key],
    class:'set-input',
    oninput: (e) => { set[key] = e.target.value; saveState(); }
  });
}

// =============================================================
//  GOALS VIEW
// =============================================================
function renderGoals() {
  if (!state.goals || !state.goals.length) {
    state.goals = buildGoals(state.baseline);
    saveState();
  }
  const groups = {};
  for (const g of state.goals) {
    if (!groups[g.category]) groups[g.category] = [];
    groups[g.category].push(g);
  }
  const titles = { strength:'Strength', calisthenics:'Calisthenics / Skill', athletic:'Athletic', prehab:'Injury Prevention', cardio:'Cardio' };
  return h('section', {class:'view'},
    h('div', {class:'card'},
      h('h2', null, 'Baseline 1RMs & rep maxes'),
      h('p', {class:'muted small'}, 'These shape your 6-week targets. Update any time — targets recompute automatically.'),
      h('div', {class:'baseline-grid'},
        baselineInput('back_squat_1rm','Back Squat 1RM','kg'),
        baselineInput('deadlift_1rm','Deadlift 1RM','kg'),
        baselineInput('bench_1rm','Bench Press 1RM','kg'),
        baselineInput('pullup_max','Pull-ups (max reps)','reps'),
        baselineInput('pushup_max','Push-ups (max reps)','reps'),
      ),
      h('div', {class:'row gap'},
        h('button', {class:'btn', onclick: () => { state.goals = buildGoals(state.baseline); saveState(); sheetsPost('saveGoals',{goals:state.goals}); pushStateToSheet(); render(); }}, 'Recalculate goals'),
        !state.plan ? h('button', {class:'btn', onclick: () => startMesocycle(state.daysPerWeek)}, 'Generate plan now') : null,
      ),
    ),
    ...Object.entries(groups).map(([cat, gs]) =>
      h('div', {class:'card'},
        h('h2', null, `${titles[cat] || cat} (${gs.length})`),
        h('div', {class:'goal-grid'},
          ...gs.map(g => renderGoal(g))
        )
      )
    )
  );
}

function baselineInput(key, label, unit) {
  return h('label', {class:'baseline-row'},
    h('span', {class:'muted small'}, label),
    h('div', {class:'baseline-input-wrap'},
      h('input', {type:'number', step:'0.5', value: state.baseline[key], oninput: (e) => { state.baseline[key] = Number(e.target.value)||0; saveState(); }}),
      h('span', {class:'muted small'}, unit),
    )
  );
}

function renderGoal(g) {
  const prog = goalProgress(g, state.log);
  const pct = g.baseline != null && g.target > g.baseline && prog
    ? Math.min(100, Math.round(((prog.current - g.baseline) / (g.target - g.baseline)) * 100))
    : (prog && g.baseline == null ? Math.min(100, Math.round((prog.current / g.target) * 100)) : 0);
  const hit = prog && prog.current >= g.target;
  return h('div', {class:'goal-card' + (hit ? ' hit' : '')},
    h('div', {class:'goal-head'},
      h('span', {class:'goal-icon'}, g.icon || '🎯'),
      h('div', null,
        h('div', {class:'goal-metric'}, g.metric),
        h('div', {class:'goal-target'},
          g.baseline != null ? h('span', {class:'muted small'}, `${g.baseline} → `) : null,
          h('strong', null, `${g.target} ${g.unit}`),
          hit ? h('span', {class:'goal-hit-badge'}, '✓ HIT') : null,
        ),
      ),
    ),
    h('div', {class:'goal-bar'}, h('div', {class:'goal-bar-fill', style:`width:${pct}%`})),
    prog ? h('div', {class:'muted small'}, `Current best: ${prog.current}${prog.weight ? ` (${prog.weight}kg × ${prog.reps})` : ''}`) : h('div', {class:'muted small'}, 'Not tested yet.'),
    h('div', {class:'muted small goal-rat'}, g.rationale),
  );
}

// =============================================================
//  PROGRAM / PLAN VIEW
// =============================================================
function renderProgram() {
  return h('section', {class:'view'},
    h('div', {class:'card'},
      h('h2', null, '6-Week Mesocycle'),
      h('table', {class:'week-table'},
        h('thead', null, h('tr', null,
          h('th',null,'Wk'),h('th',null,'Phase'),h('th',null,'RIR'),h('th',null,'Sets'),h('th',null,'Load'),h('th',null,'Note')
        )),
        h('tbody', null,
          ...Object.entries(WEEKS).map(([wk, cfg]) =>
            h('tr', {class: Number(wk) === state.currentWeek ? 'active-row' : ''},
              h('td',null,'W'+wk),
              h('td',null,cfg.label),
              h('td',null,String(cfg.rir)),
              h('td',null,(cfg.setMod>=0?'+':'')+cfg.setMod),
              h('td',null,(cfg.loadMod*100>=0?'+':'')+(cfg.loadMod*100).toFixed(1)+'%'),
              h('td',null,cfg.note),
            )
          )
        )
      )
    ),
    state.plan ? h('div', {class:'card'},
      h('h2', null, `Week ${state.currentWeek} — locked plan`),
      ...Object.entries(state.plan[state.currentWeek] || {}).map(([dc, sess]) =>
        h('div', {class:'day-block'},
          h('h3', null, `${dc} — ${sess.name}`),
          h('ul', null,
            ...sess.slots.map(sl => h('li', null,
              h('strong', null, sl.label + ': '),
              `${sl.exercise.name} — ${sl.sets} × ${sl.repRange}`,
              sl.exercise._anchored ? h('span', {class:'anchor-badge inline'}, '⚓') : null,
            ))
          )
        )
      )
    ) : h('div', {class:'card'}, h('p', {class:'muted'}, 'No plan generated yet.'))
  );
}

// =============================================================
//  HISTORY
// =============================================================
function renderHistory() {
  const log = state.log.slice().reverse();
  return h('section', {class:'view'},
    h('div', {class:'card row gap'},
      h('button', {class:'btn', onclick: exportCSV}, 'Export CSV'),
      h('button', {class:'btn ghost', onclick: bulkResyncAll}, 'Resync all to Sheet'),
      h('button', {class:'btn ghost', onclick: hydrateFromSheet}, 'Pull from Sheet'),
      h('span', {class:'muted small'}, `${state.log.length} entries${state.pendingSync.length?' · '+state.pendingSync.length+' pending':''}${state.hydratedAt?' · synced '+new Date(state.hydratedAt).toLocaleTimeString():''}`),
    ),
    h('div', {class:'card'},
      h('h2', null, 'Last 50 sets'),
      log.length === 0 ? h('p', {class:'muted'}, 'No sets logged yet.') :
      h('table', {class:'history-table'},
        h('thead', null, h('tr',null,
          h('th',null,'When'), h('th',null,'Wk'), h('th',null,'Day'), h('th',null,'Exercise'),
          h('th',null,'Set'), h('th',null,'Wt'), h('th',null,'Reps'), h('th',null,'RIR'),
        )),
        h('tbody', null,
          ...log.slice(0,50).map(e => h('tr',null,
            h('td',null, e.date ? new Date(e.date).toLocaleString() : ''),
            h('td',null, 'W'+e.week),
            h('td',null, e.day),
            h('td',null, e.exerciseName),
            h('td',null, `${e.setIdx}/${e.totalSets}`),
            h('td',null, e.weight ? `${e.weight} ${e.unit}` : ''),
            h('td',null, e.reps || ''),
            h('td',null, e.rir || ''),
          ))
        )
      )
    )
  );
}

// =============================================================
//  SETTINGS
// =============================================================
function renderSettings() {
  const s = state.settings;
  return h('section', {class:'view'},
    h('div', {class:'card'},
      h('h2', null, 'Google Sheet sync — REQUIRED'),
      h('p', {class:'muted small'}, 'Single source of truth. Paste the Apps Script Web App URL.'),
      h('label', {class:'field column'},
        h('span', null, 'Apps Script Web App URL'),
        h('input', {type:'url', value: s.sheetWebAppUrl, placeholder:'https://script.google.com/macros/s/.../exec',
          oninput: (e) => { s.sheetWebAppUrl = e.target.value.trim(); saveState(); }})
      ),
      checkboxRow('Auto-sync each set as I log it', s.syncOnLog, v => { s.syncOnLog = v; saveState(); }),
      h('div', {class:'row gap'},
        h('button', {class:'btn', onclick: async () => {
          if (!s.sheetWebAppUrl) { alert('Paste a URL first.'); return; }
          const test = [{date:new Date().toISOString(), week: state.currentWeek, weekLabel:'TEST', day:'TEST', slot:'connection-test', exerciseId:'test', exerciseName:'Connection Test', setIdx:1, totalSets:1, reps:'1', weight:'0', unit: s.weightUnit, rir:'9', targetRepRange:'-', targetRir:'-', note:'Sent from app.'}];
          const r = await sheetsPost('appendLog', { entries: test });
          alert(r.ok ? 'Test row sent. Open your sheet to confirm.' : 'Failed: ' + (r.reason||'unknown'));
        }}, 'Send test row'),
        h('button', {class:'btn ghost', onclick: hydrateFromSheet}, 'Pull latest from Sheet'),
      ),
    ),
    h('div', {class:'card'},
      h('h2', null, 'Schedule'),
      h('label', {class:'field'},
        h('span',null,'Days per week'),
        select(['4','5'], String(state.daysPerWeek), v => { state.daysPerWeek = Number(v); saveState(); render(); })
      ),
      h('label', {class:'field'},
        h('span',null,'Current week'),
        select(['1','2','3','4','5','6'], String(state.currentWeek), v => { state.currentWeek = Number(v); saveState(); pushStateToSheet(); render(); })
      ),
      h('label', {class:'field'},
        h('span',null,'Weight unit'),
        select(['kg','lb'], s.weightUnit, v => { s.weightUnit = v; saveState(); render(); })
      ),
      h('label', {class:'field'},
        h('span',null,'Upper-body style'),
        select(['calisthenics','mixed','barbell'], s.stylePref, v => { s.stylePref = v; saveState(); render(); })
      ),
      checkboxRow('Bias accessories toward unilateral (single-leg/arm)', s.unilateralBias, v => { s.unilateralBias = v; saveState(); }),
      checkboxRow('Guided mode (one exercise at a time)', s.guidedMode, v => { s.guidedMode = v; saveState(); }),
    ),
    h('div', {class:'card'},
      h('h2', null, 'Anchor exercises (bedrocks)'),
      h('p', {class:'muted small'}, 'Pin specific exercises to specific slots — they\'ll show up every week instead of rotating. After changing anchors, regenerate the plan to apply.'),
      h('div', {class:'row gap', style:'margin: 8px 0 14px'},
        h('button', {class:'btn', onclick: () => { s.anchors = suggestedAnchors(s.stylePref); saveState(); render(); }}, `Use suggested anchors (${s.stylePref})`),
        h('button', {class:'btn ghost', onclick: () => { s.anchors = {}; saveState(); render(); }}, 'Clear all'),
        state.plan ? h('button', {class:'btn ghost', onclick: regeneratePlanInPlace}, 'Regenerate plan with current anchors') : null,
      ),
      ...renderAnchorSlots(s),
    ),
    h('div', {class:'card'},
      h('h2', null, 'Equipment + safety'),
      h('div', {class:'tag-grid'},
        ...['barbell','dumbbell','kettlebell','cable','machine','smith','bodyweight','band','medball','park'].map(eq =>
          h('label', {class:'tag-pill' + (s.equipAvailable.includes(eq)?' on':'')},
            h('input', {type:'checkbox', checked: s.equipAvailable.includes(eq) ? 'checked':null,
              onchange: (e) => { if (e.target.checked) s.equipAvailable.push(eq); else s.equipAvailable = s.equipAvailable.filter(x=>x!==eq); saveState(); render(); }}),
            eq
          )
        )
      ),
      checkboxRow('Knee-safe only (recommended post-ACL)', s.kneeSafeOnly, v => { s.kneeSafeOnly = v; saveState(); }),
      checkboxRow('Ankle-easy mode (skip high-impact plyos / sprints)', s.ankleSafeOnly, v => { s.ankleSafeOnly = v; saveState(); }),
    ),
    h('div', {class:'card danger'},
      h('h2', null, 'Reset'),
      h('button', {class:'btn ghost', onclick: () => { if (confirm('Wipe local state? Sheet data is untouched.')) { localStorage.removeItem(LS_KEY); state = loadState(); render(); }}}, 'Wipe local cache'),
    ),
  );
}

function renderAnchorSlots(s) {
  const slots = allSlots();
  const byDay = {};
  for (const sl of slots) {
    if (sl.calisthenicsOnly && s.stylePref !== 'calisthenics') continue;
    if (!byDay[sl.dayCode]) byDay[sl.dayCode] = { dayName: sl.dayName, slots: [] };
    byDay[sl.dayCode].slots.push(sl);
  }
  return Object.entries(byDay).map(([dc, info]) =>
    h('div', {class:'anchor-day-group'},
      h('h3', {class:'anchor-day-title'}, `${dc} — ${info.dayName}`),
      ...info.slots.map(sl => {
        const candidates = candidatesForSlot(sl, null);
        const cur = s.anchors[sl.id] || '';
        return h('div', {class:'anchor-row'},
          h('div', {class:'anchor-slot-label'},
            h('div', null, sl.label),
            h('div', {class:'muted small'}, `${sl.baseSets} × ${sl.repRange}`)),
          h('select', {class:'anchor-select',
            onchange: (e) => {
              if (e.target.value) s.anchors[sl.id] = e.target.value;
              else delete s.anchors[sl.id];
              saveState(); render();
            }},
            (() => {
              const opts = [];
              const optRotate = h('option', {value:''}, '🔄 Rotate (default)');
              if (!cur) optRotate.setAttribute('selected','selected');
              opts.push(optRotate);
              for (const ex of candidates) {
                const o = h('option', {value: ex.id}, `⚓ ${ex.name}${ex.calisthenics ? ' (cali)' : ''}`);
                if (cur === ex.id) o.setAttribute('selected','selected');
                opts.push(o);
              }
              return opts;
            })()
          )
        );
      })
    )
  );
}

function select(opts, val, onChange) {
  return h('select', {onchange: (e) => onChange(e.target.value)},
    ...opts.map(o => {
      const opt = h('option', {value: o}, o);
      if (o === val) opt.setAttribute('selected','selected');
      return opt;
    })
  );
}
function checkboxRow(label, val, onChange) {
  return h('label', {class:'check-row'},
    h('input', {type:'checkbox', checked: val ? 'checked':null, onchange: (e) => { onChange(e.target.checked); render(); }}),
    h('span', null, label),
  );
}

// =============================================================
//  BOOT
// =============================================================
document.addEventListener('DOMContentLoaded', async () => {
  render();
  if (state.settings.sheetWebAppUrl) {
    // Auto-flush: if any sets were logged while offline / before URL was set,
    // push them now so the sheet catches up.
    if (state.pendingSync && state.pendingSync.length) {
      console.log(`Flushing ${state.pendingSync.length} pending entries to Sheet...`);
      const r = await sheetsPost('appendLog', { entries: state.pendingSync });
      if (r.ok) { state.pendingSync = []; saveState(); render(); }
    }
    hydrateFromSheet();
  }
});
