// =============================================================
//  6-WEEK MESOCYCLE — RPE/RIR autoregulated
//
//  Designed for:
//   • Advanced lifter
//   • 4-5 sessions/week, 45-60 min
//   • Midfielder football + tennis priority
//   • Calf hypertrophy emphasis
//   • Post-ACL (L knee) + R ankle history → built-in prehab
//   • Injury prevention is non-negotiable
//
//  Progression model (Renaissance-Periodization style):
//   W1  Re-intro     | RIR 3-4   | MEV sets   | establish loads
//   W2  Accumulation | RIR 2-3   | +1 set/main| +0% load
//   W3  Accumulation | RIR 2     | +1 set/main| +2.5-5% load
//   W4  Intensification| RIR 1-2 | hold sets  | +2.5-5% load
//   W5  Peak         | RIR 0-1   | -1 set/acc | top single / AMRAP
//   W6  DELOAD       | RIR 4-5   | -50% sets  | -30% load
// =============================================================

const WEEKS = {
  1: { label: 'Re-intro',         rir: 3,    setMod:  0, loadMod: 0.00, note: 'Get reps in, find groove. Submax everywhere.' },
  2: { label: 'Accumulation',     rir: 2.5,  setMod: +1, loadMod: 0.00, note: 'Add a set per main lift. Same loads.' },
  3: { label: 'Accumulation+',    rir: 2,    setMod: +1, loadMod: 0.025, note: '+2.5% load if last week felt good.' },
  4: { label: 'Intensification',  rir: 1.5,  setMod: +1, loadMod: 0.05, note: 'Loads up, volume holds. This week earns the gains.' },
  5: { label: 'PEAK',             rir: 0.5,  setMod:  0, loadMod: 0.075, note: 'Top single or 3RM on mains. Drop accessory volume 25%.' },
  6: { label: 'DELOAD',           rir: 4,    setMod: -2, loadMod: -0.30, note: 'Half the work, two-thirds the load. Walks, pilates, mobility.' },
};

// =============================================================
//  DAY TEMPLATES — slot-based, rotation engine fills the slots
// =============================================================

