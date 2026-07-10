/* ============================================================
   水果突击 · Fruit Assault —— 主入口
   ============================================================ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let scale = 1;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  scale = Math.min(window.innerWidth / W, window.innerHeight / H) * 0.96;
  canvas.style.width = W * scale + 'px';
  canvas.style.height = H * scale + 'px';
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();
initInput(canvas);

/* ——— 出兵封装 ——— */
function spawnSoldierFromBall(ball, r, c, side, forced = false) {
  const group = side === 'player' ? state.playerSoldiers : state.enemySoldiers;
  const alive = group.filter(s => s.alive).length;
  if (alive >= MAX_SOLDIERS) return null;

  const center = slotCenter(r, c, side === 'enemy');
  const soldier = side === 'player'
    ? createSoldier(ball.type, ball.level, getAtkMul(meta, ball.type), getHpMul(meta, ball.type))
    : createSoldier(ball.type, ball.level);

  soldier.x = center.x + (Math.random() - 0.5) * 8;
  soldier.y = center.y;
  soldier.side = side;
  soldier.laneIndex = c;
  soldier.laneX = BOARD_X + c * (CELL + GAP) + CELL / 2 + (Math.random() - 0.5) * 10;
  soldier.mode = 'deploy';
  soldier.target = null;
  soldier.battleReady = false;
  soldier.protected = true;
  soldier._gateFx = false;

  group.push(soldier);

  if (side === 'player') {
    state.rings.push({ x: center.x, y: center.y, r: forced ? 8 : 5, life: 0.25, maxLife: 0.25, color: forced ? THEME.gold : TYPES[ball.type].color });
    if (forced || ball.level >= 3) addFx(center.x, center.y - 22, forced ? '急派兵' : `Lv.${ball.level} 派兵`, forced ? THEME.gold : '#fff2be', 11);
  }
  return soldier;
}

/* ——— 更新 ——— */
function update(dt) {
  dt_global = dt;

  if (state.phase === 'paused') {
    for (let i = state.rings.length - 1; i >= 0; i--) {
      state.rings[i].life -= dt * 0.3;
      state.rings[i].r += 10 * dt;
      if (state.rings[i].life <= 0) state.rings.splice(i, 1);
    }
    for (let i = state.fx.length - 1; i >= 0; i--) {
      state.fx[i].life -= dt * 0.3;
      if (state.fx[i].life <= 0) state.fx.splice(i, 1);
    }
    return;
  }

  if (state.phase !== 'playing') return;

  state.time += dt;

  // Player passive regen：+1/5s，无上限
  if (!state._spTimer) state._spTimer = 0;
  state._spTimer += dt;
  if (state._spTimer >= SP_PASSIVE) {
    state._spTimer -= SP_PASSIVE;
    state.sp += 1;
    addFx(42, LAYOUT.fieldY + LAYOUT.fieldH - 46, '+1果汁', THEME.gold, 11);
  }

  // Enemy passive regen：双方对称
  state.enemySpTimer += dt;
  if (state.enemySpTimer >= SP_PASSIVE) {
    state.enemySpTimer -= SP_PASSIVE;
    state.enemySp += 1;
  }

  // 敌方 SP 经济：不再计时器刷球，改为 SP 消耗
  if (state.phase === 'playing' && (state._enemyReinforcePause || 0) <= 0) {
    state.enemySpCheckTimer = (state.enemySpCheckTimer || SP_PASSIVE) + dt;
    if (state.enemySpCheckTimer >= 4.0) {
      state.enemySpCheckTimer = 0;
      const empties = emptySlots(state.enemySlots);
      if (empties.length > 0 && state.enemySp >= state.enemySummonCostCounter) {
        state.enemySp -= state.enemySummonCostCounter;
        state.enemySummonCostCounter++;
        const pos = empties[Math.floor(Math.random() * empties.length)];
        state.enemySlots[pos[0]][pos[1]] = createBall(randomEnemyType(), 1);
      }
    }
  }

  updateAI(dt);

  // 每个水果营按 CD 自动派兵。自动派兵免费；果汁只用于召唤和急派兵。
  const slotsArr = [
    { slots: state.playerSlots, side: 'player' },
    { slots: state.enemySlots, side: 'enemy' },
  ];
  for (const grp of slotsArr) {
    const soldiers = grp.side === 'player' ? state.playerSoldiers : state.enemySoldiers;
    const alive = soldiers.filter(s => s.alive).length;
    const remaining = MAX_SOLDIERS - alive;
    if (remaining <= 0) continue;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ball = grp.slots[r][c];
        if (!ball) continue;
        ball.spawnTimer -= dt;
        if (ball.spawnTimer <= 0) {
          const cd = SPAWN_COOLDOWNS[ball.level] || SPAWN_COOLDOWNS[1];
          ball.spawnTimer += cd;
          spawnSoldierFromBall(ball, r, c, grp.side);
        }
      }
    }
  }

  updateCombat();

  for (const slots of [state.playerSlots, state.enemySlots]) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const b = slots[r][c];
        if (b && b.bounce > 0) b.bounce = Math.max(0, b.bounce - dt * 3);
      }
    }
  }

  for (const s of state.playerSoldiers) if (s.hitFlash > 0) s.hitFlash = Math.max(0, s.hitFlash - dt * 1.2);
  for (const s of state.enemySoldiers) if (s.hitFlash > 0) s.hitFlash = Math.max(0, s.hitFlash - dt * 1.2);

  for (let i = state.rings.length - 1; i >= 0; i--) {
    const ring = state.rings[i];
    ring.life -= dt;
    ring.r += 64 * dt;
    if (ring.life <= 0) state.rings.splice(i, 1);
  }

  for (const f of state.fx) {
    if (f.vx) { f.x += f.vx * dt; f.y += f.vy * dt; }
  }
  for (let i = state.fx.length - 1; i >= 0; i--) {
    state.fx[i].life -= dt;
    if (state.fx[i].life <= 0) state.fx.splice(i, 1);
  }

  for (let i = state.attackFx.length - 1; i >= 0; i--) {
    state.attackFx[i].life -= dt;
    if (state.attackFx[i].life <= 0) state.attackFx.splice(i, 1);
  }

  if (state.dust) {
    for (const d of state.dust) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y < LAYOUT.fieldY + 10) { d.y = LAYOUT.fieldY + LAYOUT.fieldH - 14; d.x = 36 + Math.random() * (W - 72); }
      if (d.x < 20 || d.x > W - 20) d.vx *= -1;
    }
  }
}

