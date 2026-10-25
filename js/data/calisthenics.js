/* Calisthenics.
   mode 'bw'   = reps with your own bodyweight, optional extra weight (empty = bodyweight only)
   mode 'time' = holds in seconds (dead hang, handstand, levers …), optional extra weight
   bwf = share of bodyweight the movement actually moves (push-up ≈ 64 %, pull-up = 100 %)
   XP  = (bodyweight × bwf + extra) × reps (or seconds) × mult */

// Existing bodyweight exercises become real calisthenics exercises.
// Old entries keep working: their stored weight was the extra weight all along.
const CALI_CONVERT={
  chest_bw_dip:['bw',.95,.9,'Dips (Chest)','Dips (Brust)'],
  chest_bw_pushup:['bw',.64,.8,'Push-Ups','Liegestütze'],
  chest_bw_pushup_decline:['bw',.72,.85,'Decline Push-Ups','Decline-Liegestütze'],
  chest_bw_pushup_diamond:['bw',.66,.95,'Diamond Push-Ups','Diamant-Liegestütze'],
  back_bw_pullup:['bw',1,1,'Pull-Ups','Klimmzüge'],
  back_bw_chinup:['bw',1,.95,'Chin-Ups','Chin-Ups (Untergriff)'],
  back_bw_invrow:['bw',.6,1,'Inverted Row','Australian Pull-Ups'],
  shd_bw_pike:['bw',.55,1.3,'Pike Push-Ups','Pike-Liegestütze'],
  shd_bw_hspu:['bw',.92,1.8,'Handstand Push-Ups (Wall)','Handstand-Liegestütze (Wand)'],
  bi_bw_chinup:['bw',1,.95,'Chin-Ups (Biceps focus)','Chin-Ups (Bizeps-Fokus)'],
  tri_bw_dip:['bw',.95,.9,'Dips (Triceps)','Dips (Trizeps)'],
  tri_bw_diamond:['bw',.66,.95,'Diamond Push-Ups (Triceps)','Diamant-Liegestütze (Trizeps)'],
  tri_bw_bench_dip:['bw',.5,.9,'Bench Dips','Bank-Dips'],
  quad_bw_squat:['bw',.7,.6,'Air Squats','Kniebeugen (Körpergewicht)'],
  quad_bw_lunge:['bw',.65,.8,'Lunges','Ausfallschritte'],
  quad_bw_pistol:['bw',.9,1.6,'Pistol Squats','Pistol Squats'],
  ham_bw_nordic:['bw',.65,2,'Nordic Hamstring Curls','Nordic Curls'],
  ham_bw_bridge:['bw',.65,1.6,'Glute-Ham Raise','Glute-Ham Raise'],
  glu_bw_bridge:['bw',.5,.7,'Glute Bridge','Glute Bridge'],
  glu_bw_clamshell:['bw',.2,1.5,'Clamshells','Clamshells'],
  glu_bw_donkey:['bw',.2,1.5,'Donkey Kicks','Donkey Kicks'],
  cal_bw_stand:['bw',1,.35,'Calf Raises','Wadenheben'],
  cal_bw_one:['bw',1,.5,'Single-Leg Calf Raises','Einbeiniges Wadenheben'],
  core_bw_crunch:['bw',.25,1.2,'Crunches','Crunches'],
  core_bw_situp:['bw',.3,1.2,'Sit-Ups','Sit-Ups'],
  core_bw_legraise:['bw',.35,2,'Hanging Leg Raises','Beinheben (hängend)'],
  core_bw_legraise_lying:['bw',.25,1.6,'Lying Leg Raises','Beinheben (liegend)'],
  core_bw_knee:['bw',.3,1.8,'Hanging Knee Raises','Knieheben (hängend)'],
  core_bw_plank:['time',.6,.09,'Plank','Plank'],
  core_bw_dragon:['bw',.5,2.5,'Dragon Flags','Dragon Flags'],
  core_bw_vup:['bw',.3,1.5,'V-Ups','V-Ups'],
  core_bw_toes:['bw',.4,2,'Toes-to-Bar','Toes-to-Bar'],
  core_bw_ab_wheel:['bw',.5,1.6,'Ab Wheel Rollouts','Ab-Wheel Rollouts'],
  core_decline_situp:['bw',.3,1.3,'Decline Sit-Ups','Schräge Sit-Ups'],
  fore_bw_dead_hang:['time',1,.1,'Dead Hang','Dead Hang (Hängen)'],
  fore_bw_fingertip:['bw',.64,1.2,'Fingertip Push-Ups','Fingerspitzen-Liegestütze'],
  fb_bw_burpee:['bw',.7,1,'Burpees','Burpees'],
  fb_bw_thruster_jump:['bw',.7,.8,'Jump Squats','Sprungkniebeugen'],
  fb_bw_bear_crawl:['bw',.5,.5,'Bear Crawl (steps)','Bear Crawl (Schritte)'],
  fb_bw_mountain:['bw',.3,.5,'Mountain Climbers','Mountain Climbers']
};

