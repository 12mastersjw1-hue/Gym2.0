// =============================================================
//  6-WEEK GOALS
//  Computed from baseline 1RM/rep numbers. Football/tennis +
//  injury-prevention flavoured (NOT pure powerlifting).
// =============================================================

const DEFAULT_BASELINE = {
  // Strength 1RMs
  back_squat_1rm: 95,    // kg
  deadlift_1rm:  120,
  bench_1rm:      80,
  // Bodyweight rep maxes
  pullup_max:     19,
  pushup_max:     28,
};

// Build 6-week target list. Returns array of goal objects.
function buildGoals(baseline) {
  const b = Object.assign({}, DEFAULT_BASELINE, baseline || {});
  return [
    // === STRENGTH (3-5% over 6 weeks is realistic for advanced) ===
    {
      id: 'g_back_squat',
      category: 'strength', icon: '🏋️',
      metric: 'Back Squat 1RM',
      baseline: b.back_squat_1rm, target: roundTo(b.back_squat_1rm * 1.055, 2.5),
      unit: 'kg',
      rationale: '+5.5% — neural + tendon-friendly bump on a knee-respecting lift.',
      relatedExerciseIds: ['back_squat'],
    },
    {
      id: 'g_deadlift',
      category: 'strength', icon: '🏋️',
      metric: 'Deadlift 1RM (RDL or trap-bar fine)',
      baseline: b.deadlift_1rm, target: roundTo(b.deadlift_1rm * 1.05, 2.5),
      unit: 'kg',
      rationale: '+5% — hip-hinge strength = stronger sprint + safer back.',
      relatedExerciseIds: ['conv_deadlift','trap_bar_dl','rdl'],
    },
    {
      id: 'g_bench',
      category: 'strength', icon: '🏋️',
      metric: 'Bench Press 1RM (de-emphasised)',
      baseline: b.bench_1rm, target: roundTo(b.bench_1rm * 1.03, 2.5),
      unit: 'kg',
      rationale: '+3% — small bump because focus is calisthenics. Use as a check-in.',
      relatedExerciseIds: ['bench_press'],
    },

    // === CALISTHENICS REP/SKILL (the headline) ===
    {
      id: 'g_pullup',
      category: 'calisthenics', icon: '🤸',
      metric: 'Strict Pull-ups (max reps)',
      baseline: b.pullup_max, target: b.pullup_max + 4,
      unit: 'reps',
      rationale: '+4 reps. Or hit 1RM at +12kg added weight.',
      relatedExerciseIds: ['pullup','chin_up'],
    },
    {
      id: 'g_pushup',
      category: 'calisthenics', icon: '🤸',
      metric: 'Strict Push-ups (max reps)',
      baseline: b.pushup_max, target: b.pushup_max + 10,
      unit: 'reps',
      rationale: '+10 reps OR progress to archer push-ups (5/side).',
      relatedExerciseIds: ['weighted_pushup','archer_pushup'],
    },
    {
      id: 'g_muscle_up',
      category: 'calisthenics', icon: '🤸',
      metric: 'Strict Ring Muscle-Up',
      baseline: 0, target: 3,
      unit: 'clean reps',
      rationale: 'You\'re at 19 pull-ups — muscle-up is the natural next milestone. False-grip drilling weekly.',
      relatedExerciseIds: ['muscle_up_ring','muscle_up_bar','mu_negatives','mu_transition_drill'],
    },
    {
      id: 'g_handstand',
      category: 'calisthenics', icon: '🤸',
      metric: 'Freestanding Handstand',
      baseline: 0, target: 10,
      unit: 'seconds',
      rationale: 'Skill, balance, shoulder health. 10s = solid foundation.',
      relatedExerciseIds: ['handstand_practice','handstand_hold','wall_hspu'],
    },
    {
      id: 'g_front_lever',
      category: 'calisthenics', icon: '🤸',
      metric: 'Advanced Tuck Front Lever Hold',
      baseline: 0, target: 15,
      unit: 'seconds',
      rationale: 'Core + lat + scapular control. Big carryover to all pulling.',
      relatedExerciseIds: ['front_lever_tuck','front_lever_adv','front_lever_straddle'],
    },

    // === ATHLETIC / SPORT-SPECIFIC ===
    {
      id: 'g_broad_jump',
      category: 'athletic', icon: '⚡',
      metric: 'Broad Jump',
      baseline: null, target: 230,
      unit: 'cm',
      rationale: 'Horizontal power = sprint-start. Test in W1, aim for body-height +50cm.',
      relatedExerciseIds: ['broad_jump'],
    },
    {
      id: 'g_30m_sprint',
      category: 'athletic', icon: '⚡',
      metric: '30m Sprint Time',
      baseline: null, target: 4.3,
      unit: 'seconds',
      rationale: 'Time in W1, aim to shave 0.1-0.2s by W5.',
      relatedExerciseIds: ['sprint_30m'],
    },
    {
      id: 'g_sl_squat',
      category: 'athletic', icon: '⚡',
      metric: 'Pistol Squat — Each Side',
      baseline: null, target: 5,
      unit: 'clean reps each leg',
      rationale: 'Single-leg strength = football cutting + post-ACL bulletproofing.',
      relatedExerciseIds: ['pistol_squat','bulgarian_ss','spanish_squat'],
    },
    {
      id: 'g_sl_hop',
      category: 'athletic', icon: '⚡',
      metric: 'Single-Leg Triple Hop — L/R symmetry',
      baseline: null, target: 95,
      unit: '% (L vs R should match)',
      rationale: 'ACL return-to-sport gold standard. 90%+ = green light.',
      relatedExerciseIds: ['sl_pogo','lateral_bound'],
    },

    // === INJURY PREVENTION (non-negotiables) ===
    {
      id: 'g_nordic',
      category: 'prehab', icon: '🛡️',
      metric: 'Strict Nordic Hamstring Curl',
      baseline: null, target: 5,
      unit: 'clean reps (controlled descent to chest)',
      rationale: 'Hamstring injury risk cut ~50% in soccer with Nordic protocols.',
      relatedExerciseIds: ['nordic_curl'],
    },
    {
      id: 'g_copenhagen',
      category: 'prehab', icon: '🛡️',
      metric: 'Copenhagen Plank — each side',
      baseline: null, target: 40,
      unit: 'seconds hold',
      rationale: 'Cuts groin injury in soccer ~41% (Harøy 2019).',
      relatedExerciseIds: ['copenhagen_plank'],
    },
    {
      id: 'g_sl_balance',
      category: 'prehab', icon: '🛡️',
      metric: 'Single-Leg Balance — Eyes Closed',
      baseline: null, target: 45,
      unit: 'seconds each leg',
      rationale: 'Ankle proprioception. Tennis ankle insurance.',
      relatedExerciseIds: ['sl_balance_eyes'],
    },
    {
      id: 'g_sl_calf',
      category: 'prehab', icon: '🛡️',
      metric: 'Single-Leg Calf Raise (off step, slow)',
      baseline: null, target: 25,
      unit: 'reps each leg',
      rationale: 'Calf endurance + Achilles tendon health. Foundation for sprinting.',
      relatedExerciseIds: ['sl_calf_raise_db'],
    },

    // === CONDITIONING ===
    {
      id: 'g_5k',
      category: 'cardio', icon: '🫁',
      metric: '5km Run',
      baseline: null, target: 24,
      unit: 'minutes',
      rationale: 'Aerobic base for a midfielder. 4:48/km pace.',
      relatedExerciseIds: ['zone2_30','tempo_run_100'],
    },
    {
      id: 'g_4x4',
      category: 'cardio', icon: '🫁',
      metric: 'Norwegian 4×4 Completed',
      baseline: null, target: 6,
      unit: 'sessions in mesocycle',
      rationale: 'VO2max protocol. Hit 6+ in 6 weeks = noticeable engine boost.',
      relatedExerciseIds: ['intervals_4x4'],
    },
  ];
}

