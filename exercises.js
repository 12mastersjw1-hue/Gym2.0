// =============================================================
//  EXERCISE POOL
//  Tags drive the rotation engine. Add/remove freely.
//
//  Tag dictionary:
//   pattern: squat_bi, squat_uni, hinge, hinge_uni, lunge,
//            push_h, push_v, pull_h, pull_v,
//            calf_gastroc, calf_soleus,
//            hamstring_ecc, glute, adductor, abductor,
//            rotation, antirotation, antiextension, carry,
//            plyo, sprint, agility, mobility
//   equip:  barbell, dumbbell, kettlebell, cable, machine,
//           bodyweight, band, medball, smith, park, sled
//   knee_safe: true (post-ACL friendly) | false (deep loaded knee flexion)
//   ankle_load: low | mid | high
//   sport:  football, tennis, both, general
//   diff:   1..5
//   fav:    user can flip true to bias rotation
// =============================================================

const EXERCISES = [
  // ===== KNEE-DOMINANT LOWER (Day A main) =====
  { id: 'back_squat',          name: 'Back Squat',                       pattern: 'squat_bi',  equip: ['barbell'],            knee_safe: true,  ankle_load: 'mid',  sport: 'general',  diff: 4, fav: false },
  { id: 'front_squat',         name: 'Front Squat',                      pattern: 'squat_bi',  equip: ['barbell'],            knee_safe: true,  ankle_load: 'mid',  sport: 'general',  diff: 4, fav: false },
  { id: 'safety_bar_squat',    name: 'Safety-Bar Squat',                 pattern: 'squat_bi',  equip: ['barbell'],            knee_safe: true,  ankle_load: 'mid',  sport: 'general',  diff: 4, fav: false },
  { id: 'hack_squat',          name: 'Hack Squat (machine)',             pattern: 'squat_bi',  equip: ['machine'],            knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },
  { id: 'leg_press',           name: 'Leg Press',                        pattern: 'squat_bi',  equip: ['machine'],            knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'goblet_squat',        name: 'Goblet Squat',                     pattern: 'squat_bi',  equip: ['dumbbell','kettlebell'], knee_safe: true, ankle_load: 'mid', sport: 'general', diff: 2, fav: false },

  // ===== UNILATERAL LOWER (Day A secondary) — strong sport carryover =====
  { id: 'bulgarian_ss',        name: 'Bulgarian Split Squat',            pattern: 'squat_uni', equip: ['dumbbell','barbell'], knee_safe: true,  ankle_load: 'high', sport: 'both',     diff: 3, fav: false },
  { id: 'rear_foot_db_ss',     name: 'Rear-Foot-Elevated DB Split Squat',pattern: 'squat_uni', equip: ['dumbbell'],           knee_safe: true,  ankle_load: 'high', sport: 'both',     diff: 3, fav: false },
  { id: 'reverse_lunge',       name: 'Reverse Lunge (DB)',               pattern: 'lunge',     equip: ['dumbbell'],           knee_safe: true,  ankle_load: 'mid',  sport: 'both',     diff: 2, fav: false },
  { id: 'walking_lunge',       name: 'Walking Lunge (DB)',               pattern: 'lunge',     equip: ['dumbbell'],           knee_safe: true,  ankle_load: 'mid',  sport: 'both',     diff: 2, fav: false },
  { id: 'step_up',             name: 'Box Step-Up (knee-high, slow)',    pattern: 'squat_uni', equip: ['dumbbell','bodyweight'], knee_safe: true, ankle_load: 'mid', sport: 'football', diff: 2, fav: false },
  { id: 'spanish_squat',       name: 'Spanish Squat (band-loaded)',      pattern: 'squat_uni', equip: ['band'],               knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false, note: 'VMO + patellar tendon love. Slow tempo 3-1-1.' },
  { id: 'sl_leg_press',        name: 'Single-Leg Leg Press',             pattern: 'squat_uni', equip: ['machine'],            knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },
  { id: 'pistol_squat',        name: 'Pistol Squat (assisted ok)',       pattern: 'squat_uni', equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'high', sport: 'general',  diff: 4, fav: false },
  { id: 'cossack_squat',       name: 'Cossack Squat',                    pattern: 'squat_uni', equip: ['dumbbell','bodyweight'], knee_safe: true, ankle_load: 'high', sport: 'tennis',  diff: 3, fav: false },

  // ===== HIP HINGE (Day C main) =====
  { id: 'rdl',                 name: 'Romanian Deadlift (barbell)',      pattern: 'hinge',     equip: ['barbell'],            knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },
  { id: 'db_rdl',              name: 'Dumbbell RDL',                     pattern: 'hinge',     equip: ['dumbbell'],           knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'trap_bar_dl',         name: 'Trap-Bar Deadlift',                pattern: 'hinge',     equip: ['barbell'],            knee_safe: true,  ankle_load: 'mid',  sport: 'general',  diff: 3, fav: false },
  { id: 'conv_deadlift',       name: 'Conventional Deadlift',            pattern: 'hinge',     equip: ['barbell'],            knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 5, fav: false },
  { id: 'sl_rdl',              name: 'Single-Leg RDL (DB or KB)',        pattern: 'hinge_uni', equip: ['dumbbell','kettlebell'], knee_safe: true, ankle_load: 'mid', sport: 'both',    diff: 3, fav: false },
  { id: 'kb_swing',            name: 'Kettlebell Swing',                 pattern: 'hinge',     equip: ['kettlebell'],         knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'good_morning',        name: 'Good Morning (barbell)',           pattern: 'hinge',     equip: ['barbell'],            knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },
  { id: 'cable_pull_through',  name: 'Cable Pull-Through',               pattern: 'hinge',     equip: ['cable'],              knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 1, fav: false },

  // ===== HAMSTRING ECCENTRIC (Day C — non-negotiable) =====
  { id: 'nordic_machine',      name: 'Nordic Curl Machine (loaded/assisted)', pattern: 'hamstring_ecc', equip: ['machine'], knee_safe: true, ankle_load: 'low', sport: 'football', diff: 4, fav: false, note: 'Bands or weighted vest to dial difficulty. Easier to overload than bodyweight.' },
  { id: 'nordic_curl',         name: 'Nordic Hamstring Curl (bodyweight)', pattern: 'hamstring_ecc', equip: ['bodyweight'], knee_safe: true, ankle_load: 'low', sport: 'football', diff: 5, fav: false, note: 'Reduces hamstring injury risk by ~50% in soccer (Petersen).' },
  { id: 'slider_curl',         name: 'Sliding Leg Curl',                 pattern: 'hamstring_ecc', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low',  sport: 'football', diff: 3, fav: false },
  { id: 'ghr',                 name: 'Glute-Ham Raise',                  pattern: 'hamstring_ecc', equip: ['machine'],        knee_safe: true,  ankle_load: 'low',  sport: 'football', diff: 4, fav: false },
  { id: 'lying_ham_curl',      name: 'Lying Leg Curl (machine)',         pattern: 'hamstring_ecc', equip: ['machine'],        knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 1, fav: false },

  // ===== GLUTE =====
  { id: 'barbell_hip_thrust',  name: 'Barbell Hip Thrust',               pattern: 'glute',     equip: ['barbell'],            knee_safe: true,  ankle_load: 'low',  sport: 'football', diff: 3, fav: false },
  { id: 'sl_hip_thrust',       name: 'Single-Leg Hip Thrust',            pattern: 'glute',     equip: ['bodyweight','dumbbell'], knee_safe: true, ankle_load: 'low', sport: 'football', diff: 2, fav: false },
  { id: 'glute_bridge_march',  name: 'Glute Bridge March',               pattern: 'glute',     equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'football', diff: 1, fav: false },
  { id: 'cable_kickback',      name: 'Cable Glute Kickback',             pattern: 'glute',     equip: ['cable'],              knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 1, fav: false },
  { id: 'b_stance_hip_thrust', name: 'B-Stance Hip Thrust',              pattern: 'glute',     equip: ['barbell','dumbbell'], knee_safe: true,  ankle_load: 'low',  sport: 'football', diff: 2, fav: false },

  // ===== CALF — GASTROC (standing, heavy-ish, long stretch) =====
  { id: 'standing_calf_raise', name: 'Standing Calf Raise (machine)',    pattern: 'calf_gastroc', equip: ['machine'],         knee_safe: true,  ankle_load: 'high', sport: 'general',  diff: 1, fav: false, note: 'Pause 2s at full stretch.' },
  { id: 'sl_calf_raise_db',    name: 'Single-Leg DB Calf Raise (off step)', pattern: 'calf_gastroc', equip: ['dumbbell'],     knee_safe: true,  ankle_load: 'high', sport: 'tennis',   diff: 2, fav: false, note: 'Off a step, full stretch.' },
  { id: 'smith_calf_raise',    name: 'Smith Machine Calf Raise',         pattern: 'calf_gastroc', equip: ['smith'],           knee_safe: true,  ankle_load: 'high', sport: 'general',  diff: 1, fav: false },
  { id: 'donkey_calf',         name: 'Donkey Calf Raise',                pattern: 'calf_gastroc', equip: ['machine','bodyweight'], knee_safe: true, ankle_load: 'high', sport: 'general', diff: 2, fav: false },
  { id: 'leg_press_calf',      name: 'Leg Press Calf Raise',             pattern: 'calf_gastroc', equip: ['machine'],         knee_safe: true,  ankle_load: 'mid',  sport: 'general',  diff: 1, fav: false },

  // ===== CALF — SOLEUS (seated/bent-knee, high-rep) =====
  { id: 'seated_calf_raise',   name: 'Seated Calf Raise (machine)',      pattern: 'calf_soleus', equip: ['machine'],          knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 1, fav: false, note: '15-25 reps, 2s pause at stretch.' },
  { id: 'db_seated_calf',      name: 'Seated DB Calf Raise',             pattern: 'calf_soleus', equip: ['dumbbell'],         knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 1, fav: false },
  { id: 'soleus_pushup',       name: 'Soleus Pushup (Stanford)',         pattern: 'calf_soleus', equip: ['bodyweight'],       knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 1, fav: false, note: 'High-rep tempo soleus burn.' },
  { id: 'bent_knee_calf',      name: 'Bent-Knee Wall Calf Raise',        pattern: 'calf_soleus', equip: ['bodyweight'],       knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 1, fav: false },

  // ===== ADDUCTOR / GROIN (Copenhagen non-negotiable) =====
  { id: 'copenhagen_plank',    name: 'Copenhagen Plank',                 pattern: 'adductor',  equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'football', diff: 4, fav: false, note: 'Cuts groin injury in soccer by ~41% (Harøy 2019).' },
  { id: 'copenhagen_short',    name: 'Short-Lever Copenhagen',           pattern: 'adductor',  equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'football', diff: 2, fav: false },
  { id: 'adductor_machine',    name: 'Adductor Machine',                 pattern: 'adductor',  equip: ['machine'],            knee_safe: true,  ankle_load: 'low',  sport: 'football', diff: 1, fav: false },
  { id: 'cable_adduction',     name: 'Cable Adduction',                  pattern: 'adductor',  equip: ['cable'],              knee_safe: true,  ankle_load: 'low',  sport: 'football', diff: 1, fav: false },

  // ===== ABDUCTOR / GLUTE MED (single-leg stability) =====
  { id: 'banded_clam',         name: 'Banded Clamshell',                 pattern: 'abductor',  equip: ['band'],               knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 1, fav: false },
  { id: 'cable_abduction',     name: 'Standing Cable Hip Abduction',     pattern: 'abductor',  equip: ['cable'],              knee_safe: true,  ankle_load: 'low',  sport: 'football', diff: 1, fav: false },
  { id: 'side_plank_abd',      name: 'Side Plank w/ Hip Abduction',      pattern: 'abductor',  equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'football', diff: 3, fav: false },

  // ===== HORIZONTAL PUSH (Day B) =====
  { id: 'bench_press',         name: 'Bench Press',                      pattern: 'push_h',    equip: ['barbell'],            knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },
  { id: 'db_bench',            name: 'DB Bench Press',                   pattern: 'push_h',    equip: ['dumbbell'],           knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'incline_db_bench',    name: 'Incline DB Bench Press',           pattern: 'push_h',    equip: ['dumbbell'],           knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'weighted_pushup',     name: 'Weighted Push-Up',                 pattern: 'push_h',    equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'dips',                name: 'Parallel Bar Dips',                pattern: 'push_h',    equip: ['bodyweight','park'],  knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },
  { id: 'larsen_press',        name: 'Larsen Press (feet up bench)',     pattern: 'push_h',    equip: ['barbell','dumbbell'], knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },

  // ===== HORIZONTAL PULL =====
  { id: 'barbell_row',         name: 'Barbell Row (Pendlay or bent)',    pattern: 'pull_h',    equip: ['barbell'],            knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },
  { id: 'chest_supp_row',      name: 'Chest-Supported DB Row',           pattern: 'pull_h',    equip: ['dumbbell'],           knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'tbar_row',            name: 'T-Bar Row',                        pattern: 'pull_h',    equip: ['barbell','machine'],  knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },
  { id: 'cable_row',           name: 'Seated Cable Row',                 pattern: 'pull_h',    equip: ['cable'],              knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 1, fav: false },
  { id: 'inverted_row',        name: 'Inverted Row (rings/bar)',         pattern: 'pull_h',    equip: ['bodyweight','park'],  knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'single_arm_row',      name: 'Single-Arm DB Row',                pattern: 'pull_h',    equip: ['dumbbell'],           knee_safe: true,  ankle_load: 'low',  sport: 'tennis',   diff: 2, fav: false },

  // ===== VERTICAL PUSH =====
  { id: 'ohp',                 name: 'Standing Overhead Press',          pattern: 'push_v',    equip: ['barbell'],            knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 4, fav: false },
  { id: 'db_shoulder_press',   name: 'DB Shoulder Press (seated)',       pattern: 'push_v',    equip: ['dumbbell'],           knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'landmine_press',      name: 'Landmine Press',                   pattern: 'push_v',    equip: ['barbell'],            knee_safe: true,  ankle_load: 'low',  sport: 'tennis',   diff: 2, fav: false, note: 'Shoulder-friendly angle.' },
  { id: 'arnold_press',        name: 'Arnold Press',                     pattern: 'push_v',    equip: ['dumbbell'],           knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'pike_pushup',         name: 'Pike Push-Up',                     pattern: 'push_v',    equip: ['bodyweight','park'],  knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },

  // ===== VERTICAL PULL =====
  { id: 'pullup',              name: 'Pull-Up (weighted if able)',       pattern: 'pull_v',    equip: ['bodyweight','park'],  knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },
  { id: 'chin_up',             name: 'Chin-Up',                          pattern: 'pull_v',    equip: ['bodyweight','park'],  knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },
  { id: 'lat_pulldown',        name: 'Lat Pulldown',                     pattern: 'pull_v',    equip: ['machine','cable'],    knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 1, fav: false },
  { id: 'neutral_pulldown',    name: 'Neutral-Grip Pulldown',            pattern: 'pull_v',    equip: ['machine','cable'],    knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 1, fav: false },
  { id: 'single_arm_pulldown', name: 'Single-Arm Cable Pulldown',        pattern: 'pull_v',    equip: ['cable'],              knee_safe: true,  ankle_load: 'low',  sport: 'tennis',   diff: 2, fav: false },

  // ===== CALISTHENICS — pushed for "fluid, light, athletic" upper body =====
  // Calisthenics-specific moves. Tagged calisthenics:true so rotation can bias them.
  { id: 'archer_pushup',       name: 'Archer Push-Up',                   pattern: 'push_h',    equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 3, fav: false, calisthenics: true, note: 'Shift weight side to side. Builds one-arm push-up.' },
  { id: 'pseudo_planche_pu',   name: 'Pseudo Planche Push-Up',           pattern: 'push_h',    equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 4, fav: false, calisthenics: true, note: 'Hands by hips, lean forward — planche prep.' },
  { id: 'ring_dip',            name: 'Ring Dip',                         pattern: 'push_h',    equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 4, fav: false, calisthenics: true, note: 'Rings tucked at sides at top. Slow eccentric.' },
  { id: 'one_arm_pu_progress', name: 'One-Arm Push-Up Progression',      pattern: 'push_h',    equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 5, fav: false, calisthenics: true },
  { id: 'ring_pushup',         name: 'Ring Push-Up (RTO if able)',       pattern: 'push_h',    equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 3, fav: false, calisthenics: true },

  { id: 'archer_pullup',       name: 'Archer Pull-Up',                   pattern: 'pull_v',    equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 4, fav: false, calisthenics: true, note: 'Pull mostly with one side, other arm extends.' },
  { id: 'typewriter_pullup',   name: 'Typewriter Pull-Up',               pattern: 'pull_v',    equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 5, fav: false, calisthenics: true },
  { id: 'l_sit_pullup',        name: 'L-Sit Pull-Up',                    pattern: 'pull_v',    equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 4, fav: false, calisthenics: true, note: 'Legs locked at 90°. Brutal grip + core.' },
  { id: 'explosive_pullup',    name: 'Explosive Pull-Up (chest to bar)', pattern: 'pull_v',    equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 4, fav: false, calisthenics: true, note: 'Power-up the bar. Builds muscle-up.' },
  { id: 'false_grip_row',      name: 'False Grip Row (rings)',           pattern: 'pull_h',    equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 3, fav: false, calisthenics: true, note: 'Muscle-up prep. Hold false grip throughout.' },
  { id: 'archer_row',          name: 'Archer Inverted Row (rings)',      pattern: 'pull_h',    equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 3, fav: false, calisthenics: true },

  { id: 'wall_hspu',           name: 'Wall Handstand Push-Up',           pattern: 'push_v',    equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 4, fav: false, calisthenics: true, note: 'Full ROM to head if possible.' },
  { id: 'pike_hspu_progress',  name: 'Pike HSPU Progression (feet on box)', pattern: 'push_v', equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false, calisthenics: true },
  { id: 'handstand_hold',      name: 'Handstand Hold (wall or free)',    pattern: 'push_v',    equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false, calisthenics: true, note: 'Sets of 20-45s. Hollow body, glutes tight.' },

  // === Calisthenics SKILL work — for Day B skill slot (when calisthenics mode is on) ===
  { id: 'muscle_up_bar',       name: 'Bar Muscle-Up',                    pattern: 'skill_cali', equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 5, fav: false, calisthenics: true, note: 'Skill, not conditioning. 3-5 quality reps, full rest.' },
  { id: 'muscle_up_ring',      name: 'Ring Muscle-Up',                   pattern: 'skill_cali', equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 5, fav: false, calisthenics: true, note: 'False grip pull → transition → press out.' },
  { id: 'mu_negatives',        name: 'Muscle-Up Negatives (slow lower)', pattern: 'skill_cali', equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 4, fav: false, calisthenics: true, note: '3-5s eccentric from top. MU progression.' },
  { id: 'mu_transition_drill', name: 'Muscle-Up Transition Drill',       pattern: 'skill_cali', equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 4, fav: false, calisthenics: true, note: 'False grip rows + dip transition assist.' },
  { id: 'front_lever_tuck',    name: 'Front Lever — Tuck Hold',          pattern: 'skill_cali', equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 3, fav: false, calisthenics: true, note: '5 × 10-15s. Progress to advanced tuck.' },
  { id: 'front_lever_adv',     name: 'Front Lever — Advanced Tuck',      pattern: 'skill_cali', equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 4, fav: false, calisthenics: true },
  { id: 'front_lever_straddle',name: 'Front Lever — Straddle',           pattern: 'skill_cali', equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 5, fav: false, calisthenics: true },
  { id: 'back_lever_tuck',     name: 'Back Lever — Tuck Hold',           pattern: 'skill_cali', equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 3, fav: false, calisthenics: true },
  { id: 'tuck_planche',        name: 'Tuck Planche Hold',                pattern: 'skill_cali', equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false, calisthenics: true, note: 'Wrist prep first. Lean over the wrists.' },
  { id: 'adv_tuck_planche',    name: 'Advanced Tuck Planche',            pattern: 'skill_cali', equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 4, fav: false, calisthenics: true },
  { id: 'skin_the_cat',        name: 'Skin the Cat (rings)',             pattern: 'skill_cali', equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 3, fav: false, calisthenics: true, note: 'Shoulder mobility + control. 5 reps slow.' },
  { id: 'german_hang',         name: 'German Hang (rings)',              pattern: 'skill_cali', equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 2, fav: false, calisthenics: true, note: 'Passive shoulder mobility. 3 × 20-30s.' },
  { id: 'l_sit_hold',          name: 'L-Sit Hold (paralettes/ground)',   pattern: 'skill_cali', equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low',  sport: 'general',  diff: 3, fav: false, calisthenics: true, note: '5 × 15-30s. Brutal core + hip flexors.' },
  { id: 'handstand_practice',  name: 'Freestanding Handstand Practice',  pattern: 'skill_cali', equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 4, fav: false, calisthenics: true, note: '10 min of attempts. Skill, not max effort.' },

  // ===== SHOULDER STABILITY / PREHAB (separated pattern so they don't leak into main pull slots) =====
  { id: 'face_pull',           name: 'Face Pull (cable, high)',          pattern: 'prehab_shoulder', equip: ['cable'],         knee_safe: true,  ankle_load: 'low',  sport: 'tennis',   diff: 1, fav: false, note: 'Prehab — 2s squeeze.' },
  { id: 'band_pull_apart',     name: 'Band Pull-Apart',                  pattern: 'prehab_shoulder', equip: ['band'],          knee_safe: true,  ankle_load: 'low',  sport: 'tennis',   diff: 1, fav: false },
  { id: 'ytw_prone',           name: 'Prone Y-T-W Raises',               pattern: 'prehab_shoulder', equip: ['bodyweight','dumbbell'], knee_safe: true, ankle_load: 'low', sport: 'tennis', diff: 2, fav: false },
  { id: 'cuban_press',         name: 'Cuban Press (light DB)',           pattern: 'prehab_shoulder', equip: ['dumbbell'],      knee_safe: true,  ankle_load: 'low',  sport: 'tennis',   diff: 2, fav: false },

  // ===== ROTATIONAL POWER (tennis-specific) =====
  { id: 'mb_rot_throw',        name: 'Medicine Ball Rotational Throw',   pattern: 'rotation',  equip: ['medball'],            knee_safe: true,  ankle_load: 'mid',  sport: 'tennis',   diff: 2, fav: false, note: 'Both sides equal reps — symmetry is everything.' },
  { id: 'mb_scoop_throw',      name: 'MB Scoop Throw (lateral)',         pattern: 'rotation',  equip: ['medball'],            knee_safe: true,  ankle_load: 'mid',  sport: 'tennis',   diff: 2, fav: false },
  { id: 'cable_wood_chop',     name: 'Cable Wood Chop (high-to-low)',    pattern: 'rotation',  equip: ['cable'],              knee_safe: true,  ankle_load: 'low',  sport: 'tennis',   diff: 2, fav: false },
  { id: 'cable_lift',          name: 'Cable Lift (low-to-high)',         pattern: 'rotation',  equip: ['cable'],              knee_safe: true,  ankle_load: 'low',  sport: 'tennis',   diff: 2, fav: false },
  { id: 'mb_overhead_slam',    name: 'MB Overhead Slam',                 pattern: 'rotation',  equip: ['medball'],            knee_safe: true,  ankle_load: 'low',  sport: 'tennis',   diff: 2, fav: false },
  { id: 'landmine_rotation',   name: 'Landmine Rotation',                pattern: 'rotation',  equip: ['barbell'],            knee_safe: true,  ankle_load: 'mid',  sport: 'tennis',   diff: 3, fav: false },

  // ===== ANTI-ROTATION / ANTI-EXTENSION CORE =====
  { id: 'pallof_press',        name: 'Pallof Press (cable or band)',     pattern: 'antirotation', equip: ['cable','band'],    knee_safe: true,  ankle_load: 'low',  sport: 'both',     diff: 1, fav: false },
  { id: 'suitcase_carry',      name: 'Suitcase Carry (one DB)',          pattern: 'antirotation', equip: ['dumbbell','kettlebell'], knee_safe: true, ankle_load: 'low', sport: 'both',  diff: 2, fav: false },
  { id: 'farmer_carry',        name: 'Farmer Carry',                     pattern: 'carry',     equip: ['dumbbell','kettlebell'], knee_safe: true, ankle_load: 'mid', sport: 'general', diff: 2, fav: false },
  { id: 'ab_wheel',            name: 'Ab Wheel Rollout',                 pattern: 'antiextension', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 4, fav: false },
  { id: 'dead_bug',            name: 'Dead Bug (loaded)',                pattern: 'antiextension', equip: ['bodyweight','dumbbell'], knee_safe: true, ankle_load: 'low', sport: 'general', diff: 1, fav: false },
  { id: 'hollow_hold',         name: 'Hollow Body Hold',                 pattern: 'antiextension', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'rkc_plank',           name: 'RKC Plank (60s max)',              pattern: 'antiextension', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'l_sit',               name: 'L-Sit (parallettes or floor)',     pattern: 'antiextension', equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low', sport: 'general',  diff: 4, fav: false },

  // ===== PLYO / POWER (Day A finisher) =====
  { id: 'broad_jump',          name: 'Broad Jump',                       pattern: 'plyo',      equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'high', sport: 'football', diff: 3, fav: false, note: '3-5 quality reps, full rest.' },
  { id: 'box_jump',            name: 'Box Jump (step down)',             pattern: 'plyo',      equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'mid',  sport: 'football', diff: 2, fav: false, note: 'STEP down, never jump down (knee).' },
  { id: 'depth_drop',          name: 'Depth Drop to Stick',              pattern: 'plyo',      equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'high', sport: 'football', diff: 3, fav: false },
  { id: 'sl_pogo',             name: 'Single-Leg Pogo',                  pattern: 'plyo',      equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'high', sport: 'tennis',   diff: 3, fav: false, note: 'Ankle stiffness + reactive.' },
  { id: 'lateral_bound',       name: 'Lateral Bound (stick the landing)',pattern: 'plyo',      equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'high', sport: 'tennis',   diff: 3, fav: false },
  { id: 'split_jump',          name: 'Split Squat Jump',                 pattern: 'plyo',      equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'high', sport: 'football', diff: 3, fav: false },
  { id: 'tuck_jump',           name: 'Tuck Jump',                        pattern: 'plyo',      equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'high', sport: 'football', diff: 3, fav: false },
  { id: 'mb_chest_pass',       name: 'MB Chest Pass (explosive)',        pattern: 'plyo',      equip: ['medball'],            knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },

  // ===== SPRINTS / CONDITIONING (Day D) =====
  { id: 'sprint_30m',          name: 'Flat Sprints — 30m × 6-8',         pattern: 'sprint',    equip: ['park'],               knee_safe: true,  ankle_load: 'high', sport: 'football', diff: 3, fav: false, note: '20-30s rest between reps.' },
  { id: 'hill_sprint',         name: 'Hill Sprints — 20m × 8-10',        pattern: 'sprint',    equip: ['park'],               knee_safe: true,  ankle_load: 'high', sport: 'football', diff: 4, fav: false, note: 'Walk down recovery.' },
  { id: 'sprint_repeats_40',   name: '40m Repeats — 6 × 40m',            pattern: 'sprint',    equip: ['park'],               knee_safe: true,  ankle_load: 'high', sport: 'football', diff: 4, fav: false },
  { id: 'shuttle_5_10_5',      name: '5-10-5 Pro Shuttle',               pattern: 'agility',   equip: ['park'],               knee_safe: true,  ankle_load: 'high', sport: 'both',     diff: 3, fav: false },
  { id: 'cone_t_drill',        name: 'T-Drill (cones)',                  pattern: 'agility',   equip: ['park'],               knee_safe: true,  ankle_load: 'high', sport: 'football', diff: 3, fav: false },
  { id: 'ladder_drills',       name: 'Agility Ladder (varied)',          pattern: 'agility',   equip: ['park'],               knee_safe: true,  ankle_load: 'mid',  sport: 'both',     diff: 2, fav: false },
  { id: 'cod_box',             name: 'Box-Drill COD (cuts at cones)',    pattern: 'agility',   equip: ['park'],               knee_safe: true,  ankle_load: 'high', sport: 'both',     diff: 3, fav: false },
  { id: 'tempo_run_100',       name: 'Tempo Runs — 8 × 100m @ 70%',      pattern: 'sprint',    equip: ['park'],               knee_safe: true,  ankle_load: 'mid',  sport: 'football', diff: 2, fav: false },
  { id: 'zone2_30',            name: 'Zone 2 Aerobic — 30-40 min',       pattern: 'sprint',    equip: ['park','bodyweight'],  knee_safe: true,  ankle_load: 'mid',  sport: 'general',  diff: 1, fav: false, note: 'Nasal breathing pace. Run/bike/row.' },
  { id: 'intervals_4x4',       name: 'Norwegian 4×4 Intervals',          pattern: 'sprint',    equip: ['park'],               knee_safe: true,  ankle_load: 'mid',  sport: 'football', diff: 4, fav: false, note: '4min @ 90% HR / 3min easy x4.' },
  { id: 'yoyo_ir1',            name: 'Yo-Yo IR1 (or sim)',               pattern: 'sprint',    equip: ['park'],               knee_safe: true,  ankle_load: 'high', sport: 'football', diff: 4, fav: false },

  // ===== SLED — leg day warm-up / post-activation potentiation (PAP) =====
  { id: 'sled_push_heavy',     name: 'Heavy Sled Push (low handles)',    pattern: 'warmup_sled',  equip: ['sled'],           knee_safe: true,  ankle_load: 'mid', sport: 'football', diff: 3, fav: false, note: 'PAP for sprints + squats. 4-6 × 15m. Heavy load, full drive.' },
  { id: 'sled_drag_backward',  name: 'Backward Sled Drag (VMO + quad)',  pattern: 'warmup_sled',  equip: ['sled'],           knee_safe: true,  ankle_load: 'mid', sport: 'football', diff: 2, fav: false, note: '3-5 × 20m. Sit low, walk backward. Spanish-squat-on-the-move.' },
  { id: 'sled_drag_forward',   name: 'Forward Sled Drag (hamstring)',    pattern: 'warmup_sled',  equip: ['sled'],           knee_safe: true,  ankle_load: 'mid', sport: 'football', diff: 2, fav: false, note: '3-5 × 20m. Walk forward, drag steady. Hamstring blood + ankle prep.' },
  { id: 'sled_march',          name: 'Sled March (knee drive)',          pattern: 'warmup_sled',  equip: ['sled'],           knee_safe: true,  ankle_load: 'mid', sport: 'football', diff: 2, fav: false, note: 'Moderate load. High knees, big steps. 3 × 20m.' },
  { id: 'sled_sprint',         name: 'Sled Sprint (light, max effort)',  pattern: 'warmup_sled',  equip: ['sled'],           knee_safe: true,  ankle_load: 'high', sport: 'football', diff: 3, fav: false, note: '5-6 × 10-15m. LIGHT load, max acceleration.' },
  { id: 'sled_rope_pull',      name: 'Sled Rope Pull (seated)',          pattern: 'warmup_sled',  equip: ['sled'],           knee_safe: true,  ankle_load: 'low', sport: 'general',  diff: 2, fav: false, note: 'Upper back + grip while legs anchor. 3 sets per side.' },

  // ===== HIP MOBILITY (Day A & C cool-down — keeps you fluid and football/tennis ready) =====
  { id: 'pigeon_pose',         name: '90/90 Pigeon Hold',                pattern: 'mobility_hip', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'both',     diff: 2, fav: false, note: '60-90s each side. Sink the front shin, square the chest.' },
  { id: 'ninety_ninety',       name: '90/90 Switch (active)',            pattern: 'mobility_hip', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'both',     diff: 2, fav: false, note: '8-12 controlled switches each side.' },
  { id: 'hip_cars',            name: 'Hip CARs (controlled articular)',  pattern: 'mobility_hip', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'both',     diff: 2, fav: false, note: '5 reps each side. Slow, max ROM.' },
  { id: 'cossack_stretch',     name: 'Cossack Squat Stretch',            pattern: 'mobility_hip', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'mid', sport: 'tennis',   diff: 2, fav: false },
  { id: 'lizard_pose',         name: 'Lizard Pose (low lunge)',          pattern: 'mobility_hip', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'both',     diff: 1, fav: false, note: '60s each side. Optional twist.' },
  { id: 'frog_stretch',        name: 'Frog Stretch',                     pattern: 'mobility_hip', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'both',     diff: 2, fav: false, note: 'Adductor/groin opener. Breathe in 90s+.' },
  { id: 'butterfly',           name: 'Butterfly Sit (active)',           pattern: 'mobility_hip', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'both',     diff: 1, fav: false },
  { id: 'jefferson_curl',      name: 'Jefferson Curl (light)',           pattern: 'mobility_hip', equip: ['dumbbell','kettlebell','bodyweight'], knee_safe: true, ankle_load: 'low', sport: 'general', diff: 3, fav: false, note: 'Posterior chain mobility under light load. Start with 5kg.' },
  { id: 'deep_squat_hold',     name: 'Deep Squat Hold (Asian squat)',    pattern: 'mobility_hip', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'mid', sport: 'both',     diff: 2, fav: false, note: '90s. Use a plate under heels if calves are tight.' },
  { id: 'worlds_greatest',     name: 'World\'s Greatest Stretch',        pattern: 'mobility_hip', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'both',     diff: 2, fav: false, note: 'Lunge + thoracic rotation. 5/side.' },
  { id: 'standing_hip_flexor', name: 'Couch Stretch (hip flexor)',       pattern: 'mobility_hip', equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'both',     diff: 1, fav: false, note: '60-90s each side. Squeeze glute on stretched side.' },

  // ===== NECK / UPPER BACK COUNTERBALANCE (Day B — offsets chest hypertrophy, prevents tension headaches) =====
  { id: 'chin_tucks',          name: 'Chin Tucks (supine or seated)',    pattern: 'mobility_neck',equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'general',  diff: 1, fav: false, note: 'Pull chin straight back (double-chin). 10 × 5s holds. Forward-head antidote.' },
  { id: 'neck_cars',           name: 'Neck CARs (gentle, eyes-led)',     pattern: 'mobility_neck',equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'general',  diff: 1, fav: false, note: '3 slow circles each direction. STOP if dizzy/painful.' },
  { id: 'dead_hang',           name: 'Dead Hang (bar)',                  pattern: 'mobility_neck',equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low', sport: 'general', diff: 2, fav: false, note: '3 × 30-45s. Decompresses spine + opens shoulders.' },
  { id: 'scap_pullup',         name: 'Scapular Pull-Up',                 pattern: 'mobility_neck',equip: ['bodyweight','park'], knee_safe: true, ankle_load: 'low', sport: 'general', diff: 2, fav: false, note: 'Hang, then JUST shrug down — no arm bend. 8-12 reps.' },
  { id: 'wall_slides',         name: 'Wall Slides (forearms)',           pattern: 'mobility_neck',equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'general',  diff: 1, fav: false, note: 'Wrists, forearms, elbows on wall. Slide up. 10 reps.' },
  { id: 'foam_roll_thoracic',  name: 'Thoracic Extension on Foam Roller',pattern: 'mobility_neck',equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'general',  diff: 1, fav: false, note: 'Roller across mid-back, hands behind head, extend back. 8 reps.' },
  { id: 'brettzel',            name: 'Brettzel (T-spine + hip combo)',   pattern: 'mobility_neck',equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'general',  diff: 3, fav: false, note: 'Side-lying. Knee crossed, top arm rotates back. 60s each side.' },
  { id: 'snow_angels_floor',   name: 'Supine Floor Snow Angels',         pattern: 'mobility_neck',equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'general',  diff: 1, fav: false, note: 'Backs of hands stay on floor. 10 slow reps.' },
  { id: 'thread_the_needle',   name: 'Thread the Needle',                pattern: 'mobility_neck',equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'general',  diff: 1, fav: false, note: '8 reps each side. T-spine rotation from quadruped.' },
  { id: 'doorway_chest_stretch', name: 'Doorway Pec Stretch',            pattern: 'mobility_neck',equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'general',  diff: 1, fav: false, note: '45s each arm. Counters bench/push-up tightness.' },
  { id: 'levator_stretch',     name: 'Levator Scapulae Stretch',         pattern: 'mobility_neck',equip: ['bodyweight'],     knee_safe: true,  ankle_load: 'low', sport: 'general',  diff: 1, fav: false, note: 'Look at armpit + same-side hand pulls head. Tension-headache go-to.' },

  // ===== SPORT SESSIONS — logged as time + RPE, for alt sessions =====
  { id: 'tennis_match',        name: 'Tennis Match (singles)',           pattern: 'sport_session', equip: ['park'],          knee_safe: true,  ankle_load: 'high', sport: 'tennis',   diff: 4, fav: false, note: 'Log total minutes + RPE.' },
  { id: 'tennis_hit',          name: 'Tennis Hit / Practice',            pattern: 'sport_session', equip: ['park'],          knee_safe: true,  ankle_load: 'high', sport: 'tennis',   diff: 3, fav: false },
  { id: 'football_match',      name: 'Football Match',                   pattern: 'sport_session', equip: ['park'],          knee_safe: true,  ankle_load: 'high', sport: 'football', diff: 4, fav: false },
  { id: 'football_training',   name: 'Football Training / 5-a-side',     pattern: 'sport_session', equip: ['park'],          knee_safe: true,  ankle_load: 'high', sport: 'football', diff: 3, fav: false },
  { id: 'pilates_class',       name: 'Pilates Class',                    pattern: 'sport_session', equip: ['bodyweight'],    knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },
  { id: 'mobility_flow',       name: 'Mobility / Yoga Flow',             pattern: 'sport_session', equip: ['bodyweight'],    knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 1, fav: false },
  { id: 'climbing_session',    name: 'Climbing / Bouldering',            pattern: 'sport_session', equip: ['park'],          knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 3, fav: false },
  { id: 'swim_session',        name: 'Swim Session',                     pattern: 'sport_session', equip: ['park'],          knee_safe: true,  ankle_load: 'low',  sport: 'general',  diff: 2, fav: false },

  // ===== ANKLE / FOOT PREHAB (right ankle priority) =====
  { id: 'sl_balance_eyes',     name: 'Single-Leg Balance — eyes closed', pattern: 'mobility',  equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'high', sport: 'both',     diff: 2, fav: false, note: '45s x 3 each side.' },
  { id: 'bosu_squat',          name: 'BOSU Single-Leg Squat (shallow)',  pattern: 'mobility',  equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'high', sport: 'both',     diff: 3, fav: false },
  { id: 'ankle_abc',           name: 'Ankle ABCs (sit, write alphabet)', pattern: 'mobility',  equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'both',     diff: 1, fav: false },
  { id: 'tibialis_raise',      name: 'Tibialis Raise (wall)',            pattern: 'mobility',  equip: ['bodyweight','band'],  knee_safe: true,  ankle_load: 'mid',  sport: 'both',     diff: 1, fav: false, note: 'Shin splint + ankle bulletproofing.' },
  { id: 'banded_ankle_ev',     name: 'Banded Ankle Eversion',            pattern: 'mobility',  equip: ['band'],               knee_safe: true,  ankle_load: 'low',  sport: 'both',     diff: 1, fav: false },
  { id: 'short_foot',          name: 'Short Foot / Arch Doming',         pattern: 'mobility',  equip: ['bodyweight'],         knee_safe: true,  ankle_load: 'low',  sport: 'both',     diff: 1, fav: false },
];

// Auto-tag SECONDS-based exercises (holds, balances, mobility) — anything not rep-counted
const SECONDS_IDS = new Set([
  // Holds & balances
  'rkc_plank','hollow_hold','l_sit','l_sit_hold','l_sit_pullup','copenhagen_plank','copenhagen_short','side_plank_abd',
  'handstand_hold','handstand_practice','dead_hang','german_hang','tuck_planche','adv_tuck_planche',
  'front_lever_tuck','front_lever_adv','front_lever_straddle','back_lever_tuck',
  'sl_balance_eyes','bosu_squat',
  // Hip mobility
  'pigeon_pose','cossack_stretch','lizard_pose','frog_stretch','butterfly','deep_squat_hold','standing_hip_flexor','worlds_greatest','jefferson_curl',
  // Neck/upper back mobility
  'brettzel','doorway_chest_stretch','levator_stretch','foam_roll_thoracic',
  // Sled (distance/time based)
  'sled_push_heavy','sled_drag_backward','sled_drag_forward','sled_march','sled_sprint','sled_rope_pull',
  // Conditioning
  'zone2_30','intervals_4x4','tempo_run_100','yoyo_ir1','sprint_30m','hill_sprint','sprint_repeats_40',
  'shuttle_5_10_5','cone_t_drill','ladder_drills','cod_box',
  // Ankle prehab
  'ankle_abc','short_foot',
]);
for (const ex of EXERCISES) {
  ex.unit = SECONDS_IDS.has(ex.id) ? 'seconds' : 'reps';
}

// =============================================================
//  LOG MODE — how this exercise is logged + what inputs to show
//
//  'strength'   weight + reps + RIR        — loaded compound/accessory work
//  'bw_reps'    reps + RIR                 — bodyweight pull-ups, push-ups, dips
//  'hold'       seconds + effort (0-5)     — planks, handstands, levers, mobility holds
//  'distance'   meters per trip + sets     — sled, sprints (each set = one rep/trip)
//  'time'       minutes + RPE (1-10)       — Zone 2, intervals, tempo runs
//  'quality'    reps only (no RIR)         — plyometrics, max-intent skill reps
//  'completion' done toggle only           — practice sessions, warm-ups, agility flows
// =============================================================
const BW_REPS_IDS = new Set([
  'pullup','chin_up','dips','weighted_pushup','archer_pushup','archer_pullup',
  'typewriter_pullup','l_sit_pullup','explosive_pullup','one_arm_pu_progress',
  'pseudo_planche_pu','ring_dip','ring_pushup','false_grip_row','archer_row',
  'wall_hspu','pike_hspu_progress','pike_pushup','inverted_row','scap_pullup',
  'muscle_up_bar','muscle_up_ring','mu_negatives','mu_transition_drill','pistol_squat',
  'nordic_curl','razor_curl','copenhagen_short','copenhagen_plank',
]);
const QUALITY_IDS = new Set([
  // Plyometrics — always max intent, no RIR concept
  'broad_jump','box_jump','depth_drop','sl_pogo','lateral_bound','split_jump',
  'tuck_jump','mb_chest_pass','mb_rot_throw','mb_scoop_throw','mb_overhead_slam',
]);
const DISTANCE_IDS = new Set([
  // Sled + sprint (each "rep" = one trip)
  'sled_push_heavy','sled_drag_backward','sled_drag_forward','sled_march',
  'sled_sprint','sled_rope_pull',
  'sprint_30m','hill_sprint','sprint_repeats_40',
]);
const TIME_IDS = new Set([
  // Cardio + agility — log duration in minutes
  'zone2_30','intervals_4x4','tempo_run_100','yoyo_ir1',
  'shuttle_5_10_5','cone_t_drill','ladder_drills','cod_box',
  // Sport sessions — duration of the activity
  'tennis_match','tennis_hit','football_match','football_training',
  'pilates_class','mobility_flow','climbing_session','swim_session',
]);
const COMPLETION_IDS = new Set([
  // Just toggle done — practice sessions, mobility flows
  'handstand_practice','ankle_abc','short_foot','hip_cars','neck_cars',
  'banded_ankle_ev','tibialis_raise','banded_clam',
]);

for (const ex of EXERCISES) {
  if (QUALITY_IDS.has(ex.id))         ex.logMode = 'quality';
  else if (DISTANCE_IDS.has(ex.id))   ex.logMode = 'distance';
  else if (TIME_IDS.has(ex.id))       ex.logMode = 'time';
  else if (COMPLETION_IDS.has(ex.id)) ex.logMode = 'completion';
  else if (BW_REPS_IDS.has(ex.id))    ex.logMode = 'bw_reps';
  else if (ex.unit === 'seconds')     ex.logMode = 'hold';
  else                                ex.logMode = 'strength';
}

// Auto-tag unilateral exercises by pattern + known IDs (so we don't have to mark every line)
const UNILATERAL_IDS = new Set([
  'bulgarian_ss','rear_foot_db_ss','reverse_lunge','walking_lunge','step_up','spanish_squat',
  'sl_leg_press','pistol_squat','cossack_squat','sl_rdl','sl_hip_thrust','b_stance_hip_thrust',
  'glute_bridge_march','sl_calf_raise_db','sl_pogo','lateral_bound','split_jump',
  'single_arm_row','single_arm_pulldown','copenhagen_plank','copenhagen_short','side_plank_abd',
  'suitcase_carry','pallof_press','sl_balance_eyes','bosu_squat','archer_pullup','archer_pushup',
  'archer_row','typewriter_pullup','one_arm_pu_progress'
]);
for (const ex of EXERCISES) {
  if (ex.pattern && (ex.pattern.endsWith('_uni') || ex.pattern === 'lunge')) ex.unilateral = true;
  if (UNILATERAL_IDS.has(ex.id)) ex.unilateral = true;
}

// Quick lookups
const EX_BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

// Filter helpers used by the rotation engine
function exercisesMatching({ pattern, equipAvailable, sport, kneeSafeOnly, ankleSafeOnly }) {
  return EXERCISES.filter(ex => {
    if (Array.isArray(pattern) ? !pattern.includes(ex.pattern) : ex.pattern !== pattern) return false;
    if (equipAvailable && equipAvailable.length && !ex.equip.some(e => equipAvailable.includes(e))) return false;
    if (kneeSafeOnly && !ex.knee_safe) return false;
    if (ankleSafeOnly && ex.ankle_load === 'high') return false;
    if (sport && sport !== 'any' && ex.sport !== sport && ex.sport !== 'both' && ex.sport !== 'general') return false;
    return true;
  });
}

if (typeof window !== 'undefined') {
  window.EXERCISES = EXERCISES;
  window.EX_BY_ID = EX_BY_ID;
  window.exercisesMatching = exercisesMatching;
}
