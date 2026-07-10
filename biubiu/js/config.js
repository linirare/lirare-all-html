/* ============================================================
   水果突击 · Fruit Assault —— 配置常量 / 13水果球卡组制
   ============================================================ */

const W = 480, H = 854;

/* ——— 清新水果主题色 ——— */
const THEME = {
  bg:        '#f4ffd9',
  panelBg:   '#fff7d6',
  gold:      '#ffc93c',
  goldGlow:  'rgba(255,201,60,0.32)',
  accent:    '#ff5d6c',
  safe:      '#53c96a',
  info:      '#4db6ff',
  text:      '#4f6a31',
  textDim:   '#7fa05a',
  textBright:'#23471f',
};

/* ——— 棋盘 ——— */
const ROWS = 3, COLS = 5;
const CELL = 64;
const GAP = 6;
const BOARD_W = COLS * CELL + (COLS - 1) * GAP;
const BOARD_H = ROWS * CELL + (ROWS - 1) * GAP;
const BOARD_X = (W - BOARD_W) / 2;

/* ——— Y 坐标布局 ——— */
const FIELD_H = 260;
const PLAYER_BOARD_SHIFT = 40;
const LAYOUT = {
  enemyInfoY:  6,
  enemyBoardY: 24,
  enemyWallY:  24 + BOARD_H + 10,
  wallH: 22,
  fieldY:      24 + BOARD_H + 10 + 22 + 8,
  fieldH: FIELD_H,
  playerWallY: 24 + BOARD_H + 10 + 22 + 8 + FIELD_H + 8,
  playerBoardY:24 + BOARD_H + 10 + 22 + 8 + FIELD_H + 8 + 22 + 10 + PLAYER_BOARD_SHIFT,
  bottomY:     24 + BOARD_H + 10 + 22 + 8 + FIELD_H + 8 + 22 + 10 + PLAYER_BOARD_SHIFT + BOARD_H + 4,
};

