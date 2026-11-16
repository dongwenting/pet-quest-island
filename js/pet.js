/* ===== 宠物养成 / 商店 ===== */
(function () {
  const el = id => document.getElementById(id);
  let mounted = false, tab = 'food';
  let picked = null;             // 当前选中的食物 id
  let sayTimer = null;
  let patLock = 0, playLock = 0;
  let holdTimer = null, longPatFlag = false;   // 长按撸宠（900ms）
  let combo = 0, lastPatAt = 0;                // 连击：只加表演，不额外刷数值
  let idleTimer = null;                        // 待机小动作

  const STAGE_NAME = { 1: '幼芽期', 2: '嫩芽期', 3: '星芽期', 4: '传说期' };
  const MOOD_TEXT = {
    happy: ['心情超好', '开心得冒泡', '元气满满'],
    normal: ['心情不错', '安安静静', '想和你玩'],
    sad: ['有点低落', '想被抱抱', '需要关心']
  };
  const FOOD_LINES = [
    '很好吃，谢谢你', '这个我最喜欢', '好香',
    '再来一口', '吃饱了，谢谢'
  ];
  const PAT_LINES = [
    '很舒服', '再摸摸头', '有点痒', '最喜欢你', '呼噜呼噜'
  ];
  const PLAY_LINES = [
    '接住了', '一起玩真好', '再来一次', '跑起来真轻快'
  ];
  /* 部位触摸：头 / 耳 / 肚 / 爪各一套反应。纯表演，不加数值。
     连击与长按共用同一套冷却：一次有效抚摸只结算一次心情。 */
  const ZONE_LINES = {
    head:  ['摸摸头～', '头顶暖暖的', '最喜欢被摸头了'],
    ear:   ['耳朵痒痒的！', '别揪耳朵啦', '耳朵竖起来了'],
    belly: ['肚皮好舒服', '咕噜咕噜', '有点痒！'],
    paws:  ['握手手～', '爪子被抓住啦', '呀，别挠脚心']
  };
  const ZONE_FX = { head: 'pat', ear: 'pat', belly: 'tickle', paws: 'shake' };
  const PURR_LINES = ['呼噜…呼噜…', '赖着不走了', '再摸一会儿嘛'];
  const COMBO_LINES = ['哈哈，好痒！', '停不下来了～', '你今天特别黏我'];
  /* 待机：空闲时按饥饿 / 心情 / 时段说不同的话，让宠物像活的 */
  const IDLE_ACTS = ['blink', 'yawn', 'stretch', 'look'];
  const IDLE_LINES = {
    hungry: ['肚子咕咕叫了…', '有点想吃东西'],
    sad:    ['陪我一会儿好吗', '有点想你'],
    night:  ['有点困了…', '陪我熬到这么晚呀'],
    normal: ['今天学了什么呀？', '窗外的云好软', '伸个懒腰～', '在等你回来', '要不要摸摸我？']
  };
  const IDLE_MS = 8000;
  const pickLine = arr => arr[Math.floor(Math.random() * arr.length)];
  /* 服饰穿戴画法统一由 js/wearart.js 提供：商店图标与宠物页共用同一份 SVG */

  /* ---------- 宠物小家：场景 ---------- */
  function scenes() { return (window.Engine && Engine.SCENES) || []; }
  function currentScene() { return Store.currentScene ? Store.currentScene() : 'living'; }
  function sceneInfo(id) { return scenes().find(s => s.id === id) || null; }
  function furnitureOf(scene) {
    const all = (window.Engine && Engine.SHOP && Engine.SHOP.furniture) || [];
    return all.filter(f => f.scene === scene);
  }
  function placedCount(scene) {
    const ids = Store.s.decor || [];
    return furnitureOf(scene).filter(f => ids.includes(f.id)).length;
  }

  /* 切换房间：换整幅背景、重绘商店与家具；已摆放的家具按场景各自保留 */
  function applyScene() {
    const list = scenes();
    const id = currentScene();
    const info = sceneInfo(id);
    const stage = el('petStage');
    if (stage) {
      list.forEach(s => stage.classList.remove('scene-' + s.id));
      if (info) {
        stage.classList.add('scene-' + info.id);
        stage.style.backgroundImage = `url("${info.bg}")`;
      }
    }
    const chips = el('sceneChips');
    if (chips) {
      chips.innerHTML = list.map(s =>
        `<button class="sb-chip${s.id === id ? ' active' : ''}" data-scene="${s.id}" type="button">${s.icon} ${s.name}</button>`
      ).join('');
    }
    const desc = el('sceneDesc');
    if (desc && info) {
      desc.textContent = `${info.name} · ${info.desc} · 已摆放 ${placedCount(id)}/${(Engine.ECON || {}).maxFurniture || 8} 件`;
    }
    /* 换房间会改变窗户 / 窗帘几何，通知氛围层按新房间重算昼夜主题 */
    if (window.RoomTheme && RoomTheme.apply) RoomTheme.apply(id);
  }

  function shell() {
    if (mounted) return;
    mounted = true;
    el('feedBtn').addEventListener('click', feed);
    el('petPlayBtn').addEventListener('click', play);
    el('petPatBtn').addEventListener('click', () => pat('btn'));
    el('petFigure').addEventListener('click', e => pat('tap', e));
    el('petTapHint').addEventListener('click', () => pat('tap'));
    /* 长按 900ms 触发呼噜：动画先起，台词与数值由随后的 click 统一结算，避免重复 */
    const fig = el('petFigure');
    fig.addEventListener('pointerdown', () => {
      longPatFlag = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        longPatFlag = true;
        playFx('purr');
        hearts(5);
      }, 900);
    });
    fig.addEventListener('pointerup', () => clearTimeout(holdTimer));
    ['pointerleave', 'pointercancel'].forEach(t => fig.addEventListener(t, () => {
      clearTimeout(holdTimer);
      longPatFlag = false;
    }));
    el('shopTabs').addEventListener('click', e => {
      const t = e.target.closest('.tab');
      if (!t) return;
      tab = t.dataset.tab;
      document.querySelectorAll('#shopTabs .tab').forEach(x => x.classList.toggle('active', x === t));
      SFX.tap();
      renderShop();
    });
    el('sceneChips').addEventListener('click', e => {
      const b = e.target.closest('.sb-chip');
      if (!b) return;
      const id = b.dataset.scene;
      if (!id || id === currentScene()) return;
      Store.setScene(id);
      SFX.tap();
      render();
      const info = sceneInfo(id);
      UI.toast(`来到了${info ? info.name : '新房间'}`);
      say(`${info ? info.name : '新房间'}布置好啦，来坐坐～`, 2000);
    });
  }

  /* ---------- 说话气泡 ---------- */
  function say(text, ms) {
    const b = el('petSpeech');
    b.innerHTML = `<span>${text}</span>`;
    b.classList.add('show');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => b.classList.remove('show'), ms || 2200);
  }

  /* ---------- 飘心特效 ---------- */
  function hearts(n) {
    const box = el('petFx');
    const marks = ['💗', '💕', '✨', '💖'];
    for (let i = 0; i < (n || 5); i++) {
      const h = document.createElement('i');
      h.textContent = marks[i % marks.length];
      h.style.left = (32 + Math.random() * 36) + '%';
      h.style.bottom = (44 + Math.random() * 16) + '%';
      h.style.animationDelay = (i * 0.07) + 's';
      h.style.fontSize = (16 + Math.random() * 8) + 'px';
      box.appendChild(h);
      setTimeout(() => h.remove(), 1500);
    }
  }

  const FX_CLASSES = ['pat', 'play', 'feed', 'tickle', 'shake', 'purr',
                      'idle-blink', 'idle-yawn', 'idle-stretch', 'idle-look'];
  function playFx(cls) {
    const fig = el('petFigure');
    FX_CLASSES.forEach(c => fig.classList.remove(c));
    void fig.offsetWidth;
    fig.classList.add(cls);
    const dur = cls.indexOf('idle-') === 0 ? 1350 : (cls === 'purr' ? 2300 : 820);
    setTimeout(() => fig.classList.remove(cls), dur);
  }

  /* 喂中今日口味：星星雨（复用 pet-fx 的飘心动画） */
  function favBurst() {
    const box = el('petFx');
    const marks = ['⭐', '✨', '💛', '🌟'];
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('i');
      s.textContent = marks[i % marks.length];
      s.style.left = (20 + Math.random() * 60) + '%';
      s.style.bottom = (40 + Math.random() * 28) + '%';
      s.style.animationDelay = (i * 0.05) + 's';
      s.style.fontSize = (14 + Math.random() * 10) + 'px';
      box.appendChild(s);
      setTimeout(() => s.remove(), 1600);
    }
  }

  /* ---------- 待机小动作 ---------- */
  function petScreenOn() {
    const sc = document.getElementById('screen-pet');
    return !!sc && sc.classList.contains('active');
  }
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(idleAct, IDLE_MS + Math.random() * 6000);
  }
  function idleAct() {
    if (!petScreenOn()) { resetIdle(); return; }   // 不在宠物页不弹气泡
    const p = Store.s.pet, hour = new Date().getHours();
    let kind = 'normal';
    if (p.hunger < 30) kind = 'hungry';
    else if (p.mood < 30) kind = 'sad';
    else if (hour >= 21 || hour < 6) kind = 'night';
    playFx('idle-' + pickLine(IDLE_ACTS));
    say(pickLine(IDLE_LINES[kind]), 2600);          // 只出气泡，不突然出声
    resetIdle();
  }

  /* 点击位置 → 身体部位（头 / 耳 / 肚 / 爪） */
  function zoneOf(e) {
    if (!e || !e.currentTarget || e.currentTarget.id !== 'petFigure') return 'head';
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width || !r.height) return 'head';
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    if (y < 0.32) return (x < 0.3 || x > 0.7) ? 'ear' : 'head';
    if (y < 0.72) return 'belly';
    return 'paws';
  }

  /* ---------- 渲染 ---------- */
  function render() {
    shell();
    const s = Store.s, p = s.pet;
    const stage = Store.petStage();
    const lv = Store.petLevel();
    const charName = Characters.name();
    const mood = Store.petMood();

    const img = el('petImg');
    img.dataset.stage = stage;
    img.src = Characters.src('normal', stage);
    const isBodyArt = !!Characters.get() && !!Characters.get().files && !!Characters.get().files.body;
    img.classList.toggle('body-art', isBodyArt);            /* 立绘类形象按整身显示 */
    const figEl = el('petFigure');
    if (figEl) figEl.classList.toggle('has-body', isBodyArt);

    el('petTitle').textContent = '我的' + charName;
    el('petSub').textContent = `累计学习 ${Store.studyDays()} 天 · 陪它一起长大`;
    el('petStageTag').textContent = STAGE_NAME[stage];
    el('petName').textContent = `${charName} · Lv.${lv} ${STAGE_NAME[stage]}`;

    /* 状态标签 */
    const moodTexts = MOOD_TEXT[mood];
    el('petMoodTag').textContent = moodTexts[Math.floor(Math.random() * moodTexts.length)];
    el('petMoodTag').className = 'pn-tag' + (mood === 'sad' ? ' warn' : '');
    const hungerTag = el('petHungerTag');
    hungerTag.textContent = p.hunger >= 80 ? '吃得饱饱' : p.hunger >= 40 ? '有点饿了' : '肚子空空的';
    hungerTag.className = 'pn-tag ghost' + (p.hunger < 40 ? ' warn' : '');

    setBar('hungerBar', 'hungerVal', p.hunger, p.hunger < 30);
    setBar('moodBar', 'moodVal', p.mood, p.mood < 30);

    renderWear();
    applyScene();

    /* 进化进度 */
    const days = Store.studyDays();
    let pct;
    if (days < 7) pct = days / 7 * 25;
    else if (days < 30) pct = 25 + (days - 7) / 23 * 25;
    else if (days < 100) pct = 50 + (days - 30) / 70 * 50;
    else pct = 100;
    el('evoBar').style.width = Math.min(100, pct) + '%';
    const next = days < 7 ? `再学 ${7 - days} 天进入嫩芽期`
      : days < 30 ? `再学 ${30 - days} 天进入星芽期`
        : days < 100 ? `再学 ${100 - days} 天进入传说期` : '已到传说期，继续陪它吧';
    el('evoHint').textContent = next;

    renderFood();
    renderShop();
    renderDecor();
    updateActions();
    resetIdle();                 // 有任何互动就重新计时，避免说话打断操作
  }

  function setBar(barId, valId, v, low) {
    el(barId).style.width = Math.max(0, Math.min(100, v)) + '%';
    el(valId).textContent = Math.round(v);
    el(barId).closest('.pbar').classList.toggle('low', !!low);
  }

  /* ---------- 穿戴：按部位叠在宠物身上 ---------- */
  function renderWear() {
    const eq = Store.s.equipped || {};
    const front = [], back = [];
    Engine.SHOP.wear.forEach(it => {
      if (!Object.keys(eq).some(k => eq[k] === it.id)) return;
      const art = window.WearArt && WearArt.get(it.id);
      if (!art) return;
      if (art.back) back.push(art.back);
      if (art.front) front.push(art.front);
    });
    el('petWearBack').innerHTML = back.join('');
    el('petWearFront').innerHTML = front.join('');
  }

  function isWorn(id) {
    return Object.keys(Store.s.equipped || {}).some(k => Store.s.equipped[k] === id);
  }

  /* ---------- 食物栏：可选中 ---------- */
  function foods() { return Engine.SHOP.food; }
  function ownedOf(id) { return Store.s.inv[id] || 0; }

  function ensurePick() {
    const list = foods();
    if (picked) {
      const cur = list.find(f => f.id === picked);
      if (cur && ownedOf(cur.id) > 0) return cur;
    }
    picked = (list.find(f => ownedOf(f.id) > 0) || {}).id || null;
    return list.find(f => f.id === picked) || null;
  }

  function renderFood() {
    const row = el('foodRow');
    /* 排序：已购买的排前面（数量从多到少），没买的按原顺序排后面 */
    const all = foods();
    const list = all.filter(f => ownedOf(f.id) > 0)
      .sort((a, b) => ownedOf(b.id) - ownedOf(a.id))
      .concat(all.filter(f => ownedOf(f.id) <= 0));
    const cur = ensurePick();
    const fav = Store.todayFav();
    const fh = el('favHint');
    if (fh) {
      const names = fav.map(id => (list.find(f => f.id === id) || {}).name).filter(Boolean);
      fh.innerHTML = names.length
        ? `<span class="pf-fav-ico">🍽️</span>今天最想吃：<b>${names.join('、')}</b><em>已喂中 ${Store.s.pet.favHits || 0} 次</em>`
        : '';
    }
    if (!list.some(f => ownedOf(f.id) > 0)) {
      row.innerHTML = `<p class="pf-empty">背包空了，去下面商店买点吃的</p>`;
      el('foodHint').textContent = '还没有食物';
      return;
    }
    row.innerHTML = list.map(f => {
      const n = ownedOf(f.id);
      const isFav = fav.includes(f.id);
      const art = f.img
        ? `<img src="${f.img}" alt="">`
        : `<span class="pf-emoji">${f.emoji || '🍬'}</span>`;
      return `<button class="pf-chip ${f.id === picked ? 'on' : ''} ${n ? '' : 'empty'}${isFav ? ' fav' : ''}" data-food="${f.id}" ${n ? '' : 'disabled'}>
        <span class="pf-num">${n}</span>
        ${isFav ? '<span class="pf-fav-star">⭐</span>' : ''}
        ${art}
        <div class="pf-name">${f.name}</div>
        <div class="pf-gain">饱食+${f.hunger}</div>
      </button>`;
    }).join('');
    row.querySelectorAll('.pf-chip').forEach(b => {
      b.addEventListener('click', () => {
        if (b.disabled) { UI.toast('这个食物吃完了，去商店买一点吧'); return; }
        picked = b.dataset.food;
        SFX.tap();
        if (cur && cur.id !== picked) say(`想吃${b.querySelector('.pf-name').textContent}！`, 1400);
        renderFood();
        updateActions();
      });
    });
    const c = foods().find(f => f.id === picked);
    el('foodHint').textContent = c ? `已选：${c.name}（还剩 ${ownedOf(c.id)} 个）` : '选一种，再点「喂食」';
    /* 让当前选中的食物滚进可视区（列表可拖动横滑） */
    const on = row.querySelector('.pf-chip.on');
    if (on) row.scrollLeft = Math.max(0, on.offsetLeft - row.clientWidth / 2 + on.offsetWidth / 2);
    enableDragScroll(row);
  }

  /* 食物栏鼠标拖动横滑：按住左键左右拖；移动端走原生触摸滚动 */
  function enableDragScroll(node) {
    if (!node || node.dataset.dragBound) return;
    node.dataset.dragBound = '1';
    let down = null;
    node.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = { x: e.clientX, l: node.scrollLeft, moved: false };
    });
    node.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (Math.abs(dx) > 5) { down.moved = true; node.classList.add('dragging'); }
      node.scrollLeft = down.l - dx;
    });
    const up = () => { down = null; requestAnimationFrame(() => node.classList.remove('dragging')); };
    node.addEventListener('pointerup', up);
    node.addEventListener('pointerleave', up);
    /* 拖动后松手不触发点击 */
    node.addEventListener('click', e => {
      if (node.classList.contains('dragging')) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  }

  function updateActions() {
    const c = foods().find(f => f.id === picked);
    el('feedBtn').disabled = !c;
    el('petPatBtn').disabled = Date.now() < patLock;
    el('petPlayBtn').disabled = Date.now() < playLock;
  }

  /* ---------- 喂食 ---------- */
  function feed() {
    const food = foods().find(f => f.id === picked && ownedOf(f.id) > 0);
    if (!food) {
      UI.toast('先选一种食物吧');
      return;
    }
    if (Store.s.pet.hunger >= 100) {
      playFx('pat');
      SFX.wrong();
      say('呜呜，虽然很想吃，但我吃不下了', 2600);
      return;
    }
    const isFav = Store.isFav(food.id);
    Store.useItem(food.id);
    Store.feed(food);
    playFx('feed');
    let line;
    if (isFav) {
      /* 今日口味命中：只给表演和计数，不额外产出金币 / 饱腹 / 心情 */
      const first = Store.favHit();
      line = `哇！今天最想吃的就是${food.name}！`;
      hearts(10);
      favBurst();
      UI.toast(first ? '🎯 今日口味命中！' : `又喂中${food.name}啦`);
    } else {
      line = pickLine(FOOD_LINES);
      hearts(3);
    }
    /* 喂食说自己的台词，用与答题完全相同的可爱女童声；
       以前误用 SFX.correct() 会念「真棒」，音色/语义都跟别处对不上。 */
    say(line, isFav ? 2800 : undefined);
    SFX.petLine('feed', line);
    const nextFood = ensurePick();
    render();
    if (!nextFood) setTimeout(() => say('食物吃完了，去商店补货', 2400), 2400);
  }

  /* ---------- 抚摸 / 挠痒：部位反应 + 连击 + 长按呼噜 ---------- */
  function pat(from, e) {
    const now = Date.now();
    const zone = zoneOf(e);
    const isLong = longPatFlag;
    longPatFlag = false;

    /* 连击按 1.4s 内的点击次数算；数值仍受 1.6s 冷却约束，连点刷不出心情 */
    combo = (now - lastPatAt < 1400) ? combo + 1 : 1;
    lastPatAt = now;
    const isCombo = combo >= 3;
    if (isCombo) combo = 0;

    const canGain = now >= patLock;
    if (canGain) { patLock = now + 1600; Store.pat(); }

    /* 冷却内的点击只给轻量表演，不重复结算数值 */
    let line;
    if (isLong) line = pickLine(PURR_LINES);
    else if (isCombo) line = pickLine(COMBO_LINES);
    else line = pickLine(canGain ? ZONE_LINES[zone] : PAT_LINES);

    if (!isLong) playFx(isCombo ? 'play' : ZONE_FX[zone]);
    hearts(isCombo ? 9 : (canGain ? 6 : 2));
    say(line);
    SFX.petLine('pat', line);
    render();
    setTimeout(() => { updateActions(); }, 1650);
  }

  /* ---------- 陪玩 ---------- */
  function play() {
    if (Date.now() < playLock) return;
    if (Store.s.pet.mood >= 100) {
      say('已经开心得冒泡了', 1800);
      UI.toast('心情已经满了，去答几道题吧');
      return;
    }
    playLock = Date.now() + 2200;
    Store.play();
    playFx('play');
    hearts(4);
    const line = PLAY_LINES[Math.floor(Math.random() * PLAY_LINES.length)];
    say(line);
    SFX.petLine('play', line);
    render();
    setTimeout(updateActions, 2250);
  }

  /* ---------- 商店 ---------- */
  /* 金币变动时同步刷新「是否买得起」，避免停留在商店页时按钮状态滞后 */
  function refreshAfford() {
    const box = el('shopGrid');
    if (!box) return;
    box.querySelectorAll('.si-buy[data-pay="1"]').forEach(b => {
      const poor = Store.s.coins < Number(b.dataset.price);
      b.classList.toggle('poor', poor);
      const em = b.querySelector('em');
      if (poor && !em) b.insertAdjacentHTML('beforeend', '<em>不足</em>');
      else if (!poor && em) em.remove();
    });
  }

  function renderShop() {
    const box = el('shopGrid');
    box.innerHTML = '';
    if (tab === 'furniture') { renderFurniture(box); return; }
    const items = Engine.SHOP[tab] || [];
    items.forEach(it => {
      const own = Store.s.inv[it.id] || 0;
      const owned = own > 0;
      const equipped = tab === 'wear' && Object.values(Store.s.equipped || {}).includes(it.id);
      const div = document.createElement('div');
      div.className = 'shop-item';
      const sub = (tab === 'food' ? `${it.desc} · 持有 ${own}` : it.desc);
      const art = tab === 'wear' && window.WearArt && WearArt.has(it.id)
        ? WearArt.thumb(it.id)
        : (it.img
          ? `<img src="${it.img}" alt="">`
          : `<span class="si-emoji">${it.emoji || '🎁'}</span>`);
      /* 是否需要扣金币：已穿着→脱下、已持有的服饰→穿上 都是免费动作；
         其余（食物全部、未持有的服饰）都要付钱，钱不够一律显示不可购买。
         旧逻辑用 !owned 短路，导致买过的食物即使钱不够也显示绿色可购买。 */
      const freeAction = equipped || (tab === 'wear' && owned);
      const poor = !freeAction && Store.s.coins < it.price;
      const priceHtml = `<img src="images/coin.png" alt="">${it.price}${poor ? '<em>不足</em>' : ''}`;
      div.innerHTML = `
        ${art}
        <div class="si-name">${it.name}${owned && tab !== 'wear' ? ` ×${own}` : ''}</div>
        <div class="si-desc">${sub}</div>
        <button class="si-buy ${equipped ? 'owned' : ''}${poor ? ' poor' : ''}"
                data-pay="${freeAction ? 0 : 1}" data-price="${it.price}">
          ${equipped ? '脱下' : (tab === 'wear' && owned ? '穿上' : priceHtml)}
        </button>`;
      div.querySelector('button').addEventListener('click', () => onBuy(it, owned, equipped));
      box.appendChild(div);
    });
  }

  function onBuy(it, owned, equipped) {
    if (tab === 'wear') {
      const eq = Store.s.equipped || (Store.s.equipped = {});
      const wornSlot = Object.keys(eq).find(k => eq[k] === it.id);
      if (wornSlot) {                       // 已穿着 → 脱下
        eq[wornSlot] = '';
        Store.save();
        render();
        SFX.tap();
        UI.toast('已脱下 ' + it.name);
        return;
      }
      if (!owned) {                         // 没买过 → 先购买
        if (!Store.spend(it.price)) {
          UI.toast('金币不够，再答几关就够啦');
          SFX.wrong();
          return;
        }
        Store.addItem(it.id, 1);
      }
      eq[it.slot || 'head'] = it.id;        // 直接穿到对应部位
      Store.save();
      render();
      const dressLine = `我穿上${it.name}啦，好看吗？`;
      say(dressLine, 2200);
      SFX.petLine('dress', dressLine);
      UI.toast(owned ? `已穿上 ${it.name}` : `买到并穿上 ${it.name}！`);
      return;
    }
    if (!Store.spend(it.price)) {
      UI.toast('金币不够，再答几关就够啦');
      SFX.wrong();
      return;
    }
    Store.addItem(it.id, 1);
    SFX.coin();
    UI.toast(`买到 ${it.name}！`);
    if (tab === 'food') {
      picked = it.id;
      render();
      say(`是${it.name}，喂给我吧`, 2000);
    } else {
      render();
    }
  }

  /* ---------- 家具：购买 / 摆放 / 收回 ---------- */
  function renderFurniture(box) {
    const scene = currentScene();
    const items = furnitureOf(scene);
    const info = sceneInfo(scene);
    const max = (Engine.ECON || {}).maxFurniture || 8;
    const tip = document.createElement('div');
    tip.className = 'shop-scene-tip';
    tip.innerHTML = `🏠 正在布置 <b>${info ? info.name : ''}</b> · 已摆放 ${placedCount(scene)}/${max} 件 · 换个房间就换一套家具`;
    box.appendChild(tip);
    items.forEach(it => {
      const owned = (Store.s.inv[it.id] || 0) > 0;
      const placed = Store.isDecor(it.id);
      /* 摆放/收回免费，只有未持有的家具购买才扣币 */
      const poor = !owned && Store.s.coins < it.price;
      const div = document.createElement('div');
      div.className = 'shop-item';
      const thumb = it.img
        ? `<img class="si-art" src="${it.img}" alt="">`
        : `<span class="si-emoji">${it.emoji || '🪑'}</span>`;
      div.innerHTML = `
        ${thumb}
        <div class="si-name">${it.name}</div>
        <div class="si-desc">${it.desc}</div>
        <button class="si-buy ${placed ? 'owned' : ''}${poor ? ' poor' : ''}"
                data-pay="${owned ? 0 : 1}" data-price="${it.price}">
          ${placed ? '收回' : (owned ? '摆放' : `<img src="images/coin.png" alt="">${it.price}${poor ? '<em>不足</em>' : ''}`)}
        </button>`;
      div.querySelector('button').addEventListener('click', () => onBuyFurniture(it, owned, placed));
      box.appendChild(div);
    });
  }

  function onBuyFurniture(it, owned, placed) {
    if (placed) {                         // 已摆出 → 收回
      Store.toggleDecor(it.id, false);
      render();
      SFX.tap();
      UI.toast('已收回 ' + it.name);
      return;
    }
    /* 上限按「当前场景」算，三个房间互不占用名额；先判断再扣币，避免买了却摆不下 */
    const scene = currentScene();
    const info = sceneInfo(scene);
    if (placedCount(scene) >= Engine.ECON.maxFurniture) {
      UI.toast(`${info ? info.name : '这个房间'}最多摆放 ${Engine.ECON.maxFurniture} 件家具，先收回一件吧`);
      SFX.wrong();
      return;
    }
    if (!owned) {                         // 没买过 → 先购买
      if (!Store.spend(it.price)) {
        UI.toast('金币不够，再答几关就够啦');
        SFX.wrong();
        return;
      }
      Store.addItem(it.id, 1);
    }
    Store.toggleDecor(it.id, true);       // 摆进房间
    SFX.happy();                          // 与宠物其它互动同一套音色
    UI.toast(owned ? `已摆出 ${it.name}` : `买下并摆出 ${it.name}！`);
    render();
  }

  /* ---------- 室内家具渲染 ---------- */
  function renderDecor() {
    const room = el('petRoom');
    if (!room) return;
    room.innerHTML = '';
    const scene = currentScene();
    (Store.s.decor || []).forEach(id => {
      const it = (Engine.SHOP.furniture || []).find(f => f.id === id);
      if (!it || it.scene !== scene) return;   // 只渲染属于当前房间的家具
      const d = document.createElement('div');
      d.className = 'ps-furn';
      d.style.left = it.x;
      d.style.bottom = it.y;
      d.style.zIndex = it.z || 0;
      if (it.img) {                      // 大件家具：整幅实心插画，按 w 等比放大
        d.style.width = it.w || it.size || '120px';
        const im = document.createElement('img');
        im.src = it.img;
        im.alt = it.name;
        d.appendChild(im);
      } else {                           // 兼容旧数据里的 emoji 家具
        d.style.fontSize = it.size || '48px';
        d.textContent = it.emoji || '';
      }
      room.appendChild(d);
    });
  }

  window.Pet = { render, say, hearts, refreshAfford };
})();
