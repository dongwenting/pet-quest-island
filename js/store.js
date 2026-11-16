/* ===== 存档与状态 ===== */
(function () {
  const KEY = 'xuexi.save.v1';
  const SAVE_VERSION = 2;
  /* 宠物小家的场景 id（与 js/engine.js 的 SCENES 一致）。
     这里独立放一份，避免 store.js 早于 engine.js 加载时取不到值。 */
  const SCENE_IDS = ['living', 'bedroom', 'kitchen'];

  const DEFAULT = () => ({
    v: SAVE_VERSION,
    createdAt: Date.now(),
    updatedAt: 0,        // 本地最近一次写入时间，用于云端合并时判断「谁更新」
    coins: 0,
    bank: '',            // 当前题库 key（见 data/banks/），空则用第一个题库
    subject: '语文',
    grade: 4,
    volume: '上册',
    streak: { count: 0, last: '', total: 0, max: 0, cycleStart: '', streak7Cycle: -1 },
    daily: { date: '', correct: 0, levels: 0, star3: 0, units: [], claimed: [] },
    progress: {},        // levelId -> { stars, best, plays }
    qstats: {},          // qid -> { r, w }
    wrong: [],           // [qid] 最近优先
    pet: { name: '团团', exp: 0, hunger: 80, mood: 80, food: 0, date: '', hugs: 0, plays: 0,
           favDate: '', favFood: [], favHitDate: '', favHits: 0 },
    char: 'tuantuan',    // 当前选中的卡通形象 id（见 js/characters.js）
    fairyUnlocked: false, // 集齐 108 张召唤花仙子后解锁限定伙伴
    flowers: {           // 群芳谱：固定 108 张，与学科无关
      volume: 1,         // 第几辑
      owned: [],         // 本辑已获得的编号 1-108（发放过就不再发）
      summoned: 0,       // 累计召唤次数
      log: [],           // 最近抽卡记录 {n, from, at, vol}
      pending: [],       // 已入库但还没播过翻卡动画 {n, from, at, vol}
      shopDate: '', shopCount: 0,  // 花种宝箱每日限购
      taskDate: '',      // 每日任务全清奖励
      finalDate: ''      // 期末大关每日奖励
    },
    inv: {},             // itemId -> count
    chests: {},          // 单元宝箱 key -> true（'题库key/阶段id'）
    /* 单元刚通关、宝箱还没真正开过（金币/花卡未发放）时记下 key。
       地图渲染以它为准停在宝箱，不再只看 hasChest——后者可能被云端合并
       或 iOS 幽灵点击提前置真，导致平板端直接跳到下一单元第一课。 */
    pendingChest: '',
    chestAwarded: {},    // key -> true：该宝箱奖励确实发放过（防止重复/漏发）
    equipped: { head: '', face: '', ears: '', neck: '', back: '', side: '', hold: '' },  // 已穿戴的服饰（按部位）
    decor: [],           // 已摆放的家具 id 列表（家具自带 scene，各场景各自保留摆放状态）
    scene: 'living',    // 当前所在的房间：客厅 / 卧室 / 厨房
    settings: { sound: true, anim: true, voice: true }
  });

  /* ---------- 旧存档迁移（v1 → v2） ----------
   * v1 的关卡 id 是 u1-l1…u8-l4 / final，宝箱 key 是 u1…u8；
   * v2 起关卡 id 带题库前缀，避免多学科撞号。 */
  function migrate(obj) {
    if ((obj.v || 1) >= SAVE_VERSION) return obj;
    const BANK = 'chinese-g4-a';
    const mapLevel = id => {
      if (!id) return id;
      if (id === 'final') return BANK + '/final';
      const m = /^u(\d+)-l(\d+)$/.exec(id);
      return m ? `${BANK}/u${m[1]}/l${m[2]}` : id;
    };
    if (obj.progress && typeof obj.progress === 'object') {
      const next = {};
      Object.keys(obj.progress).forEach(k => { next[mapLevel(k)] = obj.progress[k]; });
      obj.progress = next;
    }
    const oldChests = obj.unitDraws || obj.chests || {};
    const chests = {};
    Object.keys(oldChests).forEach(k => {
      if (!oldChests[k]) return;
      chests[/^u\d+$/.test(k) ? `${BANK}/${k}` : k] = true;
    });
    obj.chests = chests;
    delete obj.unitDraws;
    obj.bank = obj.bank || BANK;
    obj.v = SAVE_VERSION;
    return obj;
  }

  /* 注意：老存档只有 chests（已开标记），没有 chestAwarded（奖励收据）。
     这里刻意「不」把老标记批量补成已发奖——因为「有标记但没收据」正是
     平板端宝箱被提前置为已开、金币花卡却没发放的那种状态，必须允许补领。
     chestState() 会把这类宝箱判为 ready，用户点开即可正常拿到奖励。 */

  function today() {
    const d = new Date();
    const p = n => (n < 10 ? '0' + n : '' + n);
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  function dayDiff(a, b) {
    const t = s => new Date(s + 'T00:00:00').getTime();
    return Math.round((t(b) - t(a)) / 86400000);
  }

  const Store = {
    s: null,
    KEY,
    today,
    dayDiff,

    load() {
      let raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) { }
      if (raw) {
        try {
          let obj = JSON.parse(raw);
          obj = migrate(obj);
          this.s = Object.assign(DEFAULT(), obj);
          this.s.streak = Object.assign(DEFAULT().streak, obj.streak || {});
          this.s.daily = Object.assign(DEFAULT().daily, obj.daily || {});
          this.s.pet = Object.assign(DEFAULT().pet, obj.pet || {});
          this.s.equipped = Object.assign(DEFAULT().equipped, obj.equipped || {});
          this.s.decor = Array.isArray(obj.decor) ? obj.decor : [];
          this.s.settings = Object.assign(DEFAULT().settings, obj.settings || {});
          this.s.flowers = Object.assign(DEFAULT().flowers, obj.flowers || {});
          ['owned', 'log', 'pending'].forEach(k => {
            if (!Array.isArray(this.s.flowers[k])) this.s.flowers[k] = [];
          });
          if (!this.s.progress || typeof this.s.progress !== 'object') this.s.progress = {};
          if (!this.s.qstats || typeof this.s.qstats !== 'object') this.s.qstats = {};
          if (!this.s.inv || typeof this.s.inv !== 'object') this.s.inv = {};
          if (!this.s.chests || typeof this.s.chests !== 'object') this.s.chests = {};
          if (!this.s.chestAwarded || typeof this.s.chestAwarded !== 'object') this.s.chestAwarded = {};
          if (typeof this.s.pendingChest !== 'string') this.s.pendingChest = '';
          if (!Array.isArray(this.s.wrong)) this.s.wrong = [];
        } catch (e) { this.s = DEFAULT(); }
      } else {
        this.s = DEFAULT();
      }
      this.s.v = SAVE_VERSION;
      this.normalizeWear();
      this.normalizeFurniture();
      this.normalizeScene();
      this.decayDays = this.decayPet();
      this.rollDay();
      this.save();
      return this.s;
    },

    /* 旧存档的 equipped 只有 head / face 等少数键：按服饰 slot 归位。
       部位列表由题库动态生成（新增 ears / side / hold 也能兼容）。
       下架的 5 件（天使翅膀、小领带、火箭背包、甜心口红、金色铃铛）
       等价换成同类新服饰，购买记录一并迁移，旧存档不会「穿着却不显示」。 */
    normalizeWear() {
      const eq = (this.s && this.s.equipped) || {};
      const items = (window.Engine && Engine.SHOP && Engine.SHOP.wear) || [];
      if (!items.length) return eq;                    // 题库未就绪时不清洗，避免误删
      const slots = ['head', 'face', 'ears', 'neck', 'back', 'side', 'hold'];
      items.forEach(it => { if (it.slot && slots.indexOf(it.slot) < 0) slots.push(it.slot); });
      const out = {};
      slots.forEach(s => { out[s] = ''; });
      const LEGACY = { lipstick: 'pearl', bell: 'silk', tie: 'silk', wings: 'umbrella', rocket: 'shoulderbag' };
      Object.keys(eq).forEach(k => {
        let id = eq[k];
        if (!id) return;
        if (LEGACY[id]) id = LEGACY[id];
        if (Object.keys(out).some(s => out[s] === id)) return;
        const it = items.find(w => w.id === id);
        if (!it) return;                             // 彻底下架且无替代 → 丢弃
        const slot = out[it.slot] !== undefined ? it.slot : (out[k] !== undefined ? k : 'head');
        if (!out[slot]) out[slot] = id;
      });
      this.s.equipped = out;
      const inv = this.s.inv || {};
      Object.keys(LEGACY).forEach(old => {
        if (!inv[old]) return;
        inv[LEGACY[old]] = (inv[LEGACY[old]] || 0) + inv[old];
        delete inv[old];
      });
      return out;
    },

    /* 旧版小物件（皮球、小夜灯、挂钟…）已下架：把已购 / 已摆放的它们
       等价换成新的大件家具，避免存档里的家具凭空消失。可重复执行。 */
    normalizeFurniture() {
      const MAP = {
        rug: 'rug', bed: 'bed', sofa: 'sofa',
        shelf: 'bookshelf', book: 'bookshelf',
        lamp: 'floorlamp',
        piano: 'gramophone', guitar: 'gramophone', tv: 'gramophone',
        clock: 'wardrobe', mirror: 'wardrobe', painting: 'wardrobe',
        kite: 'wardrobe', lantern: 'wardrobe',
        plant: 'chest', teddy: 'chest', fishtank: 'chest', ball: 'chest',
        chair: 'chest', cushion: 'chest'
      };
      const KEEP = ['rug', 'bed', 'sofa', 'bookshelf', 'wardrobe', 'gramophone',
        'chest', 'floorlamp'];   // 新版在售家具，不参与迁移
      const inv = this.s.inv || (this.s.inv = {});
      Object.keys(MAP).forEach(old => {
        if (KEEP.includes(old) || !inv[old]) return;
        const to = MAP[old];
        inv[to] = Math.max(inv[to] || 0, 1);
        delete inv[old];
      });
      const decor = Array.isArray(this.s.decor) ? this.s.decor : (this.s.decor = []);
      const seen = [];
      decor.forEach(id => {
        const to = MAP[id] || id;
        if (!seen.includes(to)) seen.push(to);
      });
      this.s.decor = seen;
      return seen;
    },

    save() {
      try {
        this.s.v = SAVE_VERSION;
        this.s.updatedAt = Date.now();
        localStorage.setItem(KEY, JSON.stringify(this.s));
      } catch (e) {
        console.warn('存档失败', e);
        return false;
      }
      /* 已登录时防抖推云（由 cloud.js 处理节流与失败提示） */
      if (window.Cloud && Cloud.isLoggedIn()) Cloud.onLocalSave();
      return true;
    },

    reset() {
      this.s = DEFAULT();
      this.save();
    },

    // 跨天重置每日数据
    rollDay() {
      const t = today();
      let dirty = false;
      const last = this.s.streak.last;
      if (last && dayDiff(last, t) > 1 && this.s.streak.count > 0) {
        this.s.streak.count = 0;   // 断签，保留历史最长与累计天数
        dirty = true;
      }
      if (this.s.daily.date !== t) {
        this.s.daily = { date: t, correct: 0, levels: 0, star3: 0, units: [], claimed: [] };
        dirty = true;
      }
      if (dirty) this.save();
    },

    /* ---- 金币 ---- */
    addCoins(n, silent) {
      this.s.coins = Math.max(0, this.s.coins + n);
      this.save();
      if (!silent && typeof UI !== 'undefined') UI.renderCoin();
      return n;
    },
    spend(n) {
      if (this.s.coins < n) return false;
      this.s.coins -= n;
      this.save();
      if (typeof UI !== 'undefined') UI.renderCoin();
      return true;
    },

    /* ---- 打卡 ---- */
    isCheckedToday() { return this.s.streak.last === today(); },

    checkIn() {
      const t = today();
      if (this.s.streak.last === t) return { ok: false, reason: 'already' };
      const last = this.s.streak.last;
      const gap = last ? dayDiff(last, t) : 999;
      if (gap === 1) {
        this.s.streak.count += 1;
      } else {
        this.s.streak.count = 1;
      }
      this.s.streak.last = t;
      this.s.streak.total += 1;
      this.s.streak.max = Math.max(this.s.streak.max, this.s.streak.count);
      /* 连续打卡每满 7 天（按 7 天一轮）发放 25 金币，跨轮不会重复发 */
      let bonus = 0;
      const cyc = Math.floor((this.s.streak.count - 1) / 7);
      if (this.s.streak.count % 7 === 0 && this.s.streak.streak7Cycle !== cyc) {
        this.s.streak.streak7Cycle = cyc;
        bonus = 25;
        this.addCoins(bonus, true);
      }
      this.save();
      return { ok: true, count: this.s.streak.count, total: this.s.streak.total, bonus };
    },

    // 今天是否需要提示补签（昨天没打卡导致断签）
    streakAtRisk() {
      const last = this.s.streak.last;
      if (!last) return false;
      const gap = dayDiff(last, today());
      return gap === 1;
    },

    /* ---- 宠物 ---- */
    studyDays() { return this.s.streak.total || 0; },
    petStage() {
      const d = this.studyDays();
      if (d >= 100) return 4;
      if (d >= 30) return 3;
      if (d >= 7) return 2;
      return 1;
    },
    petLevel() { return 1 + Math.floor(this.s.pet.exp / 100); },

    /* 每过一天，饱食度和心情都会下降；离线多天一次性结算，最多按 7 天算 */
    decayPet() {
      const p = this.s.pet;
      const t = today();
      if (!p.date) { p.date = t; return 0; }
      const days = dayDiff(p.date, t);
      if (days <= 0) { p.date = t; return 0; }
      const d = Math.min(days, 7);
      p.hunger = Math.max(0, Math.round(p.hunger - 12 * d));
      p.mood = Math.max(0, Math.round(p.mood - 8 * d - (p.hunger < 20 ? 5 : 0)));
      p.date = t;
      this.save();
      return days;
    },
    petMood() {
      const p = this.s.pet;
      if (p.hunger <= 20 || p.mood <= 20) return 'sad';
      if (p.mood >= 80 && p.hunger >= 60) return 'happy';
      return 'normal';
    },
    /* 今日口味：按日期确定性挑 2 种（1 零食 + 1 主食）。
       同一天刷新页面、换设备、云同步结果都不变；只给趣味反馈，不产出资源。 */
    todayFav() {
      const p = this.s.pet;
      const d = today();
      if (p.favDate === d && Array.isArray(p.favFood) && p.favFood.length) return p.favFood;
      const foods = (window.Engine && Engine.SHOP && Engine.SHOP.food) || [];
      const treat = foods.filter(f => f.treat);
      const main = foods.filter(f => !f.treat);
      let h = 2166136261;
      for (let i = 0; i < d.length; i++) { h ^= d.charCodeAt(i); h = Math.imul(h, 16777619); }
      const a = treat.length ? treat[(h >>> 0) % treat.length] : null;
      const b = main.length ? main[(h >>> 8) % main.length] : null;
      p.favDate = d;
      p.favFood = [a, b].filter(Boolean).map(f => f.id);
      this.save();
      return p.favFood;
    },
    isFav(id) { return this.todayFav().includes(id); },
    /* 喂中今日口味：累计计数 + 当日首次标记（用于撒花强度） */
    favHit() {
      const p = this.s.pet;
      const d = today();
      const first = p.favHitDate !== d;
      p.favHitDate = d;
      p.favHits = (p.favHits || 0) + 1;
      this.save();
      return first;
    },
    feed(item) {
      const p = this.s.pet;
      p.hunger = Math.min(100, p.hunger + (item.hunger || 0));
      p.mood = Math.min(100, p.mood + (item.mood || 0));
      p.exp += item.exp || 10;
      p.date = today();
      this.save();
    },
    pat() {                       // 抚摸 / 挠痒
      const p = this.s.pet;
      p.hugs = (p.hugs || 0) + 1;
      p.mood = Math.min(100, p.mood + 3);
      p.exp += 1;
      p.date = today();
      this.save();
    },
    play() {                      // 陪它玩
      const p = this.s.pet;
      p.plays = (p.plays || 0) + 1;
      p.mood = Math.min(100, p.mood + 6);
      p.exp += 3;
      p.date = today();
      this.save();
    },

    /* ---- 答题统计 ---- */
    recordAnswer(qid, correct) {
      const st = this.s.qstats[qid] || (this.s.qstats[qid] = { r: 0, w: 0 });
      if (correct) {
        st.r += 1;
        this.s.daily.correct += 1;
        const i = this.s.wrong.indexOf(qid);
        if (i >= 0 && st.w >= 1) this.s.wrong.splice(i, 1); // 答对后从错题本移除
      } else {
        st.w += 1;
        if (!this.s.wrong.includes(qid)) this.s.wrong.unshift(qid);
        else { this.s.wrong = this.s.wrong.filter(x => x !== qid); this.s.wrong.unshift(qid); }
      }
      this.save();
    },

    /* ---- 关卡结算 ---- */
    finishLevel(levelId, stars, accuracy) {
      const p = this.s.progress[levelId] || { stars: 0, best: 0, plays: 0 };
      p.plays += 1;
      p.best = Math.max(p.best, accuracy);
      p.stars = Math.max(p.stars, stars);
      this.s.progress[levelId] = p;
      this.s.daily.levels += 1;
      if (stars >= 3) this.s.daily.star3 += 1;
      /* 今日首次完成某单元，计入「完成 1 个单元」任务 */
      const lv = (typeof Engine !== 'undefined' && Engine.levelById) ? Engine.levelById(levelId) : null;
      if (lv && typeof Engine.unitComplete === 'function' && Engine.unitComplete(lv.unit)) {
        const u = this.s.daily.units || (this.s.daily.units = []);
        if (!u.includes(lv.unit)) u.push(lv.unit);
      }
      this.save();
      return p;
    },

    starsOf(levelId) {
      const p = this.s.progress[levelId];
      return p ? p.stars : 0;
    },

    /* ---- 单元宝箱 ---- */
    hasChest(key) { return !!(this.s.chests && this.s.chests[key]); },
    markChest(key) {
      if (!this.s.chests) this.s.chests = {};
      this.s.chests[key] = true;
      this.save();
    },
    /* ---- 单元通关 → 开箱的「待领取」状态 ----
       只有奖励真正发放后才清掉，刷新 / 切页 / 云同步都不会弄丢。 */
    setPendingChest(key) {
      this.s.pendingChest = key || '';
      this.save();
    },
    clearPendingChest(key) {
      if (!key || this.s.pendingChest === key) this.s.pendingChest = '';
      this.save();
    },
    pendingChest() { return this.s.pendingChest || ''; },
    /* 奖励收据：判断宝箱是否已真正发过金币/花卡 */
    chestAwarded(key) { return !!(this.s.chestAwarded && this.s.chestAwarded[key]); },
    markChestAwarded(key) {
      if (!this.s.chestAwarded) this.s.chestAwarded = {};
      this.s.chestAwarded[key] = true;
      this.save();
    },
    givePrize(prize) {
      if (prize.coins) this.addCoins(prize.coins, true);
      if (prize.item) this.addItem(prize.item, 1);
      this.save();
      if (typeof UI !== 'undefined') UI.renderCoin();
    },

    totalStars() {
      return Object.values(this.s.progress).reduce((a, p) => a + (p.stars || 0), 0);
    },

    /* ---- 背包 ---- */
    addItem(id, n) {
      this.s.inv[id] = (this.s.inv[id] || 0) + (n || 1);
      this.save();
    },
    useItem(id) {
      if (!this.s.inv[id]) return false;
      this.s.inv[id] -= 1;
      if (this.s.inv[id] <= 0) delete this.s.inv[id];
      this.save();
      return true;
    },
    /* 家具摆放 / 收回：on=true 摆出，false 收回；只改 decor 列表，不影响持有 */
    toggleDecor(id, on) {
      const d = this.s.decor || (this.s.decor = []);
      const i = d.indexOf(id);
      if (on && i < 0) d.push(id);
      if (!on && i >= 0) d.splice(i, 1);
      this.save();
    },
    isDecor(id) { return (this.s.decor || []).includes(id); },

    /* 场景切换：只改当前房间，已摆放的家具留在各自场景里，切回来还在 */
    currentScene() {
      return SCENE_IDS.includes(this.s && this.s.scene) ? this.s.scene : 'living';
    },
    setScene(id) {
      if (!SCENE_IDS.includes(id)) return false;
      this.s.scene = id;
      this.save();
      return true;
    },
    normalizeScene() {
      if (!SCENE_IDS.includes(this.s.scene)) this.s.scene = 'living';
      return this.s.scene;
    },

    /* ---- 导入导出 ---- */
    /* 云端存档合并：字段级取「更靠前」的进度，绝不整档覆盖。
       修两个老问题：① 旧云档把本地新进度回退（刷新像丢档）；
       ② 云档带回来的花卡悄无声息多出来（改标为待展示，刷新后补播翻卡动画）。 */
    mergeRemote(remote) {
      if (!remote || typeof remote !== 'object' || !('coins' in remote)) return { changed: false, newCards: [] };
      const L = this.s;
      const m = migrate(remote);
      const D = DEFAULT();
      const R = Object.assign(D, m);
      R.streak = Object.assign(D.streak, m.streak || {});
      R.daily = Object.assign(D.daily, m.daily || {});
      R.pet = Object.assign(D.pet, m.pet || {});
      R.flowers = Object.assign(D.flowers, m.flowers || {});
      R.settings = Object.assign(D.settings, m.settings || {});
      R.equipped = Object.assign(D.equipped, m.equipped || {});
      ['owned', 'log', 'pending'].forEach(k => { if (!Array.isArray(R.flowers[k])) R.flowers[k] = []; });
      if (!Array.isArray(L.flowers.pending)) L.flowers.pending = [];

      const max = (a, b) => Math.max(Number(a) || 0, Number(b) || 0);
      const uniq = (a, b) => [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])];
      const newer = (Number(R.updatedAt) || 0) > (Number(L.updatedAt) || 0) ? R : L;

      /* 状态类：以较新存档为准，避免互相覆盖 */
      L.coins = newer.coins;
      L.bank = newer.bank || L.bank;
      L.subject = newer.subject || L.subject;
      L.grade = newer.grade || L.grade;
      L.volume = newer.volume || L.volume;
      L.char = newer.char || L.char;
      L.scene = SCENE_IDS.includes(newer.scene) ? newer.scene : (SCENE_IDS.includes(L.scene) ? L.scene : 'living');
      L.fairyUnlocked = !!(L.fairyUnlocked || R.fairyUnlocked);
      L.equipped = newer.equipped || L.equipped;
      L.settings = newer.settings || L.settings;
      L.decor = uniq(L.decor, R.decor);
      L.wrong = uniq(L.wrong, R.wrong);

      /* 进度类：并集 / 取最大，绝不回退 */
      const mergeProgress = (a, b) => {
        const out = Object.assign({}, a || {});
        Object.keys(b || {}).forEach(k => {
          const x = out[k], y = b[k];
          if (!x) { out[k] = y; return; }
          out[k] = {
            stars: max(x.stars, y.stars), best: max(x.best, y.best), plays: max(x.plays, y.plays)
          };
        });
        return out;
      };
      L.progress = mergeProgress(L.progress, R.progress);
      const qs = Object.assign({}, L.qstats || {});
      Object.keys(R.qstats || {}).forEach(k => {
        const x = qs[k] || { r: 0, w: 0 }, y = R.qstats[k] || {};
        qs[k] = { r: max(x.r, y.r), w: max(x.w, y.w) };
      });
      L.qstats = qs;
      const inv = Object.assign({}, L.inv || {});
      Object.keys(R.inv || {}).forEach(k => { inv[k] = max(inv[k], R.inv[k]); });
      L.inv = inv;
      L.chests = Object.assign({}, R.chests || {}, L.chests || {});
      /* 奖励收据与「待领取」也要并集，避免云端合并把本地刚通关的宝箱
         状态覆盖掉，或把已发奖记录丢掉导致重复发放。 */
      L.chestAwarded = Object.assign({}, R.chestAwarded || {}, L.chestAwarded || {});
      const pend = L.pendingChest || R.pendingChest || '';
      /* 若该宝箱奖励收据已存在，说明已领过，待领取状态作废 */
      L.pendingChest = (pend && !L.chestAwarded[pend]) ? pend : '';

      L.streak.count = max(L.streak.count, R.streak.count);
      L.streak.total = max(L.streak.total, R.streak.total);
      L.streak.max = max(L.streak.max, R.streak.max);
      L.streak.last = newer.streak.last || L.streak.last;
      L.streak.cycleStart = newer.streak.cycleStart || L.streak.cycleStart;
      L.streak.streak7Cycle = newer.streak.streak7Cycle;
      L.pet.exp = max(L.pet.exp, R.pet.exp);
      L.pet.hunger = newer.pet.hunger;
      L.pet.mood = newer.pet.mood;
      L.pet.hugs = max(L.pet.hugs, R.pet.hugs);
      L.pet.plays = max(L.pet.plays, R.pet.plays);
      /* 今日口味：计数取大值，日期新的那份决定今天吃什么 */
      L.pet.favHits = max(L.pet.favHits || 0, R.pet.favHits || 0);
      L.pet.favHitDate = newer.pet.favHitDate || L.pet.favHitDate || '';
      if ((R.pet.favDate || '') > (L.pet.favDate || '')) {
        L.pet.favDate = R.pet.favDate || '';
        L.pet.favFood = Array.isArray(R.pet.favFood) ? R.pet.favFood : [];
      }

      if (L.daily.date === R.daily.date) {
        ['correct', 'levels', 'star3'].forEach(k => { L.daily[k] = max(L.daily[k], R.daily[k]); });
        L.daily.units = uniq(L.daily.units, R.daily.units);
        L.daily.claimed = uniq(L.daily.claimed, R.daily.claimed);
      } else if ((R.daily.date || '') > (L.daily.date || '')) {
        L.daily = R.daily;
      }

      /* 花卡：同辑取并集，云档新卡标记为「待展示」而不是凭空出现 */
      const lf = L.flowers, rf = R.flowers;
      const lv = Number(lf.volume) || 1, rv = Number(rf.volume) || 1;
      let newCards = [];
      if (rv > lv) {
        lf.volume = rv;
        lf.owned = rf.owned.slice();
        lf.log = rf.log.slice();
        lf.pending = rf.pending.slice();
        lf.summonedVol = rf.summonedVol;
        lf.finalDate = rf.finalDate; lf.taskDate = rf.taskDate;
      } else if (rv === lv) {
        const had = new Set(lf.owned);
        newCards = rf.owned.filter(n => !had.has(n));
        lf.owned = uniq(lf.owned, rf.owned);
        const seen = new Set(lf.log.map(x => `${x.n}|${x.vol}|${x.at}`));
        (rf.log || []).forEach(x => {
          const k = `${x.n}|${x.vol}|${x.at}`;
          if (!seen.has(k)) { seen.add(k); lf.log.push(x); }
        });
        /* 任何一张已收集的卡都要能查到来源 */
        lf.owned.forEach(n => {
          if (!lf.log.some(x => x.n === n && x.vol === lv)) {
            lf.log.push({ n, from: '本机获得', at: L.createdAt || Date.now(), vol: lv });
          }
        });
        lf.log.sort((a, b) => (Number(b.at) || 0) - (Number(a.at) || 0));
        const pend = new Set(lf.pending.map(p => `${p.n}|${p.vol}`));
        newCards.forEach(n => {
          const k = `${n}|${lv}`;
          if (!pend.has(k)) { lf.pending.push({ n, vol: lv, from: '云端同步', at: Date.now() }); pend.add(k); }
        });
        lf.pending = lf.pending.filter(p => p.vol === lv && lf.owned.includes(p.n));
        lf.finalDate = [lf.finalDate, rf.finalDate].sort().pop() || '';
        lf.taskDate = [lf.taskDate, rf.taskDate].sort().pop() || '';
      }
      lf.summoned = max(lf.summoned, rf.summoned);

      this.normalizeWear();
      this.normalizeFurniture();
      this.save();                    // 合并结果立即落本地并推回云端
      return { changed: true, newCards };
    },

    exportJson() {
      return JSON.stringify(this.s, null, 2);
    },
    importJson(text) {
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== 'object' || !('coins' in obj)) throw new Error('不是有效的存档文件');
      const m = migrate(obj);
      this.s = Object.assign(DEFAULT(), m);
      this.s.streak = Object.assign(DEFAULT().streak, m.streak || {});
      this.s.daily = Object.assign(DEFAULT().daily, m.daily || {});
      this.s.pet = Object.assign(DEFAULT().pet, m.pet || {});
      this.s.equipped = Object.assign(DEFAULT().equipped, m.equipped || {});
      this.s.decor = Array.isArray(m.decor) ? m.decor : [];
      this.s.settings = Object.assign(DEFAULT().settings, m.settings || {});
      this.s.flowers = Object.assign(DEFAULT().flowers, m.flowers || {});
      ['owned', 'log', 'pending'].forEach(k => {
        if (!Array.isArray(this.s.flowers[k])) this.s.flowers[k] = [];
      });
      if (!this.s.chests || typeof this.s.chests !== 'object') this.s.chests = {};
      if (!this.s.chestAwarded || typeof this.s.chestAwarded !== 'object') this.s.chestAwarded = {};
      if (typeof this.s.pendingChest !== 'string') this.s.pendingChest = '';
      this.s.v = SAVE_VERSION;
      this.normalizeWear();
      this.normalizeFurniture();
      this.normalizeScene();
      this.save();
      return true;
    }
  };

  window.Store = Store;
})();