/* ——— 13 个水果球：局内只从5个上阵水果中随机召唤 ——— */
const TYPES = {
  watermelon_guard: { id:'watermelon_guard', name:'西瓜盾卫', icon:'🍉', color:'#34c96b', rarity:'normal', role:'tank',    range:'melee', atk:8,  hp:68, speed:1.55, move:76,  siege:0.75, armor:12, tags:['front','tank','anti_range'], desc:'主坦抗线。Lv3周期护盾，Lv5进场嘲讽同路敌人。', skill:'shield' },
  coconut_guard:    { id:'coconut_guard',    name:'椰子守卫', icon:'🥥', color:'#9f7a4c', rarity:'normal', role:'tank',    range:'melee', atk:7,  hp:62, speed:1.62, move:72,  siege:0.65, armor:16, tags:['front','shield'], desc:'硬坦。第一次接战获得厚护盾，适合抗爆发。', skill:'first_shield' },
  grape_archer:     { id:'grape_archer',     name:'葡萄射手', icon:'🍇', color:'#9b5cff', rarity:'normal', role:'back',    range:'far',   atk:10, hp:30, speed:1.00, move:86,  siege:0.90, armor:2,  tags:['range','dps'], desc:'稳定后排输出。怕突击切入，需要前排保护。', skill:'rapid' },
  blueberry_sniper: { id:'blueberry_sniper', name:'蓝莓狙手', icon:'🫐', color:'#4d7dff', rarity:'rare',   role:'back',    range:'long',  atk:18, hp:26, speed:1.75, move:72,  siege:1.05, armor:1,  tags:['range','burst','backline'], desc:'长射程爆发，优先处理后排。怕突击贴脸。', skill:'snipe' },
  banana_raider:    { id:'banana_raider',    name:'香蕉突击', icon:'🍌', color:'#ffd447', rarity:'normal', role:'rush',    range:'melee', atk:13, hp:36, speed:0.82, move:118, siege:0.95, armor:3,  tags:['rush','assassin'], desc:'快速突击，克制后排、医师和炮车。怕枪线拦截。', skill:'dash' },
  lemon_assassin:   { id:'lemon_assassin',   name:'柠檬刺客', icon:'🍋', color:'#ffe76a', rarity:'rare',   role:'rush',    range:'melee', atk:17, hp:28, speed:0.92, move:126, siege:0.80, armor:1,  tags:['rush','crit'], desc:'首击爆发，适合切远程和补刀。怕控制与枪线。', skill:'first_crit' },
  pineapple_lancer: { id:'pineapple_lancer', name:'菠萝枪兵', icon:'🍍', color:'#ffb337', rarity:'normal', role:'front',   range:'mid',   atk:11, hp:48, speed:1.10, move:90,  siege:0.95, armor:7,  tags:['front','anti_rush'], desc:'中线枪兵，职责克制突击单位。', skill:'anti_rush' },
  orange_cannon:    { id:'orange_cannon',    name:'橙子炮手', icon:'🍊', color:'#ff9838', rarity:'rare',   role:'siege',   range:'far',   atk:9,  hp:34, speed:1.65, move:64,  siege:2.45, armor:2,  tags:['siege','range'], desc:'攻城核心。拆果堡极强，打兵偏弱，怕突击。', skill:'siege' },
  pumpkin_roller:   { id:'pumpkin_roller',   name:'南瓜滚轮', icon:'🎃', color:'#ff7d35', rarity:'rare',   role:'siege',   range:'melee', atk:10, hp:42, speed:1.20, move:96,  siege:1.55, armor:6,  tags:['siege','death'], desc:'死亡后向前滚动爆破。适合制造攻城突破点。', skill:'death_roll' },
  pear_frost:       { id:'pear_frost',       name:'冰梨术士', icon:'🍐', color:'#9be7ff', rarity:'rare',   role:'control', range:'far',   atk:7,  hp:31, speed:1.35, move:70,  siege:0.70, armor:1,  tags:['control','slow'], desc:'攻击附带减速，职责克制高速突击。', skill:'slow' },
  peach_medic:      { id:'peach_medic',      name:'蜜桃医师', icon:'🍑', color:'#ff9fbd', rarity:'rare',   role:'support', range:'support', atk:4,  hp:32, speed:1.65, move:70,  siege:0.40, armor:1,  tags:['support','heal'], desc:'周期治疗同路前排。怕突击切入。', skill:'heal' },
  kiwi_wildcard:    { id:'kiwi_wildcard',    name:'奇异果万能', icon:'🥝', color:'#8bd34e', rarity:'epic',   role:'merge',   range:'support', atk:2,  hp:24, speed:1.80, move:62,  siege:0.20, armor:0,  tags:['merge','wildcard'], desc:'同星万能合成材料。合成辅助，不派兵。', skill:'wildcard' },
  passion_copy:     { id:'passion_copy',     name:'百香果复制', icon:'🟣', color:'#b85cff', rarity:'epic',   role:'merge',   range:'support', atk:2,  hp:24, speed:1.80, move:62,  siege:0.20, armor:0,  tags:['merge','copy'], desc:'拖到同星目标上复制成目标水果。合成辅助，不派兵。', skill:'copy' },
};

const UNIT_POOL = Object.keys(TYPES);
const OLD_DEFAULT_DECK = ['watermelon_guard','grape_archer','banana_raider','pineapple_lancer','orange_cannon'];
const DEFAULT_DECK = ['watermelon_guard','grape_archer','banana_raider','pineapple_lancer','orange_cannon'];
const DECK_SIZE = 5;
const TYPE_IDS = UNIT_POOL;
const BASIC_UNLOCKED = DEFAULT_DECK.slice();
const PROGRESS_UNLOCKS = [
  { level: 2, ids: ['coconut_guard'] },
  { level: 3, ids: ['peach_medic','pear_frost'] },
  { level: 4, ids: ['blueberry_sniper','lemon_assassin'] },
  { level: 5, ids: ['pumpkin_roller'] },
  { level: 6, ids: ['kiwi_wildcard'] },
  { level: 8, ids: ['passion_copy'] },
];
function unlockLevelFor(id) {
  if (BASIC_UNLOCKED.includes(id)) return 1;
  for (const item of PROGRESS_UNLOCKS) if (item.ids.includes(id)) return item.level;
  return 1;
}
function progressUnlocked(m = null) {
  const highest = Math.max(1, m?.highestLevel || 1);
  const list = BASIC_UNLOCKED.slice();
  for (const item of PROGRESS_UNLOCKS) if (highest >= item.level) for (const id of item.ids) if (!list.includes(id)) list.push(id);
  return list.filter(id => TYPES[id]);
}
function syncProgressUnlocks(m = null) {
  if (!m) return BASIC_UNLOCKED.slice();
  const list = progressUnlocked(m);
  m.unlocked = list.slice();
  if (!Array.isArray(m.deck) || m.deck.length === 0) m.deck = DEFAULT_DECK.slice();
  m.deck = normalizeDeck(m.deck).filter(id => list.includes(id));
  for (const id of DEFAULT_DECK) if (m.deck.length < DECK_SIZE && list.includes(id) && !m.deck.includes(id)) m.deck.push(id);
  return list;
}

