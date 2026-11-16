/* ===== 音效（WebAudio 合成 + 语音鼓励） =====
 * 统一设计：全站共用一套「多邻国式」明亮饱满音色 + 同一个可爱女童声。
 *  - 合成音：基频 sine + 微失谐 triangle（厚度）+ 高八度 sine（明亮）+ 轻混响 + 压缩限幅；
 *    所有音效都由同一个 note() 生成，音阶统一在 C 大调族里，情绪统一「上扬、有弹性」。
 *  - 语音：任何需要说话的地方都走 sayLine()，共用同一个女童声与相近的音调/语速；
 *    找不到合适的普通话女声时宁可不念，也绝不退回系统默认的成年女声（女中音）。
 */
(function () {
  /* ---------- 音频总线 ---------- */
  let ctx = null, master = null, wet = null;
  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.9;
        /* 压缩限幅：多层叠音同时响也不爆音；老浏览器不支持就直连 */
        try {
          const comp = ctx.createDynamicsCompressor();
          comp.threshold.value = -18;
          comp.knee.value = 20;
          comp.ratio.value = 3;
          comp.attack.value = 0.004;
          comp.release.value = 0.18;
          master.connect(comp);
          comp.connect(ctx.destination);
        } catch (e) { master.connect(ctx.destination); }
        /* 极短的延迟反馈当作轻混响，让单音不干瘪、更有空间与情绪 */
        try {
          const d = ctx.createDelay(0.5);
          d.delayTime.value = 0.085;
          const fb = ctx.createGain(); fb.gain.value = 0.16;
          const wg = ctx.createGain(); wg.gain.value = 0.22;
          d.connect(fb); fb.connect(d); d.connect(wg); wg.connect(master);
          wet = d;
        } catch (e) { wet = null; }
      } catch (e) { ctx = null; return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* 一个音 = 三层叠音 + ADSR。全站所有音效都经过这里，音色必然一致。 */
  function note(freq, at, dur, opt) {
    const c = ac(); if (!c) return;
    const o = opt || {};
    const t0 = c.currentTime + at;
    const amp = o.gain == null ? 0.15 : o.gain;
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(amp, t0 + 0.012);            // 快速起音
    env.gain.exponentialRampToValueAtTime(amp * 0.58, t0 + Math.min(0.09, dur * 0.45));
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);           // 自然衰减
    env.connect(master);
    if (wet) env.connect(wet);

    const layers = [
      { type: 'sine', mul: 1, g: 1.0, det: 0 },
      { type: 'triangle', mul: 1, g: 0.32, det: 6 },   // 微失谐，声音更厚更饱满
      { type: 'sine', mul: 2, g: 0.18, det: 0 }        // 高八度泛音，明亮通透
    ];
    layers.forEach(L => {
      const osc = c.createOscillator(), lg = c.createGain();
      osc.type = L.type;
      osc.frequency.setValueAtTime(freq * L.mul, t0);
      if (L.det) osc.detune.setValueAtTime(L.det, t0);
      /* 轻微上滑，做出「耶！」的弹性，而不是呆板的电子滴 */
      if (o.bend) osc.frequency.exponentialRampToValueAtTime(freq * L.mul * o.bend, t0 + dur * 0.6);
      lg.gain.value = L.g;
      osc.connect(lg); lg.connect(env);
      osc.start(t0); osc.stop(t0 + dur + 0.03);
    });
  }
  const arp = (list, at, step, dur, gain, bend) =>
    list.forEach((f, i) => note(f, at + i * step, dur, { gain, bend }));
  const chord = (list, at, dur, gain) =>
    list.forEach(f => note(f, at, dur, { gain }));

  /* 统一音阶族：明亮的大三和弦 / 上行琶音；失败用柔和下行小三度，不刺耳、不惩罚感 */
  const S = {
    ok:    [1046.5, 1318.5, 1568.0],              // C6 E6 G6
    okLow: [523.25, 659.25, 783.99],             // C5 E5 G5 铺底
    no:    [392.0, 329.63],                      // G4 → E4
    happy: [783.99, 987.77, 1174.66],            // G5 B5 D6
    coin:  [1568.0, 2093.0],
    clear: [523.25, 659.25, 783.99, 1046.5],     // C5→C6 上行
    final: [1046.5, 1318.5, 1568.0, 2093.0]     // 收尾大三和弦 + 高八度
  };

  /* ===== 语音鼓励：可爱女童声 · 全中文 =====
     答题夸奖 / 答错打气 / 宠物说话都共用这一套声音，全站音色一致。 */
  const PRAISE = [
    '真棒', '太棒啦', '答对啦', '好厉害', '真聪明',
    '棒棒哒', '你好棒', '太优秀啦', '厉害呀', '全对咯', '好样的'
  ];
  const CHEER = [
    '加油', '再试一次', '别灰心', '差一点点', '继续努力',
    '下次一定行', '慢慢来', '你可以的', '再来一次', '别着急'
  ];
  /* 常见中文女声候选，按「越像小女孩越优先」排列。
     iPadOS 自带普通话女声 Ting-Ting / Mei-Jia 常标成 zh-TW / zh-HK，也列进来。 */
  const GIRL_HINT = [
    'xiaoshuang', '晓双', 'child', '童声', 'girl', '女孩',
    'xiaoyi', '晓伊',
    'xiaoxiao', '晓晓',
    'huihui', '慧慧', 'yaoyao', '瑶瑶', 'tingting', 'ting-ting', '婷婷',
    'meijia', 'mei-jia', '美佳', 'sinji', 'sin-ji',
    'female', '女声', 'google 普通话', 'google mandarin'
  ];
  const BOY_HINT = ['kangkang', 'yunyang', 'yunxi', 'yunxia', 'yunzhe', 'yunlong', '云希', '云健', '云扬', '云夏', '雲龍', '雲哲', '康康'];
  /* 只排除粤语等非普通话音源。
     旧版把 zh-hk / zh-tw / 台湾 也一并排除，而 iPad 的普通话女声恰恰常被标成这些 lang，
     结果平板端候选为空 → 全程静音（刷新也不会好）。 */
  const BAD_HINT = ['yue', '粤', 'cantonese'];
  let cachedVoices = [];
  let praiseN = 0, cheerN = 0, lastVoice = 0;
  let speechUnlocked = false;
  let voicesTried = 0;

  function voiceOn() {
    const s = window.Store && Store.s && Store.s.settings;
    return !s || s.voice !== false;    // 默认开
  }
  function allVoices() {
    if (!('speechSynthesis' in window)) return [];
    try {
      const vs = window.speechSynthesis.getVoices() || [];
      if (vs.length) cachedVoices = vs;
    } catch (e) { /* 忽略 */ }
    return cachedVoices;
  }
  /* iOS / iPadOS Safari 的 getVoices() 在页面加载时通常返回空数组，
     且 voiceschanged 事件不一定触发。启动后多次主动轮询，拿到列表就缓存，
     避免「刷新也一直没声音」。 */
  const VOICE_RETRY = [0, 120, 300, 600, 1000, 1600, 2400, 3600];
  function primeVoices() {
    allVoices();
    if (cachedVoices.length || voicesTried >= VOICE_RETRY.length) return;
    const delay = VOICE_RETRY[voicesTried++];
    setTimeout(primeVoices, delay);
  }
  /* 挑一个普通话女童声。找不到理想音色时逐级放宽，但绝不返回 null 让平板静音：
     最后仍会用高 pitch 的系统中文语音念出来（配合合成音，至少有声音反馈）。 */
  function girlVoice() {
    const all = allVoices();
    if (!all.length) return null;
    const nm = v => (v.name || '').toLowerCase();
    const lg = v => (v.lang || '').toLowerCase();
    const isYue = v => BAD_HINT.some(k => lg(v).includes(k) || nm(v).includes(k));
    /* 中文语音：zh-* 或 cmn-*（部分 iPad 用 cmn-Hans-CN） */
    const zh = all.filter(v => /^(zh|cmn)/i.test(v.lang || '') && !isYue(v));
    const pool = zh.length ? zh : all.filter(v => !isYue(v));
    if (!pool.length) return null;
    const isBoy = v => {
      const n = nm(v);
      if (/female|女声|女孩/.test(n)) return false;   // "female" 里含 male，别误判
      return BOY_HINT.some(k => n.includes(k));
    };
    const cn = pool.filter(v => /^zh-(cn|hans)|^cmn|simplified|大陆|普通话|mandarin/i.test(lg(v) + ' ' + nm(v)));
    const pref = cn.length ? cn : pool;
    for (const k of GIRL_HINT) {
      const v = pref.find(x => nm(x).includes(k) && !isBoy(x))
        || pool.find(x => nm(x).includes(k) && !isBoy(x));
      if (v) return v;
    }
    return pref.find(v => !isBoy(v)) || pool.find(v => !isBoy(v)) || pool[0] || null;
  }
  /* iOS / iPadOS Safari：speechSynthesis 的首次 speak() 必须发生在用户手势的
     同步调用栈里，否则之后 setTimeout 里的发声会被静默拒绝（安卓无此限制）。
     因此在第一次真实交互时用一条静音句子把引擎解锁，并同时解锁 WebAudio。 */
  function unlockSpeech() {
    if (speechUnlocked) return;
    speechUnlocked = true;
    try { ac(); } catch (e) { }
    try {
      const sy = window.speechSynthesis;
      if (!sy || !window.SpeechSynthesisUtterance) return;
      const u = new window.SpeechSynthesisUtterance(' ');
      u.volume = 0; u.rate = 10; u.pitch = 1;
      sy.speak(u);
      primeVoices();
    } catch (e) { }
  }
  /* capture 阶段监听，保证在任何业务 click 之前同步执行；
     覆盖触摸、鼠标、键盘以及 JS 触发的 click（自动化 / 无障碍点击）。 */
  ['pointerdown', 'touchstart', 'mousedown', 'click', 'keydown'].forEach(evt => {
    document.addEventListener(evt, unlockSpeech, { capture: true, passive: true, once: true });
  });

  function nextText(pool, n) { return n === 0 ? pool[0] : pool[Math.floor(Math.random() * pool.length)]; }
  function nextPraise() { return nextText(PRAISE, praiseN++); }
  function nextCheer() { return nextText(CHEER, cheerN++); }

  /* 全站唯一的语音出口：同一个女声、相近音调语速、800ms 节流。
     只要 speechSynthesis 可用就一定发声：即使语音列表还没就绪，
     也用 zh-CN + 高 pitch 交给系统挑默认中文语音，不再像旧版那样直接静音。 */
  function sayLine(text, kind) {
    if (!voiceOn() || !text) return false;
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return false;
    const now = Date.now();
    if (now - lastVoice < 800) return false;
    unlockSpeech();                                  // 兜底：确保 iOS 手势解锁已发生
    let v = girlVoice();
    if (!v) { primeVoices(); v = girlVoice(); }      // 语音列表刚就绪时再取一次
    try {
      const sy = window.speechSynthesis;
      const u = new window.SpeechSynthesisUtterance(text);
      if (v) { u.voice = v; u.lang = v.lang || 'zh-CN'; }
      else u.lang = 'zh-CN';                         // 列表为空也要念，别静音
      u.pitch = kind === 'cheer' ? 1.6 : 1.58;       // 奶声奶气，全站一致
      u.rate = kind === 'cheer' ? 1.08 : 1.16;
      u.volume = 1;
      /* iOS 上 cancel() 紧跟 speak() 会把刚提交的句子一起吞掉：
         只有确实有旧句子时才 cancel 并延后一拍；否则同步 speak。
         同时 resume() 唤醒被系统挂起的引擎（iPad 锁屏/切后台后常见）。 */
      const needCancel = !!(sy.speaking || sy.pending);
      if (needCancel) sy.cancel();
      const fire = () => {
        try {
          if (sy.paused) sy.resume();
          sy.speak(u);
          if (sy.paused) sy.resume();
        } catch (e) { /* 忽略 */ }
      };
      if (needCancel) setTimeout(fire, 0); else fire();
      lastVoice = now;
      return true;
    } catch (e) { return false; }
  }

  /* 部分浏览器首次 getVoices() 为空，等语音列表就绪后缓存下来；
     同时启动主动轮询，覆盖 iPadOS 上 voiceschanged 不触发的情况。 */
  if ('speechSynthesis' in window) {
    primeVoices();
    try {
      const cache = () => {
        allVoices();
        if (cachedVoices.length) voicesTried = VOICE_RETRY.length;
      };
      if (window.speechSynthesis.addEventListener) {
        window.speechSynthesis.addEventListener('voiceschanged', cache);
      } else {
        window.speechSynthesis.onvoiceschanged = cache;
      }
    } catch (e) { /* 忽略 */ }
  }

  /* ---------- 对外的统一音效族 ---------- */
  const SFX = {
    enabled() {
      const s = window.Store && Store.s && Store.s.settings;
      return !s || s.sound !== false;
    },

    /* 轻触：极短的一颗音，不抢戏 */
    tap() { if (this.enabled()) note(880, 0, 0.075, { gain: 0.055 }); },

    /* 弹窗：轻巧两音，替代以前每个弹窗都放的「上行号角」 */
    pop() { if (this.enabled()) arp([659.25, 880], 0, 0.055, 0.13, 0.075, 1.01); },

    /* 答对：明亮上行三音 + 大三和弦铺底 + 高音铃，情绪饱满（多邻国式） */
    correct(text) {
      if (!this.enabled()) return;
      arp(S.ok, 0, 0.068, 0.19, 0.115, 1.02);
      chord(S.okLow, 0.14, 0.36, 0.042);
      note(2093, 0.20, 0.34, { gain: 0.075 });
      sayLine(text || nextPraise(), 'praise');
    },

    /* 答错：柔和下行 + 低八度垫音，不刺耳；同一女童声打气 */
    answerWrong(text) {
      if (!this.enabled()) return;
      arp(S.no, 0, 0.09, 0.26, 0.085);
      note(196, 0, 0.3, { gain: 0.045 });
      sayLine(text || nextCheer(), 'cheer');
    },

    /* 通用失败提示（未解锁 / 金币不足等非答题场景）：同上音色，只响不念 */
    wrong() {
      if (!this.enabled()) return;
      arp(S.no, 0, 0.075, 0.17, 0.075);
      note(196, 0, 0.2, { gain: 0.035 });
    },

    /* 语音开关关闭时的纯音效（设置页试听用） */
    correctBeep() {
      if (!this.enabled()) return;
      arp(S.ok, 0, 0.068, 0.19, 0.115, 1.02);
      chord(S.okLow, 0.14, 0.36, 0.042);
      note(2093, 0.2, 0.34, { gain: 0.075 });
    },

    /* 设置在开关时试听一句「真棒」（不消耗答题语库计数） */
    previewVoice() {
      if (!this.enabled()) return;
      lastVoice = 0;
      if (!sayLine('真棒', 'praise')) this.correctBeep();
    },

    /* 取一句与语音一致的文案，供答题反馈标题 / 宠物气泡显示 */
    praiseText: nextPraise,
    cheerText: nextCheer,
    sayLine: sayLine,

    /* 金币 / 星星 / 小成就：同一音阶族，长短不同但音色完全一致 */
    coin() { if (this.enabled()) arp(S.coin, 0, 0.055, 0.13, 0.085, 1.01); },
    star(i) { if (this.enabled()) note(S.clear[i] || 1046.5, 0, 0.24, { gain: 0.1, bend: 1.01 }); },
    happy() {
      if (!this.enabled()) return;
      arp(S.happy, 0, 0.06, 0.17, 0.09, 1.02);
      note(1568, 0.19, 0.24, { gain: 0.055 });
    },

    /* 宠物互动：统一音效 + 与气泡文字一致的同一女童声，
       不再误用答题的「真棒」，也不会冒出系统默认女中音 */
    petLine(kind, text) {
      this.happy();
      sayLine(text, 'pet');
    },

    levelUp() {
      if (!this.enabled()) return;
      arp(S.clear, 0, 0.08, 0.22, 0.1, 1.01);
      chord([1046.5, 1318.5, 1568], 0.34, 0.4, 0.058);
    },

    /* 一课成功通关：上行号角 + 收尾大三和弦 + 高八度闪光，情绪最饱满 */
    levelClear() {
      if (!this.enabled()) return;
      arp(S.clear, 0, 0.085, 0.24, 0.11, 1.015);
      chord(S.final, 0.4, 0.62, 0.082);
      note(2637, 0.42, 0.5, { gain: 0.05 });
    },

    /* 开奖：轻快上扬（未中奖也用，保持活泼不沮丧） */
    cheer() {
      if (!this.enabled()) return;
      arp(S.happy, 0, 0.065, 0.18, 0.09, 1.02);
    },
    win() {
      if (!this.enabled()) return;
      arp([784, 988, 1175, 1568], 0, 0.075, 0.22, 0.105, 1.02);
      chord(S.final, 0.3, 0.5, 0.055);
    }
  };

  window.SFX = SFX;
})();
