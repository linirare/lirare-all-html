/* ============================================================
   水果突击 · Fruit Assault —— DOM 界面管理
   ============================================================ */

/* ——— 科技项配置：按 12 个水果球动态生成 ——— */
function buildUpgradeGroups() {
  const groups = UNIT_POOL.map(id => {
    const t = TYPES[id];
    return {
      title: `${t.icon} ${t.name} · ${roleLabel(t.role)}`,
      items: [
        { key: id + '_atk', label: `${t.name}攻击`, type: id, stat: 'atk', maxLv: UPGRADE_MAX, wall: false },
        { key: id + '_hp',  label: `${t.name}韧性`, type: id, stat: 'hp',  maxLv: UPGRADE_MAX, wall: false },
      ],
    };
  });
  groups.push({
    title: '🍹 果园战略科技',
    items: [
      { key: 'wall', label: '我方果堡', type: null, stat: null, maxLv: WALL_UPGRADE_MAX, wall: true },
      { key: 'sp',   label: '果汁泵', type: null, stat: null, maxLv: SP_UPGRADE_MAX, sp: true },
    ],
  });
  return groups;
}
function roleLabel(role) {
  return ({ tank:'前排', back:'输出', rush:'突击', front:'枪线', siege:'攻城', control:'控制', support:'辅助', merge:'合成引擎' })[role] || role;
}
const UPGRADE_GROUPS = buildUpgradeGroups();

function getItemLv(item) {
  if (item.wall) return meta.wallLv || 0;
  if (item.sp) return meta.spLv || 0;
  return getUpgradeLv(meta, item.type, item.stat);
}
function addItemLv(item) {
  if (item.wall) meta.wallLv++;
  else if (item.sp) meta.spLv = (meta.spLv || 0) + 1;
  else {
    const key = upgradeKey(item.type, item.stat);
    meta.upgrades[key] = (meta.upgrades[key] || 0) + 1;
  }
}
function itemEffectText(item) {
  if (item.wall) return `+${WALL_PER_LV}耐久/级`;
  if (item.sp) return '开局果汁能量/上限提升';
  return `+${Math.round(UPGRADE_PER_LV * 100)}%/级`;
}
function milestoneText(item, lv) {
  const m = TECH_MILESTONES[item.key];
  if (!m) return '';
  if (lv >= m.at) return `已解锁：${m.title} · ${m.desc}`;
  return `节点 Lv.${m.at}：${m.title}`;
}
function renderUpgrades() {
  const list = document.getElementById('upgradeList');
  const goldSpan = document.getElementById('upGold');
  goldSpan.textContent = meta.gold;
  list.innerHTML = '';

  for (const group of UPGRADE_GROUPS) {
    const section = document.createElement('div');
    section.className = 'upgrade-section';
    section.innerHTML = `<h3>${group.title}</h3>`;
    for (const item of group.items) {
      const el = document.createElement('div');
      const lv = getItemLv(item);
      const maxed = lv >= item.maxLv;
      const cost = upgradeCost(lv + 1);
      const canAfford = meta.gold >= cost && !maxed;
      el.className = 'upgrade-item' + (canAfford ? '' : ' disabled');
      const node = milestoneText(item, lv);
      el.innerHTML = `
        <span class="uilabel">${item.label} <span class="uilevel">Lv.${lv}</span><br>
          <small>${itemEffectText(item)}${node ? ' · ' + node : ''}</small>
        </span>
        <span class="uicost ${maxed ? 'maxed' : canAfford ? 'can-afford' : ''}">${maxed ? 'MAX' : cost + '🍋'}</span>
      `;
      if (canAfford) {
        el.addEventListener('click', () => {
          addItemLv(item);
          meta.gold -= cost;
          saveMeta();
          renderUpgrades();
          refreshGold();
        });
      }
      section.appendChild(el);
    }
    list.appendChild(section);
  }
}