const DAY_TEMPLATES = {
  A: {
    code: 'A',
    name: 'Lower — Knee Dominant + Sprint Power',
    focus: 'Quad / glute / standing calf / plyo',
    slots: [
      { id: 'a0', label: 'Sled — Warm-Up + PAP',      pattern: 'warmup_sled', baseSets: 3, repRange: '15-20m each way', tempo: 'X', rest: '60s', priority: 'warmup', biasNote: 'Heavy push for PAP + backward drag for VMO. Primes the squat.', skippable: true, preferBiasIds: ['sled_push_heavy','sled_drag_backward','sled_sprint','sled_march'] },
      { id: 'a1', label: 'Knee-Dominant Main',        pattern: 'squat_bi',    baseSets: 3, repRange: '5-8',   tempo: '3-1-X', rest: '2-3 min', priority: 'strength' },
      { id: 'a2', label: 'Unilateral / VMO',          pattern: ['squat_uni','lunge'], baseSets: 3, repRange: '8-12/side', tempo: '3-1-1', rest: '90s', priority: 'hypertrophy', biasNote: 'Spanish squat or Bulgarian — knee gets stronger and safer.', preferBiasIds: ['spanish_squat','bulgarian_ss','rear_foot_db_ss','step_up','reverse_lunge'] },
      { id: 'a3', label: 'Calf — Gastrocnemius',      pattern: 'calf_gastroc',baseSets: 4, repRange: '8-12',  tempo: '2-2-1', rest: '60-90s', priority: 'hypertrophy', biasNote: 'Off step. Full stretch. Pause 2s at bottom.', preferBiasIds: ['sl_calf_raise_db','standing_calf_raise'], supersetGroup: 'A1' },
      { id: 'a5', label: 'Anti-Extension Core',       pattern: 'antiextension',baseSets:3, repRange: '8-15',  tempo: '2-1-1', rest: '45-60s', priority: 'core', supersetGroup: 'A1', biasNote: 'Paired with calves — core works while calves recover.' },
      { id: 'a4', label: 'Plyo / Power (quality)',    pattern: 'plyo',        baseSets: 4, repRange: '3-5',   tempo: 'X',     rest: '60-90s', priority: 'power' },
      { id: 'a6', label: 'Hip Mobility Cool-Down',    pattern: 'mobility_hip', baseSets: 2, repRange: '30-60s each', tempo: 'controlled', rest: '15s', priority: 'mobility', biasNote: 'Bookends the session. Keeps hips fluid for football/tennis movement.' },
    ],
  },

  B: {
    code: 'B',
    name: 'Upper — Calisthenics Skill + Strength + Mobility',
    focus: 'Skill (muscle-up/lever/handstand) → calisthenics strength → rotational → neck/upper-back counterbalance',
    slots: [
      { id: 'b0', label: 'Calisthenics Skill (fresh nervous system)', pattern: 'skill_cali', baseSets: 4, repRange: '3-5 reps OR 15-30s hold', tempo: 'controlled', rest: '90s-2min', priority: 'power', biasNote: 'Skill work. Fresh, not fatigued. Quality over quantity.', calisthenicsOnly: true },
      { id: 'b1', label: 'Horizontal Push Main',      pattern: 'push_h',      baseSets: 3, repRange: '5-8',   tempo: '3-1-1', rest: '2 min',  priority: 'strength', supersetGroup: 'B1' },
      { id: 'b2', label: 'Horizontal Pull Main',      pattern: 'pull_h',      baseSets: 3, repRange: '6-10',  tempo: '2-1-2', rest: '2 min',  priority: 'strength', supersetGroup: 'B1', biasNote: 'Paired with push — classic antagonist superset, no performance hit.' },
      { id: 'b3', label: 'Vertical Push',             pattern: 'push_v',      baseSets: 3, repRange: '8-12',  tempo: '2-1-1', rest: '90s',    priority: 'hypertrophy', supersetGroup: 'B2' },
      { id: 'b4', label: 'Vertical Pull',             pattern: 'pull_v',      baseSets: 3, repRange: '6-10',  tempo: '2-1-2', rest: '90s',    priority: 'hypertrophy', supersetGroup: 'B2' },
      { id: 'b5', label: 'Rotational Power (BOTH sides!)', pattern: 'rotation', baseSets: 3, repRange: '5/side', tempo: 'X', rest: '60s', priority: 'power', biasNote: 'Equal reps per side. Symmetry > weight.' },
      { id: 'b6', label: 'Shoulder Prehab',           pattern: 'prehab_shoulder', baseSets: 2, repRange: '12-15', tempo: '2-2-1', rest: '45s', priority: 'prehab', supersetGroup: 'B3' },
      { id: 'b7', label: 'Neck / Upper-Back Counterbalance', pattern: 'mobility_neck', baseSets: 2, repRange: 'see exercise', tempo: 'slow', rest: '30s', priority: 'mobility', biasNote: 'Offsets chest hypertrophy. Tension-headache prevention.', supersetGroup: 'B3' },
    ],
  },

  C: {
    code: 'C',
    name: 'Lower — Hip Dominant + Posterior Chain',
    focus: 'Hamstrings / glutes / seated calf / adductors + hip mobility',
    slots: [
      { id: 'c0', label: 'Sled — Warm-Up + PAP',      pattern: 'warmup_sled', baseSets: 3, repRange: '15-20m each way', tempo: 'X', rest: '60s', priority: 'warmup', biasNote: 'Backward drag for VMO + forward drag for hamstring blood.', skippable: true, preferBiasIds: ['sled_drag_backward','sled_drag_forward','sled_march'] },
      { id: 'c1', label: 'Hip Hinge Main',            pattern: 'hinge',       baseSets: 3, repRange: '5-8',   tempo: '3-0-1', rest: '2-3 min', priority: 'strength' },
      { id: 'c2', label: 'Hamstring Eccentric',       pattern: 'hamstring_ecc', baseSets: 3, repRange: '5-8 (slow)', tempo: '5-0-1', rest: '90s', priority: 'prehab', biasNote: 'Nordic machine if available — easier to dial load. -50% hamstring injury risk in soccer.', preferBiasIds: ['nordic_machine','nordic_curl','sl_rdl','ghr'] },
      { id: 'c3', label: 'Glute (unilateral preferred)', pattern: 'glute',    baseSets: 3, repRange: '8-12/side', tempo: '2-1-1', rest: '90s', priority: 'hypertrophy', preferBiasIds: ['sl_hip_thrust','b_stance_hip_thrust','glute_bridge_march'], supersetGroup: 'C1' },
      { id: 'c5', label: 'Adductor / Copenhagen',     pattern: 'adductor',    baseSets: 3, repRange: '8-12/side or 30s hold', tempo: 'controlled', rest: '60s', priority: 'prehab', biasNote: 'Copenhagen plank ~41% groin injury reduction.', preferBiasIds: ['copenhagen_plank','copenhagen_short'], supersetGroup: 'C1' },
      { id: 'c4', label: 'Calf — Soleus',             pattern: 'calf_soleus', baseSets: 3, repRange: '15-25', tempo: '2-2-1', rest: '60s', priority: 'hypertrophy', biasNote: 'High reps. Long pause at stretch. Soleus is mostly slow-twitch.', supersetGroup: 'C2' },
      { id: 'c6', label: 'Anti-Rotation Core',        pattern: 'antirotation', baseSets: 2, repRange: '8-12/side', tempo: '2-2-1', rest: '45s', priority: 'core', supersetGroup: 'C2' },
      { id: 'c7', label: 'Hip Opening Cool-Down',     pattern: 'mobility_hip', baseSets: 2, repRange: '30-60s each', tempo: 'controlled', rest: '15s', priority: 'mobility', biasNote: 'Soothes the hinge work. Keeps you bend-y.' },
    ],
  },

  D: {
    code: 'D',
    name: 'Athletic Conditioning — Game Speed',
    focus: 'Sprints / agility / aerobic / ankle prehab',
    slots: [
      { id: 'd1', label: 'Dynamic Warm-Up + Ankle Prep', pattern: 'mobility', baseSets: 1, repRange: '10 min', tempo: '-', rest: '-', priority: 'warmup', preferIds: ['ankle_abc','tibialis_raise','short_foot','banded_ankle_ev'] },
      { id: 'd2', label: 'Agility / COD',             pattern: 'agility',     baseSets: 4, repRange: '20-30s work / 60s rest', tempo: 'X', rest: '60s', priority: 'speed' },
      { id: 'd3', label: 'Repeated Sprints',          pattern: 'sprint',      baseSets: 1, repRange: 'see exercise', tempo: 'X', rest: 'see exercise', priority: 'rsa', preferIds: ['sprint_30m','hill_sprint','sprint_repeats_40'] },
      { id: 'd4', label: 'Aerobic Capacity',          pattern: 'sprint',      baseSets: 1, repRange: 'see exercise', tempo: '-', rest: '-', priority: 'aerobic', preferIds: ['zone2_30','intervals_4x4','tempo_run_100','yoyo_ir1'] },
      { id: 'd5', label: 'Single-Leg Balance / Proprio', pattern: 'mobility', baseSets: 3, repRange: '30-45s/side', tempo: '-', rest: '30s', priority: 'prehab', preferIds: ['sl_balance_eyes','bosu_squat'] },
    ],
  },

  E: {
    code: 'E',
    name: 'Pilates / Mobility / Active Recovery',
    focus: 'Recovery, breathing, mobility — log it, don\'t grind it',
    slots: [
      { id: 'e1', label: 'Pilates or yoga or mobility flow', pattern: 'mobility', baseSets: 1, repRange: '30-60 min', tempo: '-', rest: '-', priority: 'recovery', freeform: true },
    ],
  },
};

