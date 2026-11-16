/* ===== 首页 · 一条连续蜿蜒地图 + 每单元宝箱 ===== */
(function () {
  const el = id => document.getElementById(id);

  const ICONS = {
    star: '<svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0 1 10 0v2h1.2A1.8 1.8 0 0 1 20 11.8v7.4A1.8 1.8 0 0 1 18.2 21H5.8A1.8 1.8 0 0 1 4 19.2v-7.4A1.8 1.8 0 0 1 5.8 10zm2.4 0h5.2V8a2.6 2.6 0 0 0-5.2 0z"/></svg>',
    boss: '<svg viewBox="0 0 24 24"><path d="M3.5 8.2l4.4 3.1L12 4.2l4.1 7.1 4.4-3.1-1.4 11.1H4.9z"/><rect x="4.5" y="19" width="15" height="2.6" rx="1.3"/></svg>'
  };

  /* 宝箱小图标：颜色由 CSS 变量控制，锁定=灰，解锁=绿，已开=掀盖 */
  function chestSvg() {
    return window.ChestArt ? ChestArt.icon() : '';
  }

  const WAVE = [0, 44, 62, 44, 0, -44, -62, -44];
  const NODE_STEP = 118;
  const BAND_STEP = 58;
  const UNIT_TAIL = 12;
  const NODE_CY = 32;

  let points = [];
  let activeY = 0;
  let activeId = null;
  let activeChest = 0;      // 当前焦点是宝箱时，记录单元号
  let focusChestUnit = 0;   // 结算页点「去开宝箱」后要滚到的单元
  let fxTimers = [];
  let pendingCard = null;   // 单元宝箱里抽到的花卡，收下奖励后再翻开
  let buddyTop = 0, buddyWrapTop = 0;   // 伙伴的文档内基准高度

  /* 地图整体右移，左侧空出一条宽阔的「伙伴区」放放大的卡通形象。
     按屏宽动态计算位移与波浪幅度，保证 320~480px 都不遮住关卡节点。 */
  let SHIFT = 0, AMP = 1, BUDDY_W = 116;
  function layoutFor(w) {
    if (w <= 480) {
      AMP = w < 340 ? 0.72 : (w < 400 ? 0.9 : 1);
      const a = 62 * AMP;
      BUDDY_W = w < 340 ? 104 : (w < 400 ? 116 : 132);
      SHIFT = Math.max(0, Math.round(BUDDY_W + a + 52 + 10 - w / 2));
      const right = w - (w / 2 + SHIFT + a + 52);
      if (right < 6) SHIFT = Math.max(0, SHIFT - (6 - right));
    } else {
      /* 宽屏（桌面/平板）：放大振幅与伙伴区，地图舒展并平衡居中，告别窄栏挤中 */
      AMP = Math.min(1.6, w / 480);
      BUDDY_W = Math.min(190, 132 * AMP);
      const a = 62 * AMP;
      SHIFT = Math.round((BUDDY_W - 60) / 2);
      SHIFT = Math.max(SHIFT, Math.round(BUDDY_W + 20 + a + 52 - w / 2)); // 不压左侧伙伴区
      SHIFT = Math.min(SHIFT, Math.round(w / 2 - 16 - a - 32));           // 不溢出右侧
    }
  }
  const waveX = i => SHIFT + Math.round(WAVE[i % WAVE.length] * AMP);

  function buddyText() {
    /* 成语通关按「关」编排：不再叠加「第X单元 / 下一关 / 第X关」多层编号 */
    const cu = Engine.currentUnit();
    const byLevel = cu && cu.unitNoun === '关';
    if (activeChest) {
      const p = Engine.unitProgress(activeChest);
      return `${byLevel ? '本关' : '本单元'} ${p.total} 课已完成<br>宝箱可以打开了`;
    }
    const lv = activeId && Engine.levelById(activeId);
    if (!lv) return `全部通关啦<br>${Characters.name()}为你鼓掌！`;
    const n = lv.kind === 'boss' ? '期末终极大关' : lv.lessonName.replace(/^\d+\s*/, '');
    return `${byLevel ? '' : '下一关 · '}${n}<br>点亮绿色星星开始`;
  }

  function starsHtml(stars) {
    return [0, 1, 2].map(s =>
      `<svg viewBox="0 0 24 24" style="fill:${s < stars ? '#ffc800' : '#e2e6ec'}"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/></svg>`
    ).join('');
  }

  function place(node, x, y, color) {
    node.style.position = 'absolute';
    node.style.left = `calc(50% + ${x}px)`;
    node.style.top = y + 'px';
    node.style.transform = 'translateX(-50%)';
    node.style.setProperty('--uc', color.main);
    node.style.setProperty('--uc-soft', color.soft);
    node.style.setProperty('--uc-deep', color.deep);
  }

  function lessonNode(lv, x, y, color, isNextOverride) {
    const unlocked = Engine.isUnlocked(lv.id);
    const stars = Store.starsOf(lv.id);
    const isNext = isNextOverride === undefined
      ? (unlocked && stars === 0)
      : (unlocked && isNextOverride);
    const node = document.createElement('div');
    node.className = 'map-node lesson' +
      (unlocked ? (isNext ? ' active' : ' done') : ' locked') +
      (lv.kind === 'boss' ? ' boss' : '');
    place(node, x, y, color);
    const icon = !unlocked ? ICONS.lock
      : (lv.kind === 'boss' ? ICONS.boss : (stars > 0 ? ICONS.check : ICONS.star));
    node.innerHTML = `
      <div class="node-btn">${icon}${isNext ? '<span class="node-badge">开始</span>' : ''}</div>
      <div class="node-label">${lv.kind === 'boss' ? '期末终极大关' : lv.lessonName}</div>
      <div class="node-stars">${starsHtml(stars)}</div>`;
    node.addEventListener('click', () => {
      if (!unlocked) { UI.toast('先通过上一课才能解锁哦'); SFX.wrong(); return; }
      SFX.tap();
      Quiz.start(lv.id);
    });
    return node;
  }

  function chestNode(chest, state, unit, x, y) {
    const node = document.createElement('div');
    node.className = 'chest-node ' + state;
    place(node, x, y, unit.color);
    /* 三种状态都不用文字：未通关=素色加锁，可开=粉金发光，已开=掀盖变淡 */
    node.innerHTML = `
      <div class="cn-box">
        ${chestSvg()}
        ${state === 'locked' ? `<span class="cn-lock">${ICONS.lock}</span>` : ''}
      </div>
      <div class="cn-label">${unit.subtitle}宝箱</div>`;
    node.setAttribute('aria-label',
      state === 'ready' ? `${unit.subtitle}宝箱，点击开启` : `${unit.subtitle}宝箱`);
    node.addEventListener('click', () => {
      if (state === 'locked') {
        const totalQ = unit.levelIds.reduce((n, id) => {
          const lv = Engine.levelById(id);
          return n + (lv ? lv.count : 0);
        }, 0);
        UI.toast(`先通过${unit.subtitle}的全部 ${totalQ} 道题，宝箱就会亮起来啦`);
        SFX.wrong(); return;
      }
      if (state === 'opened') { UI.toast('这个宝箱已经开过啦'); return; }
      SFX.tap();
      openChest(unit.n);
    });
    return node;
  }

  function unitBand(u) {
    const p = Engine.unitProgress(u.n);
    const band = document.createElement('div');
    band.className = 'unit-band' + (Engine.unitComplete(u.n) ? ' complete' : '');
    band.style.setProperty('--uc', u.color.main);
    band.style.setProperty('--uc-soft', u.color.soft);
    const noun = u.unitNoun === '关' ? '关' : '课';
    band.innerHTML = `
      <span class="ub-line"></span>
      <span class="ub-pill"><b>${u.subtitle}</b>${u.title}<i>${p.done}/${p.total} ${noun}</i></span>
      <span class="ub-line"></span>`;
    return band;
  }

  function render() {
    const box = el('mapNodes');
    const buddy = el('mapMascot');
    if (buddy) buddy.remove();
    box.innerHTML = '';
    points = [];
    activeY = 0;
    activeId = null;
    activeChest = 0;
    layoutFor(el('mapWrap').clientWidth || 360);

    let y = 20, seq = 0, foundActive = false;

    Engine.UNITS.forEach(u => {
      const band = unitBand(u);
      band.style.position = 'absolute';
      band.style.top = y + 'px';
      box.appendChild(band);
      y += BAND_STEP;

      u.levelIds.forEach(id => {
        const lv = Engine.levelById(id);
        const x = waveX(seq++);
        const isFocus = !foundActive && Engine.isUnlocked(id) && Store.starsOf(id) === 0;
        box.appendChild(lessonNode(lv, x, y, u.color, isFocus));
        points.push({ x, y: y + NODE_CY, levelId: id, unit: u.n, color: u.color.main });
        if (isFocus) { activeY = y; activeId = id; foundActive = true; }
        y += NODE_STEP;
      });

      const state = Engine.chestState(u.n);
      const cx = waveX(seq++);
      box.appendChild(chestNode(Engine.chestByUnit(u.n), state, u, cx, y));
      points.push({ x: cx, y: y + NODE_CY, chest: true, unit: u.n, state, color: u.color.main });
      /* 宝箱可开时，地图停在这里：先开箱，再往下走 */
      if (!foundActive && state === 'ready') {
        activeY = y; activeId = null; activeChest = u.n; foundActive = true;
      }
      y += NODE_STEP + UNIT_TAIL;
    });

    const boss = Engine.levelById(Engine.FINAL_ID);
    const bx = waveX(seq++);
    const bossColor = { main: '#a568cc', soft: '#f1e6ff', deep: '#8344c4' };
    const bossFocus = !foundActive && Engine.isUnlocked(Engine.FINAL_ID) && Store.starsOf(Engine.FINAL_ID) === 0;
    box.appendChild(lessonNode(boss, bx, y, bossColor, bossFocus));
    points.push({ x: bx, y: y + NODE_CY, levelId: Engine.FINAL_ID, unit: 0, color: bossColor.main });
    if (bossFocus) { activeY = y; activeId = Engine.FINAL_ID; foundActive = true; }
    y += NODE_STEP;

    const totalH = y + 24;
    const wrap = el('mapWrap');
    wrap.style.height = totalH + 'px';
    box.style.height = totalH + 'px';

    wrap.appendChild(buddy);
    placeBuddy();
    el('mbBubble').innerHTML = buddyText();

    drawPaths();
    renderHeader();
    refreshPet();
    /* 单元刚通关、宝箱还没开：无论从结算页过来还是刷新后直接回地图，
       都强制停在这个宝箱，绝不滚到下一单元第一课。 */
    let focusUnit = focusChestUnit;
    focusChestUnit = 0;
    if (!focusUnit) {
      const pend = (Store.pendingChest && Store.pendingChest()) || '';
      if (pend) {
        const pu = Engine.UNITS.find(u => u.chestKey === pend);
        if (pu) focusUnit = pu.n;
      }
    }
    if (focusUnit) {
      const t = points.find(p => p.chest && p.unit === focusUnit && p.state !== 'locked');
      if (t) {
        setTimeout(() => window.scrollTo(0, Math.max(0, t.y - 250)), 90);
        const node = box.querySelectorAll('.chest-node')[t.unit - 1];
        if (node) node.classList.add('focus');
        return;
      }
    }
    autoScroll();
  }

  /* 伙伴：水平居中在左侧伙伴区（不贴边），垂直跟着当前关卡走；
     滚动时若当前关卡离视口太远，就跟着视口移动，随时能看到它。 */
  function placeBuddy() {
    const buddy = el('mapMascot');
    const wrap = el('mapWrap');
    if (!buddy || !wrap) return;
    const w = wrap.clientWidth || 360;
    const a = 62 * AMP;
    const laneRight = w / 2 + SHIFT - a - 52;        // 左侧伙伴区右边界（节点最左位置）
    const bw = Math.min(BUDDY_W, Math.max(88, laneRight - 26));   // 两侧留白，别贴边
    buddy.style.width = bw + 'px';
    buddy.style.left = Math.max(8, Math.round((laneRight - bw) / 2)) + 'px';
    buddy.style.setProperty('--buddy-w', bw + 'px');
    buddyTop = Math.max(0, activeY - 26);
    buddyWrapTop = wrap.getBoundingClientRect().top + window.scrollY;
    syncBuddy();
  }

  function syncBuddy() {
    const buddy = el('mapMascot');
    if (!buddy || !buddy.parentNode) return;
    const vh = window.innerHeight || 800;
    const min = window.scrollY + 96;
    const max = Math.max(min, window.scrollY + vh - 320);
    const y = Math.min(Math.max(buddyWrapTop + buddyTop, min), max);
    buddy.style.top = Math.max(0, Math.round(y - buddyWrapTop)) + 'px';
  }

  window.addEventListener('scroll', syncBuddy, { passive: true });

  function nodeDone(p) {
    if (p.chest) return p.state !== 'locked';
    return Store.starsOf(p.levelId) >= 1;
  }

  function drawPaths() {
    const wrap = el('mapWrap');
    const w = wrap.clientWidth || 360;
    const h = wrap.clientHeight || 1000;
    const svg = el('mapPath');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    const cx = w / 2;
    const P = points.map(p => ({ ...p, px: cx + p.x, py: p.y }));
    let html = '';
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i];
      const my = (a.py + b.py) / 2;
      const d = `M ${a.px} ${a.py} C ${a.px} ${my}, ${b.px} ${my}, ${b.px} ${b.py}`;
      const passed = nodeDone(a) && nodeDone(b);
      html += passed
        ? `<path d="${d}" fill="none" stroke="${b.color}" stroke-opacity=".85" stroke-width="9" stroke-linecap="round"/>`
        : `<path d="${d}" fill="none" stroke="#d6dde6" stroke-width="9" stroke-linecap="round" stroke-dasharray="2 16"/>`;
    }
    svg.innerHTML = html;
  }

  /* 把两个十六进制色按比例混一混（用于生成背景浅色调） */
  function mixHex(a, b, t) {
    const A = a.replace('#', ''), B = b.replace('#', '');
    const p = (h, i) => parseInt(h.slice(i, i + 2), 16);
    const ch = i => Math.round(p(A, i) + (p(B, i) - p(A, i)) * t).toString(16).padStart(2, '0');
    return '#' + ch(0) + ch(2) + ch(4);
  }

  function renderHeader() {
    const u = Engine.currentUnit();
    const bank = Engine.BANK;
    const total = Engine.LEVELS.filter(l => l.kind === 'lesson').length;
    const passed = Engine.LEVELS.filter(l => l.kind === 'lesson' && Store.starsOf(l.id) >= 1).length;
    /* 按「关」编排的题库（成语通关）：副标题不再重复单元名，大标题合并成「第X关 · 主题」 */
    const byLevel = u.unitNoun === '关';
    el('unitBannerSub').textContent = byLevel
      ? `${bank.book} · ${passed}/${total} 关`
      : `${u.subtitle} · ${bank.book} · ${passed}/${total} 课`;
    el('unitBannerTitle').textContent = byLevel ? `${u.subtitle} · ${u.title}` : u.title;
    el('unitBanner').style.background =
      `linear-gradient(135deg, ${u.color.main}, ${u.color.deep})`;
    /* 页面上半部分铺一层本单元的浅色，随滚动淡出 */
    const sc = el('screen-home');
    if (sc) {
      sc.style.setProperty('--uc', u.color.main);
      sc.style.setProperty('--uc-soft', u.color.soft);
      /* 顶部氛围色：单元色先冲淡到近白，再拉向中性灰蓝，避免暖色单元铺出整片土黄 */
      const wash = mixHex(mixHex(u.color.main, '#FFFFFF', 0.9), '#E9EEF1', 0.55);
      sc.style.setProperty('--uc-wash', wash);
    }
    el('subjectName').textContent = bank.subject;
    const sub = ((window.SUBJECTS || {}).list || []).find(s => s.key === bank.subjectKey);
    el('subjectFlag').textContent = sub ? sub.flag : bank.subject.slice(0, 1);
    UI.renderCoin();
  }

  function autoScroll() {
    if (Store.totalStars() === 0) return;
    setTimeout(() => window.scrollTo(0, Math.max(0, activeY - 210)), 70);
  }

  /* ---------- 开宝箱 ----------
     顺序很重要：先真正发奖（金币 / 道具 / 花卡）→ 写收据 → 最后才记已开。
     旧版先 markChest 再发奖，一旦中途异常（iOS 上演出报错、云同步覆盖）
     就会出现「宝箱自动变成打开状态，却没收到金币和花卡」。 */
  let openingChest = false;
  function openChest(unitN) {
    if (openingChest) return;                       // 防 iOS 幽灵点击 / 连点重复触发
    const u0 = Engine.unitById(unitN);
    if (!u0) return;
    const key = u0.chestKey || ('u' + unitN);
    if (Store.chestAwarded && Store.chestAwarded(key)) { UI.toast('这个宝箱已经开过啦'); return; }
    const noun = u0.unitNoun === '关' ? '本关' : '本单元';
    if (!Engine.unitComplete(unitN)) { UI.toast(`先通关${noun}的所有课才能开宝箱`); return; }

    openingChest = true;
    try {
      const loot = Engine.chestLoot();
      const flowerCard = Cards.chest();
      if (loot.coins) Store.addCoins(loot.coins, true);
      if (loot.item) Store.addItem(loot.item, 1);
      /* 收据与「已开」标记必须在奖励确实入账之后 */
      Store.markChest(key);
      if (Store.markChestAwarded) Store.markChestAwarded(key);
      if (Store.clearPendingChest) Store.clearPendingChest(key);
      UI.renderCoin();
      pendingCard = flowerCard;

      const finishShow = () => {
        render();
        const c = pendingCard;
        pendingCard = null;
        if (c) Cards.show([c], u0.unitNoun === '关' ? `${u0.subtitle}宝箱` : '单元宝箱');
        else if (Cards.complete()) UI.toast('108 张已集齐，去花卡召唤花仙子吧');
      };
      try {
        ChestFx.show({
          kicker: `${u0.subtitle} · ${u0.title}`,
          coins: loot.coins,
          item: loot.item,
          rare: loot.rare,
          card: flowerCard,
          onDone: finishShow
        });
      } catch (e) {
        /* 演出本身出错也绝不吞掉奖励：直接把花卡翻出来并提示金币 */
        console.warn('开箱演出失败，已改用兜底展示', e);
        UI.toast(`宝箱开启！+${loot.coins || 0} 金币`);
        finishShow();
      }
    } finally {
      /* 演出是全屏浮层，等用户点「收下」后再解锁，避免同一串幽灵点击再次开箱 */
      setTimeout(() => { openingChest = false; }, 600);
    }
  }

  function closeChestFx() {
    if (window.ChestFx) ChestFx.close();
  }

  function refreshPet() {
    const stage = Store.petStage();
    const img = el('mapMascot').querySelector('img');
    img.dataset.stage = stage;
    img.src = Characters.src('normal', stage);
  }

  /* 结算页点「去开宝箱」：先登记焦点，由随后 App.go('home') 的那一次 render
     统一滚动定位；不再自己 render，避免两次渲染/滚动互相打架。 */
  function setChestFocus(unitN) { focusChestUnit = unitN || 0; }
  function focusChest(unitN) {
    setChestFocus(unitN);
    render();   // 兼容旧调用：仍然立即渲染一次
  }

  window.Home = {
    render() { render(); },
    drawPaths, openChest, closeChestFx, focusChest, setChestFocus
  };

  window.addEventListener('resize', () => {
    if (document.getElementById('screen-home').classList.contains('active')) render();
  });
})();
