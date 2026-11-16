/* ===== 每日打卡（抽奖大转盘）/ 任务 ===== */
(function () {
  const el = id => document.getElementById(id);
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
  let mounted = false;
  let wheelRot = 0;      // 转盘累计旋转角度
  let spinning = false;

  function shell() {
    if (mounted) return;
    mounted = true;
    el('spinBtn').addEventListener('click', spinWheel);
    /* 中心圆盘也做成可点的「抽奖」按钮，更接近真实转盘 */
    el('wheelHub').addEventListener('click', spinWheel);
  }

  function render() {
    shell();
    Store.rollDay();
    const s = Store.s;
    const now = new Date();
    el('dailyDate').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 · 星期${WEEK[now.getDay()]}`;

    el('streakBig').textContent = s.streak.count;
    el('streakHint').textContent = s.streak.count >= 7
      ? `连续 ${s.streak.count} 天 · 最长 ${s.streak.max} 天`
      : `连续打卡，转盘天天有惊喜`;

    renderWeek();
    renderWheel();
    updateSpinBtn();
    renderTasks();
  }

  function renderWeek() {
    const s = Store.s;
    const row = el('weekRow');
    row.innerHTML = '';
    const today = new Date();
    for (let k = 6; k >= 0; k--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - k);
      const p = n => (n < 10 ? '0' + n : '' + n);
      const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      let on = false;
      if (s.streak.last) {
        const gap = Store.dayDiff(key, s.streak.last);
        on = gap >= 0 && gap < s.streak.count;
      }
      const dot = document.createElement('div');
      dot.className = 'day-dot' + (on ? ' on' : '') + (k === 0 ? ' today' : '');
      dot.innerHTML = `<i>${on ? '✓' : ''}</i><span>${WEEK[d.getDay()]}</span>`;
      row.appendChild(dot);
    }
  }

  /* ---------- 抽奖大转盘 ---------- */
  /* 中奖撒花：全屏彩纸 + 花瓣/星星，动画结束自动清理 */
  function confetti() {
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    const colors = ['#FFC93C', '#FF5C8A', '#4FC3F7', '#7ED957', '#B388FF', '#FF8A3D', '#FFF0A8', '#FFD21C'];
    const emojis = ['🌸', '🎉', '⭐', '🌺', '✨', '🎊'];
    let h = '';
    for (let i = 0; i < 104; i++) {
      const x = (Math.random() * 100).toFixed(1);
      const d = (Math.random() * 0.9).toFixed(2);
      const t = (2.2 + Math.random() * 1.7).toFixed(2);
      const dr = (Math.random() * 160 - 80).toFixed(0);
      const r = (Math.random() * 900 - 450).toFixed(0);
      /* 起点分散在屏幕上半部，弹框出现时前后景都有花瓣在飘 */
      const start = (-30 + Math.random() * 430).toFixed(0);
      const common = `--x:${x}vw;--d:${d}s;--t:${t}s;--dr:${dr}px;--r:${r}deg;top:${start}px;`;
      if (i % 7 === 0) {
        const sz = (13 + Math.random() * 10).toFixed(0);
        h += `<i class="emoji" style="${common}--sz:${sz}px">${emojis[(i / 7) % emojis.length]}</i>`;
      } else {
        const w = (5 + Math.random() * 6).toFixed(0);
        const hh = (7 + Math.random() * 9).toFixed(0);
        const radius = Math.random() < .3 ? '50%' : '2px';
        h += `<i style="${common}--c:${colors[i % colors.length]};width:${w}px;height:${hh}px;border-radius:${radius}"></i>`;
      }
    }
    layer.innerHTML = h;
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 4600);
  }

  /* 未中奖插画：举旗打气的笑脸星星 + 彩带，纯 SVG，不用哭脸 */
  function cheerArt() {
    const ribbons = [
      [24, 30, '#FF6B9A'], [146, 26, '#4FC3F7'], [18, 74, '#FFC93C'],
      [152, 78, '#7ED957'], [40, 12, '#B388FF'], [130, 10, '#FF8A3D']
    ];
    let deco = ribbons.map(([x, y, c], i) =>
      `<path d="M${x} ${y} l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="${c}" opacity=".9"
        transform="rotate(${i * 23} ${x} ${y})"/>`).join('');
    return `<svg viewBox="0 0 168 104" role="img" aria-label="加油打气的小星星">
      <defs>
        <linearGradient id="cheerStar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFF3A8"/><stop offset=".5" stop-color="#FFD23F"/><stop offset="1" stop-color="#FFA726"/>
        </linearGradient>
      </defs>
      ${deco}
      <!-- 小旗 -->
      <g transform="rotate(-14 122 62)">
        <rect x="120" y="30" width="3" height="46" rx="1.5" fill="#8C6A3F"/>
        <path d="M123 31 h30 l-7 10 7 10 h-30 z" fill="#FF5C8A"/>
        <text x="136" y="45" text-anchor="middle" font-size="9" font-weight="900" fill="#fff" font-family="sans-serif">加油</text>
      </g>
      <!-- 星星身体 -->
      <path d="M84 16 L96 42 L124 45 L103 64 L109 92 L84 77 L59 92 L65 64 L44 45 L72 42 Z"
            fill="url(#cheerStar)" stroke="#E89A12" stroke-width="2.4" stroke-linejoin="round"/>
      <!-- 笑脸 -->
      <ellipse cx="75" cy="53" rx="3.4" ry="4.4" fill="#5A3A12"/>
      <ellipse cx="93" cy="53" rx="3.4" ry="4.4" fill="#5A3A12"/>
      <ellipse cx="65" cy="61" rx="5" ry="3" fill="#FF8FA8" opacity=".8"/>
      <ellipse cx="103" cy="61" rx="5" ry="3" fill="#FF8FA8" opacity=".8"/>
      <path d="M76 63 Q84 71 92 63" fill="none" stroke="#5A3A12" stroke-width="2.6" stroke-linecap="round"/>
      <!-- 挥舞的小手 -->
      <circle cx="46" cy="70" r="7" fill="#FFF0C2" stroke="#E89A12" stroke-width="1.8"/>
      <circle cx="122" cy="70" r="7" fill="#FFF0C2" stroke="#E89A12" stroke-width="1.8"/>
    </svg>`;
  }

  /* 弹框顶部「一堆金币」插画：纯 SVG 绘制，不依赖系统 emoji 字体 */
  function coinPileArt() {
    const coins = [
      [30, 74, 15], [58, 78, 16], [88, 79, 16], [118, 76, 15], [138, 70, 12],
      [44, 56, 15], [73, 58, 16], [103, 57, 15], [126, 52, 12],
      [60, 38, 15], [90, 37, 15], [76, 20, 14]
    ];
    let g = '';
    coins.forEach(([x, y, r], i) => {
      const tilt = (i % 3 - 1) * 8;
      g += `<g transform="translate(${x} ${y}) rotate(${tilt})">
        <circle r="${r}" cy="3" fill="#B9760C" opacity=".55"/>
        <circle r="${r}" fill="url(#wheelCoinGrad)" stroke="#D18A16" stroke-width="1.6"/>
        <circle r="${(r * .72).toFixed(1)}" fill="none" stroke="#FFF0B0" stroke-width="1.4" opacity=".9"/>
        <text y="${(r * .34).toFixed(1)}" text-anchor="middle" font-size="${(r * 1.05).toFixed(1)}"
              font-weight="900" fill="#A9660B" font-family="Arial,sans-serif">¥</text>
      </g>`;
    });
    [[16, 26], [151, 28], [22, 48], [150, 90], [80, 6]].forEach(([x, y]) => {
      g += `<path d="M ${x} ${y - 6} L ${x + 2} ${y - 2} L ${x + 6} ${y} L ${x + 2} ${y + 2} L ${x} ${y + 6} L ${x - 2} ${y + 2} L ${x - 6} ${y} L ${x - 2} ${y - 2} Z" fill="#FFD75E"/>`;
    });
    return `<svg viewBox="0 0 168 104" role="img" aria-label="一堆金币">
      <defs><linearGradient id="wheelCoinGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FFF6BE"/><stop offset=".45" stop-color="#FFCE3D"/><stop offset="1" stop-color="#ECA21A"/>
      </linearGradient></defs>${g}</svg>`;
  }

  /* 外圈彩色跑马灯泡（静态圈，不随盘体旋转） */
  function renderBulbs() {
    const box = el('wheelBulbs');
    if (box.dataset.built) return;
    const colors = ['#FFE45C', '#FF7BA8', '#7ED7FF', '#A9F07A', '#FFFFFF', '#FFB36B'];
    let h = '';
    for (let i = 0; i < 24; i++) {
      if (i === 0) continue;            // 正上方留给指针
      const ang = i * 15;
      const rad = ang * Math.PI / 180;
      const x = (150 + 143 * Math.sin(rad)).toFixed(1);
      const y = (150 - 143 * Math.cos(rad)).toFixed(1);
      h += `<i class="wheel-bulb" style="left:${x}px;top:${y}px;--b:${colors[i % colors.length]};--delay:${(i * .09).toFixed(2)}s"></i>`;
    }
    box.innerHTML = h;
    box.dataset.built = '1';
  }

  function renderWheel() {
    renderBulbs();
    const W = Engine.ECON.wheel;
    const seg = el('wheelSegs');
    if (seg.dataset.built) return;
    const step = 360 / W.weightTotal;
    /* 高饱和实色扇区 + 每个扇区末尾 1.8° 白色分隔线 */
    const stops = W.tiers.map((t, i) => {
      const a0 = i * step, a1 = (i + 1) * step;
      return `${t.color} ${a0}deg ${(a1 - 1.8).toFixed(1)}deg, #ffffff ${(a1 - 1.8).toFixed(1)}deg ${a1}deg`;
    });
    seg.style.background = `conic-gradient(from 0deg, ${stops.join(',')})`;

    /* 给「吉祥话」扇区随机分配不重复的四字吉语 */
    const pool = W.phrases.slice();
    W.tiers.forEach(t => {
      if (t.kind === 'phrase' && !t.phrase) {
        const k = Math.floor(Math.random() * pool.length);
        t.phrase = pool.splice(k, 1)[0] || '加油';
      }
    });

    W.tiers.forEach((t, i) => {
      const center = (i + 0.5) * step;
      const span = document.createElement('span');
      span.className = 'wheel-label ' + t.kind;
      span.style.color = t.ink || '#fff';
      if (t.kind === 'coin') {
        span.innerHTML = `<span class="lbl-main">${t.coins}</span><span class="lbl-sub">金币</span>`;
      } else if (t.kind === 'phrase') {
        span.innerHTML = `<span class="lbl-main">${t.phrase}</span>`;
      } else {
        span.innerHTML = `<span class="lbl-main">谢谢参与</span>`;
      }
      /* 像真实转盘一样把文字沿半径放射排布；下半盘文字翻转 180° 保持可读。
         末尾 translate(-50%,-50%) 以锚点居中（盘半径 116，标签半径 76） */
      const flip = (center > 90 && center < 270) ? 180 : 0;
      span.style.transform = `rotate(${center}deg) translateY(-76px) rotate(${90 + flip}deg) translate(-50%,-50%)`;
      seg.appendChild(span);
    });
    seg.dataset.built = '1';
  }

  function updateSpinBtn() {
    const btn = el('spinBtn');
    const done = Store.isCheckedToday();
    btn.disabled = done || spinning;
    btn.textContent = done ? '今日已抽奖 ✓' : '转动幸运转盘';
    el('wheelTip').textContent = done
      ? '明天再来试试'
      : '每天一次 · 连续 7 天再得 25 金币';
  }

  function pickTier() {
    const W = Engine.ECON.wheel;
    let r = Math.random() * W.weightTotal, acc = 0;
    for (const t of W.tiers) { acc += t.weight; if (r < acc) return t; }
    return W.tiers[W.tiers.length - 1];
  }

  function spinWheel() {
    if (spinning) return;
    if (Store.isCheckedToday()) { UI.toast('今天已经抽过啦'); return; }
    spinning = true;
    updateSpinBtn();
    const W = Engine.ECON.wheel;
    const t = pickTier();
    let acc = 0, a0 = 0, a1 = 0;
    for (const x of W.tiers) {
      const s0 = acc * (360 / W.weightTotal);
      const s1 = (acc + x.weight) * (360 / W.weightTotal);
      if (x === t) { a0 = s0; a1 = s1; break; }
      acc += x.weight;
    }
    const margin = (a1 - a0) * 0.25;
    const target = a0 + margin + Math.random() * ((a1 - a0) - 2 * margin);
    const spins = 6;
    /* 落点对准顶部固定指针（屏幕正上方 = 360°/0°） */
    const delta = ((360 - target) - (wheelRot % 360) + 720) % 360;
    wheelRot += spins * 360 + delta;
    el('wheel').classList.add('spinning');
    el('wheel').style.transform = `translate(-50%,-50%) rotate(${wheelRot}deg)`;

    const r = Store.checkIn();   // 先落账：记录打卡/连续天数，满 7 天自动 +25
    setTimeout(() => {
      spinning = false;
      el('wheel').classList.remove('spinning');
      el('wheelStage').classList.add('reveal');
      setTimeout(() => el('wheelStage').classList.remove('reveal'), 760);
      /* 连续 7 天额外奖励改用轻提示，不插进开奖弹框的三段式文案 */
      if (r.bonus) UI.toast('连续打卡 7 天，额外 +25 金币！');

      if (t.kind === 'coin') {
        Store.addCoins(t.coins, true);
        UI.renderCoin();
        SFX.win();
        confetti();                              // 中奖撒花
        UI.dialog({
          html: `<div class="prize-result win">
            <div class="prize-kicker">🎉 好运降临 🎉</div>
            <div class="prize-art">${coinPileArt()}</div>
            <div class="prize-title">恭喜你，抽中 <b>${t.coins}</b> 枚金币</div>
            <div class="prize-sub">明日记得再来哦</div>
            <div class="prize-note">金币已存进小金库 · 连续打卡 ${Store.s.streak.count} 天</div>
          </div>`,
          buttons: [{ label: '开心收下' }],
          sound: false
        });
      } else {
        /* 「谢谢参与」和吉祥话扇区都不产出金币，统一按未中奖处理；
           主文案随机一句加重鼓励语，配打气插画，保持活泼不沮丧 */
        const cheer = ['再接再厉', '天天向上', '感谢参加'][Math.floor(Math.random() * 3)];
        SFX.cheer();
        UI.dialog({
          html: `<div class="prize-result lose">
            <div class="prize-kicker">✨ 今日份鼓励 ✨</div>
            <div class="prize-art">${cheerArt()}</div>
            <div class="prize-title">${cheer}</div>
            <div class="prize-sub">明日再来试试</div>
            <div class="prize-note">已连续打卡 ${Store.s.streak.count} 天 · 好运正在路上</div>
          </div>`,
          buttons: [{ label: '明天见' }],
          sound: false
        });
      }
      render();
    }, 3300);
  }

  /* ---------- 每日任务 ---------- */
  function taskProgress(id) {
    const d = Store.s.daily;
    const s = Store.s.streak;
    if (id === 'level3') return (d.units || []).length;
    if (id === 'star3') return d.star3;
    if (id === 'streak7') {
      const cyc = Math.floor((s.count - 1) / 7);
      return Math.max(0, Math.min(s.count - cyc * 7, 7));
    }
    return 0;
  }
  function streak7Claimed() {
    const s = Store.s.streak;
    if (s.count <= 0) return false;
    return s.streak7Cycle === Math.floor((s.count - 1) / 7);
  }

  function renderTasks() {
    const box = el('taskList');
    box.innerHTML = '';
    Engine.ECON.tasks.forEach(t => {
      const cur = Math.min(taskProgress(t.id), t.target);
      let claimed, done;
      if (t.id === 'streak7') { claimed = streak7Claimed(); done = claimed; }
      else { claimed = Store.s.daily.claimed.includes(t.id); done = cur >= t.target; }
      const div = document.createElement('div');
      div.className = 'task';
      div.innerHTML = `
        <div class="task-ico">${t.icon}</div>
        <div class="task-main">
          <div class="task-title">${t.title}</div>
          <div class="task-desc">${t.desc} · 奖励 ${t.reward} 金币</div>
          <div class="task-bar"><i style="width:${cur / t.target * 100}%"></i></div>
        </div>
        <button class="task-btn" ${(!done || claimed) ? 'disabled' : ''}>${claimed ? '已领取' : (done ? '领取' : `${cur}/${t.target}`)}</button>`;
      div.querySelector('button').addEventListener('click', () => {
        if (!done || claimed) return;
        if (t.id === 'streak7') {
          const s = Store.s.streak;
          const cyc = Math.floor((s.count - 1) / 7);
          if (s.streak7Cycle === cyc) return;
          s.streak7Cycle = cyc;
          Store.addCoins(t.reward);
        } else {
          Store.s.daily.claimed.push(t.id);
          Store.addCoins(t.reward);
        }
        SFX.coin();
        UI.toast(`+${t.reward} 金币`);
        render();
      });
      box.appendChild(div);
    });
  }

  window.Daily = { render };
})();