/* 老存档/老代码兼容 */
const LEGACY_TYPE_MAP = {
  bow: 'grape_archer',
  sword: 'banana_raider',
  spear: 'pineapple_lancer',
  shield: 'watermelon_guard',
};
function normalizeTypeId(id) {
  return LEGACY_TYPE_MAP[id] || id || DEFAULT_DECK[0];
}
function deckSignature(deck) {
  return normalizeDeckNoFill(deck).join('|');
}
function normalizeDeckNoFill(deck) {
  const result = [];
  for (const raw of deck || []) {
    const id = normalizeTypeId(raw);
    if (TYPES[id] && !result.includes(id)) result.push(id);
  }
  return result.slice(0, DECK_SIZE);
}
function shouldForceNewDefaultDeck(deck) {
  const sig = deckSignature(deck);
  return !sig
    || sig === OLD_DEFAULT_DECK.join('|')
    || sig === ['grape_archer','banana_raider','pineapple_lancer','watermelon_guard'].join('|')
}
function normalizeDeck(deck) {
  const result = shouldForceNewDefaultDeck(deck) ? DEFAULT_DECK.slice() : normalizeDeckNoFill(deck);
  for (const id of DEFAULT_DECK) if (result.length < DECK_SIZE && !result.includes(id)) result.push(id);
  return result.slice(0, DECK_SIZE);
}
function activeDeck() {
  return normalizeDeck(meta?.deck || DEFAULT_DECK);
}

/* 职责克制：不再要求玩家背水果表 */
const ROLE_COUNTER_DMG = 1.35;
const ROLE_SOFT_COUNTER_DMG = 1.22;
const ROLE_WEAK_DMG = 0.85;
function roleCounterMultiplier(sourceType, targetType) {
  const source = TYPES[sourceType] || {};
  const target = TYPES[targetType] || {};
  const sr = source.role;
  const tr = target.role;
  if (!sr || !tr || sr === 'merge') return 1;
  if (sr === 'rush' && ['back','support','siege','control'].includes(tr)) return ROLE_COUNTER_DMG;
  if (sr === 'rush' && ['tank','front'].includes(tr)) return ROLE_WEAK_DMG;
  if (sr === 'front' && tr === 'rush') return 1.40;
  if (sr === 'control' && (tr === 'rush' || (target.move || 0) >= 112)) return ROLE_COUNTER_DMG;
  if (sr === 'siege' && tr === 'tank') return ROLE_SOFT_COUNTER_DMG;
  if (sr === 'siege' && tr === 'rush') return ROLE_WEAK_DMG;
  if (sr === 'back' && tr === 'front') return ROLE_SOFT_COUNTER_DMG;
  if (sr === 'back' && tr === 'tank') return 0.92;
  if (sr === 'back' && tr === 'rush') return ROLE_WEAK_DMG;
  if (sr === 'tank' && tr === 'back') return 1.12;
  if (sr === 'tank' && ['siege','control'].includes(tr)) return 0.90;
  return 1;
}
function roleCounterText(sourceType, targetType) {
  const mul = roleCounterMultiplier(sourceType, targetType);
  if (mul >= 1.32) return '克制';
  if (mul >= 1.15) return '优势';
  if (mul <= 0.9) return '受制';
  return '';
}
function bestCounterForEnemy(enemyType, pool = null) {
  const list = pool || UNIT_POOL;
  let best = null, bestScore = 1;
  for (const id of list) {
    if (!TYPES[id] || TYPES[id].role === 'merge') continue;
    const score = roleCounterMultiplier(id, enemyType);
    if (score > bestScore) { best = id; bestScore = score; }
  }
  return best;
}