// Weekly schedule — what days are which (you can drag/swap in app)
const WEEKLY_SPLIT_4 = ['A', 'B', 'C', 'D'];           // 4-day version
const WEEKLY_SPLIT_5 = ['A', 'B', 'C', 'D', 'E'];      // 5-day version (E = pilates)

// =============================================================
//  ALT TEMPLATES — quick-pick sessions for life-happens scenarios.
//  These are ADDITIONAL to the main plan. Logs are tagged
//  sessionType='alternative' so planned days stay independent.
//  Exercises picked through the rotation engine for variety.
// =============================================================
const ALT_TEMPLATES = {
  small_gym_upper: {
    id: 'small_gym_upper',
    name: 'Small Gym Upper',
    icon: '🏋️',
    duration: '40-50 min',
    description: 'Work-gym friendly. DB + bench + cable + pull-up bar. Push/pull supersets.',
    slots: [
      { id: 'sgu1', label: 'Warm-Up — Shoulder Prep', pattern: 'prehab_shoulder', baseSets: 2, repRange: '12-15', tempo:'controlled', rest:'30s', priority:'warmup' },
      { id: 'sgu2', label: 'Push (DB / Bench)',        pattern: 'push_h', baseSets: 4, repRange: '8-10', tempo:'2-1-1', rest:'90s', priority:'strength', supersetGroup:'SGU1', preferBiasIds: ['db_bench','incline_db_bench','weighted_pushup','larsen_press'] },
      { id: 'sgu3', label: 'Pull (DB / Pull-up)',      pattern: 'pull_h', baseSets: 4, repRange: '8-10', tempo:'2-1-1', rest:'90s', priority:'strength', supersetGroup:'SGU1', preferBiasIds: ['single_arm_row','chest_supp_row','cable_row','inverted_row'] },
      { id: 'sgu4', label: 'Vertical Push (DB)',       pattern: 'push_v', baseSets: 3, repRange: '8-12', tempo:'2-1-1', rest:'60s', priority:'hypertrophy', supersetGroup:'SGU2', preferBiasIds: ['db_shoulder_press','arnold_press','landmine_press'] },
      { id: 'sgu5', label: 'Vertical Pull',            pattern: 'pull_v', baseSets: 3, repRange: '6-10', tempo:'2-1-1', rest:'60s', priority:'hypertrophy', supersetGroup:'SGU2' },
      { id: 'sgu6', label: 'Core Circuit',             pattern: 'antiextension', baseSets: 3, repRange: '8-15', tempo:'2-1-1', rest:'45s', priority:'core' },
      { id: 'sgu7', label: 'Neck / Pec Cool-Down',     pattern: 'mobility_neck', baseSets: 2, repRange: '30-45s', tempo:'-', rest:'15s', priority:'mobility', preferBiasIds:['doorway_chest_stretch','levator_stretch','chin_tucks'] },
    ],
  },
  park_upper: {
    id: 'park_upper',
    name: 'Park Upper (Calisthenics)',
    icon: '🌳',
    duration: '35-45 min',
    description: 'Bar + bodyweight. Pull-ups, dips, push-ups + skill work.',
    slots: [
      { id: 'pu1', label: 'Warm-Up — Hangs + Scaps',  pattern: 'mobility_neck', baseSets: 2, repRange: '30s', tempo:'-', rest:'30s', priority:'warmup', preferBiasIds:['dead_hang','scap_pullup'] },
      { id: 'pu2', label: 'Skill Practice',            pattern: 'skill_cali', baseSets: 4, repRange: '3-5 OR 15s', tempo:'X', rest:'90s', priority:'power', biasNote:'Fresh nervous system — quality over quantity.' },
      { id: 'pu3', label: 'Pull-Up Variant',           pattern: 'pull_v', baseSets: 4, repRange: '5-10', tempo:'2-1-2', rest:'90s', priority:'strength', supersetGroup:'PU1', preferBiasIds:['pullup','chin_up','archer_pullup','l_sit_pullup'] },
      { id: 'pu4', label: 'Push (Dips / Push-Ups)',   pattern: 'push_h', baseSets: 4, repRange: '8-12', tempo:'2-1-1', rest:'90s', priority:'strength', supersetGroup:'PU1', preferBiasIds:['dips','weighted_pushup','archer_pushup','ring_pushup'] },
      { id: 'pu5', label: 'Inverted Row / Lever',     pattern: 'pull_h', baseSets: 3, repRange: '8-12', tempo:'2-1-2', rest:'60s', priority:'hypertrophy', preferBiasIds:['inverted_row','false_grip_row','archer_row'] },
      { id: 'pu6', label: 'Core / Hollow',            pattern: 'antiextension', baseSets: 3, repRange: '20-30s OR 10', tempo:'2-1-1', rest:'45s', priority:'core' },
    ],
  },
  tennis_session: {
    id: 'tennis_session',
    name: 'Tennis (Match or Hit)',
    icon: '🎾',
    duration: '60-90 min',
    description: 'Log the activity + RPE. Counts as athletic stimulus, not strength.',
    slots: [
      { id: 'ts1', label: 'Pre-Match Prep (5 min)',   pattern: 'mobility_hip', baseSets: 1, repRange: '5 min flow', tempo:'-', rest:'-', priority:'warmup' },
      { id: 'ts2', label: 'Tennis Activity',           pattern: 'sport_session', baseSets: 1, repRange: 'see exercise', tempo:'-', rest:'-', priority:'aerobic', preferBiasIds:['tennis_match','tennis_hit'] },
      { id: 'ts3', label: 'Cool-Down — Ankle + Hip',   pattern: 'mobility_hip', baseSets: 2, repRange: '45s', tempo:'-', rest:'15s', priority:'mobility' },
    ],
  },
  football_session: {
    id: 'football_session',
    name: 'Football (Match or Training)',
    icon: '⚽',
    duration: '60-90 min',
    description: 'Match, 5-a-side or training. Log total + RPE.',
    slots: [
      { id: 'fs1', label: 'Warm-Up (already on pitch usually)', pattern: 'mobility_hip', baseSets: 1, repRange: '5 min', tempo:'-', rest:'-', priority:'warmup' },
      { id: 'fs2', label: 'Football Activity',         pattern: 'sport_session', baseSets: 1, repRange: 'see exercise', tempo:'-', rest:'-', priority:'aerobic', preferBiasIds:['football_match','football_training'] },
      { id: 'fs3', label: 'Hamstring + Hip Cool-Down', pattern: 'mobility_hip', baseSets: 2, repRange: '45s', tempo:'-', rest:'15s', priority:'mobility' },
    ],
  },
  easy_run: {
    id: 'easy_run',
    name: 'Easy Run / Zone 2',
    icon: '🏃',
    duration: '30-45 min',
    description: 'Aerobic base. Nasal-breathing pace. Logs as time + RPE.',
    slots: [
      { id: 'er1', label: 'Zone 2 Aerobic',            pattern: 'sprint', baseSets: 1, repRange: '30-45 min', tempo:'-', rest:'-', priority:'aerobic', preferBiasIds:['zone2_30','tempo_run_100'] },
    ],
  },
  pilates_mobility: {
    id: 'pilates_mobility',
    name: 'Pilates / Mobility Class',
    icon: '🧘',
    duration: '45-60 min',
    description: 'Recovery / mobility day. Counts as Day E.',
    slots: [
      { id: 'pm1', label: 'Pilates or Mobility Flow',  pattern: 'sport_session', baseSets: 1, repRange: 'see exercise', tempo:'-', rest:'-', priority:'recovery', preferBiasIds:['pilates_class','mobility_flow'] },
    ],
  },
};

