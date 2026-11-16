/* ===== 路由 / 通用 UI / 初始化 ===== */
(function () {
  const el = id => document.getElementById(id);
  const RENDER = {
    home: () => Home.render(),
    daily: () => Daily.render(),
    pet: () => Pet.render(),
    dex: () => Dex.render(),
    me: () => Me.render()
  };

  function closeModal() { el('modalMask').classList.remove('on'); }

  /* 弹窗顶部形象：优先用户所选伙伴，char 指定表情（normal/happy/sad） */
  function heroHtml(opt, sad) {
    if (opt.char || opt.image) {
      const m = opt.char || 'normal';
      const path = opt.image || (window.Characters
        ? Characters.src(m, opt.stage || 0) : 'images/char_tuantuan_normal.png');
      const flag = opt.char ? ` data-char="${m}"` : '';
      return `<div class="modal-hero${sad ? ' sad' : ''}"><img${flag} src="${path}" alt=""></div>`;
    }
    return opt.emoji ? `<div class="big-emoji">${opt.emoji}</div>` : '';
  }

  /* 通用弹窗：html + 自定义按钮 */
  function dialog(opt) {
    el('modalBody').innerHTML = opt.html || '';
    if (window.Characters) Characters.apply(el('modalBody'));
    el('modal').classList.toggle('wide', !!opt.wide);
    const wrap = el('modalBtns');
    wrap.innerHTML = '';
    (opt.buttons || [{ label: '知道啦' }]).forEach(b => {
      const node = document.createElement('button');
      node.className = 'btn ' + (b.cls || 'btn-primary');
      node.textContent = b.label;
      if (b.disabled) node.disabled = true;
      node.onclick = () => {
        if (b.close !== false) closeModal();
        if (b.onClick) b.onClick();
      };
      wrap.appendChild(node);
    });
    el('modalMask').classList.add('on');
    /* 弹窗统一用轻巧的「统一族」提示音，不再每个弹窗都放上行号角 */
    if (opt.sound !== false && typeof SFX !== 'undefined') SFX.pop();
  }

  const UI = {
    _toastTimer: null,
    toast(msg) {
      const t = el('toast');
      t.textContent = msg;
      t.classList.add('on');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => t.classList.remove('on'), 1800);
    },
    dialog,
    closeModal,
    /* 信息弹窗 */
    modal(opt) {
      const hero = heroHtml(opt, false);
      dialog({
        html: `${hero}<h3>${opt.title || ''}</h3><div class="modal-content">${opt.body || ''}</div>`,
        wide: opt.wide,
        buttons: [{ label: opt.okText || '知道啦', onClick: opt.onOk }]
      });
    },
    /* 双按钮确认弹窗（用于退出挽留） */
    confirm(opt) {
      const hero = heroHtml(opt, true);
      dialog({
        html: `${hero}<h3>${opt.title || ''}</h3><div class="modal-content">${opt.body || ''}</div>`,
        buttons: [
          { label: opt.stayText || '再坚持一下', cls: 'btn-primary', onClick: opt.onStay },
          { label: opt.leaveText || '退出', cls: 'btn-ghost', onClick: opt.onLeave }
        ],
        sound: false
      });
    },
    renderCoin() {
      el('coinNum').textContent = Store.s.coins;
      el('streakNum').textContent = Store.s.streak.count;
      const me = el('meCoins');
      if (me) me.textContent = Store.s.coins;
      if (window.Pet && Pet.refreshAfford) Pet.refreshAfford();
    }
  };
  window.UI = UI;

  const App = {
    current: 'home',
    go(name) {
      this.current = name;
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      el('screen-' + name).classList.add('active');
      document.querySelectorAll('.tabbar-btn').forEach(b => b.classList.toggle('active', b.dataset.go === name));
      el('tabbar').classList.toggle('hidden', name === 'quiz' || name === 'result');
      if (RENDER[name]) RENDER[name]();
      if (window.Characters) { Characters.apply(); Characters.refreshText(); }
      window.scrollTo(0, 0);
      const sc = document.querySelector('.screen.active');
      if (sc) sc.scrollTop = 0;
    }
  };
  window.App = App;

  /* ---------- 底部导航 ---------- */
  el('tabbar').addEventListener('click', e => {
    const b = e.target.closest('.tabbar-btn');
    if (!b) return;
    SFX.tap();
    App.go(b.dataset.go);
  });

  /* ---------- 学科抽屉 ---------- */
  function openDrawer(v) {
    el('drawer').classList.toggle('on', v);
    el('drawerMask').classList.toggle('on', v);
  }
  el('subjectBtn').addEventListener('click', () => { SFX.tap(); renderDrawer(); openDrawer(true); });
  el('drawerMask').addEventListener('click', () => openDrawer(false));

  /* 抽屉由 data/subjects.js + data/banks/ 自动推导：有题库的学科/教材才可选 */
  let browsingSubject = null; // 点击学科后临时浏览的学科 key，选教材后清空
  function currentSubjectKey() {
    if (browsingSubject) return browsingSubject;
    const bank = window.Bank.get(Store.s.bank);
    return bank ? bank.subjectKey : ((window.Bank.subjectsView()[0] || {}).key);
  }
  function renderDrawer() {
    const subs = window.Bank.subjectsView();
    el('subjectGrid').innerHTML = subs.map(s => `
      <button class="subject-item ${s.available ? 'on' : 'off'} ${s.key === currentSubjectKey() ? 'cur' : ''}" data-sub="${s.key}">
        <div class="si-flag">${s.flag}</div>
        <div class="si-label">${s.name}</div>
        <div class="si-tag">${s.available ? `已开放 · ${s.questionCount} 题` : '敬请期待'}</div>
      </button>`).join('');
    const books = window.Bank.booksOf(currentSubjectKey());
    el('gradeRow').innerHTML = books.map(b => `
      <button class="grade-item ${b.available ? 'on' : 'off'} ${b.key === Store.s.bank ? 'cur' : ''}"
        data-book="${b.key}" ${b.available ? '' : 'disabled'}>
        <span>${b.label || b.volume || b.key}</span>
        ${b.available ? `<i>${b.count} 题</i>` : '<i>待补充</i>'}
      </button>`).join('') || '<p class="drawer-empty">题库还在准备中</p>';
  }
  el('subjectGrid').addEventListener('click', e => {
    const b = e.target.closest('.subject-item');
    if (!b) return;
    const key = b.dataset.sub;
    const sub = window.Bank.subjectsView().find(s => s.key === key);
    if (!sub || !sub.available) {
      UI.toast('该学科题库还在准备中，可往 data/banks/ 里加题库文件');
      return;
    }
    SFX.tap();
    browsingSubject = key; // 记录点击的学科，让下方教材列表跟随切换
    renderDrawer();
  });
  el('gradeRow').addEventListener('click', e => {
    const b = e.target.closest('.grade-item');
    if (!b || b.disabled) return;
    const key = b.dataset.book;
    if (key === Store.s.bank) { openDrawer(false); return; }
    SFX.tap();
    if (!Engine.setBank(key)) { UI.toast('这个题库还没准备好'); return; }
    browsingSubject = null; // 已选中具体教材，回归实际题库状态
    openDrawer(false);
    App.go('home');
    UI.toast(`已切换到 ${Engine.BANK.book}`);
  });

  /* ---------- 其他入口 ---------- */
  el('dexBtn2').addEventListener('click', () => { SFX.tap(); App.go('dex'); });
  /* 顶栏头像 / 地图伙伴 / 宠物页 / 我的设置：都能打开形象选择 */
  ['buddyAvatar', 'buddyChange', 'petChangeBtn', 'charBtn'].forEach(id => {
    const b = el(id);
    if (!b) return;
    b.addEventListener('click', e => {
      e.stopPropagation();
      SFX.tap();
      Characters.picker();
    });
  });
  el('modalMask').addEventListener('click', e => {
    if (e.target === el('modalMask')) el('modalMask').classList.remove('on');
  });

  /* ---------- 键盘 ---------- */
  document.addEventListener('keydown', e => {
    if (App.current !== 'quiz') return;
    let idx = -1;
    if (/^[1-4]$/.test(e.key)) idx = Number(e.key) - 1;
    else if (/^[a-dA-D]$/.test(e.key)) idx = e.key.toLowerCase().charCodeAt(0) - 97;
    if (idx >= 0) {
      const node = document.querySelector(`.opt[data-idx="${idx}"]`);
      if (node && !node.disabled) node.click();
    }
    if (e.key === 'Enter') {
      const btn = el('quizAction');
      if (!btn.disabled) btn.click();
    }
    if (e.key === 'Escape') {
      if (el('modalMask').classList.contains('on')) UI.closeModal();
      else el('quizClose').click();
    }
  });

  /* ---------- 启动 ---------- */
  Store.load();
  const startKey = (Store.s.bank && window.Bank.get(Store.s.bank))
    ? Store.s.bank : ((window.Bank.first() || {}).key);
  if (startKey) Engine.setBank(startKey);
  Characters.apply();
  Characters.refreshText();
  renderDrawer();
  UI.renderCoin();
  App.go('home');

  /* 补播「已入库但没展示过」的花卡：任何途径发的卡都必有一次翻卡动画，
     避免刷新后卡册里凭空多出几张 */
  let flushing = false;
  function flushPendingCards() {
    if (flushing || !window.Cards || !Cards.pendingCards) return;
    flushing = true;
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      /* 有其它弹窗时先让位，最多等 6 秒 */
      if (el('modalMask').classList.contains('on') && tries < 20) return;
      clearInterval(timer);
      flushing = false;
      const list = Cards.pendingCards();
      if (list.length) Cards.show(list, '上次的通关奖励');
    }, 300);
  }
  setTimeout(flushPendingCards, 900);

  /* 云服务：恢复会话 → 处理 OAuth 回调 → 登录后拉云合并 */
  if (window.Cloud) {
    (async () => {
      await Cloud.handleCallback();       // URL 带 code 则先完成登录
      const s = await Cloud.restore();     // 普通访问恢复会话
      if (s) await Cloud.syncAfterLogin(); // 已登录则拉云合并
      flushPendingCards();                 // 云档可能带入新的待展示卡
      if (window.Dex && App.current === 'dex') Dex.render();
    })();
  }

  /* 上次没答完的题，刷新后原地接着答 */
  let resumed = false;
  try { resumed = Quiz.resume(); } catch (e) { console.warn('恢复答题进度失败', e); }
  if (resumed) {
    setTimeout(() => UI.toast('已恢复上次的答题进度'), 260);
  } else {
    if (Store.decayDays > 0) {
      setTimeout(() => UI.toast(
        `${Characters.name()}等了你 ${Store.decayDays} 天，饱食度和心情都下降了`), 900);
    }
    const fresh = Object.keys(Store.s.progress).length === 0 && Store.s.coins === 0;
    if (fresh) {
      setTimeout(() => UI.modal({
        char: 'normal',
        title: `欢迎来到萌宠闯关岛！`,
        body: `我是${Characters.name()}，会一路陪着你。沿着路线一课一课往前走，题目由易到难。<br>每完成一个关卡组的全部课程，宝箱就会亮起来，点开有奖励。<br>想换个伙伴，点顶栏的小头像。`,
        okText: '开始闯关'
      }), 350);
    }
  }
})();
