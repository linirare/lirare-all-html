/* ============================================================
   水果突击 · Bottom Navigation + Shop + Ladder(Endless)
   Loaded LAST. Injects nav bar, shop panel, ladder panel.
   ============================================================ */
(function installBottomNav() {
  const NAV_KEY = 'merge_td_nav_v1';
  const DAILY_REWARD = 50;
  const GEMS_DAILY = 2;

  const TABS = [
    { id: 'battle',  icon: '⚔️', label: '战斗', panel: 'menuPanel'     },
    { id: 'upgrade', icon: '🍉', label: '养成', panel: 'fruitLabPanel' },
    { id: 'shop',    icon: '🛒', label: '商城', panel: 'shopPanel'     },
    { id: 'ladder',  icon: '🏆', label: '天梯', panel: 'ladderPanel'   },
  ];

  let activeTab = 'battle';
  let prevPhase = '';
  let navData = { ladderBest: 0, lastDaily: '' };

  /* ---------- nav data persistence ---------- */
  function loadNavData() {
    try { const r = localStorage.getItem(NAV_KEY); if (r) navData = Object.assign(navData, JSON.parse(r)); } catch (e) {}
  }
  function saveNavData() {
    try { localStorage.setItem(NAV_KEY, JSON.stringify(navData)); } catch (e) {}
  }
  function todayStr() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* ---------- DOM injection ---------- */
  function ensureNavBar() {
    if (document.getElementById('bottomNav')) return;
    const nav = document.createElement('div');
    nav.id = 'bottomNav';
    nav.innerHTML = TABS.map(t =>
      `<button class="bnav-tab" data-tab="${t.id}"><span class="bnav-icon">${t.icon}</span><span>${t.label}</span></button>`
    ).join('');
    document.body.appendChild(nav);
    nav.querySelectorAll('.bnav-tab').forEach(btn =>
      btn.addEventListener('click', () => showTab(btn.dataset.tab)));
  }

  function ensureShopPanel() {
    if (document.getElementById('shopPanel')) return;
    const p = document.createElement('div');
    p.id = 'shopPanel'; p.className = 'panel hide';
    p.innerHTML =
      '<div class="panel-inner wide">' +
        '<div style="width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
          '<div><h2>🛒 果园商城</h2><p class="sub">抽卡得新水果 · 礼包买增益</p></div>' +
          '<div style="display:flex;gap:6px;">' +
            '<div class="shop-gold">💎 <b id="shopGems">0</b></div>' +
            '<div class="shop-gold">🍋 <b id="shopGold">0</b></div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:4px;margin:6px 0 8px;">' +
          '<button id="shopTabGacha" class="btn-secondary small" style="flex:1;">🎴 抽卡</button>' +
          '<button id="shopTabBundles" class="btn-secondary small" style="flex:1;">🎁 礼包</button>' +
        '</div>' +
        '<div id="shopList" class="shop-list"></div>' +
      '</div>';
    document.body.appendChild(p);
    document.getElementById('shopTabGacha').addEventListener('click', () => renderShop('gacha'));
    document.getElementById('shopTabBundles').addEventListener('click', () => renderShop('bundles'));
  }

  function ensureLadderPanel() {
    if (document.getElementById('ladderPanel')) return;
    const p = document.createElement('div');
    p.id = 'ladderPanel'; p.className = 'panel hide';
    p.innerHTML =
      '<div class="panel-inner">' +
        '<h2>🏆 无尽天梯</h2>' +
        '<p class="sub">一波波腐坏水果来袭，坚持得越久越强</p>' +
        '<div class="ladder-best">历史最佳 <b id="ladderBest">0</b> 波</div>' +
        '<div class="ladder-rules">' +
          '<p>· 清空敌方果堡即进入下一波，敌人越来越强</p>' +
          '<p>· 我方果堡不重置，清波回复少量耐久</p>' +
          '<p>· 果堡被攻破即结算，坚持越久果汁越多</p>' +
        '</div>' +
        '<button id="btnLadderStart" class="btn-primary">开始挑战</button>' +
      '</div>';
    document.body.appendChild(p);
  }

  /* ---------- tab switching ---------- */
  function hideAllTabPanels() {
    TABS.forEach(t => {
      const el = document.getElementById(t.panel);
      if (el) el.classList.add('hide');
    });
  }

  function updateHighlight() {
    document.querySelectorAll('.bnav-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === activeTab));
  }

  function showTab(id) {
    activeTab = id;
    hideAllTabPanels();
    if (id === 'battle') {
      document.getElementById('menuPanel').classList.remove('hide');
      if (typeof refreshGold === 'function') refreshGold();
    } else if (id === 'upgrade') {
      showUpgradeTab();
    } else if (id === 'shop') {
      document.getElementById('shopPanel').classList.remove('hide');
      renderShop('gacha');
    } else if (id === 'ladder') {
      document.getElementById('ladderPanel').classList.remove('hide');
      renderLadder();
    }
    updateHighlight();
  }

  function showUpgradeTab() {
    if (typeof openFruitLabV21 === 'function') openFruitLabV21();
    else {
      const panel = document.getElementById('fruitLabPanel');
      if (panel) panel.classList.remove('hide');
    }
    // Fruit Lab's original close handler uses { once: true } — replace with persistent one
    const closeBtn = document.getElementById('btnFruitLabClose');
    if (closeBtn) {
      const clone = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(clone, closeBtn);
      clone.addEventListener('click', function closeLab() {
        if (typeof saveMeta === 'function') saveMeta();
        if (typeof refreshGold === 'function') refreshGold();
        document.getElementById('fruitLabPanel').classList.add('hide');
        showTab('battle');
      });
    }
  }

  /* ---------- nav visibility ---------- */
  function syncNavVisibility() {
    const nav = document.getElementById('bottomNav');
    if (!nav) return;
    const isMenu = state.phase === 'menu';
    nav.classList.toggle('bnav-hidden', !isMenu);
    if (isMenu && prevPhase !== 'menu' && prevPhase !== '') {
      showTab('battle');
    }
    prevPhase = state.phase;
  }

  /* ---------- Shop ---------- */
  const SHOP_BUNDLES = [
    {
      id: 'atk_all', name: '🍒 全体攻击强化', desc: '全部水果攻击科技 +1 级', cost: 180,
      apply: function() {
        for (const uid of UNIT_POOL) {
          const k = upgradeKey(uid, 'atk');
          const lv = meta.upgrades[k] || 0;
          if (lv < UPGRADE_MAX) meta.upgrades[k] = lv + 1;
        }
      },
    },
    {
      id: 'fort_pump', name: '🏰 果堡+果汁礼包', desc: '果堡加固 +1、果汁泵 +1', cost: 150,
      apply: function() { meta.wallLv = (meta.wallLv || 0) + 1; meta.spLv = (meta.spLv || 0) + 1; },
    },
  ];

  function claimDaily() {
    if (navData.lastDaily === todayStr()) return;
    navData.lastDaily = todayStr();
    saveNavData();
    meta.gold = (meta.gold || 0) + DAILY_REWARD;
    meta.gems = (meta.gems || 0) + GEMS_DAILY;
    if (typeof saveMeta === 'function') saveMeta();
    if (typeof refreshGold === 'function') refreshGold();
    renderShop('bundles');
  }

  function buyBundle(b) {
    if ((meta.gold || 0) < b.cost) return;
    meta.gold -= b.cost;
    b.apply();
    if (typeof saveMeta === 'function') saveMeta();
    if (typeof refreshGold === 'function') refreshGold();
    renderShop();
  }

  function shopRow(name, desc, action, enabled, onClick) {
    const el = document.createElement('div');
    el.className = 'shop-item' + (enabled ? '' : ' disabled');
    el.innerHTML = '<div class="shop-info"><b>' + name + '</b><small>' + desc + '</small></div>' +
      '<button class="shop-buy"' + (enabled ? '' : ' disabled') + '>' + action + '</button>';
    if (enabled && onClick) el.querySelector('button').addEventListener('click', onClick);
    return el;
  }

  function renderShop(subTab) {
    if (!subTab) subTab = 'gacha';
    const goldEl = document.getElementById('shopGold');
    if (goldEl) goldEl.textContent = meta.gold || 0;
    const gemsEl = document.getElementById('shopGems');
    if (gemsEl) gemsEl.textContent = meta.gems || 0;
    const list = document.getElementById('shopList');
    if (!list) return;
    const gachaBtn = document.getElementById('shopTabGacha');
    const bundlesBtn = document.getElementById('shopTabBundles');
    if (gachaBtn) gachaBtn.style.opacity = subTab === 'gacha' ? '1' : '0.5';
    if (bundlesBtn) bundlesBtn.style.opacity = subTab === 'bundles' ? '1' : '0.5';
    if (subTab === 'gacha') {
      if (typeof renderGachaShop === 'function') { renderGachaShop(list); return; }
      else { list.innerHTML = '<p style="color:#8aad6a;text-align:center;">抽卡系统加载中...</p>'; return; }
    }
    list.innerHTML = '';
    const claimed = navData.lastDaily === todayStr();
    list.appendChild(shopRow('🎁 每日果汁补给', '每天领取 ' + DAILY_REWARD + '🍋 + ' + GEMS_DAILY + '💎',
      claimed ? '已领取' : '领取', !claimed, claimDaily));
    for (const b of SHOP_BUNDLES) {
      const can = (meta.gold || 0) >= b.cost;
      list.appendChild(shopRow(b.name, b.desc, b.cost + '🍋', can, function() { buyBundle(b); }));
    }
    list.appendChild(shopRow('💎 果汁充值包', '真实充值 · 敬请期待', '敬请期待', false, null));
  }

  /* ---------- Ladder / Endless ---------- */
  function renderLadder() {
    const el = document.getElementById('ladderBest');
    if (el) el.textContent = navData.ladderBest || 0;
  }

  function startLadder() {
    state.endless = true;
    state._endlessResult = false;
    state.endlessWave = 1;
    hideAllTabPanels();
    const resultPanel = document.getElementById('resultPanel');
    if (resultPanel) resultPanel.classList.add('hide');
    meta.deck = typeof normalizeDeck === 'function' ? normalizeDeck(meta.deck) : meta.deck;
    if (typeof initLevel === 'function') initLevel(1);
    syncNavVisibility();
  }

  function advanceEndlessWave() {
    state.endlessWave++;
    const w = state.endlessWave;
    const diffK = 2 + w * 2;
    const lv = typeof generateLevel === 'function' ? generateLevel(diffK) : { enemyInitLevel: 1 + w * 0.3 };
    state.levelConfig = lv;

    // Reset enemy wall
    state.enemyWallMax = Math.max(40, Math.round(46 * Math.pow(1.14, w)));
    state.enemyWallHp = state.enemyWallMax;

    // Clear & refill enemy board
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) state.enemySlots[r][c] = null;
    if (typeof initEnemyOpening === 'function')
      initEnemyOpening(diffK, Math.min(7, Math.max(1, Math.floor(lv.enemyInitLevel))));

    // Reset enemy SP economy
    state.enemySp = Math.min(12 + w * 2, 40);
    state.enemySummonCostCounter = 1;
    state.enemySpCheckTimer = 0;
    state.enemySpTimer = 0;
    state._enemyReinforcePause = 1.2;

    // Heal player wall a bit
    state.playerWallHp = Math.min(state.playerWallMax, state.playerWallHp + 10);

    // Clear dead soldiers
    state.playerSoldiers = state.playerSoldiers.filter(function(s) { return s.alive; });
    state.enemySoldiers = state.enemySoldiers.filter(function(s) { return s.alive; });

    if (typeof addFx === 'function')
      addFx(W / 2, LAYOUT.fieldY + LAYOUT.fieldH / 2, '第 ' + w + ' 波来袭!', '#ff5d6c', 18);
    if (typeof playSfx === 'function') playSfx('merge');

    state.phase = 'playing';
  }

  function endlessGameOver(win) {
    if (win) { advanceEndlessWave(); return; }

    const cleared = state.endlessWave - 1;
    const best = navData.ladderBest || 0;
    const isBest = cleared > best;
    if (isBest) { navData.ladderBest = cleared; saveNavData(); }
    const reward = cleared * 6;
    meta.gold = (meta.gold || 0) + reward;
    if (typeof saveMeta === 'function') saveMeta();
    if (typeof refreshGold === 'function') refreshGold();
    state.endless = false;
    state._endlessResult = true;

    // Show result
    const panel = document.getElementById('resultPanel');
    const title = document.getElementById('resultTitle');
    const detail = document.getElementById('resultDetail');

    document.getElementById('btnNext').classList.add('hide');
    document.getElementById('btnRetry').textContent = '再来一次';
    document.getElementById('btnMenu').textContent = '返回天梯';

    // Use capture-phase to intercept before campaign handlers (ui.js DOMContentLoaded)
    // Remove old capture handlers to avoid stacking
    if (btnRetry._endlessCapture) btnRetry.removeEventListener('click', btnRetry._endlessCapture, true);
    if (btnMenu._endlessCapture) btnMenu.removeEventListener('click', btnMenu._endlessCapture, true);

    function endlessRetryHandler(e) {
      if (!state._endlessResult) return;
      e.stopImmediatePropagation();
      document.getElementById('resultPanel').classList.add('hide');
      state._endlessResult = false;
      startLadder();
    }
    function endlessMenuHandler(e) {
      if (!state._endlessResult) return;
      e.stopImmediatePropagation();
      document.getElementById('resultPanel').classList.add('hide');
      state._endlessResult = false;
      state.phase = 'menu';
      showTab('ladder');
    }

    var btnRetry = document.getElementById('btnRetry');
    var btnMenu = document.getElementById('btnMenu');
    btnRetry._endlessCapture = endlessRetryHandler;
    btnMenu._endlessCapture = endlessMenuHandler;
    btnRetry.addEventListener('click', endlessRetryHandler, true);
    btnMenu.addEventListener('click', endlessMenuHandler, true);

    title.textContent = '🏁 天梯挑战结束';
    detail.innerHTML =
      (isBest ? '🎉 新纪录！<br>' : '') +
      '坚持 <b>' + cleared + '</b> 波<br>' +
      '历史最佳 ' + Math.max(best, cleared) + ' 波<br>' +
      '🍋 +' + reward + '<br>' +
      '⚔ 击破 ' + (state.kills || 0);
    panel.classList.remove('hide');
    if (typeof playSfx === 'function') playSfx(isBest ? 'win' : 'lose');
  }

  function hookGameOver() {
    if (typeof onGameOver !== 'function' || onGameOver._navWrapped) return;
    var orig = onGameOver;
    onGameOver = function navGameOver(win) {
      if (state.endless) return endlessGameOver(win);
      return orig(win);
    };
    onGameOver._navWrapped = true;
  }

  /* ---------- init ---------- */
  function init() {
    loadNavData();
    ensureShopPanel();
    ensureLadderPanel();
    ensureNavBar();
    hookGameOver();
    // Hide btnDeck in menu (养成 moved to nav tab)
    var deckBtn = document.getElementById('btnDeck');
    if (deckBtn) deckBtn.style.display = 'none';
    // Show battle tab by default
    showTab('battle');
    // Poll nav visibility
    setInterval(syncNavVisibility, 150);
    syncNavVisibility();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
