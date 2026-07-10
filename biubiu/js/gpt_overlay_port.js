/* ============================================================
   水果突击 · GPT Overlay Port (v36+v37 picked)
   取GPT版的阶段提示条 + 士兵城墙间距修复
   ============================================================ */
(function installGptOverlayPort() {
  patchPhaseStrip();
  patchSoldierWallClearance();
})();

/* ——— v36: 阶段提示条（战场顶部的窄色带） ——— */
function phaseMeta() {
  if (typeof battlePhaseV20 === 'function') {
    const ph = battlePhaseV20();
    if (ph?.key === 'prep')   return { main: '#69b8ff', bg: '#eef9ff', label: ph.label || '合成期' };
    if (ph?.key === 'fight')  return { main: '#d7a351', bg: '#fff3d7', label: ph.label || '交战期' };
    if (ph?.key === 'wall')   return { main: '#65cb7b', bg: '#eaffea', label: ph.label || '攻墙期' };
    if (ph?.key === 'danger') return { main: '#ea737f', bg: '#ffe8eb', label: ph.label || '危险' };
  }
  return { main: '#d7a351', bg: '#fff3d7', label: '交战期' };
}

function patchPhaseStrip() {
  if (typeof draw !== 'function' || draw._gptPhaseStrip) return;
  const oldDraw = draw;
  draw = function drawWithPhaseStrip() {
    oldDraw();
    if (!state || state.phase !== 'playing') return;
    const meta = phaseMeta();
    const w = 100, h = 14;
    const x = W / 2 - w / 2;
    const y = LAYOUT.fieldY - 18;
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = meta.bg;
    roundRect(x, y, w, h, 7);
    ctx.fill();
    ctx.strokeStyle = meta.main;
    ctx.lineWidth = 1;
    roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 7);
    ctx.stroke();
    ctx.font = '900 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#3e4d29';
    ctx.fillText(meta.label, x + w / 2, y + h / 2 + 0.5);
    ctx.restore();
  };
  draw._gptPhaseStrip = true;
}

/* ——— v37: 士兵脚底不穿模进城墙 ——— */
function soldierRadius(s) {
  try {
    if (typeof minimalTierKey === 'function' && typeof minimalRadius === 'function')
      return minimalRadius(s, minimalTierKey(s));
  } catch (e) {}
  return 16 + (s?.level || 1) * 2.2;
}

function patchSoldierWallClearance() {
  if (typeof drawSoldier !== 'function' || drawSoldier._gptWallClearance) return;
  const oldDrawSoldier = drawSoldier;
  drawSoldier = function drawSoldierCleared(s) {
    if (!s || !s.alive || state.phase !== 'playing') return oldDrawSoldier(s);
    const oldY = s.y;
    const r = soldierRadius(s);
    if (s.side === 'player') {
      const maxY = LAYOUT.playerWallY - r + 6;
      if (s.y > maxY) s.y = maxY;
    } else {
      const minY = LAYOUT.enemyWallY + LAYOUT.wallH + r * 0.2;
      if (s.y < minY) s.y = minY;
    }
    oldDrawSoldier(s);
    s.y = oldY;
  };
  drawSoldier._gptWallClearance = true;
}
