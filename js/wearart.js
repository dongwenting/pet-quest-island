/* ===== 服饰穿戴画法 · 全站唯一来源 =====
 * 统一坐标系 viewBox="0 0 120 150"，与 .pet-figure（118px 宽）基本 1:1：
 *   头顶 y≈6 / 眼睛 y≈52（x≈42 与 80）/ 耳朵 x≈14、106 / 脖颈 y≈76..92 / 身体 y≈92..140
 * back 段在宠物图之后（只露出身体轮廓外的部分），front 段压在宠物身前。
 * 商店缩略图与宠物页穿戴复用同一份 SVG：看到的即买到的。
 * 渐变 id 一律以 g_<服饰id>_ 开头，保证同页 20 件不互相串色。
 */
(function () {
  'use strict';

  function wrap(inner, vb, cls) {
    return `<svg class="${cls}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${inner}</svg>`;
  }
  /* 竖直渐变；horizontal=true 时改为横向 */
  function lg(id, a, b, horizontal) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="${horizontal ? 1 : 0}" y2="${horizontal ? 0 : 1}">` +
      `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  }
  function defs(s) { return `<defs>${s}</defs>`; }
  function star(cx, cy, r, fill, op) {
    return `<path d="M${cx} ${cy - r} Q${cx + r * .2} ${cy - r * .2} ${cx + r} ${cy} ` +
      `Q${cx + r * .2} ${cy + r * .2} ${cx} ${cy + r} Q${cx - r * .2} ${cy + r * .2} ${cx - r} ${cy} ` +
      `Q${cx - r * .2} ${cy - r * .2} ${cx} ${cy - r} Z" fill="${fill}" opacity="${op === undefined ? 1 : op}"/>`;
  }
  /* 5 瓣小花 */
  function flower(cx, cy, r, petal, edge) {
    let s = '<g>';
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 - Math.PI / 2;
      const x = cx + Math.cos(a) * r * .74, y = cy + Math.sin(a) * r * .74;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * .6).toFixed(1)}" fill="${petal}" stroke="${edge}" stroke-width=".8"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${(r * .38).toFixed(1)}" fill="#FFD873" stroke="#DFA93C" stroke-width=".7"/></g>`;
    return s;
  }
  /* 蝴蝶结：center 为中心，w 为半翼宽 */
  function bow(cx, cy, w, c1, c2, edge, tail) {
    const t = tail === false ? '' :
      `<path d="M${cx - 2} ${cy + 1} L${cx - 8} ${cy + 17} L${cx} ${cy + 13} L${cx + 8} ${cy + 17} L${cx + 2} ${cy + 1} Z" fill="${c2}" stroke="${edge}" stroke-width="1.2" stroke-linejoin="round"/>`;
    return `<g><path d="M${cx} ${cy} C${cx - w * .8} ${cy - w * .62} ${cx - w} ${cy - w * .4} ${cx - w * .95} ${cy + 1} ` +
      `C${cx - w * .88} ${cy + w * .6} ${cx - w * .45} ${cy + w * .5} ${cx} ${cy + 2} Z" fill="${c1}" stroke="${edge}" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<path d="M${cx} ${cy} C${cx + w * .8} ${cy - w * .62} ${cx + w} ${cy - w * .4} ${cx + w * .95} ${cy + 1} ` +
      `C${cx + w * .88} ${cy + w * .6} ${cx + w * .45} ${cy + w * .5} ${cx} ${cy + 2} Z" fill="${c1}" stroke="${edge}" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<path d="M${cx - w * .7} ${cy - w * .3} Q${cx - w * .45} ${cy - w * .12} ${cx - w * .2} ${cy}" fill="none" stroke="#fff" stroke-width="1.5" opacity=".45" stroke-linecap="round"/>` + t +
      `<circle cx="${cx}" cy="${cy + 1}" r="${(w * .26).toFixed(1)}" fill="${c2}" stroke="${edge}" stroke-width="1.2"/>` +
      `<circle cx="${cx - 1.4}" cy="${cy - .4}" r="1.5" fill="#fff" opacity=".8"/></g>`;
  }

  const ART = {
    /* ---------------- 头顶 ---------------- */
    hat: {
      focus: [18, 0, 84, 38],
      front: defs(lg('g_hat_a', '#575277', '#302B48')) +
        `<path d="M43 19 Q43 10 60 10 Q77 10 77 19 L77 25 L43 25 Z" fill="url(#g_hat_a)" stroke="#211D33" stroke-width="1.4"/>` +
        `<path d="M60 2 L97 13 L60 25 L23 13 Z" fill="#3B3656" stroke="#211D33" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M60 2 L97 13 L60 25 Z" fill="#5B557E" opacity=".55"/>` +
        `<circle cx="60" cy="13" r="3.4" fill="#F5C451" stroke="#B98A24" stroke-width="1"/>` +
        `<path d="M60 14 Q78 17 87 27" fill="none" stroke="#F5C451" stroke-width="1.9" stroke-linecap="round"/>` +
        `<path d="M87 27 l-3.4 12 M87 27 l3.2 12 M87 27 l-.2 13" stroke="#F5C451" stroke-width="1.7" stroke-linecap="round"/>` +
        `<circle cx="87" cy="27" r="2.2" fill="#FFE08A"/>`
    },
    bow: {
      focus: [44, 0, 70, 42],
      front: defs(lg('g_bow_a', '#FFB7CE', '#EE7AA0')) +
        bow(78, 16, 19, 'url(#g_bow_a)', '#F48FB1', '#D2557F', true) +
        `<circle cx="60" cy="12" r="2.2" fill="#FFF3C4"/>` + star(95, 5, 4, '#FFE08A', .95)
    },
    strawhat: {
      focus: [2, 2, 116, 38],
      front: defs(lg('g_straw_a', '#FBE3A8', '#D9AC5C') + lg('g_straw_b', '#FFF0C8', '#E4BE73')) +
        `<path d="M37 24 Q37 5 60 5 Q83 5 83 24 Z" fill="url(#g_straw_b)" stroke="#C1914B" stroke-width="1.7"/>` +
        `<path d="M40 12 Q60 17 80 12 M39 18 Q60 22 81 18" fill="none" stroke="#DDB77A" stroke-width="1" opacity=".8"/>` +
        `<path d="M36 20 Q60 26 84 20 L84 24 Q60 30 36 24 Z" fill="#E4798B" stroke="#B8546A" stroke-width="1.2"/>` +
        `<ellipse cx="60" cy="26" rx="53" ry="9" fill="url(#g_straw_a)" stroke="#C1914B" stroke-width="1.8"/>` +
        `<ellipse cx="60" cy="25" rx="40" ry="5.5" fill="none" stroke="#C9A063" stroke-width="1" opacity=".65"/>` +
        `<path d="M18 28 Q60 36 102 28" fill="none" stroke="#B98A45" stroke-width="1.2" opacity=".7"/>`
    },
    flowerpin: {
      focus: [8, 0, 62, 40],
      front: `<g><path d="M18 26 Q28 12 44 14 Q52 16 56 24" fill="none" stroke="#7BA46B" stroke-width="2.4" stroke-linecap="round"/>` +
        `<path d="M28 22 Q24 14 30 12 Q36 14 33 22 Z" fill="#8FC07C" stroke="#5E8B52" stroke-width="1"/>` +
        `<path d="M42 17 Q40 9 46 8 Q51 11 48 18 Z" fill="#8FC07C" stroke="#5E8B52" stroke-width="1"/>` +
        flower(24, 20, 8, '#FFC3D8', '#E28AA9') +
        flower(42, 14, 9, '#FFF0F5', '#E7A6BC') +
        flower(34, 26, 6.5, '#FFE09A', '#E1B45E') +
        `<circle cx="52" cy="22" r="2" fill="#F5C451"/>`
    },
    headphones: {
      focus: [2, 0, 116, 68],
      front: defs(lg('g_hp_a', '#8C86B4', '#5B5485')) +
        `<path d="M18 44 Q16 4 60 4 Q104 4 102 44" fill="none" stroke="#57507C" stroke-width="8" stroke-linecap="round"/>` +
        `<path d="M18 44 Q16 4 60 4 Q104 4 102 44" fill="none" stroke="#F6AFC8" stroke-width="3.4" stroke-linecap="round" opacity=".9"/>` +
        `<rect x="7" y="33" width="18" height="28" rx="9" fill="url(#g_hp_a)" stroke="#3F3965" stroke-width="1.8"/>` +
        `<rect x="95" y="33" width="18" height="28" rx="9" fill="url(#g_hp_a)" stroke="#3F3965" stroke-width="1.8"/>` +
        `<rect x="10.5" y="38" width="11" height="18" rx="5.5" fill="#F7C3D6" opacity=".85"/>` +
        `<rect x="98.5" y="38" width="11" height="18" rx="5.5" fill="#F7C3D6" opacity=".85"/>` +
        `<path d="M13 40 L13 54 M100 40 L100 54" stroke="#fff" stroke-width="1.4" opacity=".55" stroke-linecap="round"/>` +
        star(60, 8, 4, '#FFE08A', .95)
    },
    crown: {
      focus: [22, 0, 76, 40],
      front: defs(lg('g_crown_a', '#FFE486', '#EFAF32')) +
        `<path d="M29 27 L31 7 L45 17 L60 2 L75 17 L89 7 L91 27 Z" fill="url(#g_crown_a)" stroke="#C68A1E" stroke-width="1.9" stroke-linejoin="round"/>` +
        `<rect x="28" y="25" width="64" height="8" rx="3.5" fill="#F7C94E" stroke="#C68A1E" stroke-width="1.6"/>` +
        `<circle cx="45" cy="21" r="3" fill="#EA6E8E" stroke="#B44C69" stroke-width="1"/>` +
        `<circle cx="75" cy="21" r="3" fill="#7FC4E8" stroke="#4B90BB" stroke-width="1"/>` +
        star(60, 12, 6, '#FFF6CE', 1) +
        `<path d="M34 12 L36 20" stroke="#FFF6CE" stroke-width="1.7" opacity=".7" stroke-linecap="round"/>`
    },
    bunny: {
      focus: [20, -20, 80, 56],
      front: `<g><path d="M35 24 C27 8 29 -12 39 -15 C49 -17 51 4 47 24 Z" fill="#FFFFFF" stroke="#D6DDE8" stroke-width="1.9"/>` +
        `<path d="M39 20 C35 8 36 -7 41 -9 C46 -8 46 6 44 20 Z" fill="#F8C4D5"/>` +
        `<path d="M73 24 C69 4 71 -17 81 -15 C91 -12 93 8 85 24 Z" fill="#FFFFFF" stroke="#D6DDE8" stroke-width="1.9"/>` +
        `<path d="M76 20 C74 6 74 -8 79 -9 C84 -7 85 8 81 20 Z" fill="#F8C4D5"/>` +
        `<path d="M31 24 Q60 12 89 24" fill="none" stroke="#F2AFC7" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M31 23 Q60 12 89 23" fill="none" stroke="#FFE1EC" stroke-width="1.8" opacity=".8" stroke-linecap="round"/>` +
        bow(60, 16, 8, '#FFD9E6', '#F294B4', '#D96C92', false)
    },
    tophat: {
      focus: [12, 0, 96, 42],
      front: defs(lg('g_top_a', '#4B4664', '#272338')) +
        `<ellipse cx="60" cy="30" rx="43" ry="7.5" fill="#302B44" stroke="#1B1828" stroke-width="1.5"/>` +
        `<path d="M40 29 L42 6 Q60 2 78 6 L80 29 Z" fill="url(#g_top_a)" stroke="#1B1828" stroke-width="1.7"/>` +
        `<path d="M41 21 Q60 26 79 21 L79.6 26.5 Q60 31 40.4 26.5 Z" fill="#C44B55" stroke="#8E3039" stroke-width="1"/>` +
        `<ellipse cx="60" cy="6" rx="18" ry="4" fill="#5B557A" stroke="#1B1828" stroke-width="1.2"/>` +
        `<path d="M46 10 L45 20" stroke="#8A84AB" stroke-width="2" opacity=".55" stroke-linecap="round"/>`
    },
    beret: {
      focus: [18, -4, 84, 44],
      front: defs(lg('g_beret_a', '#D4648C', '#9E3E66')) +
        `<path d="M28 25 Q29 7 59 5 Q89 4 94 18 Q97 29 78 31 Q50 33 28 25 Z" fill="url(#g_beret_a)" stroke="#833454" stroke-width="1.9"/>` +
        `<path d="M60 5 Q62 -2 69 -3" fill="none" stroke="#833454" stroke-width="3.2" stroke-linecap="round"/>` +
        `<circle cx="69" cy="-3" r="2.4" fill="#B9567E"/>` +
        `<path d="M34 19 Q60 10 90 17" fill="none" stroke="#FFE1EC" stroke-width="2.2" opacity=".32" stroke-linecap="round"/>` +
        `<path d="M30 26 Q60 33 92 26" fill="none" stroke="#7B2F4F" stroke-width="3.4" stroke-linecap="round"/>` +
        `<path d="M31 25 Q60 31 91 25" fill="none" stroke="#F2B6CD" stroke-width="1.2" opacity=".5"/>`
    },

    /* ---------------- 脸部 ---------------- */
    glasses: {
      focus: [8, 36, 104, 36],
      front: `<g fill="none" stroke="#5B5348" stroke-linecap="round">` +
        `<circle cx="41" cy="52" r="13.5" fill="#EAF6FF" fill-opacity=".26" stroke-width="3"/>` +
        `<circle cx="79" cy="52" r="13.5" fill="#EAF6FF" fill-opacity=".26" stroke-width="3"/>` +
        `<path d="M54.5 49 Q60 45 65.5 49" stroke-width="3"/>` +
        `<path d="M27.5 47 L14 43 M92.5 47 L106 43" stroke-width="2.8"/>` +
        `<path d="M34 46 Q40 42 46 46 M72 46 Q78 42 84 46" stroke="#FFFFFF" stroke-width="2" opacity=".65"/>` +
        `</g>`
    },
    mask: {
      focus: [10, 26, 100, 40],
      front: `<path d="M27 43 L32 28 L47 41 Z" fill="#E7C9DC" stroke="#8E6885" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M93 43 L88 28 L73 41 Z" fill="#E7C9DC" stroke="#8E6885" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M32 33 L34 38 L42 40 Z" fill="#F4A9C0" opacity=".75"/><path d="M88 33 L86 38 L78 40 Z" fill="#F4A9C0" opacity=".75"/>` +
        `<path fill-rule="evenodd" stroke="#8E6885" stroke-width="1.9" stroke-linejoin="round" fill="#F1DFEB" d="` +
        `M16 50 Q16 41 33 42 Q47 43 60 47 Q73 43 87 42 Q104 41 104 50 Q104 61 87 63 Q73 64 60 60 Q47 64 33 63 Q16 61 16 50 Z ` +
        `M33 51 Q41 44 49 51 Q41 58 33 51 Z M71 51 Q79 44 87 51 Q79 58 71 51 Z"/>` +
        `<circle cx="60" cy="58" r="2.6" fill="#E58FA5" stroke="#B97C91" stroke-width=".8"/>` +
        `<path d="M56 61 Q60 65 64 61" fill="none" stroke="#B08CA8" stroke-width="1.5" stroke-linecap="round"/>` +
        `<path d="M20 55 L10 53 M20 59 L11 60 M100 55 L110 53 M100 59 L109 60" stroke="#B08CA8" stroke-width="1.2" stroke-linecap="round" opacity=".85"/>`
    },
    shades: {
      focus: [8, 38, 104, 38],
      front: defs(lg('g_shade_a', '#585075', '#2C2740')) +
        `<path d="M14 43 H106" stroke="#2F2A3A" stroke-width="3.6" stroke-linecap="round"/>` +
        `<path d="M17 44 H56 Q58 44 57 51 L54 63 Q52 67 46 67 H27 Q20 67 20 60 Z" fill="url(#g_shade_a)" stroke="#241F31" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M64 44 H103 Q100 44 100 60 Q100 67 93 67 H74 Q68 67 66 63 L63 51 Q62 44 64 44 Z" fill="url(#g_shade_a)" stroke="#241F31" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M57 47 Q60 44 63 47" fill="none" stroke="#2F2A3A" stroke-width="3"/>` +
        `<path d="M23 50 L35 47 M67 50 L79 47" stroke="#CFC9E8" stroke-width="2.4" opacity=".55" stroke-linecap="round"/>`
    },

    /* ---------------- 耳边 ---------------- */
    pearl: {
      focus: [0, 44, 120, 46],
      front: defs(lg('g_pearl_a', '#FFFFFF', '#D6C6DE') + lg('g_gold_a', '#FFE9A8', '#D4A63A')) +
        /* 左耳：金耳钩 + 金托 + 大珍珠 + 小垂珠 */
        `<path d="M16 51 q-4 9 0 13" fill="none" stroke="#C99A32" stroke-width="2.4" stroke-linecap="round"/>` +
        `<circle cx="16" cy="53" r="2.4" fill="url(#g_gold_a)"/>` +
        `<path d="M13 65 q3 -3 6 0 l-1 3 h-4 Z" fill="url(#g_gold_a)" stroke="#B4862A" stroke-width="1"/>` +
        `<circle cx="16" cy="74" r="8" fill="url(#g_pearl_a)" stroke="#A996AF" stroke-width="1.5"/>` +
        `<circle cx="13.5" cy="71" r="2.8" fill="#fff" opacity=".95"/>` +
        `<circle cx="16" cy="85" r="3.2" fill="#F7EED9" stroke="#B9A8C4" stroke-width="1"/>` +
        /* 右耳镜像 */
        `<path d="M104 51 q4 9 0 13" fill="none" stroke="#C99A32" stroke-width="2.4" stroke-linecap="round"/>` +
        `<circle cx="104" cy="53" r="2.4" fill="url(#g_gold_a)"/>` +
        `<path d="M101 65 q3 -3 6 0 l-1 3 h-4 Z" fill="url(#g_gold_a)" stroke="#B4862A" stroke-width="1"/>` +
        `<circle cx="104" cy="74" r="8" fill="url(#g_pearl_a)" stroke="#A996AF" stroke-width="1.5"/>` +
        `<circle cx="101.5" cy="71" r="2.8" fill="#fff" opacity=".95"/>` +
        `<circle cx="104" cy="85" r="3.2" fill="#F7EED9" stroke="#B9A8C4" stroke-width="1"/>` +
        star(28, 62, 3, '#FFE9A8', .95) + star(92, 62, 3, '#FFE9A8', .95)
    },

    /* ---------------- 脖颈 ---------------- */
    scarf: {
      focus: [18, 66, 84, 68],
      front: defs(lg('g_scarf_a', '#F47F83', '#C93F49')) +
        /* 绕脖一圈：柔软的椭圆环，下缘自然起伏，不是硬方块 */
        `<path d="M27 80 C33 73 47 72 60 75 C73 72 87 73 93 80 C95 85 92 91 86 92 C74 87 46 87 34 92 C28 91 25 85 27 80 Z" fill="url(#g_scarf_a)" stroke="#AE343E" stroke-width="1.8" stroke-linejoin="round"/>` +
        /* 交叠处自然垂下的一段，带一点摆动 */
        `<path d="M61 85 C67 89 74 89 79 86 C83 96 85 108 82 121 C78 126 69 126 65 121 C62 108 60 95 61 85 Z" fill="url(#g_scarf_a)" stroke="#AE343E" stroke-width="1.8" stroke-linejoin="round"/>` +
        /* 针织褶皱 + 高光 */
        `<path d="M32 81 Q60 76 88 81 M34 88 Q60 83 86 88" fill="none" stroke="#FFD6D6" stroke-width="1.3" opacity=".55"/>` +
        `<path d="M65 94 Q72 97 80 94 M65 104 Q72 107 80 104 M65 114 Q72 117 80 114" fill="none" stroke="#FFD6D6" stroke-width="1.3" opacity=".6"/>` +
        /* 下摆流苏 */
        `<path d="M66 121 l-1 7 M71 125 l0 7 M76 124 l1 7 M81 121 l2 6" stroke="#E2656C" stroke-width="2" stroke-linecap="round"/>`
    },
    necklace: {
      focus: [24, 70, 72, 46],
      front: defs(lg('g_dia_a', '#E7FAFF', '#7EC8E8') + lg('g_gold_b', '#FFE9A8', '#D4A63A')) +
        /* 珠链：一颗颗小金珠沿颈弧排开，比一条硬 V 线更像项链 */
        `<path d="M33 78 Q60 98 87 78" fill="none" stroke="url(#g_gold_b)" stroke-width="1.7" stroke-linecap="round"/>` +
        `<circle cx="33" cy="78" r="2.3" fill="#F5D776"/><circle cx="42" cy="84" r="2.2" fill="#F5D776"/>` +
        `<circle cx="51" cy="87" r="2.2" fill="#F5D776"/><circle cx="69" cy="87" r="2.2" fill="#F5D776"/>` +
        `<circle cx="78" cy="84" r="2.2" fill="#F5D776"/><circle cx="87" cy="78" r="2.3" fill="#F5D776"/>` +
        `<path d="M60 90 L67 97 L60 110 L53 97 Z" fill="url(#g_dia_a)" stroke="#9BC9DD" stroke-width="1.3" stroke-linejoin="round"/>` +
        `<path d="M53 97 H67 M60 90 L60 110" stroke="#fff" stroke-width="1" opacity=".8"/>` +
        star(72, 84, 3.4, '#FFF0B0', 1) + star(46, 81, 2.4, '#FFF0B0', .85)
    },
    silk: {
      focus: [20, 64, 80, 62],
      front: defs(lg('g_silk_a', '#FFD8E6', '#E795B6')) +
        /* 细方巾绕颈、向中间收拢，不是一整条横布 */
        `<path d="M30 78 Q45 74 60 80 Q75 74 90 78 Q87 85 77 87 Q60 83 43 87 Q33 85 30 78 Z" fill="url(#g_silk_a)" stroke="#C4708C" stroke-width="1.5" stroke-linejoin="round"/>` +
        `<path d="M35 80 Q60 77 85 80" fill="none" stroke="#fff" stroke-width="1.5" opacity=".6"/>` +
        /* 偏右系一个蝴蝶结，两条飘带自然垂下 */
        bow(72, 87, 13, '#F4A6C4', '#E77FA5', '#C4638A', false) +
        `<path d="M69 91 C66 101 65 110 68 118" fill="none" stroke="#EFA3C0" stroke-width="4.2" stroke-linecap="round"/>` +
        `<path d="M76 91 C80 100 82 108 79 115" fill="none" stroke="#F6BBD2" stroke-width="3.6" stroke-linecap="round"/>`
    },

    /* ---------------- 身后（两段式：布在身后，系带在身前） ---------------- */
    cape: {
      focus: [0, 58, 120, 92],
      back: defs(lg('g_cape_a', '#FF8A8A', '#C63C47')) +
        `<path d="M38 70 Q60 65 82 70 C100 82 112 112 116 144 Q88 133 60 135 Q32 133 4 144 C8 112 20 82 38 70 Z" fill="url(#g_cape_a)" stroke="#A9323C" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M39 73 C34 98 32 120 30 138 M81 73 C86 98 88 120 90 138" fill="none" stroke="#fff" stroke-width="3" opacity=".16"/>` +
        `<path d="M60 72 L60 134" stroke="#fff" stroke-width="2" opacity=".12"/>`,
      /* 身前两片垂下的披风前襟：中间露出宠物身体，才看得出是「披着」 */
      front: defs(lg('g_cape_b', '#FF9292', '#C8404A')) +
        `<path d="M37 70 C27 78 19 98 15 130 C24 136 35 138 43 135 C38 112 38 90 43 75 Z" fill="url(#g_cape_b)" stroke="#A9323C" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M83 70 C93 78 101 98 105 130 C96 136 85 138 77 135 C82 112 82 90 77 75 Z" fill="url(#g_cape_b)" stroke="#A9323C" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M33 80 C27 98 24 116 23 130 M87 80 C93 98 96 116 97 130" fill="none" stroke="#fff" stroke-width="2" opacity=".2"/>` +
        `<path d="M37 70 Q48 80 60 75 Q72 80 83 70" fill="none" stroke="#D9555C" stroke-width="4.4" stroke-linecap="round"/>` +
        `<circle cx="60" cy="76" r="5.2" fill="#F5C451" stroke="#BE8C26" stroke-width="1.5"/>` +
        `<circle cx="58.5" cy="74.5" r="1.6" fill="#FFF3C4"/>`
    },
    bag: {
      focus: [0, 60, 120, 86],
      back: defs(lg('g_bag_a', '#8CCBFF', '#3F8FE0')) +
        `<rect x="80" y="82" width="35" height="48" rx="11" fill="url(#g_bag_a)" stroke="#2F6FB8" stroke-width="2.2"/>` +
        `<path d="M80 102 h35" stroke="#2F6FB8" stroke-width="2"/>` +
        `<rect x="88" y="89" width="19" height="13" rx="4" fill="#EAF6FF" stroke="#2F6FB8" stroke-width="1.6"/>` +
        `<circle cx="97.5" cy="112" r="4" fill="#FFD23F" stroke="#C99B00" stroke-width="1.4"/>` +
        `<path d="M84 86 q-8 4 -8 14" fill="none" stroke="#3F8FE0" stroke-width="4" opacity=".9"/>`,
      front: `<path d="M37 73 Q29 86 32 106 M83 73 Q91 86 88 106" fill="none" stroke="#4A93DC" stroke-width="6.5" stroke-linecap="round"/>` +
        `<path d="M37 73 Q29 86 32 106 M83 73 Q91 86 88 106" fill="none" stroke="#A8D8FF" stroke-width="1.8" opacity=".6" stroke-linecap="round"/>` +
        `<rect x="29" y="100" width="7" height="6" rx="2" fill="#F5C451"/><rect x="85" y="100" width="7" height="6" rx="2" fill="#F5C451"/>`
    },

    /* ---------------- 斜挎身侧 ---------------- */
    shoulderbag: {
      focus: [22, 64, 98, 86],
      front: defs(
        lg('g_bag_b', '#C98A63', '#8B4A32') +
        lg('g_flap_b', '#D89A72', '#A25C40') +
        lg('g_gold_c', '#FFE9A8', '#D0A032')
      ) +
        /* 斜挎带：左肩 → 右胯，压在身前 */
        `<path d="M39 75 C55 88 76 102 94 115" fill="none" stroke="#7C4430" stroke-width="6.4" stroke-linecap="round"/>` +
        `<path d="M39 75 C55 88 76 102 94 115" fill="none" stroke="#E3B18B" stroke-width="1.6" opacity=".7" stroke-linecap="round"/>` +
        `<rect x="62" y="90" width="9" height="7" rx="2" fill="url(#g_gold_c)" stroke="#A8802A" stroke-width="1" transform="rotate(38 66.5 93.5)"/>` +
        /* 包体：右胯，梯形软皮 */
        `<path d="M75 108 Q75 104 81 104 L111 104 Q117 104 117 110 L115 136 Q114 142 108 142 L82 142 Q76 142 75 136 Z" fill="url(#g_bag_b)" stroke="#6B3A28" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M75 110 Q75 104 81 104 L111 104 Q117 104 117 110 L116 121 Q96 127 75 121 Z" fill="url(#g_flap_b)" stroke="#6B3A28" stroke-width="1.9" stroke-linejoin="round"/>` +
        `<path d="M79 111 L79 138 M113 111 L112 138" stroke="#EFC3A4" stroke-width="1.1" stroke-dasharray="2 3" opacity=".75"/>` +
        /* 金色锁扣 */
        `<rect x="91" y="116" width="10" height="9" rx="2.2" fill="url(#g_gold_c)" stroke="#A8802A" stroke-width="1.2"/>` +
        `<circle cx="96" cy="120.5" r="1.8" fill="#FFF6D0"/>` +
        /* 侧边金属链 + 流苏 */
        `<path d="M115 112 q7 7 3 16" fill="none" stroke="#E3BD55" stroke-width="2" stroke-dasharray="2.4 2.4" stroke-linecap="round"/>` +
        `<path d="M82 142 l-1 6 M88 142 l0 6 M94 142 l0 6" stroke="#B87B55" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M80 108 Q96 103 112 108" fill="none" stroke="#fff" stroke-width="1.5" opacity=".28"/>`
    },

    /* ---------------- 手持撑起 ---------------- */
    umbrella: {
      focus: [38, -20, 88, 148],
      front: defs(
        lg('g_umb_a', '#F58AA6', '#D64F76') +
        lg('g_umb_b', '#FFF3F6', '#FFD4E0') +
        lg('g_stick_a', '#D3A875', '#8C6A3F')
      ) +
        /* 伞面在头顶上方偏右；伞杆向右下斜到手边，避开眼睛和身体中央 */
        `<path d="M82 -10 C62 -10 48 5 44 27 Q52 22 59 27 Q67 22 72 27 Q82 22 92 27 Q99 22 106 27 Q113 22 120 27 C116 5 102 -10 82 -10 Z" fill="url(#g_umb_a)" stroke="#B4496B" stroke-width="1.9" stroke-linejoin="round"/>` +
        `<path d="M82 -10 C70 -10 60 3 59 27 Q67 22 72 27 Q76 6 82 -10 Z" fill="url(#g_umb_b)" opacity=".9"/>` +
        `<path d="M82 -10 C92 -10 100 3 106 27 Q99 22 92 27 Q86 6 82 -10 Z" fill="url(#g_umb_b)" opacity=".9"/>` +
        `<path d="M82 -10 Q62 7 44 27 M82 -10 Q68 7 59 27 M82 -10 Q76 7 72 27 M82 -10 Q88 7 92 27 M82 -10 Q96 7 106 27 M82 -10 Q102 7 120 27" fill="none" stroke="#fff" stroke-width="1.2" opacity=".55"/>` +
        `<path d="M50 20 Q56 8 66 0" fill="none" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/>` +
        `<path d="M82 -10 L82 -18" stroke="#8C6A3F" stroke-width="2.4" stroke-linecap="round"/>` +
        `<circle cx="82" cy="-19" r="2.2" fill="#F5C451" stroke="#BE8C26" stroke-width=".8"/>` +
        `<path d="M82 -8 L108 112" stroke="url(#g_stick_a)" stroke-width="3.4" stroke-linecap="round"/>` +
        `<path d="M81 -6 L107 110" stroke="#F0D4AC" stroke-width="1" opacity=".7" stroke-linecap="round"/>` +
        `<path d="M89 43 q5 4 9 0" fill="none" stroke="#F5C451" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M108 112 q1 12 -7 13 q-8 1 -8 -7" fill="none" stroke="#8C6A3F" stroke-width="3.6" stroke-linecap="round"/>` +
        `<path d="M107 113 q1 10 -6 11" fill="none" stroke="#E8C79B" stroke-width="1.2" opacity=".8" stroke-linecap="round"/>`
    }
  };

  /* 单件穿戴：返回可分别塞进 back / front 容器的两段 SVG */
  function get(id) {
    const a = ART[id];
    if (!a) return null;
    return {
      back: a.back ? wrap(a.back, '0 0 120 150', 'wa-svg wa-' + id + ' wa-back') : '',
      front: a.front ? wrap(a.front, '0 0 120 150', 'wa-svg wa-' + id + ' wa-front') : '',
      focus: a.focus
    };
  }

  /* 商店缩略图：裁到该服饰所在区域，渐变 id 另加前缀避免与主图串用 */
  function thumb(id, cls) {
    const a = ART[id];
    if (!a) return '';
    const raw = ((a.back || '') + (a.front || ''))
      .replace(/id="g_/g, 'id="gt_')
      .replace(/url\(#g_/g, 'url(#gt_');
    return wrap(raw, a.focus.join(' '), 'wa-thumb ' + (cls || ''));
  }

  window.WearArt = {
    get: get,
    thumb: thumb,
    ids: function () { return Object.keys(ART); },
    has: function (id) { return !!ART[id]; }
  };
})();