/* ——— 溢出队列弹窗 ——— */
function showOverflowPopup() {
  const popup = document.getElementById('overflowPopup');
  const list = document.getElementById('overflowList');
  list.innerHTML = '';
  if (state.overflowQueue.length === 0) {
    list.innerHTML = '<p style="color:#8a7a5a;font-size:13px;">队列为空</p>';
  } else {
    for (let i = 0; i < state.overflowQueue.length; i++) {
      const item = state.overflowQueue[i];
      const t = TYPES[normalizeTypeId(item.type)] || TYPES[DEFAULT_DECK[0]];
      const el = document.createElement('div');
      el.style.cssText = `display:flex;align-items:center;gap:5px;padding:8px 11px;background:rgba(255,255,255,0.42);border:1px solid rgba(72,174,70,0.16);border-radius:10px;cursor:pointer;color:#416329;font-size:13px;`;
      el.innerHTML = `${t.icon} ${t.name} Lv.${item.level}`;
      el.title = '点击后选择棋盘空格放置';
      const pick = (e) => {
        e.stopPropagation();
        document.getElementById('overflowPopup').classList.add('hide');
        state.pendingPlace = { type: normalizeTypeId(item.type), level: item.level, queueIndex: i };
      };
      el.addEventListener('mousedown', pick);
      el.addEventListener('touchstart', pick, { passive: true });
      list.appendChild(el);
    }
  }
  popup.classList.remove('hide');
}

document.getElementById('btnOverflowClose').addEventListener('click', () => document.getElementById('overflowPopup').classList.add('hide'));

/* ——— 保存/读取 meta ——— */
const META_KEY = 'merge_td_meta_v1';
function saveMeta() {
  meta.deck = normalizeDeck(meta.deck || DEFAULT_DECK);
  meta.unlocked = Array.isArray(meta.unlocked) && meta.unlocked.length ? meta.unlocked.map(normalizeTypeId).filter(id => TYPES[id]) : UNIT_POOL.slice();
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
}
function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      meta.gold = saved.gold || 0;
      meta.upgrades = saved.upgrades || {};
      meta.wallLv = saved.wallLv || 0;
      meta.spLv = saved.spLv || 0;
      meta.highestLevel = Math.max(1, saved.highestLevel || 1);
      meta.totalWins = saved.totalWins || 0;
      meta.stars = saved.stars || {};
      meta.deck = normalizeDeck(saved.deck || saved.activeDeck || DEFAULT_DECK);
      meta.unlocked = Array.isArray(saved.unlocked) && saved.unlocked.length ? saved.unlocked.map(normalizeTypeId).filter(id => TYPES[id]) : UNIT_POOL.slice();
      /* 加载/迁移起始等级 */
      meta.startingLvs = saved.startingLvs || {};
      if (Object.keys(meta.startingLvs).length === 0 && Object.keys(meta.upgrades).length > 0) {
        for (const id of UNIT_POOL) {
          const atkLv = meta.upgrades[id + '_atk'] || 0;
          const hpLv = meta.upgrades[id + '_hp'] || 0;
          if (atkLv + hpLv > 0) {
            meta.startingLvs[id] = Math.min(1 + Math.floor((atkLv + hpLv) / 6), STARTING_LV_MAX);
          }
        }
      }
      meta.gems = saved.gems || 0;
      meta.fragments = saved.fragments || {};
      meta.unlockedStages = saved.unlockedStages || [];
      if (meta.unlockedStages.length === 0) {
        for (let i = 1; i <= (meta.highestLevel || 1); i++) meta.unlockedStages.push(i);
      }
    } else {
      meta.deck = normalizeDeck(DEFAULT_DECK);
      meta.unlocked = UNIT_POOL.slice();
    }
  } catch (e) {
    meta.deck = normalizeDeck(DEFAULT_DECK);
    meta.unlocked = UNIT_POOL.slice();
  }
  refreshGold();
}
function startStage(id) {
  meta.deck = normalizeDeck(meta.deck);
  saveMeta();
  document.getElementById('menuPanel').classList.add('hide');
  if (typeof initLevel === 'function') initLevel(id);
}