function roundTo(num, step) { return Math.round(num / step) * step; }

// Read the most recent achievement for a goal from the log
function goalProgress(goal, log) {
  if (!goal.relatedExerciseIds || !log || !log.length) return null;
  const relevant = log.filter(e => goal.relatedExerciseIds.includes(e.exerciseId));
  if (!relevant.length) return null;

  // For strength: best weight × reps from any entry
  if (goal.category === 'strength' && goal.unit === 'kg') {
    const best = relevant.reduce((acc, e) => {
      const w = Number(e.weight) || 0;
      const r = Number(e.reps) || 0;
      // Epley estimated 1RM
      const est1rm = r > 0 ? w * (1 + r/30) : w;
      return est1rm > acc.value ? { value: est1rm, weight: w, reps: r, date: e.date } : acc;
    }, { value: 0 });
    return best.value > 0 ? { current: Math.round(best.value), weight: best.weight, reps: best.reps, date: best.date } : null;
  }

  // For rep-based (pull-ups, push-ups, muscle-ups)
  if (goal.unit.includes('rep')) {
    const best = relevant.reduce((acc, e) => {
      const r = Number(e.reps) || 0;
      return r > acc.value ? { value: r, date: e.date } : acc;
    }, { value: 0 });
    return best.value > 0 ? { current: best.value, date: best.date } : null;
  }

  // For seconds-based (holds, balance)
  if (goal.unit.includes('second')) {
    const best = relevant.reduce((acc, e) => {
      const r = Number(e.reps) || 0; // we store seconds in reps field for holds
      return r > acc.value ? { value: r, date: e.date } : acc;
    }, { value: 0 });
    return best.value > 0 ? { current: best.value, date: best.date } : null;
  }

  return null;
}

if (typeof window !== 'undefined') {
  window.DEFAULT_BASELINE = DEFAULT_BASELINE;
  window.buildGoals = buildGoals;
  window.goalProgress = goalProgress;
}