// [id, nameEn, nameDe, muscle, mode, bwf, mult, skill?]
const CALI_NEW=[
  // push
  ['cx_pushup_knee','Knee Push-Ups','Knie-Liegestütze','chest','bw',.5,.7],
  ['cx_pushup_incline','Incline Push-Ups','Erhöhte Liegestütze','chest','bw',.5,.7],
  ['cx_pushup_wide','Wide Push-Ups','Breite Liegestütze','chest','bw',.64,.8],
  ['cx_pushup_spiderman','Spiderman Push-Ups','Spiderman-Liegestütze','chest','bw',.64,.9],
  ['cx_pushup_ring','Ring Push-Ups','Ring-Liegestütze','chest','bw',.7,1.1],
  ['cx_pushup_clap','Clap Push-Ups','Klatsch-Liegestütze','chest','bw',.64,1.3],
  ['cx_pushup_archer','Archer Push-Ups','Archer-Liegestütze','chest','bw',.78,1.4,1],
  ['cx_pushup_typewriter','Typewriter Push-Ups','Typewriter-Liegestütze','chest','bw',.75,1.5,1],
  ['cx_pushup_pseudo','Pseudo Planche Push-Ups','Pseudo-Planche-Liegestütze','chest','bw',.75,1.6,1],
  ['cx_pushup_oa','One-Arm Push-Ups','Einarmige Liegestütze','chest','bw',.85,2.5,1],
  ['cx_pushup_hindu','Hindu Push-Ups','Hindu-Liegestütze','shoulders','bw',.6,.9],
  ['cx_dip_ring','Ring Dips','Ring-Dips','chest','bw',.95,1.2,1],
  ['cx_dip_korean','Korean Dips','Korean Dips','shoulders','bw',.95,1.3,1],
  ['cx_pike_elevated','Elevated Pike Push-Ups','Erhöhte Pike-Liegestütze','shoulders','bw',.7,1.4],
  ['cx_wall_walk','Wall Walks','Wall Walks','shoulders','bw',1,1.2],
  ['cx_hspu_free','Freestanding Handstand Push-Ups','Freie Handstand-Liegestütze','shoulders','bw',.95,3,1],
  ['cx_tiger_bend','Tiger Bend Push-Ups','Tiger-Bend-Liegestütze','triceps','bw',.85,2,1],
  ['cx_bw_ext','Bodyweight Triceps Extensions','Körpergewicht-Trizepsstrecken','triceps','bw',.6,1.2],
  // pull
  ['cx_pullup_scap','Scapula Pull-Ups','Schulterblatt-Klimmzüge','back','bw',.5,.8],
  ['cx_pullup_neg','Negative Pull-Ups','Negative Klimmzüge','back','bw',1,.6],
  ['cx_row_ring','Ring Rows','Ring-Rudern','back','bw',.6,1],
  ['cx_pullup_wide','Wide-Grip Pull-Ups','Breite Klimmzüge','back','bw',1,1.05],
  ['cx_pullup_commando','Commando Pull-Ups','Commando-Klimmzüge','back','bw',1,1.1],
  ['cx_pullup_explosive','Chest-to-Bar Pull-Ups','Chest-to-Bar-Klimmzüge','back','bw',1,1.3],
  ['cx_pullup_lsit','L-Sit Pull-Ups','L-Sit-Klimmzüge','back','bw',1,1.4,1],
  ['cx_pullup_archer','Archer Pull-Ups','Archer-Klimmzüge','back','bw',1,1.5,1],
  ['cx_pullup_typewriter','Typewriter Pull-Ups','Typewriter-Klimmzüge','back','bw',1,1.6,1],
  ['cx_pullup_oa','One-Arm Pull-Ups','Einarmige Klimmzüge','back','bw',1,4,1],
  ['cx_skin_cat','Skin the Cat','Skin the Cat','back','bw',1,1.2],
  ['cx_fl_raise','Front Lever Raises','Front-Lever-Raises','back','bw',1,1.8,1],
  ['cx_fl_row','Tuck Front Lever Rows','Tuck-Front-Lever-Rudern','back','bw',1,2.2,1],
  ['cx_muscleup','Muscle-Ups (Bar)','Muscle-Ups (Stange)','fullBody','bw',1,2.4,1],
  ['cx_muscleup_ring','Ring Muscle-Ups','Ring-Muscle-Ups','fullBody','bw',1,2.8,1],
  // legs
  ['cx_step_up','Step-Ups (BW)','Step-Ups (Körpergewicht)','quads','bw',.7,.8],
  ['cx_box_jump','Box Jumps','Box Jumps','quads','bw',.7,.9],
  ['cx_jump_lunge','Jumping Lunges','Sprung-Ausfallschritte','quads','bw',.65,.9],
  ['cx_cossack','Cossack Squats','Cossack Squats','quads','bw',.7,1],
  ['cx_split_squat','Bulgarian Split Squats (BW)','Bulgarian Split Squats (Körpergewicht)','quads','bw',.7,1],
  ['cx_sissy','Sissy Squats','Sissy Squats','quads','bw',.7,1.3],
  ['cx_shrimp','Shrimp Squats','Shrimp Squats','quads','bw',.9,1.6,1],
  ['cx_sl_rdl','Single-Leg RDL (BW)','Einbeiniges RDL (Körpergewicht)','hamstrings','bw',.5,.9],
  ['cx_hip_thrust_sl','Single-Leg Hip Thrusts','Einbeinige Hip Thrusts','glutes','bw',.5,.9],
  // core
  ['cx_russian_twist','Russian Twists','Russian Twists','core','bw',.3,.6],
  ['cx_hollow_rock','Hollow Body Rocks','Hollow Body Rocks','core','bw',.3,1],
  ['cx_windshield','Windshield Wipers','Scheibenwischer','core','bw',.4,2.2,1],
  // holds
  ['cx_hollow','Hollow Body Hold','Hollow Body Hold','core','time',.4,.2],
  ['cx_side_plank','Side Plank','Seitstütz','core','time',.5,.12],
  ['cx_superman','Superman Hold','Superman Hold','back','time',.4,.08],
  ['cx_wall_sit','Wall Sit','Wandsitzen','quads','time',.7,.08],
  ['cx_bridge','Bridge Hold','Brücke (halten)','back','time',.5,.15],
  ['cx_active_hang','Active Hang','Aktives Hängen','back','time',1,.1],
  ['cx_flexed_hang','Flexed-Arm Hang','Hängen mit gebeugten Armen','biceps','time',1,.2],
  ['cx_hang_oa','One-Arm Dead Hang','Einarmiges Hängen','forearms','time',1,.3,1],
  ['cx_support','Support Hold (Bars/Rings)','Stütz halten (Barren/Ringe)','triceps','time',1,.12],
  ['cx_crow','Crow Pose','Krähe (Crow Pose)','core','time',1,.15,1],
  ['cx_hs_wall','Wall Handstand','Handstand an der Wand','shoulders','time',1,.12,1],
  ['cx_hs_free','Freestanding Handstand','Freier Handstand','shoulders','time',1,.3,1],
  ['cx_hs_oa','One-Arm Handstand','Einarmiger Handstand','shoulders','time',1,1.5,1],
  ['cx_lsit','L-Sit','L-Sit','core','time',1,.35,1],
  ['cx_vsit','V-Sit','V-Sit','core','time',1,.6,1],
  ['cx_manna','Manna','Manna','core','time',1,1.5,1],
  ['cx_elbow_lever','Elbow Lever','Elbow Lever','core','time',1,.3,1],
  ['cx_planche_lean','Planche Lean','Planche Lean','shoulders','time',1,.15,1],
  ['cx_planche_tuck','Tuck Planche','Tuck Planche','shoulders','time',1,.5,1],
  ['cx_planche_adv','Advanced Tuck Planche','Advanced Tuck Planche','shoulders','time',1,.7,1],
  ['cx_planche_straddle','Straddle Planche','Straddle Planche','shoulders','time',1,1,1],
  ['cx_planche_full','Full Planche','Full Planche','shoulders','time',1,1.6,1],
  ['cx_fl_tuck','Tuck Front Lever','Tuck Front Lever','back','time',1,.35,1],
  ['cx_fl_adv','Advanced Tuck Front Lever','Advanced Tuck Front Lever','back','time',1,.5,1],
  ['cx_fl_straddle','Straddle Front Lever','Straddle Front Lever','back','time',1,.8,1],
  ['cx_fl_full','Full Front Lever','Full Front Lever','back','time',1,1.2,1],
  ['cx_bl_tuck','Tuck Back Lever','Tuck Back Lever','back','time',1,.25,1],
  ['cx_bl_full','Full Back Lever','Full Back Lever','back','time',1,.6,1],
  ['cx_flag','Human Flag','Human Flag','fullBody','time',1,1.5,1]
];

(()=>{
  EXERCISES.forEach(ex=>{const c=CALI_CONVERT[ex.id];if(!c)return;ex.mode=c[0];ex.bwf=c[1];ex.mult=c[2];ex.nameEn=c[3];ex.nameDe=c[4]});
  CALI_NEW.forEach(([id,nameEn,nameDe,muscle,mode,bwf,mult,skill])=>EXERCISES.push({id,nameEn,nameDe,muscle,equipment:'bodyweight',mode,bwf,mult,skill:!!skill}));
  Object.assign(secondaryMuscles,{cx_muscleup:['back','triceps'],cx_muscleup_ring:['back','triceps'],cx_dip_ring:['triceps'],cx_pushup_pseudo:['shoulders'],cx_pullup_archer:['biceps'],cx_pullup_oa:['biceps'],cx_hspu_free:['triceps']});
})();