function renderStageSelect() {
  const grid = document.getElementById('stageGrid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < STAGES.length; i++) {
    const s = STAGES[i];
    const unlocked = meta.unlockedStages && meta.unlockedStages.includes(s.id);
    const stars = (meta.stars && meta.stars[s.id]) || 0;
    const card = document.createElement('div');
    card.className = 'stage-card' + (unlocked ? '' : ' locked');
    card.innerHTML = '<div class="stage-card-num">' + (unlocked ? s.id : '🔒') + '</div><div class="stage-card-name">' + s.name + '</div><div class="stage-card-stars">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</div>';
    if (unlocked) {
      card.addEventListener('click', function() { startStage(s.id); });
    }
    grid.appendChild(card);
  }
}

function refreshGold() {
  const g = meta.gold || 0;
  const menuEl = document.getElementById('menuGold');
  if (menuEl) menuEl.textContent = g;
  const upEl = document.getElementById('upGold');
  if (upEl) upEl.textContent = g;
  const stageEl = document.getElementById('menuStage');
  if (stageEl) stageEl.textContent = meta.highestLevel || 1;
  const deckEl = document.getElementById('menuDeck');
  if (deckEl) deckEl.innerHTML = normalizeDeck(meta.deck).map(id => `<span title="${TYPES[id].name}">${TYPES[id].icon}</span>`).join('');
}

/* ——— 按钮事件绑定 ——— */
document.addEventListener('DOMContentLoaded', () => {
  loadMeta();
  document.getElementById('btnStart').addEventListener('click', () => {
    const grid = document.getElementById('stageGrid');
    if (!grid) return;
    if (grid.classList.contains('hide')) {
      renderStageSelect();
      grid.classList.remove('hide');
      document.getElementById('btnStart').textContent = '收起关卡';
    } else {
      grid.classList.add('hide');
      document.getElementById('btnStart').textContent = '选择关卡';
    }
  });
  document.getElementById('btnUpgrade').addEventListener('click', () => {
    refreshGold();
    document.getElementById('upgradePanel').classList.remove('hide');
    renderUpgrades();
  });
  document.getElementById('btnUpClose').addEventListener('click', () => document.getElementById('upgradePanel').classList.add('hide'));
  document.getElementById('btnHelpClose').addEventListener('click', () => document.getElementById('helpPanel').classList.add('hide'));
  document.getElementById('btnRetry').addEventListener('click', () => { document.getElementById('resultPanel').classList.add('hide'); initLevel(state.currentLevel); });
  document.getElementById('btnMenu').addEventListener('click', () => {
    document.getElementById('resultPanel').classList.add('hide');
    document.getElementById('menuPanel').classList.remove('hide');
    state.phase = 'menu';
    refreshGold();
  });
  document.getElementById('btnNext').addEventListener('click', () => { document.getElementById('resultPanel').classList.add('hide'); initLevel(state.currentLevel + 1); });

const resetBtn = document.getElementById('btnReset');
  let resetTimer = null;
  const resetStart = (e) => {
    if (e) e.preventDefault();
    resetTimer = setTimeout(() => { localStorage.removeItem(META_KEY); location.reload(); }, 1500);
    resetBtn.textContent = '继续按住以确认...';
  };
  const resetCancel = () => { clearTimeout(resetTimer); resetBtn.textContent = '长按重置数据'; };
  resetBtn.addEventListener('mousedown', resetStart);
  resetBtn.addEventListener('mouseup', resetCancel);
  resetBtn.addEventListener('mouseleave', resetCancel);
  resetBtn.addEventListener('touchstart', resetStart, { passive: false });
  resetBtn.addEventListener('touchend', resetCancel);
});