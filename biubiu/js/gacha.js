/* ============================================================
   水果突击 · Fruit Assault —— 抽卡/碎片系统 (Item 4)
   ============================================================ */

/* ——— 抽卡池定义 ——— */
const GACHA_TIERS = [
  { label: '普通', weight: 40, fragCount: 1, color: '#9ab678' },
  { label: '稀有', weight: 30, fragCount: 2, color: '#4db6ff' },
  { label: '史诗', weight: 20, fragCount: 3, color: '#b85cff' },
  { label: '传说', weight: 10, fragCount: 5, color: '#ffc93c' },
];

function gachaTierForFruit(id) {
  if (typeof FRUIT_TIER_V20 !== 'undefined' && FRUIT_TIER_V20[id]) {
    const t = FRUIT_TIER_V20[id];
    if (t === 'T1') return 0; // 普通
    if (t === 'T2') return 1; // 稀有
    if (t === 'T3') return 2; // 史诗
  }
  return 1; // default稀有
}

function gachaWeightedTier() {
  const total = GACHA_TIERS.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < GACHA_TIERS.length; i++) {
    r -= GACHA_TIERS[i].weight;
    if (r <= 0) return i;
  }
  return GACHA_TIERS.length - 1;
}

function gachaRandomFruit() {
  const unlocked = (typeof progressUnlocked === 'function') ? progressUnlocked(meta) : UNIT_POOL.slice();
  const pool = UNIT_POOL.filter(id => !unlocked.includes(id) || true);
  const idx = Math.floor(Math.random() * UNIT_POOL.length);
  return UNIT_POOL[idx];
}

/* ——— 抽卡逻辑 ——— */
function gachaPull(count) {
  const cost = count === 1 ? 5 : 45;
  if ((meta.gems || 0) < cost) return null;
  meta.gems -= cost;

  const results = [];
  for (let i = 0; i < count; i++) {
    const tierIdx = gachaWeightedTier();
    const fruitId = gachaRandomFruit();
    const fragCount = GACHA_TIERS[tierIdx].fragCount;
    const alreadyOwned = !meta.unlocked || meta.unlocked.includes(fruitId);

    if (!alreadyOwned) {
      meta.unlocked = meta.unlocked || [];
      meta.unlocked.push(fruitId);
    }

    meta.fragments = meta.fragments || {};
    meta.fragments[fruitId] = (meta.fragments[fruitId] || 0) + fragCount;

    results.push({
      fruitId,
      fruitIcon: TYPES[fruitId]?.icon || '?',
      fruitName: TYPES[fruitId]?.name || '?',
      tierIdx,
      tierLabel: GACHA_TIERS[tierIdx].label,
      tierColor: GACHA_TIERS[tierIdx].color,
      fragCount,
      isNew: !alreadyOwned,
    });
  }

  saveMeta();
  refreshGold();
  return results;
}

/* ——— 抽卡结果面板 ——— */
function showGachaResult(results, onClose) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;display:flex;align-items:center;justify-content:center;';
  const box = document.createElement('div');
  box.style.cssText = 'background:linear-gradient(180deg,#fffbe4,#eaffc3);border-radius:20px;padding:20px;width:min(90vw,380px);text-align:center;';
  box.innerHTML = '<h2 style="color:#2c8d3f;font-size:22px;margin-bottom:12px;">🎉 抽卡结果</h2><div id="gachaResultList" style="display:flex;flex-direction:column;gap:8px;max-height:50vh;overflow-y:auto;"></div><button id="gachaCloseBtn" style="margin-top:14px;border:0;border-radius:12px;background:#53c96a;color:#fff;font-weight:900;font-size:14px;padding:10px 28px;cursor:pointer;">确认</button>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const list = document.getElementById('gachaResultList') || box.querySelector('#gachaResultList');

  // Show results one by one with delay
  let idx = 0;
  function showNext() {
    if (idx >= results.length) return;
    const r = results[idx];
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.6);border-radius:12px;padding:10px 12px;border:2px solid ' + r.tierColor + ';animation:gachaReveal 0.3s ease;';
    item.innerHTML = '<span style="font-size:28px;">' + r.fruitIcon + '</span><div style="text-align:left;flex:1;"><b style="color:#244b21;">' + r.fruitName + '</b><br><span style="font-size:12px;color:' + r.tierColor + ';font-weight:900;">' + r.tierLabel + (r.isNew ? ' · 新!' : '') + '</span></div><span style="font-weight:900;font-size:16px;color:' + r.tierColor + ';">+' + r.fragCount + '碎片</span>';
    list.appendChild(item);
    idx++;
    if (idx < results.length) setTimeout(showNext, 250);
  }
  // Add keyframe for reveal
  if (!document.getElementById('gachaRevealStyle')) {
    const st = document.createElement('style');
    st.id = 'gachaRevealStyle';
    st.textContent = '@keyframes gachaReveal { from { opacity:0;transform:scale(0.85) translateY(10px); } to { opacity:1;transform:scale(1) translateY(0); } }';
    document.head.appendChild(st);
  }
  setTimeout(showNext, 200);

  document.getElementById('gachaCloseBtn').addEventListener('click', () => {
    document.body.removeChild(overlay);
    if (typeof onClose === 'function') onClose();
  });
}

/* ——— 渲染抽卡商城Tab ——— */
function renderGachaShop(parentEl) {
  parentEl.innerHTML = '';
  const gems = meta.gems || 0;
  parentEl.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
      '<span style="font-size:15px;font-weight:900;color:#31551f;">💎 ' + gems + '</span>' +
      '<span style="font-size:11px;color:#6f9251;">5💎/次 · 45💎/十连</span>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">' +
      '<button id="gachaPull1" class="btn-primary" style="font-size:14px;padding:12px 0;" ' + (gems < 5 ? 'disabled' : '') + '>抽1次</button>' +
      '<button id="gachaPull10" class="btn-primary" style="font-size:14px;padding:12px 0;background:linear-gradient(180deg,#ffcf52,#ff9f37);color:#5b3f05;" ' + (gems < 45 ? 'disabled' : '') + '>十连抽</button>' +
    '</div>' +
    '<div id="gachaProbHint" style="font-size:10px;color:#8aad6a;text-align:center;line-height:1.5;">普通40% · 稀有30% · 史诗20% · 传说10%<br>重复获得转化为碎片</div>';

  document.getElementById('gachaPull1').addEventListener('click', () => {
    const results = gachaPull(1);
    if (results) showGachaResult(results, () => renderGachaShop(parentEl));
  });
  document.getElementById('gachaPull10').addEventListener('click', () => {
    const results = gachaPull(10);
    if (results) showGachaResult(results, () => renderGachaShop(parentEl));
  });
}