// Build a session from an alt template (mirrors buildSession's output shape)
function buildAltSession(templateId, weekNum, history, settings, log) {
  const tmpl = ALT_TEMPLATES[templateId];
  if (!tmpl) return null;
  const weekCfg = WEEKS[weekNum] || WEEKS[1];

  const session = {
    day: 'ALT',
    altTemplate: templateId,
    altName: tmpl.name,
    week: weekNum,
    name: tmpl.name,
    focus: tmpl.description,
    weekLabel: weekCfg.label,
    rir: weekCfg.rir,
    weekNote: `Alt session — doesn't affect planned-day completion.`,
    slots: [],
  };

  for (const slot of tmpl.slots) {
    const ex = rotateSlot(slot, weekNum, history || {}, settings);
    if (!ex) continue;
    const rec = recommendLoad(ex.id, weekCfg, log || []);
    session.slots.push({
      slotId: slot.id,
      label: slot.label,
      exercise: ex,
      sets: slot.baseSets,
      repRange: slot.repRange,
      tempo: slot.tempo,
      rest: slot.rest,
      rir: weekCfg.rir,
      priority: slot.priority,
      biasNote: slot.biasNote || ex.note || '',
      loadAdjustHint: weekCfg.loadMod,
      recommendation: rec,
      unit: ex.unit || 'reps',
      logMode: ex.logMode || 'strength',
      isUnilateral: !!ex.unilateral,
      supersetGroup: slot.supersetGroup || null,
      skippable: !!slot.skippable,
    });
  }
  return session;
}

