/* ===== 花仙子变身演出 =====
 * 时间轴：星光闪现 → 光芒旋转 → 光核亮起 → 光环扩散 + 花瓣爆发
 *        → 少女从光里升起 → 白闪定格 → 文案与奖励淡入。
 * 全部用 CSS 动画驱动，这里只负责生成粒子和按节拍加 class。
 */
(function () {
  const el = id => document.getElementById(id);
  let timers = [];
  let opts = {};
  let onNext = null;

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

  function buildStars() {
    el('ffStars').innerHTML = Array.from({ length: 34 }, (_, i) => {
      const x = (i * 7.3 + 3) % 100;
      const y = (i * 13.7 + 5) % 96;
      const s = i % 6 === 0 ? 5 : 3;
      return `<i style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;width:${s}px;height:${s}px;` +
        `animation-delay:${((i % 9) * .21).toFixed(2)}s"></i>`;
    }).join('');
  }

  /* 从中心向外炸开的花瓣，随机角度 / 距离 / 大小 */
  function buildPetals() {
    const n = 46;
    el('ffPetals').innerHTML = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + (Math.random() * .3 - .15);
      const dist = 95 + Math.random() * 270;
      const x = Math.cos(a) * dist;
      const y = Math.sin(a) * dist * .9 + 80;
      const r = Math.round(Math.random() * 760 - 380);
      const w = Math.round(11 + Math.random() * 8);
      const h = Math.round(w * 1.28);
      return `<i style="width:${w}px;height:${h}px;--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;` +
        `--r:${r}deg;--d:${(Math.random() * .26).toFixed(2)}s"></i>`;
    }).join('');
  }

  /* 四周绽开的花：粉 / 紫 / 黄 / 白四套配色，位置避开中央人物与底部按钮 */
  const BLOOM_COLORS = [
    ['#FFC7E2', '#EE6FA8', '#FFD24F'],
    ['#DCC6FF', '#A97BFF', '#FFE9A8'],
    ['#FFE7A8', '#F5B93C', '#FFFBEA'],
    ['#FFFFFF', '#D9C7FF', '#FFD24F'],
    ['#FFB4D6', '#D9438C', '#FFE9A8']
  ];
  function bloomArt(c) {
    const petals = [0, 60, 120, 180, 240, 300].map(a =>
      `<ellipse cx="0" cy="-24" rx="13" ry="23" fill="${c[0]}" stroke="${c[1]}" stroke-width="1.8" ` +
      `opacity=".96" transform="rotate(${a})"/>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
      `<g transform="translate(50 52)">${petals}` +
      `<circle r="12" fill="${c[2]}" stroke="${c[1]}" stroke-width="1.6"/>` +
      `<circle cx="-3.4" cy="-3.4" r="3.6" fill="#FFFFFF" opacity=".8"/></g></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function buildBloom() {
    const spots = [
      [5, 24, 46], [14, 48, 34], [6, 72, 50], [16, 87, 36],
      [95, 28, 44], [86, 52, 32], [94, 74, 52], [84, 88, 38],
      [30, 11, 28], [70, 9, 26]
    ];
    el('ffBloom').innerHTML = spots.map((sp, i) =>
      `<i style="left:${sp[0]}%;top:${sp[1]}%;--s:${sp[2]}px;--d:${(i * .055).toFixed(2)}s;` +
      `background-image:url('${bloomArt(BLOOM_COLORS[i % BLOOM_COLORS.length])}')"></i>`).join('');
  }

  /* 变身之后持续飘落的花雨 */
  function buildFall() {
    el('ffFall').innerHTML = Array.from({ length: 26 }, (_, i) => {
      const left = (i * 5.1 + 1.5) % 100;
      const dur = (5.5 + Math.random() * 4).toFixed(1);
      const delay = (Math.random() * 5).toFixed(1);
      return `<i style="left:${left.toFixed(1)}%;animation-duration:${dur}s;--d:${delay}s"></i>`;
    }).join('');
  }

  function reset() {
    const fx = el('fairyFx');
    clearTimers();
    fx.classList.remove('on', 'stage1', 'burst', 'reveal', 'flash', 'settle', 'ghost-on');
    void fx.offsetWidth;
    el('ffSkip').style.display = '';
    return fx;
  }

  /* o = { kicker, body, coins, nextLabel, replay, onNext } */
  function play(o) {
    opts = o || {};
    onNext = o.onNext || null;
    const fx = reset();
    buildStars(); buildBloom(); buildPetals(); buildFall();

    el('ffKicker').textContent = o.kicker || '108 张全部集齐';
    el('ffBody').innerHTML = o.body || '';
    el('ffNext').textContent = o.nextLabel || '开启下一辑';
    const hasCoins = typeof o.coins === 'number';
    el('ffRewards').style.display = hasCoins ? '' : 'none';
    el('ffCoins').textContent = hasCoins ? o.coins : '';
    el('ffReplay').style.display = '';

    fx.classList.add('on');
    if (window.SFX) SFX.levelUp();

    at(320, () => { fx.classList.add('stage1'); if (window.SFX) SFX.star(0); });
    at(620, () => { if (window.SFX) SFX.star(2); });
    at(760, () => { fx.classList.add('burst', 'ghost-on'); if (window.SFX) SFX.star(4); });
    at(1340, () => { fx.classList.remove('ghost-on'); });
    at(980, () => { fx.classList.add('reveal'); });
    at(1880, () => { fx.classList.add('flash'); if (window.SFX) SFX.coin(); });
    at(2120, () => {
      fx.classList.add('settle');
      el('ffSkip').style.display = 'none';   /* 定格后不再需要跳过 */
    });
  }

  function skip() {
    const fx = el('fairyFx');
    if (!fx.classList.contains('on')) return;
    clearTimers();
    fx.classList.add('burst', 'reveal', 'settle');
    el('ffSkip').style.display = 'none';
    if (window.SFX) SFX.tap();
  }

  function close() {
    const fx = el('fairyFx');
    if (!fx.classList.contains('on')) return;
    clearTimers();
    fx.classList.remove('on', 'stage1', 'burst', 'reveal', 'flash', 'settle');
    el('ffSkip').style.display = '';
    if (window.SFX) SFX.tap();
    const cb = onNext; onNext = null;
    if (cb) cb();
  }

  /* 原地重播：同一份文案与按钮完整再演一次，金币不会二次发放 */
  function replay() {
    if (!opts || !opts.kicker) return;
    play(opts);
    if (window.SFX) SFX.tap();
  }

  function mount() {
    const fx = el('fairyFx');
    if (!fx || fx.dataset.bound) return;
    fx.dataset.bound = '1';
    el('ffNext').addEventListener('click', close);
    el('ffReplay').addEventListener('click', replay);
    el('ffSkip').addEventListener('click', skip);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && fx.classList.contains('on')) close();
    });
  }

  window.FairyFx = {
    play, close, replay, skip,
    get open() { return !!el('fairyFx') && el('fairyFx').classList.contains('on'); }
  };
  if (document.readyState !== 'loading') mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
