/* Calisthenics skill trees. A node unlocks automatically as soon as a logged set reaches it:
   reps (or seconds for holds) ≥ target and extra weight ≥ add. */
const SKILL_TREES=[
  {id:'pull',icon:'pullup',c:'#3b9eff',nodes:[
    ['back_bw_pullup',{r:1},100],['back_bw_pullup',{r:5},200],['back_bw_pullup',{r:10},350],['back_bw_pullup',{r:15},500],['back_bw_pullup',{r:20},800],
    ['back_bw_pullup',{r:5,add:10},400],['back_bw_pullup',{r:3,add:25},700],['cx_pullup_archer',{r:5},600],['cx_pullup_oa',{r:1},1500]]},
  {id:'push',icon:'pushup',c:'#ff6b4a',nodes:[
    ['chest_bw_pushup',{r:10},100],['chest_bw_pushup',{r:25},200],['chest_bw_pushup',{r:50},500],['chest_bw_pushup_diamond',{r:20},300],
    ['cx_pushup_archer',{r:10},500],['cx_pushup_pseudo',{r:10},500],['cx_pushup_oa',{r:1},500],['cx_pushup_oa',{r:10},1000]]},
  {id:'dip',icon:'dip',c:'#a27bff',nodes:[
    ['chest_bw_dip',{r:10},150],['chest_bw_dip',{r:20},350],['cx_dip_ring',{r:10},500],['chest_bw_dip',{r:5,add:20},500],['chest_bw_dip',{r:3,add:40},900]]},
  {id:'mu',icon:'muscleup',c:'#ff4d2e',nodes:[
    ['cx_muscleup',{r:1},600],['cx_muscleup',{r:5},1000],['cx_muscleup',{r:10},1500],['cx_muscleup_ring',{r:1},1000],['cx_muscleup_ring',{r:5},1800]]},
  {id:'hs',icon:'handstand',c:'#ffaa1f',nodes:[
    ['cx_hs_wall',{s:30},100],['cx_hs_wall',{s:60},250],['cx_hs_free',{s:5},300],['cx_hs_free',{s:15},500],['cx_hs_free',{s:30},800],['cx_hs_free',{s:60},1200],
    ['shd_bw_hspu',{r:1},300],['shd_bw_hspu',{r:10},700],['cx_hspu_free',{r:1},1500],['cx_hs_oa',{s:3},2500]]},
  {id:'fl',icon:'lever',c:'#14bfc2',nodes:[
    ['cx_fl_tuck',{s:10},300],['cx_fl_tuck',{s:20},450],['cx_fl_adv',{s:10},600],['cx_fl_straddle',{s:5},900],['cx_fl_full',{s:3},1500],['cx_fl_full',{s:10},2500]]},
  {id:'planche',icon:'planche',c:'#e879f9',nodes:[
    ['cx_planche_lean',{s:30},200],['cx_planche_tuck',{s:10},500],['cx_planche_adv',{s:10},800],['cx_planche_straddle',{s:5},1500],['cx_planche_full',{s:3},3000]]},
  {id:'core',icon:'lsit',c:'#f5c518',nodes:[
    ['core_bw_plank',{s:60},100],['core_bw_plank',{s:120},250],['cx_lsit',{s:10},200],['cx_lsit',{s:30},500],['core_bw_toes',{r:10},400],
    ['core_bw_dragon',{r:5},500],['cx_vsit',{s:5},800],['cx_manna',{s:3},3000]]},
  {id:'legs',icon:'pistol',c:'#2fd18a',nodes:[
    ['quad_bw_squat',{r:50},150],['quad_bw_squat',{r:100},350],['quad_bw_pistol',{r:1},300],['quad_bw_pistol',{r:10},700],['cx_shrimp',{r:5},500],['ham_bw_nordic',{r:5},600]]},
  {id:'flag',icon:'flag',c:'#8197c9',nodes:[
    ['cx_elbow_lever',{s:10},300],['cx_bl_tuck',{s:10},300],['cx_bl_full',{s:5},900],['cx_flag',{s:3},1000],['cx_flag',{s:10},2000]]},
  {id:'grip',icon:'hang',c:'#d49a5f',nodes:[
    ['fore_bw_dead_hang',{s:30},100],['fore_bw_dead_hang',{s:60},200],['fore_bw_dead_hang',{s:120},400],['cx_hang_oa',{s:10},400],['cx_hang_oa',{s:30},900]]}
];
SKILL_TREES.forEach(tr=>{tr.nodes=tr.nodes.map(([ex,goal,xp],i)=>({id:tr.id+'_'+i,ex,r:goal.r||0,s:goal.s||0,add:goal.add||0,xp}))});
