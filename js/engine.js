/* ===== 题库编排 · 连续关卡 · 单元宝箱 · 经济规则 =====
 * 全部关卡都由「当前题库」推导出来：题库 → 阶段(stage) → 课(lesson) → 题。
 * 换学科/年级只是换一个题库，这里不需要改任何东西。
 */
(function () {
  const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const UNIT_COLORS = [
    { main: '#4E9B6E', soft: '#E8F4EC', deep: '#3C7C57' },
    { main: '#4C8FBF', soft: '#EAF3F9', deep: '#3B739B' },
    { main: '#9B72C9', soft: '#F0E9F8', deep: '#7E58AA' },
    { main: '#C98A3E', soft: '#F8EFE2', deep: '#A56C29' },
    { main: '#C97E92', soft: '#F9ECEF', deep: '#A85C72' },
    { main: '#5AA795', soft: '#E7F3F0', deep: '#45836F' },
    { main: '#6B7FC4', soft: '#ECEFF8', deep: '#52649F' },
    { main: '#C9A24E', soft: '#F8F1DE', deep: '#A2803A' },
    { main: '#7C97C9', soft: '#EDF1F8', deep: '#5E76A3' },
    { main: '#C06B84', soft: '#F8EAEE', deep: '#9C5268' }
  ];

  const PRIZES = [
    { id: 'coin', label: '随机金币', icon: '🪙', w: 74 },
    { id: 'hint', label: '提示卡 ×1', icon: '💡', item: 'hint', w: 8 },
    { id: 'shield', label: '连击保护 ×1', icon: '🛡️', item: 'shield', w: 6 },
    { id: 'cake', label: '奶油蛋糕 ×1', icon: '🍰', item: 'cake', w: 6 },
    { id: 'hat', label: '学士帽', icon: '🎓', item: 'hat', w: 3, rare: true },
    { id: 'honey', label: '野花蜂蜜 ×1', icon: '🍯', item: 'honey', w: 3, rare: true }
  ];
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  /* 宝箱掉落：金币数量每次随机（30~90），10% 机会触发幸运大奖再 +50 */
  function chestLoot() {
    const base = randInt(3, 9) * 10;
    const lucky = Math.random() < 0.1;
    let item = null;
    const r = Math.random();
    if (r > 0.94) item = 'hat';
    else if (r > 0.86) item = 'honey';
    else if (r > 0.74) item = 'cake';
    else if (r > 0.62) item = 'hint';
    let coins = base + (lucky ? 50 : 0);
    return { coins, base, lucky, item, rare: lucky || item === 'hat' || item === 'honey' };
  }
  function drawPrize() {
    const total = PRIZES.reduce((a, p) => a + p.w, 0);
    let r = Math.random() * total;
    for (const p of PRIZES) { r -= p.w; if (r <= 0) return p; }
    return PRIZES[0];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function byRamp(a, b) { return a.lv - b.lv || a.id.localeCompare(b.id); }

  const ECON = {
    coinForCorrect(q, combo) {
      /* 做对一题固定 1 金币：鼓励靠"多做、多闯关"积攒原始资本 */
      return 1;
    },
    starBonus(stars) { return { 3: 18, 2: 10, 1: 4, 0: 0 }[stars] || 0; },
    maxFurniture: 8,    // 每个场景最多同时摆放的家具数量（各场景互不占用名额）
    /* 抽奖大转盘：每天打卡转一次。
       12 个等角(30°)扇区，金币/吉祥话/「谢谢参与」交错分散。
       权重之和 = 12，期望金币 ≈ (100+40+20+10+10)/12 ≈ 15。
       盘面按真实大转盘做高饱和实色扇区 + 白分隔线，ink 是该扇区上的文字颜色。 */
    wheel: {
      weightTotal: 12,
      tiers: [
        { kind: 'coin',   coins: 100, weight: 1, color: '#F7A900', ink: '#ffffff' },
        { kind: 'none',   weight: 1, color: '#F0562E', ink: '#ffffff' },            // 谢谢参与
        { kind: 'phrase', weight: 1, color: '#2E9BE6', ink: '#ffffff' },            // 吉祥话
        { kind: 'coin',   coins: 40,  weight: 1, color: '#E62E6B', ink: '#ffffff' },
        { kind: 'none',   weight: 1, color: '#67BE3E', ink: '#ffffff' },            // 谢谢参与
        { kind: 'coin',   coins: 20,  weight: 1, color: '#FFD21C', ink: '#8A4B00' },
        { kind: 'phrase', weight: 1, color: '#8B4FC9', ink: '#ffffff' },            // 吉祥话
        { kind: 'none',   weight: 1, color: '#00AFA5', ink: '#ffffff' },            // 谢谢参与
        { kind: 'coin',   coins: 10,  weight: 1, color: '#F2760C', ink: '#ffffff' },
        { kind: 'phrase', weight: 1, color: '#3C6FE0', ink: '#ffffff' },            // 吉祥话
        { kind: 'none',   weight: 1, color: '#FF4C86', ink: '#ffffff' },            // 谢谢参与
        { kind: 'coin',   coins: 10,  weight: 1, color: '#43B94E', ink: '#ffffff' }
      ],
      /* 吉祥话字库：扇区上的四字吉语从中随机不重复抽取 */
      phrases: [
        '恭喜发财', '笑口常开', '再接再厉', '学业进步', '心想事成',
        '步步高升', '聪明伶俐', '天天向上', '好运连连', '元气满满',
        '一举夺魁', '前程似锦'
      ]
    },
    tasks: [
      { id: 'level3', title: '完成 3 个单元', desc: '任意单元全部通关', target: 3, reward: 10, icon: '🏠' },
      { id: 'star3', title: '拿到 5 次三星', desc: '单关正确率 100%', target: 5, reward: 15, icon: '⭐' },
      { id: 'streak7', title: '连续打卡 7 天', desc: '每 7 天一轮', target: 7, reward: 25, icon: '🔥' }
    ]
  };

  /* 宠物小家的三个场景：各有独立墙面 / 地板 / 固定装修（整幅背景 SVG），
     家具按 scene 归属，切换场景时商店与房间同步切换。 */
  const SCENES = [
    { id: 'living',  name: '客厅', icon: '🛋️', bg: 'images/scene_living.svg',  desc: '阳光、书本和老唱片' },
    { id: 'bedroom', name: '卧室', icon: '🛏️', bg: 'images/scene_bedroom.svg', desc: '软软的大床靠着墙' },
    { id: 'kitchen',  name: '厨房', icon: '🍳', bg: 'images/scene_kitchen.svg',  desc: '热腾腾的小厨房' }
  ];

  const SHOP = {
    /* 食物：hunger 饱食度 / mood 心情 / exp 经验；有 img 用图片，没有就用 emoji。
       定价原则：价格只买饱腹（hunger = round(price / 0.85)，严格正相关），
       心情只是顺带 1–3 点（抚摸、陪玩可免费刷心情，不应作为商品价值），
       exp = round(price * 1.2)。treat:true 为零食，用于「今日口味」互动，不再卖心情。 */
    food: [
      { id: 'cookie', name: '小饼干', price: 10, hunger: 12, mood: 1, exp: 12, img: 'images/item_cookie.png', desc: '饱食 +12 · 心情 +1' },
      { id: 'apple', name: '青苹果', price: 10, hunger: 12, mood: 1, exp: 12, emoji: '🍎', desc: '饱食 +12 · 心情 +1 · 便宜管饱' },
      { id: 'carrot', name: '脆胡萝卜', price: 15, hunger: 18, mood: 1, exp: 18, emoji: '🥕', desc: '饱食 +18 · 心情 +1' },
      { id: 'milk', name: '热牛奶', price: 15, hunger: 18, mood: 1, exp: 18, emoji: '🥛', desc: '饱食 +18 · 心情 +1 · 暖暖的' },
      { id: 'candy', name: '星星糖', price: 20, hunger: 24, mood: 1, exp: 24, img: 'images/item_candy.png', desc: '饱食 +24 · 心情 +1 · 零食', treat: true },
      { id: 'bread', name: '蜂蜜面包', price: 20, hunger: 24, mood: 1, exp: 24, emoji: '🍞', desc: '饱食 +24 · 心情 +1' },
      { id: 'icecream', name: '草莓冰淇淋', price: 25, hunger: 29, mood: 1, exp: 30, emoji: '🍦', desc: '饱食 +29 · 心情 +1 · 零食', treat: true },
      { id: 'cake', name: '奶油蛋糕', price: 30, hunger: 35, mood: 2, exp: 36, img: 'images/item_cake.png', desc: '饱食 +35 · 心情 +2 · 零食', treat: true },
      { id: 'donut', name: '巧克力甜甜圈', price: 30, hunger: 35, mood: 2, exp: 36, emoji: '🍩', desc: '饱食 +35 · 心情 +2 · 零食', treat: true },
      { id: 'sushi', name: '三文鱼寿司', price: 40, hunger: 47, mood: 2, exp: 48, emoji: '🍣', desc: '饱食 +47 · 心情 +2' },
      { id: 'strawberry', name: '奶油草莓', price: 15, hunger: 18, mood: 1, exp: 18, emoji: '🍓', desc: '饱食 +18 · 心情 +1 · 零食', treat: true },
      { id: 'honey', name: '野花蜂蜜', price: 50, hunger: 59, mood: 3, exp: 60, emoji: '🍯', desc: '饱食 +59 · 心情 +3' },
      { id: 'banana', name: '甜香蕉', price: 15, hunger: 18, mood: 1, exp: 18, emoji: '🍌', desc: '饱食 +18 · 心情 +1' },
      { id: 'grapes', name: '水晶葡萄', price: 15, hunger: 18, mood: 1, exp: 18, emoji: '🍇', desc: '饱食 +18 · 心情 +1' },
      { id: 'dumpling', name: '鲜肉饺子', price: 35, hunger: 41, mood: 2, exp: 42, emoji: '🥟', desc: '饱食 +41 · 心情 +2' },
      { id: 'noodles', name: '牛肉拉面', price: 45, hunger: 53, mood: 3, exp: 54, emoji: '🍜', desc: '饱食 +53 · 心情 +3' },
      { id: 'cupcake', name: '纸杯蛋糕', price: 25, hunger: 29, mood: 1, exp: 30, emoji: '🧁', desc: '饱食 +29 · 心情 +1 · 零食', treat: true },
      { id: 'chocolate', name: '黑巧克力', price: 30, hunger: 35, mood: 2, exp: 36, emoji: '🍫', desc: '饱食 +35 · 心情 +2 · 零食', treat: true },
      { id: 'salad', name: '蔬菜沙拉', price: 35, hunger: 41, mood: 2, exp: 42, emoji: '🥗', desc: '饱食 +41 · 心情 +2 · 健康轻食' },
      { id: 'watermelon', name: '冰镇西瓜', price: 20, hunger: 24, mood: 1, exp: 24, emoji: '🍉', desc: '饱食 +24 · 心情 +1 · 清凉解暑' }
    ],
    /* 服饰：全部为真实可穿戴物件，穿戴画法见 js/wearart.js。
       slot 决定穿在宠物身上的位置：head 头顶 / face 脸上 / ears 耳边 /
       neck 脖子 / back 身后 / side 斜挎身侧 / hold 手持撑起。
       每个 slot 可同时穿 1 件，所以帽子 + 眼镜 + 耳环 + 丝巾 + 单肩包 + 雨伞可叠加。 */
    wear: [
      { id: 'hat',        name: '学士帽',       price: 180, emoji: '🎓', slot: 'head', desc: '戴在头顶 · 心情 +15' },
      { id: 'bow',        name: '蝴蝶结',       price: 125, emoji: '🎀', slot: 'head', desc: '戴在头顶 · 心情 +10' },
      { id: 'strawhat',   name: '草帽',         price: 145, emoji: '👒', slot: 'head', desc: '戴在头顶 · 心情 +12' },
      { id: 'flowerpin',  name: '小花发夹',     price: 225, emoji: '🌸', slot: 'head', desc: '别在发间 · 心情 +16' },
      { id: 'headphones', name: '音乐耳机',     price: 295, emoji: '🎧', slot: 'head', desc: '戴在头上 · 心情 +20' },
      { id: 'crown',      name: '星星皇冠',     price: 530, emoji: '👑', slot: 'head', desc: '戴在头顶 · 心情 +28' },
      { id: 'bunny',      name: '兔耳发箍',     price: 240, emoji: '🐰', slot: 'head', desc: '戴在头顶 · 心情 +18' },
      { id: 'tophat',     name: '绅士礼帽',     price: 210, emoji: '🎩', slot: 'head', desc: '戴在头顶 · 心情 +14' },
      { id: 'beret',      name: '画家贝雷帽',   price: 260, emoji: '🧢', slot: 'head', desc: '斜戴头顶 · 心情 +16' },
      { id: 'glasses',    name: '圆框镜',       price: 265, emoji: '👓', slot: 'face', desc: '架在脸上 · 心情 +22' },
      { id: 'mask',       name: '猫咪面具',     price: 225, emoji: '🐱', slot: 'face', desc: '架在脸上 · 心情 +18' },
      { id: 'shades',     name: '酷酷墨镜',     price: 310, emoji: '🕶️', slot: 'face', desc: '架在脸上 · 心情 +24' },
      { id: 'pearl',      name: '珍珠耳环',     price: 235, emoji: '📿', slot: 'ears', desc: '戴在耳边 · 心情 +18' },
      { id: 'scarf',      name: '红围巾',       price: 225, emoji: '🧣', slot: 'neck', desc: '围在脖子上 · 心情 +18' },
      { id: 'necklace',   name: '闪光项链',     price: 280, emoji: '💎', slot: 'neck', desc: '戴在颈间 · 心情 +22' },
      { id: 'silk',       name: '蝴蝶结丝巾',   price: 240, emoji: '🎗️', slot: 'neck', desc: '系在颈间 · 心情 +14' },
      { id: 'cape',       name: '英雄披风',     price: 435, emoji: '🦸', slot: 'back', desc: '披在身后 · 心情 +30' },
      { id: 'bag',        name: '小书包',       price: 295, emoji: '🎒', slot: 'back', desc: '背在身后 · 心情 +20' },
      { id: 'shoulderbag',name: '时尚单肩包',   price: 575, emoji: '👜', slot: 'side', desc: '斜挎身侧 · 心情 +34' },
      { id: 'umbrella',   name: '晴雨伞',       price: 630, emoji: '☂️', slot: 'hold', desc: '撑在头顶 · 心情 +36' }
    ],
    tool: [
      { id: 'hint', name: '提示卡', price: 35, img: 'images/item_hint.png', desc: '答题时去掉两个错误选项' },
      { id: 'shield', name: '连击保护', price: 40, img: 'images/item_shield.png', desc: '答错不清零连击' }
    ],
    /* 家具：只放实心大件家具，插画见 images/furn_*.svg。
       scene 决定它属于哪个场景（商店与房间都按当前场景过滤）。
       x/y 为固定摆放位置（left%/bottom%），w 为实际宽度（px），z 为家具之间的前后层次。
       整层家具统一压在宠物背后（.ps-room z-index:0），每个场景最多 maxFurniture 件。
       y 越大越靠后墙；卧室大床 y=18% 贴着墙脚线，配合透视床形呈现「床头靠墙」。 */
    furniture: [
      /* ---- 客厅 ---- */
      { id: 'rug',        name: '暖绒地毯',   scene: 'living',  price: 160, img: 'images/furn_rug.svg',         desc: '铺满一整块地面',       x: '50%', y: '0%',  w: '300px', z: 0 },
      { id: 'bookshelf',  name: '实木书柜',   scene: 'living',  price: 520, img: 'images/furn_bookshelf.svg',   desc: '三层满满的故事书',     x: '11%', y: '14%', w: '96px',  z: 1 },
      { id: 'tvstand',    name: '实木电视柜', scene: 'living',  price: 540, img: 'images/furn_tvstand.svg',    desc: '电视机稳稳摆在上面',   x: '34%', y: '13%', w: '118px', z: 1 },
      { id: 'floorlamp',  name: '布罩落地灯', scene: 'living',  price: 300, img: 'images/furn_floorlamp.svg',  desc: '一整盏暖暖的光',       x: '90%', y: '12%', w: '70px',  z: 2 },
      { id: 'gramophone', name: '复古留声机', scene: 'living',  price: 580, img: 'images/furn_gramophone.svg',desc: '铜喇叭唱着老歌',       x: '63%', y: '8%',  w: '92px',  z: 2 },
      { id: 'coffeetable',name: '原木茶几',   scene: 'living',  price: 280, img: 'images/furn_coffeetable.svg',desc: '放得下茶杯和绘本',    x: '50%', y: '3%',  w: '118px', z: 3 },
      { id: 'sofa',       name: '圆弧沙发',   scene: 'living',  price: 620, img: 'images/furn_sofa.svg',       desc: '窝进去就不想起来',     x: '80%', y: '1%',  w: '142px', z: 4 },
      /* ---- 卧室 ---- */
      { id: 'rugbed',     name: '长绒床边毯', scene: 'bedroom', price: 190, img: 'images/furn_rugbed.svg',     desc: '光脚踩上去软软的',     x: '38%', y: '0%',  w: '270px', z: 0 },
      { id: 'bed',        name: '靠墙实木大床', scene: 'bedroom', price: 680, img: 'images/furn_bed.svg',        desc: '床头贴墙 · 红被白枕', x: '30%', y: '18%', w: '180px', z: 2 },
      { id: 'wardrobe',   name: '双门衣柜',   scene: 'bedroom', price: 560, img: 'images/furn_wardrobe.svg',   desc: '厚实的双开门大柜',     x: '85%', y: '12%', w: '92px',  z: 1 },
      { id: 'chest',      name: '五斗矮柜',   scene: 'bedroom', price: 420, img: 'images/furn_chest.svg',      desc: '三层大抽屉',           x: '63%', y: '10%', w: '112px', z: 2 },
      { id: 'nightstand', name: '床头柜台灯', scene: 'bedroom', price: 330, img: 'images/furn_nightstand.svg', desc: '睡前留一盏暖光',       x: '55%', y: '2%',  w: '92px',  z: 3 },
      { id: 'mirror',     name: '实木落地镜', scene: 'bedroom', price: 390, img: 'images/furn_mirror.svg',     desc: '出门前照一照',         x: '9%',  y: '9%',  w: '62px',  z: 2 },
      /* ---- 厨房 ---- */
      { id: 'mat',        name: '格纹厨房垫', scene: 'kitchen', price: 150, img: 'images/furn_mat.svg',        desc: '站在上面做饭不凉脚',   x: '50%', y: '0%',  w: '230px', z: 0 },
      { id: 'fridge',     name: '双门大冰箱', scene: 'kitchen', price: 720, img: 'images/furn_fridge.svg',     desc: '塞满好吃的',           x: '13%', y: '10%', w: '98px',  z: 1 },
      { id: 'pantry',     name: '餐边储物柜', scene: 'kitchen', price: 520, img: 'images/furn_pantry.svg',     desc: '碗碟都收得整整齐齐',   x: '35%', y: '10%', w: '100px', z: 1 },
      { id: 'stove',      name: '灶台烤箱',   scene: 'kitchen', price: 660, img: 'images/furn_stove.svg',      desc: '小锅正冒着热气',       x: '60%', y: '8%',  w: '120px', z: 2 },
      { id: 'washer',     name: '滚筒洗衣机', scene: 'kitchen', price: 600, img: 'images/furn_washer.svg',     desc: '衣服转呀转',           x: '86%', y: '7%',  w: '96px',  z: 2 },
      { id: 'dining',     name: '小餐桌椅',   scene: 'kitchen', price: 580, img: 'images/furn_dining.svg',     desc: '一人一碗热乎饭',       x: '50%', y: '1%',  w: '160px', z: 4 }
    ]
  };

  /* ---------- 由题库生成本次运行的关卡结构 ---------- */
  function build(bank) {
    const UNITS = bank.stages.map((st, i) => Object.assign({}, st, {
      subtitle: st.subtitle || `第${CN[i] || i + 1}${st.unitNoun || '单元'}`,
      color: UNIT_COLORS[i % UNIT_COLORS.length],
      colorSoft: UNIT_COLORS[i % UNIT_COLORS.length].soft
    }));
    const LEVELS = bank.levels.map(lv => ({
      id: lv.id, unit: lv.unit, unitTitle: lv.stageTitle,
      lessonIdx: lv.idx, lessonName: lv.title, kind: 'lesson',
      name: lv.title, qids: lv.qids, count: lv.qids.length
    }));
    LEVELS.push({
      id: `${bank.key}/final`, unit: 0, unitTitle: '期末复习',
      lessonIdx: 0, lessonName: bank.final.title, kind: 'boss',
      name: bank.final.title, count: bank.final.count
    });
    const FINAL_ID = `${bank.key}/final`;

    const CHESTS = UNITS.map(u => ({
      id: 'chest-' + u.chestKey, key: u.chestKey, unit: u.n,
      name: `${u.subtitle}宝箱`, color: u.color
    }));

    const BY_ID = {};
    bank.all.forEach(q => { BY_ID[q.id] = q; });

    function unitLevels(n) { return LEVELS.filter(l => l.unit === n && l.kind === 'lesson'); }
    function unitProgress(n) {
      const ls = unitLevels(n);
      return { done: ls.filter(l => Store.starsOf(l.id) >= 1).length, total: ls.length };
    }
    function unitComplete(n) {
      const p = unitProgress(n);
      return p.total > 0 && p.done === p.total;
    }
    function currentUnit() { return UNITS.find(u => !unitComplete(u.n)) || UNITS[UNITS.length - 1]; }
    function unitById(n) { return UNITS.find(u => u.n === n) || null; }
    function chestState(n) {
      const u = unitById(n);
      if (!u) return 'locked';
      /* 刚通关、还没领奖：无论旧标记如何，都强制停在宝箱。
         iPad 上曾出现 hasChest 被提前置真、地图直接滚到下一单元第一课且没发奖，
         这里用持久化的 pendingChest + 奖励收据把流程钉死。 */
      if (Store.pendingChest && Store.pendingChest() === u.chestKey) return 'ready';
      /* 以「奖励确实发放过」为已开依据；只有旧标记没有收据时视为待补领，
         不让「宝箱自动变成打开状态却没收到金币花卡」的情况静默吞掉奖励。 */
      if (Store.chestAwarded && Store.chestAwarded(u.chestKey)) return 'opened';
      if (Store.hasChest(u.chestKey)) return 'ready';
      return unitComplete(n) ? 'ready' : 'locked';
    }
    function chestByUnit(n) { return CHESTS.find(c => c.unit === n) || null; }
    function levelById(id) { return LEVELS.find(l => l.id === id); }
    function levelIndex(id) { return LEVELS.findIndex(l => l.id === id); }
    function isUnlocked(id) {
      const i = levelIndex(id);
      if (i <= 0) return true;
      return Store.starsOf(LEVELS[i - 1].id) >= 1;
    }

    function pickFinal(count) {
      const out = [], picked = new Set(), perUnit = {};
      const take = q => {
        if (out.length >= count || picked.has(q.id)) return;
        if ((perUnit[q.unit] || 0) >= 2) return;
        picked.add(q.id); out.push(q);
        perUnit[q.unit] = (perUnit[q.unit] || 0) + 1;
      };
      bank.all.filter(q => {
        const st = Store.s.qstats[q.id];
        return st && st.w > 0;
      }).sort((a, b) => b.lv - a.lv).forEach(take);
      bank.all.filter(q => !picked.has(q.id)).sort((a, b) => b.lv - a.lv).forEach(take);
      for (const q of bank.all) { if (out.length >= count) break; take(q); }
      return out.sort(byRamp);
    }
    function answerText(q) {
      return 'ABCDEF'[q.answer] + '．' + (q.options[q.answer] || '');
    }
    function pickQuestions(level) {
      if (level.qids && level.qids.length) {
        return level.qids.map(id => BY_ID[id]).filter(Boolean).sort(byRamp);
      }
      return pickFinal(level.count);
    }

    return {
      BANK: bank, ALL: bank.all, UNITS, LEVELS, CHESTS, FINAL_ID,
      UNIT_COLORS, CN, BY_ID, ECON, SHOP, SCENES, PRIZES,
      shuffle, byRamp, pickQuestions, pickFinal, answerText,
      levelById, levelIndex, isUnlocked,
      unitById, unitLevels, unitProgress, unitComplete, currentUnit,
      chestState, chestByUnit, drawPrize, chestLoot
    };
  }

  const Engine = { setBank };
  function apply(key) {
    const bank = window.Bank.get(key) || window.Bank.first();
    if (!bank) return null;
    const built = build(bank);
    Object.keys(Engine).forEach(k => { if (k !== 'setBank') delete Engine[k]; });
    Object.assign(Engine, built);
    Engine.setBank = setBank;
    return bank;
  }
  function setBank(key) {
    if (!window.Bank.get(key)) return false;
    Store.s.bank = key;
    const b = window.Bank.get(key);
    Store.s.subject = b.subject;
    Store.s.grade = b.grade || 0;
    Store.s.volume = b.volume || '';
    Store.save();
    apply(key);
    return true;
  }

  window.Engine = Engine;
  apply((window.Store && Store.s && Store.s.bank) || (window.Bank.first() || {}).key);
})();