const LEVEL_MUL = [0, 1.0, 1.45, 2.05, 2.8, 3.75, 4.9, 6.2];

/* ——— 按角色独立成长曲线（Item 5: 英雄差异化） ——— */
const ROLE_GROWTH = {
  tank:    { atk: [0,1.0,1.3,1.7,2.2,2.8,3.5,4.3], hp: [0,1.0,1.6,2.5,3.8,5.5,7.5,10.0] },
  back:    { atk: [0,1.0,1.6,2.5,3.8,5.5,7.5,10.0], hp: [0,1.0,1.2,1.5,1.9,2.4,3.0,3.7] },
  rush:    { atk: [0,1.0,1.5,2.2,3.2,4.5,6.2,8.5], hp: [0,1.0,1.3,1.7,2.2,2.8,3.5,4.3] },
  front:   { atk: [0,1.0,1.4,1.9,2.6,3.5,4.6,6.0], hp: [0,1.0,1.5,2.2,3.2,4.5,6.2,8.5] },
  siege:   { atk: [0,1.0,1.5,2.2,3.2,4.5,6.2,8.5], hp: [0,1.0,1.3,1.7,2.2,2.8,3.5,4.3] },
  control: { atk: [0,1.0,1.4,1.9,2.6,3.5,4.6,6.0], hp: [0,1.0,1.3,1.7,2.2,2.8,3.5,4.3] },
  support: { atk: [0,1.0,1.3,1.7,2.2,2.8,3.5,4.3], hp: [0,1.0,1.4,1.9,2.6,3.5,4.6,6.0] },
  merge:   { atk: [0,1.0,1.0,1.0,1.0,1.0,1.0,1.0], hp: [0,1.0,1.0,1.0,1.0,1.0,1.0,1.0] },
};
const FRUIT_SCALE = {
  watermelon_guard: { atk: 0.85, hp: 1.15 },
  coconut_guard:    { atk: 0.80, hp: 1.20 },
  grape_archer:     { atk: 1.15, hp: 0.85 },
  blueberry_sniper: { atk: 1.20, hp: 0.80 },
  banana_raider:    { atk: 1.05, hp: 0.90 },
  lemon_assassin:   { atk: 1.10, hp: 0.85 },
  pineapple_lancer: { atk: 0.95, hp: 1.05 },
  orange_cannon:    { atk: 0.90, hp: 1.10 },
  pumpkin_roller:   { atk: 1.00, hp: 1.00 },
  pear_frost:       { atk: 0.95, hp: 1.00 },
  peach_medic:      { atk: 0.75, hp: 1.05 },
  kiwi_wildcard:    { atk: 0.50, hp: 0.50 },
  passion_copy:     { atk: 0.50, hp: 0.50 },
};

const MAX_LEVEL = 7;
const BASE_WALL_HP = 72;
const SIEGE_SLOTS_PER_LANE = 3;
const BALL_SPAWN_INTERVAL = 4.4;
const SOLDIER_SPAWN_INTERVAL = 5;
const SPAWN_COOLDOWNS = [0, 5.6, 4.9, 4.25, 3.65, 3.15, 2.7, 2.35];
const OVERFLOW_MAX = 10;
const MAX_SOLDIERS = 24;
const SP_MAX = 18;
const SP_PASSIVE = 5.0;

function upgradeCost(lv) { return 10 + lv * 8; }
function startingLvCost(lv) { return 30 + lv * 30; }
function stageReward(k) { return k * 8 + 18; }
const STARTING_LV_MAX = 4;
const UPGRADE_MAX = 20;
const WALL_UPGRADE_MAX = 10;
const SP_UPGRADE_MAX = 10;
const UPGRADE_PER_LV = 0.05;
const WALL_PER_LV = 5;