let dt_global = 0;
let last = 0;

function reportHtml() {
  const report = state.lastBattleReport;
  if (!report || !report.tips || report.tips.length === 0) return '';
  return `<br><span style="color:#ffc93c">战斗复盘</span><br>${report.tips.slice(0, 4).map(t => `· ${t}`).join('<br>')}`;
}

function onGameOver(win) {
  const panel = document.getElementById('resultPanel');
  const title = document.getElementById('resultTitle');
  const detail = document.getElementById('resultDetail');
  const nextBtn = document.getElementById('btnNext');

  panel.classList.remove('hide');
  if (win) {
    const wallRatio = state.playerWallHp / state.playerWallMax;
    const elapsed = Math.floor(state.time);
    let stars = 1;
    if (wallRatio > 0.8 && elapsed < 58) stars = 3;
    else if (wallRatio > 0.48) stars = 2;

    const prevStars = meta.stars[state.currentLevel] || 0;
    if (stars > prevStars) meta.stars[state.currentLevel] = stars;

    const bonus = Math.round(state.levelConfig.reward * (stars - 1) * 0.5);
    const totalReward = state.levelConfig.reward + bonus;
    meta.gold += totalReward;
    meta.totalWins++;

    title.textContent = state.levelConfig.isBoss ? '🏆 腐坏果堡攻破！' : '🎉 水果突击胜利！';
    const starsStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const bestType = state.maxSoldierType ? (TYPES[state.maxSoldierType]?.name || '') : '';
    detail.innerHTML = `
      ${starsStr}<br>
      第 ${state.currentLevel} 关 · ${elapsed}秒 · 果堡剩余${Math.round(wallRatio * 100)}%<br>
      🍋 +${totalReward}（基础${state.levelConfig.reward}${bonus > 0 ? ' + 星级'+bonus : ''}）<br>
      ⚔ 击破 ${state.kills} · 合成 ${state.merges} 次${bestType ? ' · 王牌: ' + bestType + ' ' + state.maxSoldierAtk + '攻' : ''}
      ${reportHtml()}
    `;
    playSfx('win');
    if (state.currentLevel >= meta.highestLevel) meta.highestLevel = state.currentLevel + 1;
    /* Item 6: unlock next stage */
    if (!state.endless && typeof STAGES !== 'undefined') {
      const nextId = state.currentLevel + 1;
      if (!meta.unlockedStages) meta.unlockedStages = [];
      if (nextId <= STAGES.length && !meta.unlockedStages.includes(nextId)) meta.unlockedStages.push(nextId);
    }
    /* Item 4: gem rewards */
    if (!state.endless) {
      const prevStars = meta.stars[state.currentLevel] || 0;
      if (prevStars === 0 || (prevStars < stars && stars >= prevStars)) {
        meta.gems = (meta.gems || 0) + (prevStars === 0 ? 5 : 2);
      }
      if (stars >= 3) meta.gems = (meta.gems || 0) + 3;
    }
    nextBtn.classList.remove('hide');
  } else {
    title.textContent = '💀 果堡失守';
    const elapsed = Math.floor(state.time);
    detail.innerHTML = `
      腐坏水果突破了我方果堡。<br>
      建议点击空格消耗果汁召唤水果营，或双击高等级水果营消耗果汁急派兵救线。<br>
      ⚔ 击破 ${state.kills} · 合成 ${state.merges} 次 · ${elapsed}秒
      ${reportHtml()}
    `;
    playSfx('lose');
    nextBtn.classList.add('hide');
  }
  saveMeta();
  refreshGold();
}

function loop(t) {
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;
  update(dt * state.speed);
  draw();
  requestAnimationFrame(loop);
}

loadMeta();
state.phase = 'menu';
requestAnimationFrame(loop);