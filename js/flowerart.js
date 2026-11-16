/* ===== 群芳谱 · 卡面绘制（写实形态版） =====
 * 纯 SVG 即时生成 data URI，不依赖网络 / 图片文件，file:// 双击可用。
 *
 * 旧版所有花共用「一圈放射花瓣 + 圆花蕊」模板，只换颜色和瓣数，
 * 导致玫瑰不像玫瑰、桃花是绿色的。本版改为：
 *   1) data/flowers.js 里每种花记录真实花色 + form（物种形态）+ opt（形态参数）
 *   2) 下方 FORMS 是 37 个按真实植物形态写的绘制器（重瓣螺旋、舌状花盘、
 *      蝶形花序、唇形花、佛焰苞、莲蓬、带刺复叶……）
 * 卡片版式、稀有度描边、卡背沿用原设计，只替换花朵本体。
 */
(function () {
  const CACHE = new Map();
  const FONT = "font-family=\"-apple-system,'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif\"";

  const VOL = [
    { soft: '#EAF7DD', ink: '#3B6D11', back: '#E4F3D0', tint: '#C9F0A8' },
    { soft: '#EAF0FF', ink: '#3F5EDE', back: '#DDE8FF', tint: '#BCD5FF' },
    { soft: '#FDEBF3', ink: '#A93B6B', back: '#FBE0EC', tint: '#FFC6DE' },
    { soft: '#FFF3DC', ink: '#A66A00', back: '#FBEBCD', tint: '#FFDFA0' }
  ];
  const RARITY = {
    '普通': { accent: '#7C8798', mark: '普' },
    '珍稀': { accent: '#2A8FD0', mark: '珍' },
    '传说': { accent: '#B07800', mark: '传' }
  };
  const RIM = {
    '普通': ['#F0E8DB', '#E4D8C6'],
    '珍稀': ['#EAF4FF', '#A9CDF6', '#E2D0FA', '#8FB9EE', '#F2E9FF', '#B7D4F7'],
    '传说': ['#FFF3C4', '#F2C04E', '#FFF9E0', '#D9A13A', '#FFE49B', '#E9B548', '#FFF6CF']
  };

  function vol(n) { return VOL[((n || 1) - 1) % VOL.length]; }
  function pad(n) { return String(n).padStart(3, '0'); }
  function uri(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }

  /* ---------- 颜色工具 ---------- */
  function rgbOf(hex) {
    let h = String(hex || '#FFFFFF').replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(hex, target, t) {
    const a = rgbOf(hex);
    return '#' + [0, 1, 2].map(i =>
      Math.round(a[i] + (target[i] - a[i]) * t).toString(16).padStart(2, '0')).join('');
  }
  const light = (c, t) => mix(c, [255, 255, 255], t);
  const dark = (c, t) => mix(c, [0, 0, 0], t);
  function star(cx, cy, r, fill, op) {
    return `<path d="M${cx} ${cy - r} Q${cx + r * .18} ${cy - r * .18} ${cx + r} ${cy} ` +
      `Q${cx + r * .18} ${cy + r * .18} ${cx} ${cy + r} Q${cx - r * .18} ${cy + r * .18} ${cx - r} ${cy} ` +
      `Q${cx - r * .18} ${cy - r * .18} ${cx} ${cy - r} Z" fill="${fill}"` +
      `${op == null ? '' : ` opacity="${op}"`}/>`;
  }
  function rnd(seed, i) {
    const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }
  const f1 = n => Math.round(n * 10) / 10;

  /* ================================================================
   * 形态绘制工具：所有图形以 (0,0) 为花心，向上生长，花瓣长 L 半宽 W
   * A 为当前花的上下文（配色 + opt），由 bloom() 在每次渲染前设置
   * ================================================================ */
  let A = null;

  function pth(L, W, t) {
    switch (t) {
      case 'point':  // 披针尖瓣：荷、兰、菊
        return `M0 0 C${f1(W)} ${f1(-L * .3)} ${f1(W * .72)} ${f1(-L * .82)} 0 ${f1(-L)} ` +
          `C${f1(-W * .72)} ${f1(-L * .82)} ${f1(-W)} ${f1(-L * .3)} 0 0 Z`;
      case 'notch':  // 瓣端 V 形缺刻：樱花
        return `M0 0 C${f1(W)} ${f1(-L * .28)} ${f1(W * .88)} ${f1(-L * .82)} ${f1(W * .3)} ${f1(-L * .97)} ` +
          `Q0 ${f1(-L * .78)} ${f1(-W * .3)} ${f1(-L * .97)} C${f1(-W * .88)} ${f1(-L * .82)} ` +
          `${f1(-W)} ${f1(-L * .28)} 0 0 Z`;
      case 'wide':   // 宽扇平头瓣：波斯菊、山茶
        return `M0 0 C${f1(W * 1.2)} ${f1(-L * .2)} ${f1(W * 1.08)} ${f1(-L * .8)} ${f1(W * .45)} ${f1(-L)} ` +
          `Q0 ${f1(-L * .93)} ${f1(-W * .45)} ${f1(-L)} C${f1(-W * 1.08)} ${f1(-L * .8)} ` +
          `${f1(-W * 1.2)} ${f1(-L * .2)} 0 0 Z`;
      case 'strap':  // 舌状瓣，末端三齿：雏菊、金盏花
        return `M0 0 L${f1(-W * .62)} ${f1(-L * .9)} L${f1(-W * .85)} ${f1(-L)} ` +
          `L${f1(-W * .24)} ${f1(-L * .94)} L0 ${f1(-L)} L${f1(W * .24)} ${f1(-L * .94)} ` +
          `L${f1(W * .85)} ${f1(-L)} L${f1(W * .62)} ${f1(-L * .9)} Z`;
      case 'frill':  // 波缘皱瓣：牡丹、芍药
        return `M0 0 C${f1(W * 1.15)} ${f1(-L * .22)} ${f1(W * .9)} ${f1(-L * .6)} ${f1(W * 1.05)} ${f1(-L * .78)} ` +
          `Q${f1(W * .6)} ${f1(-L * .92)} ${f1(W * .5)} ${f1(-L)} Q${f1(W * .2)} ${f1(-L * .87)} 0 ${f1(-L * .98)} ` +
          `Q${f1(-W * .2)} ${f1(-L * .87)} ${f1(-W * .5)} ${f1(-L)} Q${f1(-W * .6)} ${f1(-L * .92)} ` +
          `${f1(-W * 1.05)} ${f1(-L * .78)} C${f1(-W * .9)} ${f1(-L * .6)} ${f1(-W * 1.15)} ${f1(-L * .22)} 0 0 Z`;
      case 'spoon':  // 厚匙形瓣：玉兰
        return `M0 0 C${f1(W * .55)} ${f1(-L * .25)} ${f1(W * .5)} ${f1(-L * .55)} ${f1(W * 1.05)} ${f1(-L * .85)} ` +
          `Q${f1(W * .7)} ${f1(-L * 1.02)} 0 ${f1(-L)} Q${f1(-W * .7)} ${f1(-L * 1.02)} ` +
          `${f1(-W * 1.05)} ${f1(-L * .85)} C${f1(-W * .5)} ${f1(-L * .55)} ${f1(-W * .55)} ${f1(-L * .25)} 0 0 Z`;
      case 'curl':   // 细长末端外卷：菊瓣、百合
        return `M0 0 C${f1(W)} ${f1(-L * .3)} ${f1(W * .55)} ${f1(-L * .82)} ${f1(W * .15)} ${f1(-L)} ` +
          `Q${f1(-W * .8)} ${f1(-L * 1.03)} ${f1(-W * .28)} ${f1(-L * .84)} ` +
          `C${f1(-W * .45)} ${f1(-L * .5)} ${f1(-W)} ${f1(-L * .18)} 0 0 Z`;
      case 'saw':    // 锯齿缘：石竹、康乃馨
        return `M0 0 C${f1(W)} ${f1(-L * .2)} ${f1(W * .9)} ${f1(-L * .55)} ${f1(W * .75)} ${f1(-L * .68)} ` +
          `L${f1(W * .48)} ${f1(-L * .72)} L${f1(W * .72)} ${f1(-L * .8)} L${f1(W * .3)} ${f1(-L * .87)} ` +
          `L${f1(W * .44)} ${f1(-L * .95)} L0 ${f1(-L)} L${f1(-W * .44)} ${f1(-L * .95)} ` +
          `L${f1(-W * .3)} ${f1(-L * .87)} L${f1(-W * .72)} ${f1(-L * .8)} L${f1(-W * .48)} ${f1(-L * .72)} ` +
          `L${f1(-W * .75)} ${f1(-L * .68)} C${f1(-W * .9)} ${f1(-L * .55)} ${f1(-W)} ${f1(-L * .2)} 0 0 Z`;
      case 'fringe': // 漏斗状缘花，末端撕裂：矢车菊
        return `M0 0 L${f1(-W * .5)} ${f1(-L * .82)} L${f1(-W)} ${f1(-L)} L${f1(-W * .34)} ${f1(-L * .88)} ` +
          `L0 ${f1(-L * 1.02)} L${f1(W * .34)} ${f1(-L * .88)} L${f1(W)} ${f1(-L)} ` +
          `L${f1(W * .5)} ${f1(-L * .82)} Z`;
      default:       // 卵圆瓣：梅、桃、梨、海棠
        return `M0 0 C${f1(W)} ${f1(-L * .26)} ${f1(W * .9)} ${f1(-L * .76)} 0 ${f1(-L)} ` +
          `C${f1(-W * .9)} ${f1(-L * .76)} ${f1(-W)} ${f1(-L * .26)} 0 0 Z`;
    }
  }

  /* 一圈花瓣。cy 让整圈沿屏幕 y 下移，形成杯状/外翻的立体感 */
  function ring(n, L, W, t, fill, opt) {
    opt = opt || {};
    const off = opt.off || 0;
    const jit = opt.jit == null ? 2.5 : opt.jit;
    const seedOff = opt.seedOff || 0;
    const so = opt.sw == null ? .8 : opt.sw;
    const op = opt.op == null ? .5 : opt.op;
    const edge = opt.stroke || A.c2;
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = (360 * i / n + off + (rnd(A.seed, i + seedOff) - .5) * jit).toFixed(2);
      const tf = `translate(0 ${opt.cy || 0}) rotate(${a})`;
      s += `<path d="${pth(L, W, t)}" fill="${fill}" stroke="${edge}" stroke-width="${so}" ` +
        `stroke-opacity="${op}" transform="${tf}"/>`;
      if (opt.vein) {
        s += `<path d="M0 -4 Q${f1(W * .22)} ${f1(-L * .52)} 0 ${f1(-L + 4)}" fill="none" ` +
          `stroke="${edge}" stroke-width=".7" opacity=".22" transform="${tf}"/>`;
      }
    }
    return s;
  }

  /* 放射状雄蕊：细丝 + 顶端花药 */
  function stamens(n, len, opt) {
    opt = opt || {};
    const col = opt.color || A.c3;
    const fil = opt.filament || light(A.c3, .25);
    const r = opt.r || 1.7;
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = (360 * i / n + (opt.off || 0)).toFixed(2);
      s += `<g transform="rotate(${a})"><path d="M0 -2 Q${f1(len * .16)} ${f1(-len * .55)} 0 ${f1(-len)}" ` +
        `fill="none" stroke="${fil}" stroke-width="1" opacity=".9"/>` +
        `<ellipse cx="0" cy="${f1(-len)}" rx="${r}" ry="${f1(r * 1.45)}" fill="${col}"/></g>`;
    }
    return s;
  }

  /* 花盘：菊科 / 向日葵的盘花 */
  function disk(r, type) {
    let s = `<circle r="${r}" fill="url(#cg)" stroke="${dark(A.c3, .25)}" stroke-width=".9"/>`;
    if (type === 'grid') {                       // 向日葵：螺旋排列的籽
      for (let i = 0; i < 54; i++) {
        const t = i / 54, ang = t * Math.PI * 11, rho = Math.sqrt(t) * r * .86;
        s += `<circle cx="${f1(Math.cos(ang) * rho)}" cy="${f1(Math.sin(ang) * rho)}" r="1.15" ` +
          `fill="${dark(A.c3, .55)}" opacity=".7"/>`;
      }
    } else if (type === 'ring') {
      s += `<circle r="${f1(r * .55)}" fill="${light(A.c3, .2)}" opacity=".65"/>` +
        `<circle r="${f1(r * .3)}" fill="${dark(A.c3, .3)}"/>`;
    } else if (type === 'dark' || type === 'fringe') {
      s += `<circle r="${f1(r * .62)}" fill="${dark(A.c3, .3)}" opacity=".7"/>`;
    } else {
      for (let i = 0; i < 16; i++) {
        const ang = Math.PI * 2 * i / 16, rho = r * (.35 + (i % 3) * .2);
        s += `<circle cx="${f1(Math.cos(ang) * rho)}" cy="${f1(Math.sin(ang) * rho)}" r="1.2" ` +
          `fill="${dark(A.c3, .3)}" opacity=".75"/>`;
      }
    }
    return s;
  }

  /* 一片叶：从基点朝 -y 方向生长，rot 控制朝向 */
  function leafShape(cx, cy, L, W, rot, fill) {
    const ink = dark(A.leaf, .3);
    return `<g transform="translate(${cx} ${cy}) rotate(${rot})">` +
      `<path d="M0 0 C${f1(W)} ${f1(-L * .3)} ${f1(W * .72)} ${f1(-L * .84)} 0 ${f1(-L)} ` +
      `C${f1(-W * .72)} ${f1(-L * .84)} ${f1(-W)} ${f1(-L * .3)} 0 0 Z" fill="${fill || 'url(#lf)'}" ` +
      `stroke="${ink}" stroke-width=".7" stroke-opacity=".65"/>` +
      `<path d="M0 -2 L0 ${f1(-L + 3)}" fill="none" stroke="${ink}" stroke-width=".6" opacity=".4"/></g>`;
  }

  /* 茎 / 枝 / 叶：不同科属的植株形态也是识别特征 */
  function stem(t) {
    t = t || A.o.stem || 'broad';
    const g = A.leaf, dk = dark(g, .35);
    if (t === 'pad') {                                    // 荷 / 睡莲：浮水圆叶
      return `<path d="M0 32 Q-32 28 -30 20 Q-16 9 0 17 Q16 9 30 20 Q32 28 0 32 Z" ` +
        `fill="url(#lf)" stroke="${dk}" stroke-width=".9"/>` +
        `<path d="M0 30 L0 20 M0 22 L-20 16 M0 22 L20 16 M0 22 L-12 11 M0 22 L12 11" ` +
        `fill="none" stroke="${dk}" stroke-width=".7" opacity=".38"/>` +
        `<ellipse cx="0" cy="30" rx="26" ry="3" fill="#FFFFFF" opacity=".22"/>`;
    }
    if (t === 'branch' || t === 'cane') {                 // 木本枝条：先花后叶
      const w = t === 'cane' ? 2.2 : 3.4;
      return `<path d="M0 8 C-3 20 -2 36 1 52" fill="none" stroke="${g}" stroke-width="${w}" stroke-linecap="round"/>` +
        `<path d="M-1 24 C-11 19 -19 19 -26 13" fill="none" stroke="${g}" stroke-width="${f1(w * .65)}" stroke-linecap="round"/>` +
        `<path d="M0 34 C9 30 16 29 23 24" fill="none" stroke="${g}" stroke-width="${f1(w * .55)}" stroke-linecap="round"/>` +
        (t === 'cane' ? leafShape(-25, 14, 13, 5, -60, 'url(#lf)') + leafShape(23, 24, 12, 5, 55, 'url(#lf)') : '');
    }
    let s = `<path d="M0 7 C-2 21 -2 37 0 52" fill="none" stroke="${g}" ` +
      `stroke-width="${t === 'grass' ? 2 : 2.4}" stroke-linecap="round"/>`;
    if (t === 'thorn') {                                 // 蔷薇属：皮刺 + 羽状复叶
      s += `<path d="M-1 22 l-5 -5 l4 6 z M1 33 l5 -5 l-4 6 z" fill="${dk}"/>`;
      s += `<path d="M-1 39 L-19 34 M0 39 L18 34" stroke="${g}" stroke-width="1.2" fill="none"/>`;
      s += leafShape(-19, 34, 13, 5, -68, 'url(#lf)') + leafShape(-11, 38, 11, 4.5, -78, 'url(#lf)');
      s += leafShape(18, 34, 13, 5, 68, 'url(#lf)') + leafShape(10, 38, 11, 4.5, 78, 'url(#lf)');
      s += `<path d="M-19 34 l7 -1 M18 34 l-7 -1" stroke="${dark(g, .3)}" stroke-width=".6" opacity=".5"/>`;
    } else if (t === 'grass') {                          // 百合 / 郁金香：线形长叶
      s += leafShape(-1, 44, 38, 5, -22, 'url(#lf)') + leafShape(0, 40, 34, 4.5, 24, 'url(#lf)');
    } else if (t === 'vine') {                           // 牵牛 / 凌霄：缠绕藤 + 心形叶
      s = `<path d="M0 8 C8 20 -8 32 2 50" fill="none" stroke="${g}" stroke-width="2" stroke-linecap="round"/>`;
      s += `<path d="M-2 30 C-16 26 -22 18 -19 12 C-11 11 -4 18 -2 30 Z" fill="url(#lf)" stroke="${dk}" stroke-width=".7"/>` +
        `<path d="M-2 30 C-14 24 -18 18 -19 12" fill="none" stroke="${dk}" stroke-width=".6" opacity=".4"/>`;
      s += `<path d="M1 40 C13 37 19 30 17 24 C10 24 4 31 1 40 Z" fill="url(#lf)" stroke="${dk}" stroke-width=".7"/>`;
    } else {                                              // 普通草茎 + 对生卵形叶
      s += leafShape(-1, 32, 20, 8, -62, 'url(#lf)') + leafShape(0, 42, 18, 7, 58, 'url(#lf)');
    }
    return s;
  }

  /* 小花零件：供穗状 / 伞形 / 总状花序复用 */
  function floret(kind, x, y, sc, k) {
    k = k || 0;
    /* 小花在缩略卡上也要看得见：描边加重、整体放大 12% */
    const o = { off: 0, jit: 0, sw: .95, op: .8, seedOff: k * 3 + 1, stroke: A.c2 };
    let g = '';
    switch (kind) {
      case 'c4':
        g = ring(4, 9, 5, 'round', 'url(#pg)', o) + `<circle r="2.5" fill="${A.c3}"/>`; break;
      case 'c5':
        g = ring(5, 9, 4.6, 'round', 'url(#pg)', o) + `<circle r="2.4" fill="${A.c3}"/>`; break;
      case 'big4':
        g = ring(4, 15, 8, 'wide', 'url(#pgL)', o) + `<circle r="3" fill="${A.c3}"/>` +
          `<circle r="1.5" fill="${light(A.c3, .4)}"/>`; break;
      case 'star':
        g = ring(6, 8, 3, 'point', 'url(#pg)', o) + `<circle r="2" fill="${light(A.c3, .25)}"/>`; break;
      case 'funnel':
        g = ring(6, 10, 4, 'point', 'url(#pg)', o) +
          `<path d="M-2 -1 L-2 9 L2 9 L2 -1 Z" fill="${dark(A.c1, .12)}"/>` +
          `<circle r="2.4" fill="${A.c3}"/>`; break;
      case 'tube':
        g = `<path d="M-2 10 L-3 -3 L3 -3 L2 10 Z" fill="${dark(A.c1, .1)}"/>` +
          ring(5, 6, 3, 'round', 'url(#pg)', o) + `<circle r="1.6" fill="${A.c3}"/>`; break;
      case 'lip':
        g = `<path d="M0 0 C-8 -3 -10 -9 -3 -10 Q0 -9 0 -5 Q0 -9 3 -10 C10 -9 8 -3 0 0 Z" ` +
          `fill="url(#pg)" stroke="${A.c2}" stroke-width=".6"/>` +
          `<path d="M0 0 Q-5 4 0 8 Q5 4 0 0 Z" fill="url(#pgL)"/>`; break;
      case 'paper':
        g = ring(5, 8, 3.4, 'strap', 'url(#pgL)', o) + `<circle r="2.2" fill="${A.c3}"/>`; break;
      case 'tiny':
        g = `<circle r="3.4" fill="url(#pg)" stroke="${A.c2}" stroke-width=".4"/>` +
          `<circle r="1.3" fill="${A.c3}"/>`; break;
      case 'spur':
        g = ring(5, 8, 3.6, 'wide', 'url(#pg)', o) +
          `<path d="M0 2 Q-1 9 3 11 Q5 8 2 2 Z" fill="url(#pgL)"/>` +
          `<circle r="2" fill="${light(A.c3, .3)}"/>`; break;
      case 'pea':                                     // 蝶形花：旗瓣 + 翼瓣 + 龙骨
        g = `<path d="M0 -2 C-8 -2 -10 -9 -4 -11 Q0 -12 4 -11 C10 -9 8 -2 0 -2 Z" ` +
          `fill="url(#pg)" stroke="${A.c2}" stroke-width=".5"/>` +
          `<path d="M0 -2 C-8 0 -9 7 -2 8 L0 3 Z" fill="url(#pgD)" stroke="${A.c2}" stroke-width=".4"/>` +
          `<path d="M0 -2 C8 0 9 7 2 8 L0 3 Z" fill="url(#pgD)" stroke="${A.c2}" stroke-width=".4"/>` +
          `<circle cx="0" cy="-6" r="2" fill="${A.c3}"/>`; break;
      default:
        g = ring(5, 8, 4, 'round', 'url(#pg)', o) + `<circle r="2" fill="${A.c3}"/>`;
    }
    return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(sc * 1.12)})">${g}</g>`;
  }

  /* ================================================================
   * 37 种真实形态绘制器
   * ================================================================ */
  const FORMS = {

    /* 蔷薇科五瓣花：梅（圆瓣）、桃（尖瓣）、樱（缺刻）、梨（白瓣紫药）、海棠 */
    prunus() {
      const o = A.o, n = o.p || 5, st = o.style || 'round';
      let s = stem(o.stem || 'broad');
      const one = (x, y, sc, rot) => {
        const darkCore = o.stamens === 'dark';
        return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">` +
          ring(n, 27, 11, st, 'url(#pgD)', { off: 180 / n, stroke: A.c2, jit: 2 }) +
          ring(n, 22, 9, st, 'url(#pg)', { off: 0, stroke: A.c2, op: .3, sw: .6, jit: 0 }) +
          stamens(n * 3, 13, {
            color: darkCore ? '#8A3F66' : A.c3, r: 1.5,
            filament: darkCore ? '#C98D6A' : light(A.c3, .2)
          }) +
          `<circle r="3.4" fill="${light(A.c3, .18)}" stroke="${A.c2}" stroke-width=".5"/></g>`;
      };
      const c = o.cluster || 1;
      if (c === 1) s += one(0, 0, 1.2, 0);
      else if (c === 2) s += one(-19, -6, .84, -14) + one(15, -1, 1.08, 10);
      else if (c === 3) s += one(-22, 4, .8, -18) + one(20, -9, .86, 16) + one(0, 1, 1.1, 0);
      else s += one(-24, 6, .72, -20) + one(22, -8, .78, 18) + one(-7, -16, .8, -6) + one(8, 4, 1, 8);
      if (o.bud) {
        s += `<g transform="translate(28,-20) rotate(28)"><path d="M0 0 C-6 -3 -6 -12 0 -14 C6 -12 6 -3 0 0 Z" ` +
          `fill="${A.alt}" stroke="${A.c2}" stroke-width=".7"/></g>`;
      }
      return s;
    },

    /* 玫瑰 / 月季 / 蔷薇：螺旋层叠重瓣 + 卷心 + 带刺茎与羽状复叶 */
    rose() {
      const o = A.o, layers = o.layers || 5;
      let s = stem(o.thorn ? 'thorn' : 'broad');
      const one = (x, y, sc, rot) => {
        let g = `<ellipse cy="4" rx="33" ry="31" fill="${dark(A.c2, .1)}" opacity=".2"/>`;
        for (let L = 0; L < layers; L++) {
          const nn = 5 + L;
          const len = 36 - L * 4.4, w = 19 - L * 1.9;
          const fill = L < 2 ? 'url(#pgD)' : L >= layers - 2 ? 'url(#pgL)' : 'url(#pg)';
          g += ring(nn, len, w, L < 2 ? 'wide' : 'round', fill, {
            off: L * 29 + (o.curl ? L * 19 : 0), cy: L < 2 ? 4 : L < 4 ? 2 : 0,
            stroke: A.c2, op: .45, jit: 2, vein: L === 0, seedOff: L * 11
          });
        }
        if (o.curl) {
          g += `<path d="M0 2 C-9 -2 -10 7 -2 9 C7 10 10 1 4 -3 C0 -6 -5 -3 -4 1" ` +
            `fill="none" stroke="${A.c2}" stroke-width="2.2" opacity=".7"/>` +
            `<path d="M-4 1 C-7 -2 -5 -6 -1 -7" fill="none" stroke="${light(A.c1, .35)}" stroke-width="1.4" opacity=".85"/>` +
            `<ellipse cy="0" rx="5" ry="6" fill="${dark(A.c1, .38)}" opacity=".55"/>`;
        } else {
          g += stamens(16, 9, { color: A.c3, r: 1.4 }) + `<circle r="4" fill="${A.c3}"/>`;
        }
        return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">${g}</g>`;
      };
      const c = o.cluster || 1;
      if (c === 1) s += one(0, 0, o.ball ? 1.05 : 1, 0);
      else s += one(-20, 3, .72, -14) + one(19, -8, .78, 16) + one(0, 0, .95, 0);
      return s;
    },

    /* 牡丹 / 芍药：大波浪皱瓣，中心一圈金黄雄蕊 */
    peony() {
      let s = stem('broad');
      s += ring(8, 41, 21, 'frill', 'url(#pgD)', { off: 22, cy: 3, stroke: A.c2, vein: true });
      s += ring(9, 34, 17, 'frill', 'url(#pg)', { off: 0, cy: 2, stroke: A.c2, op: .45 });
      s += ring(10, 26, 13, 'frill', 'url(#pgL)', { off: 18, stroke: A.c2, op: .4 });
      s += ring(8, 18, 9, 'frill', 'url(#pg)', { off: 8, stroke: A.c2, op: .35 });
      s += stamens(24, 11, { color: A.c3, r: 1.5, filament: A.c3 });
      s += `<circle r="5" fill="${A.c3}"/><circle cx="-2" cy="-2" r="2" fill="${light(A.c3, .5)}"/>`;
      return s;
    },

    /* 菊科舌状花 + 花盘：雏菊、向日葵、波斯菊、金盏花、百日草、矢车菊 */
    daisy() {
      const o = A.o, n = o.n || 16, L = o.L || 32, W = o.W || 6, t = o.style || 'strap';
      let s = stem('broad');
      s += `<ellipse cy="3" rx="${f1(L * .92)}" ry="${f1(L * .88)}" fill="${dark(A.c1, .14)}" opacity=".22"/>`;
      s += ring(n, L, W, t, 'url(#pgD)', { off: 180 / n, cy: 2, stroke: A.c2, jit: 3, vein: W > 6 });
      s += ring(n, L * .93, W * .88, t, 'url(#pg)', { off: 0, stroke: A.c2, op: .28, sw: .6, jit: 3, seedOff: 9 });
      s += disk(o.disk === 'grid' ? 17 : o.disk === 'dark' ? 12 : o.disk === 'fringe' ? 10 : 10, o.disk || 'dot');
      if (o.disk === 'grid') {
        s += `<circle r="18" fill="none" stroke="${dark(A.c3, .25)}" stroke-width="1.2" opacity=".6"/>`;
      }
      return s;
    },

    /* 菊 / 万寿菊：细管瓣多层内抱 */
    chrys() {
      const o = A.o, n = o.n || 32;
      let s = stem('broad');
      for (let L = 0; L < 3; L++) {
        s += ring(n - L * 5, 38 - L * 8, 3.3, o.curl ? 'curl' : 'strap',
          L === 0 ? 'url(#pgD)' : L === 1 ? 'url(#pg)' : 'url(#pgL)',
          { off: L * (180 / n), cy: L === 0 ? 3 : 1, stroke: A.c2, op: .35, jit: 3, seedOff: L * 7 });
      }
      s += disk(7, 'dot');
      return s;
    },

    /* 荷 / 睡莲 / 并蒂莲：尖瓣碗状 + 中央莲蓬 + 浮水圆叶 */
    lotus() {
      const o = A.o;
      let s = stem('pad');
      const one = (x, y, sc, rot) => {
        let g = ring(o.flat ? 12 : 10, 39, 13, 'point', 'url(#pgD)', { off: 9, cy: 5, stroke: A.c2, vein: true });
        g += ring(o.flat ? 10 : 9, 32, 11, 'point', 'url(#pg)', { off: 0, cy: 3, stroke: A.c2, op: .45 });
        g += ring(7, 22, 8, 'point', 'url(#pgL)', { off: 16, stroke: A.c2, op: .35 });
        g += stamens(20, 16, { color: light(A.c3, .3), r: 1.2, filament: A.c3 });
        g += `<circle cy="3" r="9.5" fill="${light(A.c3, .28)}" stroke="${dark(A.c3, .2)}" stroke-width=".9"/>`;
        for (let i = 0; i < 9; i++) {
          const ang = Math.PI * 2 * i / 9, rr = i === 8 ? 0 : 5.4;
          g += `<circle cx="${f1(Math.cos(ang) * rr)}" cy="${f1(3 + Math.sin(ang) * rr)}" r="1.35" ` +
            `fill="${dark(A.c3, .35)}" opacity=".7"/>`;
        }
        return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">${g}</g>`;
      };
      if (o.twin) s += one(-19, 2, .78, -10) + one(19, 4, .78, 10);
      else s += one(0, 0, 1, 0);
      return s;
    },

    /* 玉兰 / 木兰 / 含笑 / 白兰：厚实匙形瓣直立成杯，木枝 */
    magnolia() {
      /* 玉兰是九枚厚实长瓣直立成杯，不是莲座式的多层平摊 */
      const o = A.o, p = o.p || 9, L = o.small ? 28 : o.slim ? 36 : 44;
      const W = o.slim ? 6.5 : 9.5;
      let s = stem(o.stem || 'broad');
      s += `<path d="M-17 12 C-23 -4 -19 -26 -9 -36 Q0 -41 9 -36 C19 -26 23 -4 17 12 ` +
        `Q0 19 -17 12 Z" fill="url(#pgD)" stroke="${A.c2}" stroke-width="1.1"/>`;
      s += ring(p, L, W, 'spoon', 'url(#pg)', { off: 180 / p, cy: 5, stroke: A.c2, op: .6, vein: true });
      s += ring(p - 2, L * .76, W * .8, 'spoon', 'url(#pgL)', { off: 12, cy: 1, stroke: A.c2, op: .4 });
      s += `<path d="M0 6 C-5 -1 -4 -14 0 -20 C4 -14 5 -1 0 6 Z" fill="${light(A.c3, .3)}" ` +
        `stroke="${dark(A.c3, .2)}" stroke-width=".7"/>`;
      s += stamens(12, 14, { color: A.c3, r: 1.4, filament: light(A.c3, .2) });
      return s;
    },

    /* 郁金香：三尖杯形花被 + 长阔叶 */
    tulip() {
      let s = stem('grass');
      s += `<path d="M-19 6 C-23 -13 -19 -33 -9 -41 L0 -33 L9 -41 C19 -33 23 -13 19 6 Q0 14 -19 6 Z" ` +
        `fill="url(#pg)" stroke="${A.c2}" stroke-width="1.1"/>`;
      s += `<path d="M-9 -41 Q-5 -31 -2 -37 L0 -33 L2 -37 Q5 -31 9 -41" fill="none" ` +
        `stroke="${A.c2}" stroke-width="1" opacity=".6"/>`;
      s += `<path d="M0 -31 C-8 -22 -9 -6 -6 8 M0 -31 C8 -22 9 -6 6 8" fill="none" ` +
        `stroke="${A.c2}" stroke-width="1" opacity=".5"/>`;
      s += `<path d="M-13 -14 C-15 -26 -12 -35 -7 -39" fill="none" stroke="#FFFFFF" stroke-width="2.4" opacity=".3"/>`;
      s += `<path d="M-19 6 Q0 13 19 6" fill="none" stroke="${A.c2}" stroke-width="1" opacity=".6"/>`;
      return s;
    },

    /* 百合：六枚反卷长瓣 + 斑点 + 六枚长雄蕊和大花药 */
    lily() {
      let s = stem('grass');
      /* 六枚长椭圆瓣，尖端向外反卷，是百合最容易辨认的特征 */
      const LP = 'M0 0 C-14 -10 -14 -33 -5 -44 Q0 -49 5 -44 C14 -33 14 -10 0 0 Z';
      const LP2 = 'M0 0 C-10 -8 -10 -27 -4 -35 Q0 -39 4 -35 C10 -27 10 -8 0 0 Z';
      for (let i = 0; i < 6; i++) {
        const a = 30 + i * 60;
        s += `<g transform="translate(0 2) rotate(${a})">` +
          `<path d="${LP}" fill="url(#pgD)" stroke="${A.c2}" stroke-width="1.1"/>` +
          `<path d="${LP2}" fill="url(#pg)" opacity=".95"/>` +
          `<path d="M0 -4 L0 -36" fill="none" stroke="#FFFFFF" stroke-width="1.1" opacity=".45"/>` +
          `<path d="M-5 -44 Q0 -40 5 -44" fill="none" stroke="${A.c2}" stroke-width="1" opacity=".6"/>`;
        if (A.o.spots) {
          s += `<ellipse cy="-26" rx="2.1" ry="1.3" fill="${A.alt}" opacity=".8"/>` +
            `<ellipse cx="3" cy="-33" rx="1.6" ry="1" fill="${A.alt}" opacity=".7"/>`;
        }
        s += `</g>`;
      }
      s += stamens(6, 33, { color: A.c3, r: 2.7, filament: light(A.c1, .1), off: 30 });
      s += `<path d="M0 5 Q3 -12 0 -29" fill="none" stroke="${light(A.c1, .2)}" stroke-width="2.4"/>` +
        `<circle cy="-30" r="2.6" fill="${light(A.c3, .3)}"/>`;
      return s;
    },

    /* 合瓣喇叭：牵牛、凌霄、泡桐、矮牵牛（侧视 + 五浅裂口 + 喉部） */
    trumpet() {
      const o = A.o, c = o.cluster || 1;
      let s = stem('vine');
      const one = (x, y, sc, rot) => {
        let g = `<path d="M-5 12 C-8 2 -10 -8 -15 -19 L-21 -23 Q0 -32 21 -23 L15 -19 C10 -8 8 2 5 12 Z" ` +
          `fill="url(#pg)" stroke="${A.c2}" stroke-width="1"/>`;
        g += `<ellipse cy="-23" rx="21" ry="7.5" fill="url(#pgL)" stroke="${A.c2}" stroke-width="1"/>`;
        g += `<ellipse cy="-23" rx="12" ry="4.4" fill="${o.throat ? (A.c3) : dark(A.c1, .3)}" opacity=".92"/>`;
        g += `<path d="M-21 -23 l-3 -5 M-10 -27 l-2 -6 M0 -30 l0 -6 M10 -27 l2 -6 M21 -23 l3 -5" ` +
          `fill="none" stroke="${A.c2}" stroke-width="1.3" stroke-linecap="round"/>`;
        g += `<path d="M0 -21 L0 -4 M-9 -14 C-11 -6 -9 0 -7 6" fill="none" stroke="#FFFFFF" stroke-width="1.2" opacity=".28"/>`;
        g += `<path d="M0 -20 L0 -12" stroke="${light(A.c3, .3)}" stroke-width="1.2" opacity=".8"/>`;
        return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">${g}</g>`;
      };
      if (c === 1) s += one(0, -4, 1.15, 0);
      else if (c === 2) s += one(-17, 4, .8, -22) + one(12, -8, 1.05, 12);
      else if (c === 3) s += one(-20, 8, .72, -20) + one(17, -2, .82, 16) + one(0, -16, .86, 0);
      else s += one(-20, 10, .68, -22) + one(18, 2, .74, 18) + one(-8, -14, .76, -8) + one(10, -22, .72, 10);
      return s;
    },

    /* 钟形花：铃兰、风铃草（下垂一串）；桔梗、龙胆（直立星形五裂） */
    bell() {
      const o = A.o, cnt = o.count || 6;
      let s = stem('grass');
      if (o.up) {                                     // 桔梗 / 龙胆：钟口朝上
        const pos = [[-16, 4, .82], [15, 2, .86], [0, -18, 1]];
        for (let i = 0; i < Math.min(cnt, 3); i++) {
          const [x, y, sc] = pos[i];
          s += `<g transform="translate(${x} ${y}) scale(${sc})">` +
            `<path d="M-6 12 C-9 2 -10 -6 -12 -14 L12 -14 C10 -6 9 2 6 12 Z" fill="url(#pgD)" stroke="${A.c2}" stroke-width=".9"/>` +
            ring(5, 18, 10, o.star ? 'point' : 'wide', 'url(#pg)',
              { off: 36, stroke: A.c2, op: .45, jit: 0, seedOff: i * 4 }) +
            `<circle cy="-12" r="3" fill="${light(A.c3, .35)}"/></g>`;
        }
        return s;
      }
      s += `<path d="M0 -38 C-3 -20 -5 2 -4 20" fill="none" stroke="${A.leaf}" stroke-width="1.8" stroke-linecap="round"/>`;
      for (let i = 0; i < cnt; i++) {
        const y = -34 + i * (cnt > 5 ? 9 : 12);
        const x = (i % 2 ? 1 : -1) * (3 + i * .7);
        const w = 8 + i * .5;
        s += `<path d="M${f1(x)} ${f1(y - 7)} l-3 -4" fill="none" stroke="${A.leaf}" stroke-width="1"/>`;
        s += `<path d="M${f1(x - 2)} ${f1(y - 8)} C${f1(x - w)} ${f1(y - 7)} ${f1(x - w - 1)} ${f1(y + 3)} ` +
          `${f1(x - w)} ${f1(y + 6)} Q${f1(x)} ${f1(y + 12)} ${f1(x + w)} ${f1(y + 6)} ` +
          `C${f1(x + w + 1)} ${f1(y + 3)} ${f1(x + w)} ${f1(y - 7)} ${f1(x + 2)} ${f1(y - 8)} Z" ` +
          `fill="url(#pg)" stroke="${A.c2}" stroke-width=".9"/>`;
        s += `<path d="M${f1(x - w)} ${f1(y + 6)} Q${f1(x)} ${f1(y + 1)} ${f1(x + w)} ${f1(y + 6)}" ` +
          `fill="none" stroke="${A.c2}" stroke-width=".8" opacity=".55"/>`;
        s += `<circle cx="${f1(x)}" cy="${f1(y - 1)}" r="1.8" fill="${light(A.c3, .4)}" opacity=".8"/>`;
      }
      return s;
    },

    /* 兰科：三萼二瓣 + 明显唇瓣（蝴蝶兰 / 国兰 / 文心兰） */
    orchid() {
      const o = A.o, lip = o.lip || 'slipper';
      let s = stem('broad');
      if (lip === 'butterfly') {
        s += `<path d="M0 0 C-24 -6 -34 -24 -26 -33 C-16 -38 -4 -22 0 -4 Z" fill="url(#pg)" stroke="${A.c2}" stroke-width="1"/>` +
          `<path d="M0 0 C24 -6 34 -24 26 -33 C16 -38 4 -22 0 -4 Z" fill="url(#pg)" stroke="${A.c2}" stroke-width="1"/>`;
      } else {
        s += `<g transform="rotate(-58)"><path d="${pth(30, 9, 'point')}" fill="url(#pg)" stroke="${A.c2}" stroke-width=".8"/></g>`;
        s += `<g transform="rotate(58)"><path d="${pth(30, 9, 'point')}" fill="url(#pg)" stroke="${A.c2}" stroke-width=".8"/></g>`;
      }
      s += `<g transform="rotate(-24)"><path d="${pth(28, 8, 'point')}" fill="url(#pgL)" stroke="${A.c2}" stroke-width=".7"/></g>`;
      s += `<g transform="rotate(24)"><path d="${pth(28, 8, 'point')}" fill="url(#pgL)" stroke="${A.c2}" stroke-width=".7"/></g>`;
      s += `<path d="${pth(30, 8, 'point')}" fill="url(#pgD)" stroke="${A.c2}" stroke-width=".8" transform="rotate(180)"/>`;
      /* 唇瓣 */
      if (lip === 'dancing') {
        s += `<path d="M0 1 C-19 1 -24 18 -14 26 Q0 34 14 26 C24 18 19 1 0 1 Z" fill="url(#pgL)" ` +
          `stroke="${A.c2}" stroke-width="1"/><path d="M-8 16 Q0 22 8 16" fill="none" stroke="${A.alt}" stroke-width="2"/>`;
      } else if (lip === 'butterfly') {
        /* 蝴蝶兰的紫红唇瓣是最醒目的识别点 */
        s += `<path d="M0 0 C-13 2 -16 17 -8 24 Q0 30 8 24 C16 17 13 2 0 0 Z" fill="${A.c3}" ` +
          `stroke="${A.c2}" stroke-width="1"/><path d="M-5 12 Q0 18 5 12" fill="none" stroke="${light(A.c3, .5)}" stroke-width="1.6"/>` +
          `<circle cy="9" r="2.4" fill="${light(A.c3, .45)}"/>`;
      } else {
        s += `<path d="M0 0 C-10 2 -12 14 -5 19 Q0 22 5 19 C12 14 10 2 0 0 Z" fill="url(#cg)" ` +
          `stroke="${A.c2}" stroke-width=".9"/>`;
      }
      s += `<ellipse cy="-1" rx="5" ry="6" fill="${light(A.c3, .3)}" stroke="${A.c2}" stroke-width=".7"/>` +
        `<circle cy="-3" r="1.8" fill="${A.c3}"/>`;
      if (o.count === 2) {
        s += `<g transform="translate(-30,20) scale(.42)">` +
          ring(5, 27, 13, 'wide', 'url(#pg)', { off: 36, stroke: A.c2, op: .4, jit: 0 }) +
          `<circle r="4" fill="${A.c3}"/></g>`;
      }
      return s;
    },

    /* 鸢尾：三枚下垂瓣带黄髯 + 三枚直立瓣 + 剑形叶 */
    iris() {
      let s = stem('grass');
      const down = [60, 180, 300], up = [0, 120, 240];
      for (const a of down) {
        s += `<g transform="rotate(${a})"><path d="M0 0 C-15 -6 -17 -27 -6 -36 Q0 -40 6 -36 C17 -27 15 -6 0 0 Z" ` +
          `fill="url(#pg)" stroke="${A.c2}" stroke-width="1"/>` +
          `<path d="M0 -6 L0 -27" stroke="${A.c3}" stroke-width="3.4" opacity=".9" stroke-linecap="round"/>` +
          `<path d="M0 -6 L0 -24" stroke="#FFFFFF" stroke-width="1" opacity=".35"/></g>`;
      }
      for (const a of up) {
        s += `<g transform="rotate(${a})"><path d="M0 0 C-9 -8 -8 -28 0 -34 C8 -28 9 -8 0 0 Z" ` +
          `fill="url(#pgL)" stroke="${A.c2}" stroke-width=".9"/>` +
          `<path d="M0 -4 L0 -28" stroke="${A.c2}" stroke-width=".7" opacity=".4"/></g>`;
      }
      s += `<circle r="4.5" fill="${light(A.c3, .25)}"/>`;
      s += leafShape(-2, 48, 42, 4, -12, 'url(#lf)') + leafShape(2, 46, 38, 4, 14, 'url(#lf)');
      return s;
    },

    /* 直立穗状花序：风信子、薰衣草、一串红、飞燕草、补血草、紫罗兰 */
    spike() {
      const o = A.o, cnt = o.dense ? 20 : 12, k = o.floret || 'star';
      let s = stem('grass');
      s += `<path d="M0 12 C-2 -8 -2 -30 0 -44" fill="none" stroke="${A.leaf}" stroke-width="2" stroke-linecap="round"/>`;
      for (let i = 0; i < cnt; i++) {
        const t = i / (cnt - 1), y = -42 + t * 54;
        const w = 12 * Math.sin(Math.PI * (.15 + t * .8));
        const side = i % 2 ? 1 : -1;
        const x = side * (2 + w * .55);
        s += floret(k, x, y, .88 + (1 - t) * .25, i);
        if (o.dense) s += floret(k, -x * .85, y + 2, .74, i + 40);
      }
      s += `<path d="M0 -44 C-3 -48 -2 -52 0 -54" fill="none" stroke="${A.leaf}" stroke-width="1.4"/>`;
      return s;
    },

    /* 垂挂总状花序：紫藤、槐花、蓝花楹 */
    raceme() {
      const o = A.o, cnt = o.count || 10, k = o.floret || 'pea';
      let s = stem('broad');
      s += `<path d="M0 -40 C-3 -20 -3 4 -1 18" fill="none" stroke="${A.leaf}" stroke-width="2.2" stroke-linecap="round"/>`;
      for (let i = 0; i < cnt; i++) {
        const t = i / (cnt - 1), y = -37 + t * 52;
        const x = (i % 2 ? 1 : -1) * (4 + 16 * Math.sin(Math.PI * t));
        s += `<path d="M0 ${f1(y - 3)} Q${f1(x * .6)} ${f1(y - 6)} ${f1(x)} ${f1(y - 2)}" ` +
          `fill="none" stroke="${A.leaf}" stroke-width="1"/>`;
        s += floret(k, x, y, 1.5 - t * .5, i);
      }
      s += `<path d="M-2 -38 Q-12 -44 -16 -38 Q-8 -33 -2 -38 Z" fill="url(#lf)" stroke="${dark(A.leaf, .3)}" stroke-width=".7"/>`;
      return s;
    },

    /* 伞形 / 球状 / 圆锥花序：绣球、丁香、桂花、满天星、君子兰、琼花… */
    umbel() {
      const o = A.o, k = o.floret || 'c5', shape = o.shape || 'flat', n = o.count || 10;
      let s = stem(o.stem || 'broad');
      const pts = [];
      if (shape === 'ball') {
        for (let i = 0; i < n; i++) {
          const a = i * 2.39996, r = 26 * Math.sqrt(i / n);
          pts.push([Math.cos(a) * r, -12 + Math.sin(a) * r * .82]);
        }
      } else if (shape === 'cone') {
        for (let i = 0; i < n; i++) {
          const t = i / n, row = Math.floor(i / 4), col = i % 4;
          pts.push([(col - 1.5) * (4 + t * 11), -34 + row * 9 + (i % 2) * 3]);
        }
      } else if (shape === 'scatter') {
        for (let i = 0; i < n; i++) {
          pts.push([(rnd(A.seed, i + 3) - .5) * 62, -40 + rnd(A.seed, i + 31) * 58]);
        }
      } else if (shape === 'ring') {
        for (let i = 0; i < n; i++) {
          const a = 360 * i / n;
          pts.push([Math.cos(a * Math.PI / 180) * 27, -12 + Math.sin(a * Math.PI / 180) * 20]);
        }
      } else if (shape === 'loose') {
        for (let i = 0; i < n; i++) {
          const a = 360 * i / n + 12;
          pts.push([Math.cos(a * Math.PI / 180) * 21, -18 + Math.sin(a * Math.PI / 180) * 15]);
        }
      } else {
        for (let i = 0; i < n; i++) {
          const a = 360 * i / n;
          pts.push([Math.cos(a * Math.PI / 180) * 20, -18 + Math.sin(a * Math.PI / 180) * 13]);
        }
      }
      /* 花序梗 */
      if (shape === 'flat' || shape === 'loose' || shape === 'ring') {
        for (const [x, y] of pts) {
          s += `<path d="M0 6 Q${f1(x * .4)} ${f1(y * .5)} ${f1(x)} ${f1(y)}" fill="none" ` +
            `stroke="${A.leaf}" stroke-width=".9" opacity=".55"/>`;
        }
      }
      pts.sort((p, q) => p[1] - q[1]);
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i];
        const sc = shape === 'ring' ? 1.1 : shape === 'ball' ? .88 : .95;
        s += floret(k, x, y, sc, i);
      }
      if (shape === 'ring') {
        s += `<circle cy="-12" r="10" fill="${dark(A.c1, .1)}" opacity=".35"/>`;
        for (let i = 0; i < 9; i++) {
          const a = i * 2.4;
          s += floret('tiny', Math.cos(a) * 7, -12 + Math.sin(a) * 6, .7, i + 20);
        }
      }
      return s;
    },

    /* 球状 / 绒球花：合欢（放射花丝）、千日红、结香 */
    ball() {
      const o = A.o, type = o.type || 'globe';
      let s = stem('broad');
      if (type === 'silk') {
        /* 合欢：放射状粉红花丝是它唯一的识别点，必须够密够实 */
        s += `<circle r="27" fill="url(#pgL)" opacity=".5"/>`;
        for (let i = 0; i < 96; i++) {
          const a = i * 2.39996, r = 17 + rnd(A.seed, i) * 21;
          const x = Math.cos(a) * r, y = Math.sin(a) * r * .88;
          s += `<path d="M0 0 Q${f1(x * .55)} ${f1(y * .55 - 4)} ${f1(x)} ${f1(y)}" fill="none" ` +
            `stroke="${i % 3 ? dark(A.c1, .16) : light(A.c1, .18)}" stroke-width="1.5" opacity=".95"/>` +
            `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.7" fill="${i % 4 ? A.c2 : A.c3}"/>`;
        }
        s += `<circle r="6" fill="${dark(A.c1, .2)}" opacity=".55"/>`;
      } else if (type === 'cluster') {
        for (let i = 0; i < 17; i++) {
          const a = i * 2.39996, r = 20 * Math.sqrt(i / 17);
          s += floret('tiny', Math.cos(a) * r, Math.sin(a) * r, .82, i);
        }
      } else {
        for (let i = 0; i < 30; i++) {
          const a = i * 2.39996, r = 25 * Math.sqrt(i / 30);
          s += `<ellipse cx="${f1(Math.cos(a) * r)}" cy="${f1(Math.sin(a) * r)}" rx="5" ry="3.6" ` +
            `transform="rotate(${f1(a * 57.3)} ${f1(Math.cos(a) * r)} ${f1(Math.sin(a) * r)})" ` +
            `fill="${i % 2 ? 'url(#pg)' : 'url(#pgL)'}" stroke="${A.c2}" stroke-width=".5" opacity=".95"/>`;
        }
      }
      return s;
    },

    /* 三色堇：上二大瓣 + 侧二瓣 + 下一瓣带「脸」斑纹 */
    pansy() {
      let s = stem('broad');
      s += `<g transform="rotate(-32)"><path d="${pth(28, 17, 'wide')}" fill="url(#pgD)" stroke="${A.c2}" stroke-width=".8"/></g>`;
      s += `<g transform="rotate(32)"><path d="${pth(28, 17, 'wide')}" fill="url(#pgD)" stroke="${A.c2}" stroke-width=".8"/></g>`;
      s += `<g transform="rotate(-100)"><path d="${pth(25, 14, 'wide')}" fill="${A.alt}" stroke="${A.c2}" stroke-width=".8"/></g>`;
      s += `<g transform="rotate(100)"><path d="${pth(25, 14, 'wide')}" fill="${A.alt}" stroke="${A.c2}" stroke-width=".8"/></g>`;
      s += `<path d="${pth(26, 18, 'wide')}" fill="url(#pg)" stroke="${A.c2}" stroke-width=".9" transform="rotate(180)"/>`;
      s += `<path d="M-6 -4 Q0 -10 6 -4 M-4 2 L-13 9 M4 2 L13 9" fill="none" stroke="${dark(A.c2, .2)}" ` +
        `stroke-width="1.2" opacity=".7"/>`;
      s += `<circle r="5" fill="${A.c3}"/><circle r="2" fill="${dark(A.c3, .35)}"/>`;
      return s;
    },

    /* 罂粟科薄皱瓣：虞美人、绿绒蒿、银莲花、白头翁 */
    poppy() {
      const o = A.o, n = o.n || 4;
      let s = stem('broad');
      s += ring(n, 38, 21, 'frill', 'url(#pgD)', { off: 180 / n, cy: 3, stroke: A.c2, vein: true });
      s += ring(n, 33, 18, 'frill', 'url(#pg)', { off: 0, stroke: A.c2, op: .35 });
      if (o.darkcore) {
        s += `<circle r="14" fill="${A.c3}" opacity=".85"/>` + stamens(26, 15, { color: dark(A.c3, .2), r: 1.3, filament: A.c3 });
      } else {
        s += `<circle r="9" fill="${dark(A.c3, .25)}"/>` + stamens(26, 17, { color: A.c3, r: 1.4, filament: dark(A.c1, .4) });
        s += `<circle r="5" fill="${light(A.c3, .2)}"/>`;
      }
      return s;
    },

    /* 马蹄莲：白色佛焰苞卷成喇叭 + 黄色肉穗花序 */
    calla() {
      let s = stem('grass');
      s += `<path d="M-7 12 C-16 2 -23 -16 -18 -34 C-10 -44 8 -44 18 -33 C25 -20 14 -2 7 12 ` +
        `Q0 17 -7 12 Z" fill="url(#pgD)" stroke="${A.c2}" stroke-width="1.5"/>`;
      s += `<path d="M-5 10 C-13 1 -19 -16 -15 -32 C-8 -40 6 -40 15 -31 C21 -19 12 -2 5 10 ` +
        `Q0 14 -5 10 Z" fill="url(#pg)"/>`;
      s += `<path d="M-7 12 C-2 4 -2 -18 0 -34 C4 -18 6 2 7 12 Q0 17 -7 12 Z" ` +
        `fill="url(#pgD)" opacity=".45"/>`;
      s += `<path d="M0 8 C-3 -4 -3 -18 0 -30 C3 -18 4 -4 2 8 Z" fill="url(#cg)" stroke="${dark(A.c3, .25)}" stroke-width=".8"/>`;
      s += `<path d="M-14 -20 C-10 -30 -3 -36 3 -37" fill="none" stroke="#FFFFFF" stroke-width="2.2" opacity=".55"/>`;
      return s;
    },

    /* 鹤望兰：橙色萼片 + 蓝色箭形花瓣 + 绿色佛焰苞 */
    bird() {
      let s = stem('grass');
      s += `<path d="M-6 14 C-14 6 -18 -4 -16 -12 L-2 -6 L-6 14 Z" fill="${dark(A.leaf, .1)}" ` +
        `stroke="${dark(A.leaf, .3)}" stroke-width=".9"/>`;
      for (const [rot, col] of [[-34, 'url(#pgD)'], [-14, 'url(#pg)'], [6, 'url(#pgL)']]) {
        s += `<g transform="rotate(${rot})"><path d="M0 6 C-5 -8 -5 -32 0 -42 C5 -32 5 -8 0 6 Z" ` +
          `fill="${col}" stroke="${A.c2}" stroke-width=".8"/></g>`;
      }
      s += `<path d="M-2 4 C-16 -2 -26 -20 -22 -32 C-12 -34 -2 -20 2 -2 Z" fill="${A.c3}" ` +
        `stroke="${dark(A.c3, .25)}" stroke-width=".9"/>`;
      s += `<path d="M2 2 C10 -8 12 -26 8 -36 C2 -32 -2 -16 0 0 Z" fill="${light(A.c3, .35)}" ` +
        `stroke="${dark(A.c3, .2)}" stroke-width=".7"/>`;
      return s;
    },

    /* 一品红：红色苞片两层星形 + 中心黄绿杯状小蕊 */
    poinsettia() {
      let s = stem('broad');
      s += ring(8, 40, 11, 'point', 'url(#pgD)', { off: 22, cy: 2, stroke: A.c2, vein: true });
      s += ring(6, 28, 9, 'point', 'url(#pg)', { off: 0, stroke: A.c2, op: .45 });
      for (let i = 0; i < 7; i++) {
        const a = 360 * i / 7;
        s += `<g transform="rotate(${a})"><ellipse cy="-9" rx="3.2" ry="4.4" fill="${A.c3}" ` +
          `stroke="${dark(A.c3, .25)}" stroke-width=".6"/><circle cy="-12" r="1.2" fill="${dark(A.c3, .3)}"/></g>`;
      }
      return s;
    },

    /* 仙客来：五枚向上反卷的瓣 + 下垂花梗 */
    cyclamen() {
      let s = `<path d="M0 8 C-4 20 -3 36 0 50" fill="none" stroke="${A.leaf}" stroke-width="2.2" stroke-linecap="round"/>`;
      s += leafShape(-2, 44, 18, 11, -30, 'url(#lf)');
      for (let i = -2; i <= 2; i++) {
        const a = i * 26;
        s += `<g transform="rotate(${a})"><path d="M0 6 C-9 -2 -9 -30 -3 -38 Q0 -42 3 -38 C9 -30 9 -2 0 6 Z" ` +
          `fill="${i % 2 ? 'url(#pg)' : 'url(#pgL)'}" stroke="${A.c2}" stroke-width=".9"/>` +
          `<path d="M0 -4 L0 -30" stroke="#FFFFFF" stroke-width="1" opacity=".3"/></g>`;
      }
      s += `<circle cy="4" r="4" fill="${dark(A.c1, .3)}"/>`;
      return s;
    },

    /* 石竹 / 康乃馨：锯齿缘花瓣 + 长筒状花萼 */
    carnation() {
      const o = A.o;
      let s = stem('grass');
      s += `<path d="M-7 12 L-8 -3 Q0 -7 8 -3 L7 12 Z" fill="url(#lf)" stroke="${dark(A.leaf, .3)}" stroke-width=".8"/>`;
      const layers = o.double ? 4 : 1;
      for (let L = 0; L < layers; L++) {
        s += ring(5 + L, 32 - L * 4.5, 13 - L * 1.2, 'saw',
          L === 0 ? 'url(#pgD)' : L % 2 ? 'url(#pg)' : 'url(#pgL)',
          { off: L * 21 + 36, cy: L === 0 ? 2 : 0, stroke: A.c2, op: .45, jit: 2, seedOff: L * 9 });
      }
      if (!o.double) s += stamens(10, 11, { color: A.c3, r: 1.5 }) + `<circle r="4.5" fill="${light(A.c1, .3)}"/>`;
      return s;
    },

    /* 木槿 / 扶桑 / 芙蓉：五枚大瓣 + 突出的长蕊柱 */
    hibiscus() {
      let s = stem('broad');
      s += ring(5, 40, 22, 'wide', 'url(#pg)', { off: 36, cy: 2, stroke: A.c2, vein: true, jit: 2 });
      s += ring(5, 31, 17, 'wide', 'url(#pgL)', { off: 0, stroke: A.c2, op: .3, sw: .6, jit: 0 });
      s += `<circle r="9" fill="${dark(A.c1, .25)}" opacity=".5"/>`;
      s += `<path d="M0 6 C2 -4 2 -18 0 -32" fill="none" stroke="${light(A.c1, .15)}" stroke-width="2.6"/>`;
      for (let i = 0; i < 12; i++) {
        const a = 360 * i / 12;
        s += `<g transform="rotate(${a})"><ellipse cy="-14" rx="1.7" ry="2.6" fill="${A.c3}"/></g>`;
      }
      for (let i = 0; i < 5; i++) {
        s += `<circle cx="${f1(Math.cos(i * 1.256) * 3)}" cy="${f1(-32 + Math.sin(i * 1.256) * 2)}" r="2.2" fill="${A.c3}"/>`;
      }
      return s;
    },

    /* 水仙：六枚白瓣 + 中央橙黄副冠（波浪口） */
    narcissus() {
      let s = stem('grass');
      s += ring(6, 36, 12, 'wide', 'url(#pg)', { off: 30, cy: 2, stroke: A.c2, vein: true });
      s += `<circle r="15" fill="url(#cg)" stroke="${dark(A.c3, .25)}" stroke-width="1"/>`;
      s += `<path d="M-14 -1 Q-10 -9 -7 -3 Q-3 -12 0 -4 Q4 -12 7 -3 Q11 -9 14 -1 ` +
        `Q11 8 0 9 Q-11 8 -14 -1 Z" fill="${light(A.c3, .18)}" opacity=".8"/>`;
      s += `<circle r="8" fill="${dark(A.c3, .28)}" opacity=".65"/>` +
        `<circle cx="-3" cy="-3" r="2.6" fill="#FFFFFF" opacity=".35"/>`;
      return s;
    },

    /* 鸡蛋花 / 夹竹桃：五枚螺旋排列的瓣，外缘黄心 */
    plumeria() {
      const o = A.o;
      let s = stem('broad');
      for (let i = 0; i < 5; i++) {
        const a = i * 72 + 14;
        s += `<g transform="rotate(${a})"><path d="M0 0 C${o.frill ? 16 : 13} -8 15 -28 3 -36 ` +
          `Q-6 -40 -10 -28 C-13 -14 -8 -3 0 0 Z" fill="${i % 2 ? 'url(#pg)' : 'url(#pgL)'}" ` +
          `stroke="${A.c2}" stroke-width=".9"/>` +
          `<path d="M0 -2 Q4 -18 2 -30" fill="none" stroke="#FFFFFF" stroke-width="1" opacity=".3"/></g>`;
      }
      s += `<circle r="9" fill="url(#cg)"/>` + stamens(10, 6, { color: dark(A.c3, .3), r: 1, filament: A.c3 });
      if (o.frill) s += `<circle r="5" fill="${light(A.c1, .35)}" opacity=".8"/>`;
      return s;
    },

    /* 木棉 / 凤凰花 / 紫荆 / 紫薇：五瓣 + 一束刷状长雄蕊 */
    bombax() {
      const o = A.o;
      let s = stem(o.stem || 'broad');
      const t = o.frill ? 'frill' : 'wide';
      s += ring(5, 37, o.frill ? 15 : 17, t, 'url(#pg)', { off: 36, cy: 3, stroke: A.c2, vein: true });
      if (o.flag) {
        s += `<g transform="rotate(180)"><path d="${pth(34, 15, 'wide')}" fill="${A.alt}" opacity=".85" ` +
          `stroke="${A.c2}" stroke-width=".7"/></g>`;
      }
      s += `<circle r="6" fill="${dark(A.c1, .3)}" opacity=".6"/>`;
      for (let i = 0; i < 22; i++) {
        const a = -40 + i * 3.7, len = 26 + rnd(A.seed, i) * 14;
        s += `<g transform="rotate(${f1(a)})"><path d="M0 0 Q${f1(len * .12)} ${f1(-len * .6)} 0 ${f1(-len)}" ` +
          `fill="none" stroke="${i % 4 ? A.c3 : light(A.c3, .3)}" stroke-width="1.1" opacity=".9"/>` +
          `<ellipse cy="${f1(-len)}" rx="1.6" ry="2.4" fill="${dark(A.c3, .1)}"/></g>`;
      }
      return s;
    },

    /* 荷包牡丹：一串心形小花下垂 */
    heart() {
      let s = stem('broad');
      s += `<path d="M0 -40 C-6 -24 -6 -2 -3 12" fill="none" stroke="${A.leaf}" stroke-width="1.8" stroke-linecap="round"/>`;
      for (let i = 0; i < 5; i++) {
        const y = -34 + i * 11, x = (i % 2 ? 1 : -1) * (4 + i * .8);
        s += `<path d="M0 ${f1(y - 5)} Q${f1(x * .6)} ${f1(y - 8)} ${f1(x)} ${f1(y - 4)}" ` +
          `fill="none" stroke="${A.leaf}" stroke-width="1"/>`;
        s += `<g transform="translate(${f1(x)} ${f1(y)})">` +
          `<path d="M0 -5 C-9 -12 -16 -3 -10 5 Q-4 12 0 17 Q4 12 10 5 C16 -3 9 -12 0 -5 Z" ` +
          `fill="url(#pg)" stroke="${A.c2}" stroke-width=".9"/>` +
          `<path d="M0 9 Q-5 3 0 -2 Q5 3 0 9 Z" fill="${A.c3}"/>` +
          `<path d="M0 10 L0 17" stroke="${A.c3}" stroke-width="1.4"/></g>`;
      }
      return s;
    },

    /* 金银花：白 / 黄双色细长筒花成对，唇形花冠 */
    honeysuckle() {
      let s = stem('vine');
      const one = (x, y, rot, white) => {
        /* 金银花得名于白花转黄，两色必须一眼可分 */
        const col = white ? '#FFFFFF' : 'url(#pgD)';
        const edge = white ? '#93A392' : A.c2;
        return `<g transform="translate(${x} ${y}) rotate(${rot})">` +
          `<path d="M0 12 C-5 5 -5 -8 -3 -19 L3 -19 C5 -8 5 5 0 12 Z" fill="${col}" ` +
          `stroke="${edge}" stroke-width="1.1"/>` +
          `<path d="M-3 -19 C-10 -22 -10 -31 -3 -31 Q0 -28 0 -19 Z" fill="${col}" stroke="${edge}" stroke-width="1"/>` +
          `<path d="M3 -19 C10 -22 10 -31 3 -31 Q0 -28 0 -19 Z" fill="${col}" stroke="${edge}" stroke-width="1"/>` +
          `<path d="M0 -19 L-3 -36 M3 -19 L4 -35 M-1 -19 L0 -37" fill="none" stroke="${edge}" stroke-width="1.1"/>` +
          `<circle cy="-36" r="1.8" fill="${white ? A.c3 : dark(A.c3, .3)}"/></g>`;
      };
      s += one(-12, -4, -18, true) + one(12, -6, 20, false);
      s += one(-8, 12, -32, false) + one(9, 10, 28, true);
      return s;
    },

    /* 鸡冠花：波浪扇状肉穗花序 */
    cockscomb() {
      let s = stem('broad');
      s += `<path d="M-16 14 C-26 4 -27 -16 -19 -26 C-14 -34 -6 -26 -3 -32 C2 -40 9 -30 13 -34 ` +
        `C22 -36 27 -20 24 -8 C22 2 18 10 14 14 Z" fill="url(#pgD)" stroke="${A.c2}" stroke-width="1.4"/>`;
      s += `<path d="M-13 12 C-22 3 -23 -14 -16 -24 C-11 -31 -5 -24 -2 -29 C3 -36 9 -27 12 -31 ` +
        `C19 -32 23 -18 20 -8 C18 1 15 8 11 12 Z" fill="url(#pg)" opacity=".9"/>`;
      for (let i = 0; i < 9; i++) {
        const y = -28 + i * 5;
        s += `<path d="M-17 ${y} Q-8 ${y - 6} 2 ${y} Q12 ${y + 6} 21 ${y}" fill="none" ` +
          `stroke="${i % 2 ? A.c2 : light(A.c1, .3)}" stroke-width="${i % 2 ? 1.5 : 1.2}" opacity=".55"/>`;
      }
      for (let i = 0; i < 24; i++) {
        s += `<circle cx="${f1((rnd(A.seed, i) - .5) * 34)}" cy="${f1(-26 + rnd(A.seed, i + 30) * 36)}" ` +
          `r="1.2" fill="${A.c3}" opacity=".5"/>`;
      }
      return s;
    },

    /* 雪莲 / 优昙花：半透明苞片层叠包裹中心 */
    bract() {
      const o = A.o;
      let s = stem('grass');
      for (let L = 0; L < 3; L++) {
        s += ring(o.star ? 8 : 9, 40 - L * 9, 13 - L * 1.5, o.star ? 'point' : 'spoon',
          L === 0 ? 'url(#pgD)' : L === 1 ? 'url(#pg)' : 'url(#pgL)',
          { off: L * 20, cy: L === 0 ? 3 : 1, stroke: A.c2, op: .4, vein: L === 0 });
      }
      s += `<circle r="11" fill="${A.c3}" opacity=".75"/>` +
        `<circle r="7" fill="${dark(A.c3, .3)}" opacity=".7"/>`;
      s += `<path d="M-24 8 Q0 18 24 8" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".3"/>`;
      return s;
    },

    /* 昙花：多层细长白色萼片放射 + 中央漏斗 */
    epiphyllum() {
      let s = stem('broad');
      s += ring(12, 44, 4.5, 'curl', 'url(#pgD)', { off: 15, cy: 3, stroke: A.c2, op: .4 });
      s += ring(10, 36, 6, 'point', 'url(#pg)', { off: 0, stroke: A.c2, op: .35 });
      s += ring(8, 26, 7, 'spoon', 'url(#pgL)', { off: 22, stroke: A.c2, op: .3 });
      s += stamens(20, 17, { color: A.c3, r: 1.2, filament: light(A.c3, .2) });
      s += `<circle r="7" fill="${light(A.c3, .35)}"/>`;
      return s;
    },

    /* 腊梅：蜡黄半透明小杯状花，内轮紫红，褐色无叶枝 */
    wintersweet() {
      let s = stem('branch');
      const one = (x, y, sc, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">` +
        ring(6, 22, 9, 'spoon', 'url(#pg)', { off: 30, stroke: A.c2, op: .45, jit: 0 }) +
        ring(6, 15, 7, 'spoon', 'url(#pgL)', { off: 0, stroke: A.c2, op: .3, jit: 0 }) +
        `<circle r="6" fill="${A.c3}" opacity=".85"/>` +
        stamens(8, 7, { color: light(A.c3, .3), r: 1, filament: A.c3 }) + `</g>`;
      s += one(-19, -6, .85, -16) + one(17, -12, .9, 14) + one(0, 6, 1.05, 0);
      return s;
    },

    /* 石榴花：厚钟状红萼 + 顶端皱褶花瓣 */
    urn() {
      let s = stem('broad');
      s += `<path d="M-13 12 C-18 2 -17 -10 -12 -18 Q0 -24 12 -18 C17 -10 18 2 13 12 Q0 17 -13 12 Z" ` +
        `fill="url(#pgD)" stroke="${A.c2}" stroke-width="1"/>`;
      s += `<path d="M-12 -18 l-5 -6 M-5 -21 l-2 -7 M0 -22 l0 -7 M5 -21 l2 -7 M12 -18 l5 -6" ` +
        `fill="none" stroke="${A.c2}" stroke-width="1.6" stroke-linecap="round"/>`;
      s += ring(6, 14, 8, 'frill', 'url(#pg)', { off: 30, stroke: A.c2, op: .4, jit: 0, cy: -18 });
      s += stamens(16, 12, { color: A.c3, r: 1.1, filament: light(A.c3, .1) });
      s += `<path d="M-9 0 Q0 5 9 0" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity=".28"/>`;
      return s;
    },

    /* 茉莉 / 栀子：白色重瓣小花 + 革质对生叶 */
    gardenia() {
      const o = A.o;
      let s = stem('broad');
      const layers = o.double ? 3 : 2;
      for (let L = 0; L < layers; L++) {
        s += ring(6, 30 - L * 7, 11 - L * 1.6, 'round',
          L === 0 ? 'url(#pgD)' : L % 2 ? 'url(#pg)' : 'url(#pgL)',
          { off: L * 30, cy: L === 0 ? 2 : 0, stroke: A.c2, op: .4, jit: 2, seedOff: L * 7 });
      }
      s += `<circle r="5" fill="${A.c3}" opacity=".9"/>` +
        `<circle cx="-2" cy="-2" r="1.8" fill="#FFFFFF" opacity=".5"/>`;
      s += leafShape(-2, 36, 20, 8, -58, 'url(#lf)') + leafShape(2, 44, 18, 7, 56, 'url(#lf)');
      return s;
    },

    /* 杜鹃：五裂漏斗花簇，上瓣有深色蜜导斑 */
    azalea() {
      let s = stem('broad');
      const one = (x, y, sc, rot) => {
        let g = ring(5, 27, 15, 'wide', 'url(#pg)', { off: 36, cy: 2, stroke: A.c2, jit: 0 });
        g += `<circle r="9" fill="${dark(A.c1, .28)}" opacity=".55"/>`;
        g += stamens(10, 20, { color: A.c3, r: 1.7, filament: light(A.c1, .3) });
        g += `<path d="M0 6 Q2 -8 0 -20" fill="none" stroke="${light(A.c1, .2)}" stroke-width="1.6"/>`;
        for (let i = -2; i <= 2; i++) {
          g += `<ellipse cx="${i * 2.6}" cy="-21" rx="1.5" ry="2.2" fill="${A.alt}" opacity=".55"/>`;
        }
        return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">${g}</g>`;
      };
      s += one(-19, 4, .82, -14) + one(18, -10, .86, 16) + one(0, -2, 1, 0);
      return s;
    }
  };

  /* 渲染入口：设置上下文后调用对应形态绘制器 */
  function brightness(hex) {
    const [r, g, b] = rgbOf(hex);
    return (r * .299 + g * .587 + b * .114) / 255;
  }
  function bloom(f) {
    /* 白 / 极浅色花在米白卡面上会糊掉：自动换成灰绿描边，并加一层衬底 */
    const pale = brightness(f.c1) > .86;
    A = {
      f, o: f.opt || {}, seed: f.n, pale: pale,
      c1: f.c1, c2: pale ? '#8D9C90' : f.c2, c3: f.c3,
      leaf: f.leaf || '#4E7A38', alt: f.alt || f.c1
    };
    const fn = FORMS[A.o.form || f.form] || FORMS.prunus;
    return fn();
  }

  function flower(f, cx, cy, s) {
    return `<g transform="translate(${cx} ${cy}) scale(${s})">${bloom(f)}</g>`;
  }

  /* 统一把以 (100,110) 为原点的图形搬到指定位置并按比例缩放 */
  function placed(markup, cx, cy, s) {
    cx = cx == null ? 100 : cx;
    cy = cy == null ? 110 : cy;
    s = s == null ? 1 : s;
    return `<g transform="translate(${cx} ${cy}) scale(${s}) translate(-100 -110)">${markup}</g>`;
  }

  /* 卡面小装饰：只做柔光与露珠，不干扰花朵识别 */
  function deco(f) {
    if (f.deco === 'dew') {
      return `<path d="M144 84 q6 8 0 11 q-6 -3 0 -11 z" fill="#BFE9FF" stroke="#7FC4EE" stroke-width="1" opacity=".8"/>` +
        `<circle cx="58" cy="132" r="2.6" fill="#FFFFFF" opacity=".7"/>`;
    }
    if (f.deco === 'star') {
      return star(38, 62, 6, '#FFFFFF', .65) + star(164, 78, 4, '#FFFFFF', .55) +
        star(150, 176, 3, '#FFFFFF', .5);
    }
    if (f.deco === 'butterfly') {
      return `<g transform="translate(158,168) rotate(-14)" opacity=".72">
<path d="M0 0 C-12 -15 -22 -11 -19 2 C-17 11 -7 11 0 4 Z" fill="#FFF7E8" stroke="${f.c2}" stroke-width="1"/>
<path d="M0 0 C12 -15 22 -11 19 2 C17 11 7 11 0 4 Z" fill="#FFF7E8" stroke="${f.c2}" stroke-width="1"/>
<path d="M-16 -4 L0 2 M16 -4 L0 2" fill="none" stroke="${f.c2}" stroke-width=".6" opacity=".6"/>
<path d="M0 -4 v14" stroke="${f.c2}" stroke-width="1.6" stroke-linecap="round"/></g>`;
    }
    return '';
  }

  /* 版式：大卡（详情 / 翻卡）与小卡（卡册网格）共用同一套画法，只换几何参数 */
  const BIG = {
    H: 280, pad: 7, rx: 19, rim: 24,
    nameX: 18, nameY: 47, nameSize: 21, sub: true,
    subY: 66, subSize: 9.5,
    stage: { x: 18, y: 76, w: 164, h: 126, r: 26 },
    flowerY: 142, flowerS: 1.0,
    sayY: 226, saySize: 11, sayLH: 14.5,
    footY: 258, footSize: 8.8, foot: true, footShow: true,
    badge: { x: 143, y: 240, w: 39, h: 19, r: 9.5, size: 10 }
  };
  const TILE = {
    H: 230, pad: 6.5, rx: 17.5, rim: 21.5,
    nameX: 16, nameY: 39, nameSize: 18.5, sub: false,
    stage: { x: 16, y: 50, w: 168, h: 108, r: 20 },
    flowerY: 107, flowerS: .86,
    sayY: 187, saySize: 10.5, sayLH: 13.5,
    footY: 208, footSize: 8.2, foot: false, footShow: false,
    badge: { x: 148, y: 194, w: 36, h: 17, r: 8.5, size: 9 }
  };

  function wrapSaying(s, maxLen) {
    if (!s) return [''];
    const parts = s.split('、');
    const lines = [];
    let cur = '';
    for (const p of parts) {
      if (!p) continue;
      const sep = cur ? '、' : '';
      if ((cur + sep + p).length <= maxLen) cur += sep + p;
      else { if (cur) lines.push(cur); cur = p; }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 2);
  }

  function sayingText(f, G) {
    const len = f.saying.length;
    const maxLen = len <= 8 ? 8 : (len <= 11 ? 9 : 10);
    const lines = wrapSaying(f.saying, maxLen);
    const lh = G.sayLH || (G.saySize + 3);
    const base = G.sayY - (lines.length === 2 ? lh * .5 : 0);
    return lines.map((ln, i) =>
      `<text x="100" y="${(base + lh * i).toFixed(1)}" text-anchor="middle" ${FONT} ` +
      `font-size="${G.saySize}" font-weight="500" fill="#6C7686" letter-spacing=".6">${ln}</text>`).join('');
  }

  function draw(f, volume, G) {
    const r = RARITY[f.rarity] || RARITY['普通'];
    const stops = (RIM[f.rarity] || RIM['普通']).map((c, i, a) =>
      `<stop offset="${(i / (a.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join('');
    const nm = f.name;
    const nameSize = nm.length >= 4 ? G.nameSize - 3.5 : nm.length === 3 ? G.nameSize - 1 : G.nameSize;
    const st = G.stage;
    const cy = G.flowerY, s = G.flowerS;
    const legend = f.rarity === '传说';
    const rare = f.rarity === '珍稀';
    const inW = 200 - G.pad * 2, inH = G.H - G.pad * 2;
    const bx = G.badge;
    const line = legend ? '#D4A23E' : '#7FA9DE';
    /* 白色花（百合、玉兰、茉莉、马蹄莲…）需要浅青灰衬底才不会糊进米白卡面 */
    const pale = brightness(f.c1) > .86;
    const underlay = pale
      ? `<ellipse cx="100" cy="${cy - 5 * s}" rx="${45 * s}" ry="${43 * s}" fill="#DCE7D8" opacity=".55"/>` : '';
    const pgL0 = pale ? '#F1F5EE' : '#FFFFFF';
    const pgDLast = pale ? dark(f.c1, .55) : dark(f.c1, .45);

    const rareBack = (rare || legend) ? `<g clip-path="url(#ic)">
  <rect x="${G.pad}" y="${G.pad}" width="${inW}" height="${inH}" fill="url(#foil)" opacity="${legend ? 1 : .82}"/>
  ${legend ? `<ellipse cx="100" cy="${cy}" rx="88" ry="96" fill="url(#rareHalo)"/>` : ''}
</g>` : '';
    const seal = (rare || legend) ? `<g>
  <circle cx="174" cy="34" r="13.5" fill="#FFFFFF" stroke="${line}" stroke-width="1.5"/>
  <circle cx="174" cy="34" r="10.8" fill="none" stroke="${line}" stroke-width=".8" opacity=".55"/>
  <text x="174" y="38" text-anchor="middle" ${FONT} font-size="11.5" font-weight="800" fill="${legend ? '#A5760C' : '#2A7FC0'}">${legend ? '传' : '珍'}</text>
</g>${legend ? star(155, 22, 2.8, '#FFE9A8', .9) : star(155, 24, 2.6, '#CFE2FF', .85)}`
      : star(174, 36, 4, '#FFFFFF', .9);
    const rareFront = (rare || legend) ? `
<rect x="${G.pad + 3}" y="${G.pad + 3}" width="${inW - 6}" height="${inH - 6}" rx="${G.rx - 3}"
  fill="none" stroke="${line}" stroke-width="${legend ? 1.7 : 1.2}" opacity=".9"/>
<rect x="${G.pad + 5.5}" y="${G.pad + 5.5}" width="${inW - 11}" height="${inH - 11}" rx="${G.rx - 5}"
  fill="none" stroke="#FFFFFF" stroke-width=".9" opacity=".72"/>
${star(G.pad + 8, G.H * .55, 3.4, legend ? '#FFD77A' : '#A9C9F5', .9)}
${star(200 - G.pad - 8, G.H * .55, 3.4, legend ? '#FFD77A' : '#A9C9F5', .9)}
${legend ? star(100, G.pad + 12, 3.2, '#FFE9A8', .9) : ''}` : '';

    const defs = `<linearGradient id="rb" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>
<linearGradient id="inner" x1=".1" y1="0" x2=".9" y2="1">
  <stop offset="0" stop-color="#FFFDF9"/><stop offset=".46" stop-color="#FCF8F0"/><stop offset="1" stop-color="#FAF4E9"/></linearGradient>
<radialGradient id="ga" cx=".14" cy=".06" r=".82">
  <stop offset="0" stop-color="#FFF3D6" stop-opacity=".6"/><stop offset="1" stop-color="#FFF3D6" stop-opacity="0"/></radialGradient>
<radialGradient id="gb" cx=".95" cy=".32" r=".72">
  <stop offset="0" stop-color="#FFE2EA" stop-opacity=".34"/><stop offset="1" stop-color="#FFE2EA" stop-opacity="0"/></radialGradient>
<radialGradient id="gc" cx=".5" cy="1.02" r=".9">
  <stop offset="0" stop-color="#DCE9DA" stop-opacity=".34"/><stop offset="1" stop-color="#DCE9DA" stop-opacity="0"/></radialGradient>
<linearGradient id="sg" x1=".12" y1="0" x2=".9" y2="1">
  <stop offset="0" stop-color="#F4EFE2"/><stop offset=".5" stop-color="#FBF5EA"/><stop offset="1" stop-color="#EDF1E6"/></linearGradient>
<radialGradient id="sw" cx=".32" cy=".24" r=".72">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity=".8"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<radialGradient id="bl" cx=".38" cy=".3" r=".66">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity=".62"/><stop offset=".58" stop-color="#FFFFFF" stop-opacity=".14"/>
  <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<linearGradient id="pg" x1=".18" y1="0" x2=".82" y2="1">
  <stop offset="0" stop-color="${light(f.c1, .45)}"/><stop offset=".5" stop-color="${f.c1}"/>
  <stop offset="1" stop-color="${dark(f.c1, .3)}"/></linearGradient>
<linearGradient id="pgL" x1=".2" y1="0" x2=".8" y2="1">
  <stop offset="0" stop-color="${pgL0}"/><stop offset=".55" stop-color="${light(f.c1, .55)}"/>
  <stop offset="1" stop-color="${light(f.c1, .12)}"/></linearGradient>
<linearGradient id="pgD" x1=".15" y1="0" x2=".85" y2="1">
  <stop offset="0" stop-color="${light(f.c1, .1)}"/><stop offset=".55" stop-color="${dark(f.c1, .12)}"/>
  <stop offset="1" stop-color="${pgDLast}"/></linearGradient>
<radialGradient id="cg" cx=".34" cy=".26" r=".8">
  <stop offset="0" stop-color="${light(f.c3, .5)}"/><stop offset="1" stop-color="${f.c3}"/></radialGradient>
<linearGradient id="lf" x1=".1" y1="0" x2=".9" y2="1">
  <stop offset="0" stop-color="${light(f.leaf || '#4E7A38', .3)}"/>
  <stop offset=".55" stop-color="${f.leaf || '#4E7A38'}"/>
  <stop offset="1" stop-color="${dark(f.leaf || '#4E7A38', .28)}"/></linearGradient>
<filter id="fs" x="-30%" y="-30%" width="160%" height="160%">
  <feDropShadow dx="0" dy="${5 * s}" stdDeviation="${5 * s}" flood-color="${dark(f.c2, .15)}" flood-opacity=".3"/></filter>
<radialGradient id="halo" cx=".5" cy=".5" r=".5">
  <stop offset=".45" stop-color="${f.c1}" stop-opacity=".42"/><stop offset="1" stop-color="${f.c1}" stop-opacity="0"/></radialGradient>
<clipPath id="ic"><rect x="${G.pad}" y="${G.pad}" width="${inW}" height="${inH}" rx="${G.rx}"/></clipPath>
<clipPath id="sc"><rect x="${st.x}" y="${st.y}" width="${st.w}" height="${st.h}" rx="${st.r}"/></clipPath>
<linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/>
  <stop offset=".28" stop-color="${legend ? '#FFF0B0' : '#CFE4FF'}" stop-opacity=".30"/>
  <stop offset=".46" stop-color="#FFFFFF" stop-opacity=".58"/>
  <stop offset=".60" stop-color="${legend ? '#FFD98A' : '#E2D2FF'}" stop-opacity=".34"/>
  <stop offset=".82" stop-color="#FFFFFF" stop-opacity="0"/>
  <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<radialGradient id="rareHalo" cx=".5" cy=".5" r=".5">
  <stop offset=".3" stop-color="${legend ? '#FFE7A6' : '#BFD9FF'}" stop-opacity=".42"/>
  <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 ${G.H}" width="200" height="${G.H}">
<defs>${defs}</defs>
<rect x="1" y="1" width="198" height="${G.H - 2}" rx="${G.rim}" fill="url(#rb)"/>
<rect x="${G.pad}" y="${G.pad}" width="${inW}" height="${inH}" rx="${G.rx}" fill="url(#inner)"/>
<g clip-path="url(#ic)">
  <rect x="${G.pad}" y="${G.pad}" width="${inW}" height="${inH}" fill="url(#ga)"/>
  <rect x="${G.pad}" y="${G.pad}" width="${inW}" height="${inH}" fill="url(#gb)"/>
  <rect x="${G.pad}" y="${G.pad}" width="${inW}" height="${inH}" fill="url(#gc)"/>
</g>
${rareBack}
<text x="${G.nameX}" y="${G.nameY}" ${FONT} font-size="${nameSize}" font-weight="700" fill="#23262F" letter-spacing="1.2">${nm}</text>
${G.sub ? `<text x="${G.nameX}" y="${G.subY}" ${FONT} font-size="${G.subSize}" font-weight="700" fill="#98A1AF" letter-spacing=".7">No.${pad(f.n)} · ${f.rarity}</text>` : ''}
${seal}
<g clip-path="url(#sc)">
  <rect x="${st.x}" y="${st.y}" width="${st.w}" height="${st.h}" fill="url(#sg)"/>
  <ellipse cx="${st.x + st.w * .27}" cy="${st.y + st.h * .2}" rx="${st.w * .4}" ry="${st.h * .4}" fill="url(#sw)"/>
  <ellipse cx="${st.x + st.w * .8}" cy="${st.y + st.h * .74}" rx="${st.w * .4}" ry="${st.h * .48}" fill="#E9EFE1" opacity=".55"/>
  <rect x="${st.x}" y="${st.y}" width="${st.w}" height="${st.h * .45}" fill="#FFFFFF" opacity=".16"/>
</g>
<rect x="${st.x}" y="${st.y}" width="${st.w}" height="${st.h}" rx="${st.r}" fill="none" stroke="#FFFFFF" stroke-width="1.8" opacity=".92"/>
<rect x="${st.x + 1}" y="${st.y + 1}" width="${st.w - 2}" height="${st.h - 2}" rx="${st.r - 1}" fill="none" stroke="${light(f.c2, .6)}" stroke-width=".8" opacity=".3"/>
${star(st.x + 22, st.y + 24, G.stage.h > 110 ? 4.6 : 3.8, '#FFFFFF', .7)}
${star(st.x + st.w - 26, st.y + 30, 3, '#FFFFFF', .6)}
${star(st.x + st.w - 32, st.y + st.h - 20, 2.6, '#FFFFFF', .5)}
${star(st.x + 24, st.y + st.h - 24, 3.2, '#FFFFFF', .45)}
${underlay}
<circle cx="100" cy="${cy - 6 * s}" r="${70 * s}" fill="url(#halo)"/>
<ellipse cx="100" cy="${cy + 46 * s}" rx="${30 * s}" ry="${6 * s}" fill="#6B5B4A" opacity=".1"/>
<g filter="url(#fs)">
${flower(f, 100, cy, s)}
</g>
${placed(deco(f), 100, cy, s)}
<circle cx="${100 - 10 * s}" cy="${cy - 14 * s}" r="${40 * s}" fill="url(#bl)" opacity=".35"/>
${sayingText(f, G)}
${G.footShow === false ? '' : `<text x="${G.nameX}" y="${G.footY}" ${FONT} font-size="${G.footSize}" font-weight="700" fill="#AEB6C4" letter-spacing=".6">第${volume}辑 · ${pad(f.n)}${G.foot ? ' / 108' : ''}</text>`}
<rect x="${bx.x}" y="${bx.y}" width="${bx.w}" height="${bx.h}" rx="${bx.r}" fill="#FFFFFF" stroke="#E9EDF4" stroke-width=".9"/>
<text x="${bx.x + bx.w / 2}" y="${bx.y + bx.h / 2 + bx.size * .36}" text-anchor="middle" ${FONT} font-size="${bx.size}" font-weight="800" fill="${r.accent}">×1</text>
${rareFront}
</svg>`;
  }

  function front(f, volume) {
    const key = 'f' + f.n + '_' + volume;
    if (CACHE.has(key)) return CACHE.get(key);
    const out = uri(draw(f, volume, BIG));
    CACHE.set(key, out);
    return out;
  }

  function tile(f, volume) {
    const key = 't' + f.n + '_' + volume;
    if (CACHE.has(key)) return CACHE.get(key);
    const out = uri(draw(f, volume, TILE));
    CACHE.set(key, out);
    return out;
  }

  function back(volume) {
    const key = 'b' + volume;
    if (CACHE.has(key)) return CACHE.get(key);
    const v = vol(volume);
    let grid = '';
    for (let y = 20; y < 300; y += 24) {
      for (let x = 20; x < 200; x += 24) {
        grid += `<path d="M${x} ${y} l8 8 -8 8 -8 -8 z" fill="none" stroke="${v.ink}" stroke-width=".7" opacity=".22"/>`;
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="200" height="280">
<rect x="1" y="1" width="198" height="278" rx="26" fill="${v.tint}"/>
<rect x="6" y="6" width="188" height="268" rx="21" fill="${v.back}"/>
<rect x="14" y="14" width="172" height="252" rx="15" fill="none" stroke="${v.ink}" stroke-width="1" opacity=".45"/>
${grid}
<circle cx="100" cy="132" r="56" fill="${v.back}" stroke="${v.ink}" stroke-width="1.6"/>
<circle cx="100" cy="132" r="47" fill="none" stroke="${v.ink}" stroke-width=".8" opacity=".6"/>
<g transform="translate(100,124)" fill="#FFFFFF" stroke="${v.ink}" stroke-width="1.2">
<ellipse cx="0" cy="-20" rx="10" ry="17"/><ellipse cx="0" cy="-20" rx="10" ry="17" transform="rotate(72)"/>
<ellipse cx="0" cy="-20" rx="10" ry="17" transform="rotate(144)"/>
<ellipse cx="0" cy="-20" rx="10" ry="17" transform="rotate(216)"/>
<ellipse cx="0" cy="-20" rx="10" ry="17" transform="rotate(288)"/>
</g>
<circle cx="100" cy="124" r="9" fill="${v.ink}"/>
<text x="100" y="222" text-anchor="middle" font-family="serif" font-size="22" font-weight="bold" fill="${v.ink}">群芳谱</text>
<text x="100" y="246" text-anchor="middle" font-family="sans-serif" font-size="12" fill="${v.ink}" opacity=".8">第${volume}辑 · 神秘宝箱</text>
</svg>`;
    const out = uri(svg);
    CACHE.set(key, out);
    return out;
  }

  window.FlowerArt = { front, tile, back, uri, vol, RARITY, pad };
})();
