/* ===== 原创卡通形象库 =====
 * 6 个可选伙伴；每个形象支持 3 种表情（normal / happy / sad）
 * 与 4 个进化阶段（0 = 向导常态，1-4 = 宠物进化）。
 * 画风：毛绒玩偶（plush）——奶白绒毛身体 + 蓬松波浪边 + 大颗水光眼 +
 * 明显腮红 + 小鼻子小嘴 + 粉彩编织配饰，柔和三点光照。
 * 形象 SVG 由本文件即时生成（data URI），不依赖网络 / 构建工具，
 * 双击 index.html 以 file:// 打开也能正常显示。
 * 默认「团团」另有 images/ 下导出的同款 SVG 素材（顶栏、地图、宠物页优先用文件）。
 */
(function () {
  const el = id => document.getElementById(id);

  /* ---------- 颜色工具 ---------- */
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgb2hex(r) {
    return '#' + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  function mix(a, b, t) {
    const A = hex2rgb(a), B = hex2rgb(b);
    return rgb2hex(A.map((v, i) => v + (B[i] - v) * t));
  }
  const light = (h, t) => mix(h, '#FFFFFF', t);
  const dark = (h, t) => mix(h, '#241C33', t);

  /* ---------- 稳定伪随机：同一形象每次渲染完全一致 ---------- */
  function seedRnd(seed) {
    let s = Math.abs(Math.round(seed)) % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /* ---------- 毛绒轮廓 ----------
   * 沿椭圆采样一圈点，半径小幅交替起伏，再用二次曲线把相邻点连成
   * 向外鼓的小圆弧 —— 形成「绒毛一撮一撮」的波浪边。
   */
  function fluff(cx, cy, rx, ry, n, seed, rot) {
    const r = seedRnd(seed || 7);
    const amp = 0.065;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2 + (rot || 0);
      const k = 1 + (i % 2 ? amp : amp * 0.28) + (r() - 0.5) * 0.022;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      let nx = (mx - cx) / (rx || 1), ny = (my - cy) / (ry || 1);
      const L = Math.hypot(nx, ny) || 1;
      nx /= L; ny /= L;
      const ox = mx + nx * rx * 0.075, oy = my + ny * ry * 0.075;
      d += ' Q' + ox.toFixed(1) + ' ' + oy.toFixed(1) + ' ' + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
    }
    return d + 'Z';
  }

  function star(cx, cy, r, color, opacity) {
    color = color || '#F0C46A';
    opacity = opacity === undefined ? 1 : opacity;
    return `<path d="M${cx} ${cy - r} Q${cx + r * .18} ${cy - r * .18} ${cx + r} ${cy} ` +
      `Q${cx + r * .18} ${cy + r * .18} ${cx} ${cy + r} Q${cx - r * .18} ${cy + r * .18} ${cx - r} ${cy} ` +
      `Q${cx - r * .18} ${cy - r * .18} ${cx} ${cy - r} Z" fill="${color}" opacity="${opacity}"/>`;
  }

  /* ---------- 6 个形象的配置 ----------
   * fur : 绒毛色调（极浅的奶白，靠耳型与配饰区分）
   * acc : 配饰 / 服饰主色
   */
  const LIST = [
    {
      id: 'tuantuan', name: '团团', tag: '', theme: '#5E93B8',
      body: 'soft', fur: ['#FFFFFF', '#EDF6FC', '#CCE3F2'], deep: '#8FBAD6',
      blush: '#F2A0A8', acc: ['#C6E7CF', '#7FBF97'], accDark: '#5C9C76',
      ears: 'tuft', head: 'sprout', wear: 'scarf',
      files: {
        normal: 'images/char_tuantuan_normal.png',
        happy: 'images/char_tuantuan_happy.png',
        sad: 'images/char_tuantuan_sad.png',
        pet: ['images/char_tuantuan_normal.png', 'images/char_tuantuan_normal.png',
              'images/char_tuantuan_normal.png', 'images/char_tuantuan_normal.png']
      }
    },
    {
      id: 'taotao', name: '桃桃', tag: '', theme: '#C97E92',
      body: 'soft', fur: ['#FFFFFF', '#FEF1F4', '#F6D8E0'], deep: '#D79CAC',
      blush: '#F09AA6', acc: ['#FBDDE6', '#EFA8BE'], accDark: '#C97E96',
      ears: 'bunny', head: 'leaves', wear: 'bow',
      files: {
        normal: 'images/char_taotao_normal.png',
        happy: 'images/char_taotao_happy.png',
        sad: 'images/char_taotao_sad.png',
        pet: ['images/char_taotao_normal.png', 'images/char_taotao_normal.png',
              'images/char_taotao_normal.png', 'images/char_taotao_normal.png']
      }
    },
    {
      id: 'dudu', name: '兔兔', tag: '', theme: '#C9A24E',
      body: 'soft', fur: ['#FFFFFD', '#FDF6E4', '#F3E2BF'], deep: '#D6B77E',
      blush: '#EFA396', acc: ['#BFE2EE', '#8CBBD3'], accDark: '#6398B0',
      ears: 'bear', head: 'tuft', wear: 'bib',
      files: {
        normal: 'images/char_dudu_normal.png',
        happy: 'images/char_dudu_happy.png',
        sad: 'images/char_dudu_sad.png',
        pet: ['images/char_dudu_normal.png', 'images/char_dudu_normal.png',
              'images/char_dudu_normal.png', 'images/char_dudu_normal.png']
      }
    },
    {
      id: 'paopao', name: '泡泡', tag: '', theme: '#4EA8C4',
      body: 'soft', fur: ['#FFFFFF', '#F0FAF6', '#D3ECE3'], deep: '#92C6B6',
      blush: '#F0A0A6', acc: ['#CDEBDD', '#8FC9B4'], accDark: '#63A08C',
      ears: 'cat', head: 'none', wear: 'collar',
      files: {
        normal: 'images/char_paopao_normal.png',
        happy: 'images/char_paopao_happy.png',
        sad: 'images/char_paopao_sad.png',
        pet: ['images/char_paopao_normal.png', 'images/char_paopao_normal.png',
              'images/char_paopao_normal.png', 'images/char_paopao_normal.png']
      }
    },
    {
      id: 'xingzai', name: '星仔', tag: '', theme: '#9573C9',
      body: 'soft', fur: ['#FFFFFF', '#F6F2FD', '#E3D9F4'], deep: '#B7A2D8',
      blush: '#E9A0C2', acc: ['#E4DBF8', '#B49BE0'], accDark: '#8A6FBB',
      ears: 'star', head: 'starPin', wear: 'capelet',
      files: {
        normal: 'images/char_xingzai_normal.png',
        happy: 'images/char_xingzai_happy.png',
        sad: 'images/char_xingzai_sad.png',
        pet: ['images/char_xingzai_normal.png', 'images/char_xingzai_normal.png',
              'images/char_xingzai_normal.png', 'images/char_xingzai_normal.png']
      }
    },
    {
      id: 'doudou', name: '花花', tag: '', theme: '#C08F63',
      body: 'soft', fur: ['#FFFFFD', '#FDF4EA', '#F0DFCB'], deep: '#CBA992',
      blush: '#EE9C93', acc: ['#F6E3C4', '#D9B481'], accDark: '#A9814F',
      ears: 'bear', head: 'none', wear: 'tie',
      files: {
        normal: 'images/char_doudou_normal.png',
        happy: 'images/char_doudou_happy.png',
        sad: 'images/char_doudou_sad.png',
        pet: ['images/char_doudou_normal.png', 'images/char_doudou_normal.png',
              'images/char_doudou_normal.png', 'images/char_doudou_normal.png']
      }
    },
    {
      /* 限定伙伴：集齐 108 张花卡并召唤花仙子后解锁 */
      id: 'fairy', name: '花仙子', tag: '花之精灵 · 集齐 108 张解锁', theme: '#C77BD8',
      locked: true,
      files: {
        normal: 'images/fairy_avatar.png', happy: 'images/fairy_avatar.png', sad: 'images/fairy_avatar.png',
        body: 'images/flower_fairy.png',
        pet: ['images/flower_fairy.png', 'images/flower_fairy.png',
              'images/flower_fairy.png', 'images/flower_fairy.png']
      }
    }
  ];

  /* ---------- 骨架尺寸 ---------- */
  const HEAD = { cx: 100, cy: 84, rx: 58, ry: 52 };
  const BODY = { cx: 100, cy: 158, rx: 43, ry: 35 };

  function defs(c) {
    return `<defs>
      <radialGradient id="fur" cx=".36" cy=".26" r=".88">
        <stop offset="0" stop-color="${c.fur[0]}"/>
        <stop offset=".55" stop-color="${c.fur[1]}"/>
        <stop offset="1" stop-color="${c.fur[2]}"/>
      </radialGradient>
      <radialGradient id="furB" cx=".42" cy=".28" r=".92">
        <stop offset="0" stop-color="${c.fur[0]}"/>
        <stop offset=".58" stop-color="${c.fur[1]}"/>
        <stop offset="1" stop-color="${c.fur[2]}"/>
      </radialGradient>
      <radialGradient id="shade" cx=".5" cy="1.06" r=".8">
        <stop offset="0" stop-color="${dark(c.deep, .32)}" stop-opacity=".32"/>
        <stop offset=".62" stop-color="${dark(c.deep, .32)}" stop-opacity=".08"/>
        <stop offset="1" stop-color="${dark(c.deep, .32)}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="halo" cx=".34" cy=".24" r=".55">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/>
        <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="eye" x1=".3" y1="0" x2=".7" y2="1">
        <stop offset="0" stop-color="#4B3F49"/>
        <stop offset=".42" stop-color="#2A2229"/>
        <stop offset="1" stop-color="#141018"/>
      </linearGradient>
      <radialGradient id="acc" cx=".3" cy=".2" r=".9">
        <stop offset="0" stop-color="${c.acc[0]}"/><stop offset="1" stop-color="${c.acc[1]}"/>
      </radialGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FBEBBE"/><stop offset="1" stop-color="#D3A94F"/>
      </linearGradient>
      <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#B7DC9E"/><stop offset="1" stop-color="#6FA765"/>
      </linearGradient>
      <radialGradient id="glow">
        <stop offset="0" stop-color="#F8E7B4" stop-opacity=".5"/>
        <stop offset="1" stop-color="#F8E7B4" stop-opacity="0"/>
      </radialGradient>
      <filter id="soft" x="-45%" y="-45%" width="190%" height="200%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="${dark(c.deep, .45)}" flood-opacity=".16"/>
      </filter>
      <filter id="blur" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="3"/>
      </filter>
    </defs>`;
  }

  /* ---------- 耳朵（都在头的后面） ---------- */
  function ears(c) {
    const inner = c.blush;
    if (c.ears === 'bunny') {
      const ear = (cx, cy, rot) =>
        `<g transform="rotate(${rot} ${cx} ${cy})">
          <path d="${fluff(cx, cy, 15, 31, 14, cx * 3 + 11)}" fill="url(#fur)" stroke="${c.deep}" stroke-opacity=".28" stroke-width="1.2"/>
          <ellipse cx="${cx}" cy="${cy + 3}" rx="8.4" ry="19" fill="${inner}" opacity=".45"/>
        </g>`;
      return ear(52, 44, -14) + ear(148, 44, 14);
    }
    if (c.ears === 'cat') {
      const e = (cx, dir) =>
        `<path d="${fluff(cx, 38, 19, 22, 12, cx)}" fill="url(#fur)" stroke="${c.deep}" stroke-opacity=".28" stroke-width="1.2"/>
         <path d="M${cx + dir * 5} 44 q${dir * 3} -9 ${dir * 9} -11 q${dir * 1} 10 ${dir * -4} 14 Z" fill="${inner}" opacity=".55"/>`;
      return e(42, 1) + e(158, -1);
    }
    if (c.ears === 'bear') {
      const e = (cx) =>
        `<path d="${fluff(cx, 42, 24, 24, 14, cx * 5)}" fill="url(#fur)" stroke="${c.deep}" stroke-opacity=".26" stroke-width="1.2"/>
         <ellipse cx="${cx}" cy="${45}" rx="11.4" ry="11.4" fill="${inner}" opacity=".42"/>`;
      return e(42) + e(158);
    }
    if (c.ears === 'star') {
      return `<g opacity=".9">${star(38, 34, 15, '#EFDDAE')}${star(163, 30, 12, light(c.deep, .5))}${star(178, 62, 7, '#EFDDAE')}</g>`;
    }
    if (c.ears === 'tuft') {
      const e = (cx, rot) =>
        `<g transform="rotate(${rot} ${cx} 50)">
          <path d="${fluff(cx, 36, 18, 21, 12, cx * 7)}" fill="url(#fur)" stroke="${c.deep}" stroke-opacity=".26" stroke-width="1.2"/>
        </g>`;
      return e(48, -20) + e(152, 20);
    }
    return '';
  }

  /* ---------- 头顶配饰 ---------- */
  function head(c, small) {
    if (c.head === 'none') return '';
    if (c.head === 'sprout') {
      return `<path d="M100 34 C98 26 100 20 100 13" stroke="#7AA96C" stroke-width="3.6" stroke-linecap="round" fill="none"/>
<path d="M99 24 C86 8 69 9 67 12 C67 26 84 33 99 25 Z" fill="url(#leaf)" stroke="#5C8F5A" stroke-width="1.1"/>
<path d="M101 22 C115 6 131 7 133 10 C133 24 116 31 101 23 Z" fill="url(#leaf)" stroke="#5C8F5A" stroke-width="1.1"/>
<path d="M95 21 C86 16 77 14 72 14 M105 19 C114 14 123 13 128 13" stroke="#EAF8DE" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".85"/>`;
    }
    if (c.head === 'leaves') {
      return `<path d="M100 32 C99 25 100 19 100 13" stroke="#8CB07E" stroke-width="3.4" stroke-linecap="round" fill="none"/>
<path d="M98 23 C84 9 66 10 64 13 C64 27 82 33 98 23 Z" fill="#F3BCCB" stroke="#C98CA0" stroke-width="1.1"/>
<path d="M102 21 C116 7 134 8 136 11 C136 25 118 31 102 21 Z" fill="#F8CDD9" stroke="#C98CA0" stroke-width="1.1"/>
<path d="M95 20 C86 15 76 13 70 13 M105 18 C114 13 124 12 130 12" stroke="#FFF0F4" stroke-width="1.5" stroke-linecap="round" fill="none" opacity=".9"/>`;
    }
    if (c.head === 'tuft') {
      return `<path d="M92 32 C86 20 90 9 100 5 C105 16 103 25 100 30 C108 15 119 11 126 14 C121 27 110 32 100 32 Z"
 fill="url(#fur)" stroke="${c.deep}" stroke-opacity=".4" stroke-width="1.2"/>`;
    }
    if (c.head === 'starPin') {
      return `<g>${star(100, 24, 13, '#EBCE85')}${star(72, 30, 5, '#F7ECBF')}${star(129, 28, 5, '#F7ECBF')}</g>`;
    }
    return '';
  }

  /* ---------- 身上配饰（编织质感） ---------- */
  function wear(c) {
    if (c.wear === 'scarf') {
      return `<path d="M64 130 Q100 150 136 130 L139 141 Q100 161 61 141 Z" fill="url(#acc)" stroke="${c.accDark}" stroke-width="1.2"/>
<path d="M69 135 Q100 153 131 135 M67 140 Q100 157 133 140" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="1.5" fill="none"/>
<path d="M132 143 q12 7 9 20 q-2 8 -10 6 q5 -11 -2 -24 Z" fill="${c.acc[1]}" stroke="${c.accDark}" stroke-width="1.1"/>
<path d="M134 149 q8 4 7 13" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1.5" fill="none"/>`;
    }
    if (c.wear === 'bow') {
      return `<path d="M100 150 C82 134 64 140 68 156 C70 169 87 166 100 154 C113 166 130 169 132 156 C136 140 118 134 100 150 Z"
 fill="url(#acc)" stroke="${c.accDark}" stroke-width="1.2"/>
<path d="M74 148 q10 4 18 10 M126 148 q-10 4 -18 10" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="1.6" fill="none"/>
<circle cx="100" cy="151" r="7" fill="url(#gold)" stroke="${c.accDark}" stroke-width="1"/>
<circle cx="97.6" cy="148.6" r="2.1" fill="#FFFFFF" opacity=".75"/>`;
    }
    if (c.wear === 'bib') {
      return `<path d="M78 140 Q100 152 122 140 L118 172 Q100 181 82 172 Z" fill="url(#acc)" stroke="${c.accDark}" stroke-width="1.2"/>
<path d="M86 156 Q100 163 114 156 M85 165 Q100 172 115 165" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    }
    if (c.wear === 'collar') {
      return `<path d="M56 128 Q100 152 144 128 L147 140 Q100 165 53 140 Z" fill="url(#acc)" stroke="${c.accDark}" stroke-width="1.2"/>
<path d="M62 133 Q100 154 138 133" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="1.6" fill="none"/>
<circle cx="100" cy="148" r="9.4" fill="url(#gold)" stroke="#A9814F" stroke-width="1.2"/>
<path d="M100 151 v4.4 M95.6 147 h8.8" stroke="#96702F" stroke-width="1.5" stroke-linecap="round"/>
<circle cx="97" cy="145" r="2.2" fill="#FFFFFF" opacity=".8"/>`;
    }
    if (c.wear === 'capelet') {
      return `<path d="M58 126 Q100 146 142 126 L156 164 Q100 184 44 164 Z" fill="url(#acc)" stroke="${c.accDark}" stroke-width="1.2"/>
<path d="M68 137 Q100 152 132 137" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="1.8" fill="none"/>
${star(100, 158, 6, '#FFFFFF', .85)}`;
    }
    if (c.wear === 'tie') {
      return `<path d="M100 148 L74 138 Q69 150 74 161 L100 152 L126 161 Q131 150 126 138 Z"
 fill="url(#acc)" stroke="${c.accDark}" stroke-width="1.2"/>
<circle cx="100" cy="150" r="6" fill="url(#gold)" stroke="${c.accDark}" stroke-width="1"/>
<path d="M80 142 q10 5 18 8 M120 142 q-10 5 -18 8" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1.4" fill="none"/>`;
    }
    return '';
  }

  /* ---------- 眼睛：大颗水光眼（双高光 + 底部暖反光） ---------- */
  function eyes(mood, c) {
    const lash = '#3A3038';
    if (mood === 'happy') {
      /* 开心：眼睛睁着但下缘上弯（笑眼），加两颗小星芒 */
      return `<ellipse cx="76" cy="89" rx="11.6" ry="12.2" fill="url(#eye)"/>
<ellipse cx="124" cy="89" rx="11.6" ry="12.2" fill="url(#eye)"/>
<ellipse cx="76" cy="93.5" rx="7.6" ry="4.4" fill="#8A6350" opacity=".42"/>
<ellipse cx="124" cy="93.5" rx="7.6" ry="4.4" fill="#8A6350" opacity=".42"/>
<circle cx="71.4" cy="83" r="4.8" fill="#FFFFFF"/>
<circle cx="81.4" cy="95.4" r="2.1" fill="#FFFFFF" opacity=".9"/>
<circle cx="120.4" cy="83" r="4.8" fill="#FFFFFF"/>
<circle cx="130.4" cy="95.4" r="2.1" fill="#FFFFFF" opacity=".9"/>
<circle cx="84.6" cy="86.4" r="1.2" fill="#FFFFFF" opacity=".6"/>
<circle cx="133.6" cy="86.4" r="1.2" fill="#FFFFFF" opacity=".6"/>
<path d="M64.6 83.6 C68.4 77 84.6 77 88 83.4" fill="none" stroke="#0E0B12" stroke-width="1.7" stroke-linecap="round" opacity=".5"/>
<path d="M112.4 83.4 C115.8 77 132 77 135.4 83.6" fill="none" stroke="#0E0B12" stroke-width="1.7" stroke-linecap="round" opacity=".5"/>`;
    }
    if (mood === 'sad') {
      return `<path d="M78 74 C72 70 64 70 58 74" fill="none" stroke="${dark(c.deep, .3)}" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
<path d="M122 74 C128 70 136 70 142 74" fill="none" stroke="${dark(c.deep, .3)}" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
<ellipse cx="76" cy="90" rx="11.6" ry="12.4" fill="url(#eye)"/>
<ellipse cx="124" cy="90" rx="11.6" ry="12.4" fill="url(#eye)"/>
<ellipse cx="76" cy="94" rx="7.4" ry="4.2" fill="#8A6350" opacity=".4"/>
<ellipse cx="124" cy="94" rx="7.4" ry="4.2" fill="#8A6350" opacity=".4"/>
<circle cx="71.6" cy="84.4" r="4.3" fill="#FFFFFF"/>
<circle cx="81" cy="96" r="1.9" fill="#FFFFFF" opacity=".85"/>
<circle cx="120.6" cy="84.4" r="4.3" fill="#FFFFFF"/>
<circle cx="130" cy="96" r="1.9" fill="#FFFFFF" opacity=".85"/>
<path d="M64 84 C68 76.5 84 76.5 88 84" fill="none" stroke="${lash}" stroke-width="2.2" stroke-linecap="round" opacity=".5"/>
<path d="M112 84 C116 76.5 132 76.5 136 84" fill="none" stroke="${lash}" stroke-width="2.2" stroke-linecap="round" opacity=".5"/>
<path d="M124 98 C124 98 120 108 120 112 a5 5 0 0 0 10 0 c0-4-6-14-6-14 Z" fill="#CFEAF7" stroke="#9FC8DC" stroke-width="1" opacity=".95"/>
<path d="M96 110 Q100 105 104 110" fill="none" stroke="#B7606C" stroke-width="2.3" stroke-linecap="round"/>`;
    }
    return `<ellipse cx="76" cy="90" rx="11.6" ry="12.4" fill="url(#eye)"/>
<ellipse cx="124" cy="90" rx="11.6" ry="12.4" fill="url(#eye)"/>
<ellipse cx="76" cy="94" rx="7.6" ry="4.4" fill="#8A6350" opacity=".42"/>
<ellipse cx="124" cy="94" rx="7.6" ry="4.4" fill="#8A6350" opacity=".42"/>
<circle cx="71.4" cy="84" r="4.6" fill="#FFFFFF"/>
<circle cx="81.4" cy="96.2" r="2" fill="#FFFFFF" opacity=".9"/>
<circle cx="120.4" cy="84" r="4.6" fill="#FFFFFF"/>
<circle cx="130.4" cy="96.2" r="2" fill="#FFFFFF" opacity=".9"/>
<circle cx="84.6" cy="87.2" r="1.15" fill="#FFFFFF" opacity=".6"/>
<circle cx="133.6" cy="87.2" r="1.15" fill="#FFFFFF" opacity=".6"/>
<path d="M65.2 82.8 C69 76.6 83 76.6 86.8 82.6" fill="none" stroke="#0E0B12" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
<path d="M113.2 82.6 C117 76.6 131 76.6 134.8 82.8" fill="none" stroke="#0E0B12" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`;
  }

  /* 鼻子 + 嘴（脸中央，眼睛下方） */
  function noseMouth(mood, c) {
    if (mood === 'sad') {
      return `<path d="M96 100 h8 q1.5 0 .7 1.4 l-4 3.6 q-.7.6-1.4 0 l-4-3.6 q-.8-1.4 .7-1.4 Z" fill="${c.blush}" opacity=".9"/>`;
    }
    const smile = mood === 'happy'
      ? `<path d="M94.6 105.4 Q100 113.4 105.4 105.4 Q100 107.2 94.6 105.4 Z" fill="#C25F70"/>
         <path d="M97.2 108.8 Q100 106.6 102.8 108.8 Q100 110.8 97.2 108.8 Z" fill="#EB9AA8" opacity=".8"/>`
      : `<path d="M100 105.4 v1.6 M100 107 q-2.8 3.4 -5.4 .3 M100 107 q2.8 3.4 5.4 .3"
          fill="none" stroke="#B7606C" stroke-width="1.9" stroke-linecap="round" opacity=".92"/>`;
    return `<path d="M96.6 100.2 h6.8 q1.5 0 .7 1.4 l-3.4 3.2 q-.7.6-1.4 0 l-3.4-3.2 q-.8-1.4 .7-1.4 Z" fill="#E8909C" opacity=".95"/>
<ellipse cx="99" cy="101.6" rx="1.5" ry=".9" fill="#FFFFFF" opacity=".65"/>
${smile}`;
  }

  function arms(mood, c) {
    const left = `<path d="${fluff(42, 156, 15, 19, 12, 31)}" fill="url(#furB)" stroke="${c.deep}" stroke-opacity=".3" stroke-width="1.1" transform="rotate(-22 42 156)"/>`;
    const rightRot = mood === 'happy' ? 40 : (mood === 'sad' ? -8 : 22);
    const right = `<path d="${fluff(158, 156, 15, 19, 12, 77)}" fill="url(#furB)" stroke="${c.deep}" stroke-opacity=".3" stroke-width="1.1" transform="rotate(${rightRot} 158 156)"/>`;
    return left + right;
  }

  function feet(c) {
    return `<path d="${fluff(78, 193, 16, 8.4, 12, 13)}" fill="url(#furB)" stroke="${c.deep}" stroke-opacity=".24" stroke-width="1.1"/>
<path d="${fluff(122, 193, 16, 8.4, 12, 57)}" fill="url(#furB)" stroke="${c.deep}" stroke-opacity=".24" stroke-width="1.1"/>`;
  }

  function stageExtras(stage) {
    if (stage <= 1) return { before: '', after: '', top: '', sp: '' };
    const cape = stage === 4
      ? `<path d="M62 60 C22 72 2 116 6 168 C38 190 70 196 100 196 C130 196 162 190 194 168 C198 116 178 72 138 60 Z"
 fill="#DCCBEE" stroke="#A98BC8" stroke-width="1.4" opacity=".9"/>
<circle cx="66" cy="72" r="6" fill="url(#gold)"/><circle cx="134" cy="72" r="6" fill="url(#gold)"/>` : '';
    const badge = stage >= 3
      ? `<g transform="translate(146 146)"><circle r="12" fill="#FDF3D8" stroke="#C79A3E" stroke-width="1.4"/>${star(0, 0, 7.4, '#D9AE55')}</g>` : '';
    const crown = stage === 4
      ? `<path d="M68 40 L75 17 L88 30 L100 10 L112 30 L125 17 L132 40 Z" fill="url(#gold)" stroke="#A87E28" stroke-width="1.5" stroke-linejoin="round"/>
<circle cx="100" cy="27" r="3" fill="#D96A7A"/><circle cx="82" cy="33" r="2.2" fill="#8FB6C9"/><circle cx="118" cy="33" r="2.2" fill="#8FB6C9"/>` : '';
    const pts = [[24, 54, 4.4], [176, 46, 5], [14, 128, 3.6], [188, 132, 4.2], [34, 22, 3], [166, 18, 3.4]];
    const n = stage === 4 ? 6 : (stage === 3 ? 4 : 0);
    let sp = '';
    for (let i = 0; i < n; i++) sp += star(pts[i][0], pts[i][1], pts[i][2], '#E4C177', .8);
    if (stage === 2) sp = star(154, 130, 6.5, '#E4C177', .9) + star(28, 78, 4.2, '#E4C177', .75);
    return { before: cape, after: badge, top: crown, sp: sp };
  }

  /* ---------- 组装一张 SVG ---------- */
  function build(c, mood, stage) {
    mood = ['normal', 'happy', 'sad'].includes(mood) ? mood : 'normal';
    stage = Math.max(0, Math.min(4, Number(stage) || 0));
    const ex = stageExtras(stage);
    const glow = stage >= 3 ? `<circle cx="100" cy="108" r="94" fill="url(#glow)" opacity=".75"/>` : '';
    const headD = fluff(HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry, 26, 5);
    const bodyD = fluff(BODY.cx, BODY.cy, BODY.rx, BODY.ry, 20, 23);

    let moodExtra = '';
    if (mood === 'happy') {
      moodExtra = star(22, 76, 4.4, '#E8B3C1') + star(180, 66, 5, light(c.deep, .3)) + star(32, 26, 3.4, '#E4C177');
    } else if (mood === 'sad') {
      moodExtra = `<path d="M150 40 a9 9 0 0 1 11-8 a11 11 0 0 1 20 3 a8 8 0 0 1 1 16 h-28 a9 9 0 0 1-4-11 Z"
 fill="#EDEFF3" stroke="#D3D9E2" stroke-width="1.2"/>
<path d="M158 54 l-2.4 6 M169 54 l-2.4 6 M180 54 l-2.4 6" stroke="#AFC8DA" stroke-width="2" stroke-linecap="round"/>`;
    }

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 210" width="200" height="210">',
      defs(c), glow,
      `<ellipse cx="100" cy="198" rx="52" ry="6.4" fill="${dark(c.deep, .5)}" opacity=".13"/>`,
      '<g filter="url(#soft)">',
      ex.before, ears(c),
      /* 手臂与脚在身体后面 */
      arms(mood, c), feet(c),

      /* 身体 */
      `<path d="${bodyD}" fill="url(#furB)" stroke="${c.deep}" stroke-opacity=".2" stroke-width="1.1"/>`,
      `<path d="${bodyD}" fill="url(#shade)"/>`,
      `<path d="M62 142 C70 128 84 120 96 118" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="7" stroke-linecap="round" fill="none" filter="url(#blur)"/>`,

      /* 头与身体之间的一层柔影，避免糊成一个雪人 */
      `<ellipse cx="100" cy="132" rx="34" ry="9" fill="${dark(c.deep, .3)}" opacity=".16" filter="url(#blur)"/>`,

      /* 头（蓬松毛球） */
      `<path d="${headD}" fill="url(#fur)" stroke="${c.deep}" stroke-opacity=".2" stroke-width="1.1"/>`,
      `<path d="${headD}" fill="url(#shade)"/>`,
      `<ellipse cx="86" cy="64" rx="30" ry="24" fill="url(#halo)" opacity=".5"/>`,

      /* 腮红：两团明显的粉 */
      `<ellipse cx="54" cy="100" rx="12" ry="7.6" fill="${c.blush}" opacity=".5" filter="url(#blur)"/>`,
      `<ellipse cx="146" cy="100" rx="12" ry="7.6" fill="${c.blush}" opacity=".5" filter="url(#blur)"/>`,

      eyes(mood, c), noseMouth(mood, c),
      head(c, stage === 1), ex.top,
      '</g>',
      wear(c), ex.after,
      /* 边缘碎毛，增加蓬松感 */
      `<g stroke="${c.deep}" stroke-opacity=".16" stroke-width="1.6" stroke-linecap="round" fill="none">
        <path d="M48 60 q-5 -6 -3 -12"/><path d="M152 58 q5 -6 3 -12"/>
        <path d="M46 116 q-6 4 -6 10"/><path d="M154 116 q6 4 6 10"/>
        <path d="M66 190 q-4 5 -1 9"/><path d="M134 190 q4 5 1 9"/>
      </g>`,
      ex.sp || '', moodExtra, '</svg>'
    ].join('\n');
  }

  /* ---------- 对外接口 ---------- */
  /* 限定形象只有解锁后才可选，否则退回默认团团（兼容旧存档 / 清档） */
  function unlocked(c) {
    return !c.locked || !!(window.Store && Store.s && Store.s.fairyUnlocked);
  }
  function valid(id) {
    const c = LIST.find(x => x.id === id);
    return (c && unlocked(c)) ? id : LIST[0].id;
  }
  function current() {
    const id = (window.Store && Store.s && Store.s.char) || LIST[0].id;
    return valid(id);
  }
  function get(id) { return LIST.find(c => c.id === valid(id || current())); }
  function name(id) { return get(id).name; }

  function src(mood, stage, id) {
    mood = mood || 'normal';
    stage = Math.max(0, Math.min(4, Number(stage) || 0));
    const c = get(id);
    if (c.files) {
      if (stage > 0 && c.files.body) return c.files.body;
      if (stage > 0) return c.files.pet[stage - 1];
      return c.files[mood] || c.files.normal;
    }
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(build(c, mood, stage));
  }

  /* 把页面里所有 <img data-char> 刷成当前形象；data-char-id 可指定单个形象（选择弹窗用） */
  function apply(root) {
    (root || document).querySelectorAll('img[data-char]').forEach(img => {
      const s = src(img.dataset.char || 'normal', img.dataset.stage || 0, img.dataset.charId);
      if (img.getAttribute('src') !== s) img.src = s;
    });
  }

  function mood(img, m) {
    if (!img) return;
    img.dataset.char = m;
    img.src = src(m, img.dataset.stage || 0, img.dataset.charId);
  }

  function refreshText() {
    const n = name();
    document.title = '萌宠闯关岛 · 快乐学习';
    const a = el('charName'); if (a) a.textContent = n;
    const t = el('petTitle'); if (t) t.textContent = '我的' + n;
  }

  function set(id, quiet) {
    const c = get(id);
    if (!window.Store || !Store.s) return c.id;
    Store.s.char = c.id;
    Store.s.pet.name = c.name;
    Store.save();
    apply();
    refreshText();
    if (window.Pet && App.current === 'pet') Pet.render();
    if (window.Me && App.current === 'me') Me.render();
    if (!quiet && window.UI) UI.toast(`已换成${c.name}，它会一直陪着你`);
    return c.id;
  }

  /* 选择弹窗：6 个形象，点一下立即全站生效 */
  function picker() {
    const cur = current();
    const html = `<div class="char-picker">
      <div class="cp-head">
        <img class="cp-hero" id="cpHero" data-char="normal" src="${src('normal')}" alt="当前伙伴">
        <div><h3>挑一个学习伙伴</h3><p>选中后，它会陪你出现在地图、答题、结算、宠物等每个页面。</p></div>
      </div>
      <div class="cp-grid">
        ${LIST.filter(unlocked).map(c => `<button class="cp-item ${c.id === cur ? 'on' : ''}" data-id="${c.id}">
          <img data-char="normal" data-char-id="${c.id}" src="${src('normal', 0, c.id)}" alt="${c.name}">
          <b>${c.name}</b><span>${c.tag}</span><i class="cp-tick">✓</i>
        </button>`).join('')}
      </div>
      ${unlocked(LIST[LIST.length - 1]) ? '' :
        '<p class="cp-lock">集齐 108 张花卡并召唤花仙子，即可解锁限定伙伴</p>'}
    </div>`;
    UI.dialog({ html: html, wide: true, buttons: [{ label: '就用这个' }], sound: false });
    const body = el('modalBody');
    apply(body);
    body.querySelectorAll('.cp-item').forEach(b => {
      b.addEventListener('click', () => {
        set(b.dataset.id, true);
        body.querySelectorAll('.cp-item').forEach(x => x.classList.toggle('on', x === b));
        const hero = el('cpHero');
        if (hero) { delete hero.dataset.charId; hero.src = src('normal'); }
        if (window.SFX) SFX.tap();
        UI.toast('已换成 ' + name() + '，整站都换好啦');
      });
    });
  }

  window.Characters = { list: LIST, src, apply, mood, set, current, get, name, picker, refreshText, build };
})();