// =============================================================
//  ROTATION ENGINE
//  For each slot, pick an exercise that:
//   - matches the pattern
//   - hasn't been used in the last N weeks (avoid staleness)
//   - is feasible with the available equipment
//   - respects safety filters (knee_safe, ankle_load)
//   - bias toward "fav" exercises
// =============================================================

function rotateSlot(slot, weekNum, history /* {exerciseId: [weekNumbers]} */, settings) {
  const { equipAvailable = ['barbell','dumbbell','kettlebell','cable','machine','bodyweight','band','medball','smith','park'],
          kneeSafeOnly = true,
          ankleSafeOnly = false,
          stylePref = 'calisthenics' /* 'mixed' | 'calisthenics' | 'barbell' */,
          anchors = {} /* { [slotId]: exerciseId } — pinned exercises that lock a slot */,
          unilateralBias = true /* prefer single-leg/single-arm on accessory slots */ } = settings || {};
  const weekCfg = WEEKS[weekNum];
  const isDeload = weekCfg && weekCfg.label === 'DELOAD';

  // ANCHOR — if this slot has a pinned exercise, return it directly (skip rotation)
  if (anchors && anchors[slot.id]) {
    const anchored = EX_BY_ID[anchors[slot.id]];
    if (anchored) return { ...anchored, _anchored: true };
  }

  // Filter pool — preferIds is a HARD filter, preferBiasIds is just a scoring bump
  let pool;
  if (slot.preferIds && slot.preferIds.length) {
    pool = slot.preferIds.map(id => EX_BY_ID[id]).filter(Boolean);
  } else {
    pool = exercisesMatching({
      pattern: slot.pattern,
      equipAvailable,
      kneeSafeOnly,
      ankleSafeOnly,
    });
  }

  if (pool.length === 0) {
    // Fallback: ignore equipment restriction
    pool = exercisesMatching({ pattern: slot.pattern, kneeSafeOnly, ankleSafeOnly });
  }
  // Deload: drop the hardest stuff (difficulty 4-5) unless pool would empty
  if (isDeload) {
    const easier = pool.filter(ex => (ex.diff || 1) <= 3);
    if (easier.length) pool = easier;
  }
  if (pool.length === 0) return null;

  // Score each candidate
  const scored = pool.map(ex => {
    const used = history[ex.id] || [];
    const lastUsed = used.length ? Math.max(...used) : -99;
    const weeksSince = weekNum - lastUsed;

    let score = 0;
    // Strongly prefer exercises not used in the last 2 weeks
    score += Math.min(weeksSince, 4) * 10;
    // Favorites get a bump
    if (ex.fav) score += 8;
    // preferBiasIds: soft preference for the slot's "first-choice" exercises
    if (slot.preferBiasIds && slot.preferBiasIds.includes(ex.id)) score += 12;
    // Style preference: calisthenics vs barbell vs mixed
    if (stylePref === 'calisthenics' && ex.calisthenics) score += 14; // stronger bias toward calisthenics
    if (stylePref === 'barbell' && ex.equip.includes('barbell')) score += 8;
    // Unilateral bias for accessory slots (NOT main strength slots — those need bilateral progression)
    if (unilateralBias && ex.unilateral && slot.priority !== 'strength') score += 6;
    // Sport-specific bumps for slots that benefit from it
    if (slot.priority === 'power' && (ex.sport === 'football' || ex.sport === 'tennis' || ex.sport === 'both')) score += 4;
    if (slot.priority === 'rsa' && ex.sport === 'football') score += 4;
    // Mild random jitter so we don't always pick the same when scores tie
    score += Math.random() * 3;
    return { ex, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].ex;
}

function buildSession(dayCode, weekNum, history, settings, log /* optional past log entries */) {
  const template = DAY_TEMPLATES[dayCode];
  const weekCfg = WEEKS[weekNum];
  if (!template || !weekCfg) return null;
  const stylePref = (settings && settings.stylePref) || 'mixed';

  const session = {
    day: dayCode,
    week: weekNum,
    name: template.name,
    focus: template.focus,
    weekLabel: weekCfg.label,
    rir: weekCfg.rir,
    weekNote: weekCfg.note,
    slots: [],
  };

  for (const slot of template.slots) {
    // Skip calisthenics-only slots unless calisthenics mode is on
    if (slot.calisthenicsOnly && stylePref !== 'calisthenics') continue;
    const ex = rotateSlot(slot, weekNum, history, settings);
    if (!ex) continue;
    // Set count: deload uses ~half of base (rounded up), other weeks use base + setMod
    let sets;
    if (slot.priority === 'warmup' || slot.priority === 'recovery' || slot.priority === 'mobility') {
      sets = slot.baseSets;       // mobility/recovery stays constant — always do it
    } else if (weekCfg.label === 'DELOAD') {
      sets = Math.max(1, Math.ceil(slot.baseSets / 2));
    } else {
      sets = Math.max(1, slot.baseSets + weekCfg.setMod);
    }
    // Build load recommendation from history if available
    const rec = recommendLoad(ex.id, weekCfg, log || []);
    session.slots.push({
      slotId: slot.id,
      label: slot.label,
      exercise: ex,
      sets,
      repRange: slot.repRange,
      tempo: slot.tempo,
      rest: slot.rest,
      rir: weekCfg.rir,
      priority: slot.priority,
      biasNote: slot.biasNote || ex.note || '',
      loadAdjustHint: weekCfg.loadMod,
      recommendation: rec,
      unit: ex.unit || 'reps',                  // 'reps' or 'seconds'
      logMode: ex.logMode || 'strength',        // strength/bw_reps/hold/distance/time/quality/completion
      isUnilateral: !!ex.unilateral,            // show L/R inputs
      supersetGroup: slot.supersetGroup || null, // e.g. 'A1' — pairs of slots
      skippable: !!slot.skippable,              // sled etc. can be skipped if no equipment
    });
  }
  return session;
}

// =============================================================
//  INTELLIGENT LOAD RECOMMENDER
//  Looks at most recent log of this exercise, compares last RIR to
//  target RIR, applies week's load mod, and suggests next load + reps.
// =============================================================
function recommendLoad(exerciseId, weekCfg, log) {
  const ex = (typeof EX_BY_ID !== 'undefined') ? EX_BY_ID[exerciseId] : null;
  const mode = (ex && ex.logMode) || 'strength';
  const pastAll = log.filter(e => e.exerciseId === exerciseId);

  // Non-strength modes use different recommendation logic
  if (mode === 'quality') {
    return { weight: null, reps: null, rationale: 'Max-intent reps. Quality over quantity — full rest between reps. No RIR.' };
  }
  if (mode === 'completion') {
    return { weight: null, reps: null, rationale: 'Just get it done. Tick the box when complete.' };
  }
  if (mode === 'distance') {
    const last = pastAll.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
    if (!last) return { weight: null, reps: null, rationale: 'First time — keep distance modest, intensity high. Each set = one trip.' };
    return { weight: null, reps: Number(last.reps) || null, rationale: `Last: ${last.reps || '?'}m per trip × ${last.totalSets || '?'} trips. Match or +5m if it felt under-cooked.` };
  }
  if (mode === 'time') {
    const last = pastAll.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
    if (!last) return { weight: null, reps: null, rationale: 'Log duration (min) + RPE (1-10). First time — go by feel.' };
    return { weight: null, reps: Number(last.reps) || null, rationale: `Last: ${last.reps || '?'} min @ RPE ${last.rir || '?'}. Hold duration; target same RPE.` };
  }
  if (mode === 'hold') {
    const past = pastAll.filter(e => e.reps !== '' && e.reps != null && !isNaN(Number(e.reps)));
    if (!past.length) return { weight: null, reps: null, rationale: 'Log seconds held + effort (0=failure, 5=easy). Build up gradually.' };
    past.sort((a,b) => new Date(b.date) - new Date(a.date));
    const top = past.reduce((best, e) => Number(e.reps) > Number(best.reps) ? e : best, past[0]);
    const lastSec = Number(top.reps);
    const lastEffort = top.rir !== '' && top.rir != null ? Number(top.rir) : null;
    let nextSec = lastSec;
    if (lastEffort != null) {
      if (lastEffort >= 3) nextSec = Math.round(lastSec * 1.15); // had a lot left → push +15%
      else if (lastEffort >= 1) nextSec = lastSec + 3;          // small bump
      else nextSec = lastSec;                                    // failure last time → hold
    }
    return { weight: null, reps: nextSec, rationale: `Last: ${lastSec}s @ effort ${lastEffort ?? '?'}. Try ${nextSec}s.`, delta: nextSec - lastSec };
  }
  if (mode === 'bw_reps') {
    const past = pastAll.filter(e => e.reps !== '' && e.reps != null && !isNaN(Number(e.reps)));
    if (!past.length) return { weight: null, reps: null, rationale: 'Bodyweight reps. First time — go for one shy of failure (RIR 1).' };
    past.sort((a,b) => new Date(b.date) - new Date(a.date));
    const top = past.reduce((best, e) => Number(e.reps) > Number(best.reps) ? e : best, past[0]);
    const lastReps = Number(top.reps);
    const lastRir = top.rir !== '' && top.rir != null ? Number(top.rir) : null;
    const targetRir = weekCfg.rir;
    let nextReps = lastReps;
    if (lastRir != null) {
      const gap = lastRir - targetRir;
      if (gap >= 2) nextReps = lastReps + 2;
      else if (gap >= 1) nextReps = lastReps + 1;
      else if (gap <= -1) nextReps = Math.max(1, lastReps - 1);
    }
    return { weight: null, reps: nextReps, rationale: `Last: ${lastReps} reps @ RIR ${lastRir ?? '?'}. Try ${nextReps} reps at RIR ${targetRir}.`, delta: nextReps - lastReps };
  }

  // STRENGTH (default) — existing weight-based logic
  const past = pastAll.filter(e =>
    e.weight !== '' && e.weight != null && !isNaN(Number(e.weight))
  );
  if (!past.length) {
    return { weight: null, reps: null, rationale: 'First time on this exercise — pick a load that leaves you at target RIR.' };
  }
  // Use the most recent date
  past.sort((a, b) => new Date(b.date) - new Date(a.date));
  // Use the heaviest top set from the most recent session
  const lastDate = past[0].date.slice(0,10);
  const lastSession = past.filter(e => e.date.slice(0,10) === lastDate);
  const top = lastSession.reduce((best, e) => Number(e.weight) > Number(best.weight) ? e : best, lastSession[0]);
  const lastWeight = Number(top.weight);
  const lastReps = Number(top.reps) || 0;
  const lastRir = top.rir !== '' && top.rir != null ? Number(top.rir) : null;
  const targetRir = weekCfg.rir;

  // RIR-based adjustment
  let rirAdjust = 0;
  let rirReason = '';
  if (lastRir != null) {
    const rirGap = lastRir - targetRir; // positive = you had more in tank than planned
    if (rirGap >= 2)        { rirAdjust =  0.05; rirReason = `last set was ${rirGap.toFixed(1)} RIR above target → step it up`; }
    else if (rirGap >= 1)   { rirAdjust =  0.025; rirReason = `you had ~1 rep in tank above target → small bump`; }
    else if (rirGap <= -1.5){ rirAdjust = -0.05; rirReason = `last set was harder than target → ease back`; }
    else if (rirGap <= -0.5){ rirAdjust = -0.025; rirReason = `slightly tougher than target → tiny dial back`; }
    else                    { rirAdjust =  0;     rirReason = `RIR was on target → progress per week plan`; }
  }
  const weekAdjust = weekCfg.loadMod; // -0.30 ... +0.075
  const raw = lastWeight * (1 + rirAdjust + weekAdjust);

  // Round to nearest 2.5 (kg / lb both work well at 2.5 increments)
  const suggested = Math.max(0, Math.round(raw / 2.5) * 2.5);

  const delta = suggested - lastWeight;
  const arrow = delta > 0 ? '↑' : (delta < 0 ? '↓' : '→');
  const rationale = `Last: ${lastWeight} × ${lastReps} @ RIR ${lastRir ?? '?'}. ${arrow} ${suggested} (${rirReason}; week ${weekCfg.label.toLowerCase()} ${weekAdjust>=0?'+':''}${(weekAdjust*100).toFixed(1)}%)`;

  return {
    weight: suggested,
    reps: lastReps || null,
    rationale,
    lastWeight, lastReps, lastRir,
    delta,
  };
}

// =============================================================
//  ANCHOR HELPERS
// =============================================================

// Return all slots from all days as a flat list with day code attached
function allSlots() {
  const out = [];
  for (const code of Object.keys(DAY_TEMPLATES)) {
    for (const s of DAY_TEMPLATES[code].slots) {
      out.push({ dayCode: code, dayName: DAY_TEMPLATES[code].name, ...s });
    }
  }
  return out;
}

// Return all exercises that could fill this slot (used by the anchor dropdown)
function candidatesForSlot(slot, equipAvailable) {
  if (slot.preferIds && slot.preferIds.length) {
    return slot.preferIds.map(id => EX_BY_ID[id]).filter(Boolean);
  }
  // For anchor dropdown, ignore equipment restriction — user may want to pin something not in current setup
  return exercisesMatching({ pattern: slot.pattern, equipAvailable: null, kneeSafeOnly: false, ankleSafeOnly: false });
}

// Suggested anchor presets — picks sensible bedrocks based on style preference
function suggestedAnchors(stylePref) {
  const base = {
    // Day A
    a1: stylePref === 'barbell' ? 'back_squat' : 'front_squat',
    a3: 'sl_calf_raise_db',
    // Day C
    c1: stylePref === 'barbell' ? 'conv_deadlift' : 'rdl',
    c2: 'nordic_machine',  // prefer machine for easy load adjustment
    c4: 'seated_calf_raise',
    c5: 'copenhagen_plank',
  };
  if (stylePref === 'calisthenics') {
    return {
      ...base,
      b0: 'mu_negatives',          // safer entry-point — progresses to muscle-up
      b1: 'ring_dip',
      b2: 'false_grip_row',
      b3: 'wall_hspu',
      b4: 'archer_pullup',
    };
  }
  // mixed or barbell
  return {
    ...base,
    b1: 'bench_press',
    b2: 'barbell_row',
    b3: 'ohp',
    b4: 'pullup',
  };
}

// =============================================================
//  PLAN GENERATION — pre-compute all 6 weeks × all days, once.
//  Stops sessions from being re-rolled / muddled between page loads.
// =============================================================
function generateMesocyclePlan(settings, daysPerWeek = 4) {
  const split = daysPerWeek === 5 ? WEEKLY_SPLIT_5 : WEEKLY_SPLIT_4;
  const plan = {}; // plan[weekNum][dayCode] = session (without setLogs — those go in log)
  const history = {}; // exerciseId -> [weeks used]

  for (let w = 1; w <= 6; w++) {
    plan[w] = {};
    for (const dayCode of split) {
      // buildSession takes (dayCode, weekNum, history, settings, log)
      // For pre-generation we don't have log yet, but recommendations will be
      // re-computed on session start using the current log at that time.
      const s = buildSession(dayCode, w, history, settings, []);
      // Strip the recommendation — that's computed fresh when starting a session
      s.slots = s.slots.map(sl => {
        const { recommendation, ...rest } = sl;
        return rest;
      });
      plan[w][dayCode] = s;
      // Record exercise usage to influence rotation in later weeks
      for (const sl of s.slots) {
        if (!history[sl.exercise.id]) history[sl.exercise.id] = [];
        if (!history[sl.exercise.id].includes(w)) history[sl.exercise.id].push(w);
      }
    }
  }
  return plan;
}

// Pull a session out of the plan, and freshen up the load recommendations
// against the current log. Also re-hydrates exercise + slot metadata so
// plans saved under older code pick up new fields (supersetGroup, unit,
// unilateral flag, skippable, etc.) automatically.
function getPlannedSession(plan, dayCode, weekNum, log) {
  if (!plan || !plan[weekNum] || !plan[weekNum][dayCode]) return null;
  const sess = JSON.parse(JSON.stringify(plan[weekNum][dayCode]));
  const weekCfg = WEEKS[weekNum];
  const dayTemplate = DAY_TEMPLATES[dayCode];
  const templateBySlotId = dayTemplate
    ? Object.fromEntries(dayTemplate.slots.map(s => [s.id, s]))
    : {};

  for (const slot of sess.slots) {
    // Re-hydrate full exercise metadata from the pool (unit, unilateral, etc.)
    const fullEx = EX_BY_ID[slot.exercise.id];
    if (fullEx) {
      const anchored = slot.exercise._anchored;
      slot.exercise = Object.assign({}, fullEx, { _anchored: anchored });
    }
    // Re-hydrate slot-level fields from current template (supersets, etc.)
    const tmpl = templateBySlotId[slot.slotId];
    if (tmpl) {
      if (tmpl.supersetGroup !== undefined) slot.supersetGroup = tmpl.supersetGroup;
      if (tmpl.skippable !== undefined)     slot.skippable = tmpl.skippable;
    }
    // Derive (re-hydrated each session so older plans pick up new fields)
    slot.unit = (slot.exercise && slot.exercise.unit) || 'reps';
    slot.logMode = (slot.exercise && slot.exercise.logMode) || 'strength';
    slot.isUnilateral = !!(slot.exercise && slot.exercise.unilateral);

    slot.recommendation = recommendLoad(slot.exercise.id, weekCfg, log || []);
  }
  return sess;
}

// Returns true if every slot for this day has at least one logged set
function isDayLogged(log, weekNum, dayCode, plan) {
  if (!plan || !plan[weekNum] || !plan[weekNum][dayCode]) return false;
  const slotIds = plan[weekNum][dayCode].slots.map(s => s.slotId);
  // Day is "logged" when we've recorded at least one set for every slot
  return slotIds.every(sid =>
    log.some(e => e.week === weekNum && e.day === dayCode && e.slot && e.slot.length && plan[weekNum][dayCode].slots.find(sl => sl.slotId === sid && sl.label === e.slot))
  );
}

// Simpler: a day is "complete" if user has logged at least one set for it
function dayHasAnyLog(log, weekNum, dayCode) {
  return log.some(e => e.week === weekNum && e.day === dayCode);
}

// Which days in this week have any logs
function loggedDaysInWeek(log, weekNum) {
  const days = new Set();
  for (const e of log) {
    if (e.week === weekNum && e.day) days.add(e.day);
  }
  return Array.from(days);
}

if (typeof window !== 'undefined') {
  window.WEEKS = WEEKS;
  window.DAY_TEMPLATES = DAY_TEMPLATES;
  window.WEEKLY_SPLIT_4 = WEEKLY_SPLIT_4;
  window.WEEKLY_SPLIT_5 = WEEKLY_SPLIT_5;
  window.rotateSlot = rotateSlot;
  window.buildSession = buildSession;
  window.recommendLoad = recommendLoad;
  window.allSlots = allSlots;
  window.candidatesForSlot = candidatesForSlot;
  window.suggestedAnchors = suggestedAnchors;
  window.generateMesocyclePlan = generateMesocyclePlan;
  window.getPlannedSession = getPlannedSession;
  window.dayHasAnyLog = dayHasAnyLog;
  window.loggedDaysInWeek = loggedDaysInWeek;
  window.ALT_TEMPLATES = ALT_TEMPLATES;
  window.buildAltSession = buildAltSession;
}