const TECH_MILESTONES = {};
for (const id of UNIT_POOL) {
  TECH_MILESTONES[id + '_atk'] = { title: TYPES[id].name + '强化', at: 5, desc: TYPES[id].desc };
  TECH_MILESTONES[id + '_hp'] = { title: TYPES[id].name + '耐久', at: 5, desc: '提升该水果球在战线上的容错。' };
}
TECH_MILESTONES.wall = { title: '果堡加固', at: 5, desc: '降低被偷家失败概率。' };
TECH_MILESTONES.sp = { title: '果汁号角', at: 5, desc: '开局果汁能量和上限提升。' };

/* ——— 固定关卡数据（Item 6: 固定PVE难度） ——— */
const STAGES = [
  { id:1,  name:'果园初战',     enemyLv:1.0, wallHp:22, spawnInterval:4.5, reward:18,  boss:false },
  { id:2,  name:'腐坏小队',     enemyLv:1.2, wallHp:28, spawnInterval:4.2, reward:24,  boss:false },
  { id:3,  name:'果林遭遇战',   enemyLv:1.4, wallHp:34, spawnInterval:3.9, reward:30,  boss:false },
  { id:4,  name:'青苹果前哨',   enemyLv:1.7, wallHp:40, spawnInterval:3.7, reward:36,  boss:false },
  { id:5,  name:'青苹果堡垒',   enemyLv:2.0, wallHp:60, spawnInterval:3.5, reward:52,  boss:true  },
  { id:6,  name:'腐化蔓生',     enemyLv:2.2, wallHp:56, spawnInterval:3.6, reward:48,  boss:false },
  { id:7,  name:'酸液河谷',     enemyLv:2.4, wallHp:64, spawnInterval:3.4, reward:54,  boss:false },
  { id:8,  name:'巨果压境',     enemyLv:2.6, wallHp:72, spawnInterval:3.3, reward:60,  boss:false },
  { id:9,  name:'毒藤阵地',     enemyLv:2.8, wallHp:80, spawnInterval:3.2, reward:66,  boss:false },
  { id:10, name:'甘蔗堡垒',     enemyLv:3.1, wallHp:110, spawnInterval:3.0, reward:90, boss:true  },
  { id:11, name:'果核深巷',     enemyLv:3.3, wallHp:100, spawnInterval:3.1, reward:78, boss:false },
  { id:12, name:'枯萎庭院',     enemyLv:3.5, wallHp:112, spawnInterval:3.0, reward:84, boss:false },
  { id:13, name:'腐败长廊',     enemyLv:3.7, wallHp:126, spawnInterval:2.9, reward:90, boss:false },
  { id:14, name:'黑莓深渊',     enemyLv:3.9, wallHp:140, spawnInterval:2.8, reward:96, boss:false },
  { id:15, name:'腐烂果王',     enemyLv:4.2, wallHp:190, spawnInterval:2.6, reward:128, boss:true  },
  { id:16, name:'朽木废墟',     enemyLv:4.3, wallHp:180, spawnInterval:2.7, reward:110, boss:false },
  { id:17, name:'败果坟场',     enemyLv:4.5, wallHp:210, spawnInterval:2.6, reward:120, boss:false },
  { id:18, name:'脓汁沼泽',     enemyLv:4.7, wallHp:240, spawnInterval:2.5, reward:130, boss:false },
  { id:19, name:'果核王座',     enemyLv:4.9, wallHp:280, spawnInterval:2.4, reward:140, boss:false },
  { id:20, name:'最终果堡',     enemyLv:5.0, wallHp:420, spawnInterval:2.2, reward:198, boss:true  },
];

function generateLevel(k) {
  const boss = k > 0 && k % 5 === 0;
  const enemyLv = 1 + (k - 1) * 0.19 + (boss ? 0.18 : 0);
  const wallBase = boss ? 82 : 56;
  const wallGrow = boss ? 1.15 : 1.10;
  return {
    id: k,
    isBoss: boss,
    enemyInitLevel: enemyLv,
    enemyWallHp: Math.round(wallBase * Math.pow(wallGrow, k - 1)),
    enemySpawnInterval: Math.max(4.25, 6.2 - k * 0.13),
    reward: stageReward(k) + (boss ? 24 : 0),
    desc: boss ? `第 ${k} 关 · 腐坏果堡Boss · 破堡奖励+24` : `第 ${k} 关 · 腐坏水果 Lv${enemyLv.toFixed(1)} · 推倒果堡`,
  };
}