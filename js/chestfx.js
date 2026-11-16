/* ===== 宝箱：图案绘制 + 开箱演出 =====
 * ChestArt.icon()  -> 地图 / 打卡页用的小宝箱（矢量，状态由 CSS 变量控制）
 * ChestFx.show()   -> 全屏开箱：放大、箱盖弹开、金光、金币喷出、花卡飞出
 * 金币数量由 Engine.chestLoot() 随机生成，这里只负责演出与数字滚动。
 */
(function () {
  const el = id => document.getElementById(id);
  let timers = [];
  let countTimer = null;
  let onDone = null;

  function star(cx, cy, r, fill, op) {
    return `<path d="M${cx} ${cy - r} Q${cx + r * .2} ${cy - r * .2} ${cx + r} ${cy} ` +
      `Q${cx + r * .2} ${cy + r * .2} ${cx} ${cy + r} Q${cx - r * .2} ${cy + r * .2} ${cx - r} ${cy} ` +
      `Q${cx - r * .2} ${cy - r * .2} ${cx} ${cy - r} Z" fill="${fill}" opacity="${op == null ? 1 : op}"/>`;
  }

  /* 宝箱矢量图：120 x 104。奶油白木纹箱体 + 柔金包角/提环 + 圆润弧顶盖 + 圆扣锁，
     画风对齐「奶白毛绒玩偶」：低饱和、圆润、柔光。颜色走 CSS 变量：
     锁定=灰、可开=奶金微光、已开=掀盖。 */
  function art(uid) {
    const u = uid;
    return `<svg class="chest-art" viewBox="0 0 120 104" aria-hidden="true">
  <defs>
    <linearGradient id="bd${u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--chest-lidtop,#F4F1EC)"/>
      <stop offset=".55" stop-color="var(--chest-body,#E7DFD3)"/>
      <stop offset="1" stop-color="var(--chest-deep,#D4C8B7)"/>
    </linearGradient>
    <linearGradient id="ld${u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--chest-cream,#FBF8F3)"/>
      <stop offset="1" stop-color="var(--chest-lidtop,#F4F1EC)"/>
    </linearGradient>
    <linearGradient id="gd${u}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="var(--chest-gold,#E8C988)"/>
      <stop offset=".45" stop-color="var(--chest-gold,#D9B46B)"/>
      <stop offset="1" stop-color="var(--chest-gold-d,#BE9347)"/>
    </linearGradient>
    <clipPath id="cp${u}"><rect x="14" y="46" width="92" height="42" rx="12"/></clipPath>
    <clipPath id="cl${u}"><path d="M14 48C14 28 32 15 60 15s46 13 46 33z"/></clipPath>
  </defs>

  <ellipse class="ca-shadow" cx="60" cy="95" rx="41" ry="6"/>

  <g class="ca-hole">
    <rect x="19" y="30" width="82" height="22" rx="10" fill="var(--chest-dark,#8A8172)"/>
    <rect x="23" y="30" width="74" height="9" rx="4.5" fill="#4A4036"/>
    <ellipse cx="60" cy="48" rx="34" ry="5" fill="#4A4036" opacity=".4"/>
  </g>

  <g class="ca-body">
    <rect x="14" y="46" width="92" height="42" rx="12" fill="url(#bd${u})"
      stroke="var(--chest-dark,#8A8172)" stroke-width="2.4"/>
    <g clip-path="url(#cp${u})">
      <!-- 竖向木纹 -->
      <rect x="30" y="46" width="13" height="42" fill="var(--chest-cream,#FBF8F3)" opacity=".5"/>
      <rect x="77" y="46" width="13" height="42" fill="var(--chest-cream,#FBF8F3)" opacity=".5"/>
      <rect x="14" y="46" width="92" height="12" fill="#FFFFFF" opacity=".3"/>
      <rect x="14" y="70" width="92" height="18" fill="#000000" opacity=".06"/>
      <rect x="14" y="78" width="92" height="10" fill="url(#gd${u})" opacity=".9"/>
      <!-- 左右包角 -->
      <rect x="15.5" y="46" width="8" height="42" fill="url(#gd${u})"/>
      <rect x="96.5" y="46" width="8" height="42" fill="url(#gd${u})"/>
      <circle cx="19.5" cy="51" r="1.5" fill="#FFF6DC" opacity=".95"/>
      <circle cx="100.5" cy="51" r="1.5" fill="#FFF6DC" opacity=".95"/>
    </g>
  </g>

  <g class="ca-lid">
    <path d="M14 48C14 28 32 15 60 15s46 13 46 33z" fill="url(#ld${u})"
      stroke="var(--chest-dark,#8A8172)" stroke-width="2.4"/>
    <g clip-path="url(#cl${u})">
      <rect x="30" y="15" width="13" height="34" fill="var(--chest-body,#E7DFD3)" opacity=".32"/>
      <rect x="77" y="15" width="13" height="34" fill="var(--chest-body,#E7DFD3)" opacity=".32"/>
      <rect x="15.5" y="15" width="8" height="34" fill="url(#gd${u})"/>
      <rect x="96.5" y="15" width="8" height="34" fill="url(#gd${u})"/>
      <ellipse cx="40" cy="27" rx="16" ry="6.4" fill="#FFFFFF" opacity=".6" transform="rotate(-15 40 27)"/>
      <ellipse cx="78" cy="36" rx="7" ry="3" fill="#FFFFFF" opacity=".34" transform="rotate(-15 78 36)"/>
    </g>
    <!-- 圆扣锁：柔金圆片 + 提环，替代心形 -->
    <g class="ca-lock">
      <circle cx="60" cy="26" r="7" fill="url(#gd${u})" stroke="var(--chest-gold-d,#BE9347)" stroke-width="1.3"/>
      <circle cx="60" cy="26" r="3.2" fill="var(--chest-dark,#8A8172)" opacity=".85"/>
      <circle cx="58.9" cy="24.9" r="1.1" fill="#FFF6DC" opacity=".9"/>
    </g>
    <!-- 顶盖提环 -->
    <path d="M51 17a9 9 0 0 1 18 0" stroke="url(#gd${u})" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <rect x="10" y="43" width="100" height="10" rx="5" fill="url(#gd${u})"
      stroke="var(--chest-gold-d,#BE9347)" stroke-width="1.1"/>
    <path d="M22 45h18" stroke="#FFF6DC" stroke-width="2" stroke-linecap="round" opacity=".85"/>
  </g>

  <g class="ca-spark">
    ${star(107, 20, 7, 'var(--chest-gold,#E8C988)', .95)}
    ${star(10, 60, 4.6, '#FFFFFF', .9)}
    ${star(112, 56, 3.6, '#FFFFFF', .75)}
  </g>
</svg>`;
  }

  /* ---------- 开箱演出 ---------- */
  function itemById(id) {
    const S = (window.Engine && Engine.SHOP) || {};
    return [].concat(S.food || [], S.wear || [], S.tool || []).find(x => x.id === id) || null;
  }

  function fireConfetti() {
    const colors = ['#ffc800', '#58cc02', '#1cb0f6', '#ff6b9a', '#ce82ff', '#ff9600'];
    el('cfConfetti').innerHTML = Array.from({ length: 26 }, (_, i) =>
      `<i style="left:${(i * 4.3 + 2) % 100}%;background:${colors[i % colors.length]};` +
      `animation-delay:${((i % 7) * 0.08).toFixed(2)}s;transform:rotate(${i * 37}deg)"></i>`).join('');
  }

  function buildGlints() {
    el('cfGlints').innerHTML = Array.from({ length: 9 }, (_, i) => {
      const x = 8 + ((i * 11.7) % 84);
      const y = 6 + ((i * 17.3) % 78);
      return `<i style="left:${x}%;top:${y}%;animation-delay:${(i * 0.13).toFixed(2)}s"></i>`;
    }).join('');
  }

  function buildCoins(n, lucky) {
    const box = el('cfCoins');
    box.innerHTML = '';
    const count = Math.min(18, Math.max(8, Math.round(n / 6)));
    for (let i = 0; i < count; i++) {
      const ang = (-150 + (300 / count) * i + (Math.random() * 16 - 8)) * Math.PI / 180;
      const dist = 90 + Math.random() * 70;
      const tx = Math.round(Math.cos(ang) * dist * 1.05);
      const ty = Math.round(Math.sin(ang) * dist * 0.85);
      const img = document.createElement('img');
      img.className = 'cf-coin' + (lucky && i % 4 === 0 ? ' big' : '');
      img.src = 'images/coin.png';
      img.alt = '';
      img.style.setProperty('--tx', tx + 'px');
      img.style.setProperty('--ty', ty + 'px');
      img.style.setProperty('--rot', Math.round(Math.random() * 360 - 180) + 'deg');
      img.style.setProperty('--d', (i * 0.045).toFixed(2) + 's');
      box.appendChild(img);
    }
  }

  function countUp(total, ms) {
    const node = el('cfCoinNum');
    const step = Math.max(1, Math.round(total / (ms / 40)));
    let cur = 0;
    clearInterval(countTimer);
    node.textContent = '0';
    countTimer = setInterval(() => {
      cur = Math.min(total, cur + step);
      node.textContent = cur;
      if (cur >= total) { clearInterval(countTimer); countTimer = null; }
    }, 40);
  }

  function show(opt) {
    const o = opt || {};
    const fx = el('chestFx');
    timers.forEach(clearTimeout);
    timers = [];
    clearInterval(countTimer);
    onDone = o.onDone || null;

    el('cfKicker').textContent = o.kicker || '神秘宝箱';
    el('cfHead').textContent = o.head || '宝箱开启中…';
    el('cfChestSvg').innerHTML = art('fx' + (Date.now() % 100000));
    el('cfCoinNum').textContent = '0';
    el('cfCoins').innerHTML = '';
    el('cfCardFly').innerHTML = '';
    const item = o.item ? itemById(o.item) : null;
    el('cfRewardName').textContent = item ? `还获得「${item.name}」` : (o.rare ? '幸运大奖 · 金币加成！' : '');
    el('cfRewardName').style.display = (item || o.rare) ? '' : 'none';
    el('cfRewardSub').textContent = o.card ? '金币已入账 · 还有 1 张花卡等你翻开' : '金币已存入账户';
    el('cfClose').textContent = o.card ? '收下，去翻花卡' : '收下，继续闯关';

    fireConfetti();
    buildGlints();
    buildCoins(o.coins || 30, o.rare);
    if (o.card) {
      el('cfCardFly').innerHTML =
        `<img src="${FlowerArt.back(Cards.volume())}" alt="花卡">`;
    }

    fx.classList.remove('on', 'open', 'loot');
    void fx.offsetWidth;
    fx.classList.add('on');
    if (window.SFX) SFX.levelUp();

    timers.push(setTimeout(() => {
      fx.classList.add('open');
      if (window.SFX) SFX.tap();
    }, 640));
    timers.push(setTimeout(() => {
      fx.classList.add('loot');
      el('cfHead').textContent = '宝箱开启！';
      if (window.SFX) SFX.coin();
      countUp(o.coins || 30, 620);
    }, 840));
    timers.push(setTimeout(() => {
      if (window.SFX) SFX.coin();
    }, 1180));
  }

  function close() {
    const fx = el('chestFx');
    if (!fx || !fx.classList.contains('on')) return;
    timers.forEach(clearTimeout);
    timers = [];
    clearInterval(countTimer);
    countTimer = null;
    fx.classList.remove('on', 'open', 'loot');
    el('cfCoins').innerHTML = '';
    if (window.SFX) SFX.tap();
    const cb = onDone; onDone = null;
    if (cb) cb();
  }

  function mount() {
    const btn = el('cfClose');
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', close);
    el('chestFx').addEventListener('click', e => { if (e.target === el('chestFx')) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && el('chestFx').classList.contains('on')) close();
    });
  }

  window.ChestArt = { icon: uid => art(uid || ('c' + Math.random().toString(36).slice(2, 7))) };
  window.ChestFx = {
    show, close,
    get open() { return !!el('chestFx') && el('chestFx').classList.contains('on'); }
  };
  if (document.readyState !== 'loading') mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
