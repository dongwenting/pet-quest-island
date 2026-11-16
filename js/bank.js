/* ===== 题库注册器 =====
 * 每个题库文件调用 Bank.add({...}) 注册自己，这里负责：
 *   1) 补齐 id、把填空/多选/判断统一转换成单选题；
 *   2) 生成关卡 id（题库key/阶段/课）与扁平题目表；
 *   3) 给「学科 → 教材」抽屉生成可选项（没有题库的年级显示为待补充）。
 * 数据文件只写最少字段，其余都在这里推导，加学科不用改任何 js。
 */
(function () {
  const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    '十一', '十二', '十三', '十四', '十五', '十六'];
  const SUBJ = window.SUBJECTS || { list: [], gradeNames: [] };
  const banks = [];

  function guessType(q) {
    if (typeof q.answer === 'boolean') return 'judge';
    if (Array.isArray(q.answer)) return typeof q.answer[0] === 'number' ? 'multiple' : 'fill';
    if (!q.options || !q.options.length) return 'fill';
    return 'single';
  }
  function splitAlts(s) {
    return String(s).split(/[|｜]/).map(x => x.trim()).filter(Boolean);
  }

  /* ---------- 全站统一为单选题 ----------
   * 旧题库里的填空 / 多选 / 判断在注册时转成单选，题号、关卡、难度、知识点都不变：
   *   fill     → 原句保留「（　）」，用同题库其它填空答案组成 4 个选项；
   *   multiple → 说法类只有一个错误项时改问「不正确的一项」；归类题及多正确项
   *              只留 1 个正确项，用同题库错误说法补成四选一，保证唯一答案；
   *   judge    → A 正确 / B 错误，结构本来就是单选，只改 type。
   * 顺序由题目 id 派生的固定种子打乱，答案分布均匀且刷新后不变（存档兼容）。 */
  const fillPool = [], wrongPool = [];
  const fillSeen = new Set(), wrongMap = new Map();

  function collectPools(def, bankKey) {
    (def.stages || []).forEach(sd => (sd.lessons || []).forEach(ld =>
      (ld.qs || []).forEach(raw => {
        const t = raw.type || guessType(raw);
        if (t === 'fill') {
          const arr = Array.isArray(raw.answer) ? raw.answer : [raw.answer];
          arr.forEach(v => splitAlts(v == null ? '' : v).forEach(a => {
            if (a && !fillSeen.has(a)) { fillSeen.add(a); fillPool.push(a); }
          }));
        } else if (t === 'multiple') {
          const ans = (raw.answer || []).map(Number);
          const cm = /^下列成语中，属于(.+?)的有/.exec(raw.stem || '');
          (raw.options || []).forEach((o, i) => {
            if (ans.includes(i) || !o) return;
            let rec = wrongMap.get(o);
            if (!rec) {
              rec = { t: o, bank: bankKey, not: new Set() };
              wrongMap.set(o, rec); wrongPool.push(rec);
            }
            /* 该词在这道归类题里被判为「不属于」这个色彩，可安全当同类题的干扰项 */
            if (cm) rec.not.add(cm[1]);
          });
        }
      })));
  }

  function hashStr(s) {
    let h = 2166136261;
    const str = String(s);
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function shuffle(arr, seed) {
    const a = arr.slice();
    let x = (seed || 1) >>> 0;
    const rnd = () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; };
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function distractors(correct, n, salt) {
    const out = [], seen = new Set([correct]);
    const cand = fillPool.filter(x => x && x !== correct);
    cand.sort((a, b) =>
      Math.abs(a.length - correct.length) - Math.abs(b.length - correct.length)
      || (hashStr(a + salt) % 97) - (hashStr(b + salt) % 97));
    for (const x of cand) {
      if (!seen.has(x)) { seen.add(x); out.push(x); }
      if (out.length >= n) break;
    }
    let k = 1;
    while (out.length < n) out.push('以上都不符合' + (k++));
    return out;
  }
  /* 旧解析常写「D 项错误」。多选题转成单选后选项会被打乱，字母就对不上了，
     这里把字母还原成它原本指向的选项内容，解析与新的单选答案始终自洽。 */
  function exLettersToText(ex, rawOpts) {
    if (!ex) return ex;
    return String(ex).replace(/([A-DＡ-Ｄ])\s*项/g, (all, ch) => {
      const i = 'ABCD'.indexOf(ch) >= 0 ? 'ABCD'.indexOf(ch) : 'ＡＢＣＤ'.indexOf(ch);
      const t = rawOpts && rawOpts[i];
      return t ? `「${t}」` : all;
    });
  }

  function singleStem(stem, positive) {
    let s = String(stem || '').trim();
    const idiom = /^下列成语中，属于(.+?)的有[（(][　_ ]*[）)]\s*$/.exec(s);
    if (idiom) return `下列成语中，属于${idiom[1]}的是（　）`;
    s = s.replace(/的哪些(特点|说法|条件|变化|应用|原因|收获|启示)/g, '的$1')
         .replace(/有哪些(特点|说法|条件|变化|应用|原因|收获|启示)[？?]?/g, '的$1');
    const tail = positive ? '下列说法中正确的一项是（　）' : '下列说法中不正确的一项是（　）';
    const rules = [
      [/选出所有正确的(描述|说法|选项|一项)[。.]?\s*$/, tail],
      [/说法正确的有[（(][　_ ]*[）)]\s*[。.]?\s*$/, '：' + tail],
      [/正确的有[（(][　_ ]*[）)]\s*[。.]?\s*$/, '：' + tail],
      [/属于(.+?)的有[（(][　_ ]*[）)]\s*$/, '属于$1的是（　）'],
      [/有[（(][　_ ]*[）)]\s*[。.]?\s*$/, '：' + tail],
      [/[（(][　_ ]*[）)]\s*[。.]?\s*$/, '：' + tail]
    ];
    for (const [re, rep] of rules) {
      if (re.test(s)) return s.replace(re, rep).replace(/[，,]\s*：/g, '：').replace(/：{2,}/g, '：');
    }
    return s.replace(/[。.]\s*$/, '') + '：' + tail;
  }

  function fillToSingle(q) {
    const correct = (q.blanks && q.blanks[0] && q.blanks[0][0]) || '';
    const opts = shuffle([correct, ...distractors(correct, 3, q.kp + q.id)], hashStr(q.id));
    q.type = 'single';
    q.options = opts;
    q.answer = Math.max(0, opts.indexOf(correct));
    q.blanks = null;
  }

  function multiToSingle(q, bankKey) {
    const opts = (q.options || []).slice();
    const ans = (q.answer || []).filter(i => i >= 0 && i < opts.length);
    const wrong = opts.map((_, i) => i).filter(i => !ans.includes(i));
    const cm = /^下列成语中，属于(.+?)的有/.exec(q.stem || '');
    const color = cm ? cm[1] : '';
    let correctText, newOpts, ex;
    if (wrong.length === 1 && !color) {
      /* 说法类多选：只有一个错误项，改问「不正确的一项」，选项和解析都不动 */
      newOpts = opts;
      correctText = opts[wrong[0]];
      ex = q.ex;
      q.stem = singleStem(q.stem, false);
    } else {
      /* 归类题 / 多个正确项：只留一个正确项，用同题库的错误说法补成四选一 */
      correctText = opts[ans[0]] || opts[0];
      newOpts = [correctText].concat(wrong.map(i => opts[i]));
      for (const rec of wrongPool) {
        if (newOpts.length >= 4) break;
        if (rec.bank !== bankKey) continue;
        if (color && (!rec.not.has(color) || rec.t.length > 6)) continue;
        if (rec.t === correctText || newOpts.indexOf(rec.t) >= 0) continue;
        newOpts.push(rec.t);
      }
      q.stem = singleStem(q.stem, true);
      ex = wrong.length >= 2
        ? `「${correctText}」符合题意；其余选项均不符合。`
        : q.ex;                       // 3 正确 1 错误：原解析正好解释保留的正确项
    }
    const mixed = shuffle(newOpts, hashStr(q.id));
    q.type = 'single';
    q.options = mixed;
    q.answer = Math.max(0, mixed.indexOf(correctText));
    q.ex = ex;
  }

  function normQuestion(raw, ctx, idx) {
    const type = raw.type || guessType(raw);
    const q = {
      id: raw.id || `${ctx.levelId}/${idx + 1}`,
      type,
      stem: raw.stem || '',
      kp: raw.kp || '',
      lv: Math.min(4, Math.max(1, Number(raw.lv || raw.difficulty) || 1)),
      ex: raw.ex || raw.explain || '',
      options: [],
      answer: 0,
      blanks: null,
      bankKey: ctx.bankKey, unit: ctx.unit,
      stageId: ctx.stageId, lessonId: ctx.lessonId, levelId: ctx.levelId
    };
    if (type === 'judge') {
      q.options = ['正确', '错误'];
      const a = raw.answer;
      q.answer = (a === true || a === 1 || a === 'true' || a === '正确' || a === '对') ? 0 : 1;
      q.type = 'single';                 // 判断题 = A 正确 / B 错误
    } else if (type === 'multiple') {
      q.options = raw.options || [];
      q.answer = (raw.answer || []).map(Number).filter(n => n >= 0).sort((x, y) => x - y);
      multiToSingle(q, ctx.bankKey);
    } else if (type === 'fill') {
      const arr = Array.isArray(raw.answer) ? raw.answer : [raw.answer];
      q.blanks = arr.map(v => splitAlts(v == null ? '' : v));
      if (!q.blanks.length) q.blanks = [['']];
      fillToSingle(q);
    } else {
      q.options = raw.options || [];
      q.answer = Number(raw.answer) || 0;
    }
    if (type !== 'single') q.ex = exLettersToText(q.ex, raw.options || []);
    return q;
  }

  function add(def) {
    const subject = def.subject || '未命名';
    const grade = Number(def.grade) || 0;
    const gradeLabel = grade ? (SUBJ.gradeNames[grade - 1] || grade + '年级') : '';
    const key = def.key || [def.subjectKey || subject, grade || 'x', def.volume || 'a']
      .join('-').toLowerCase().replace(/\s+/g, '');
    const bank = {
      key, subject,
      subjectKey: def.subjectKey || subject,
      grade, gradeLabel,
      volume: def.volume || '',
      book: def.book || [subject, gradeLabel, def.volume].filter(Boolean).join('·'),
      final: Object.assign({ title: '期末终极大关', count: 10 }, def.final || {}),
      stages: [], all: [], levels: []
    };

    collectPools(def, key);
    (def.stages || []).forEach((sd, si) => {
      const stageId = sd.id || 's' + (si + 1);
      const unitNoun = def.unitNoun || '单元';
      const stage = {
        n: si + 1, id: stageId,
        title: sd.title || `第${CN[si] || si + 1}阶段`,
        subtitle: sd.subtitle || `第${CN[si] || si + 1}${unitNoun}`,
        unitNoun,
        lessons: [], levelIds: [],
        chestKey: `${key}/${stageId}`
      };
      (sd.lessons || []).forEach((ld, li) => {
        const lessonId = ld.id || 'l' + (li + 1);
        const levelId = `${key}/${stageId}/${lessonId}`;
        const ctx = { bankKey: key, unit: si + 1, stageId, lessonId, levelId };
        const qs = (ld.qs || []).map((q, qi) => normQuestion(q, ctx, qi));
        const level = {
          id: levelId, bankKey: key,
          unit: si + 1, stageId, stageTitle: stage.title,
          lessonId, idx: li + 1,
          title: ld.title || `第${CN[li] || li + 1}课`,
          kind: 'lesson', qids: qs.map(q => q.id)
        };
        stage.lessons.push(level);
        stage.levelIds.push(levelId);
        bank.levels.push(level);
        bank.all.push.apply(bank.all, qs);
      });
      bank.stages.push(stage);
    });

    bank.questionCount = bank.all.length;
    banks.push(bank);
    return bank;
  }

  function get(key) {
    return banks.find(b => b.key === key) || null;
  }

  /* 抽屉：把注册表里登记过的学科都列出来，有题库的教材可选，其余置灰 */
  function booksOf(subjectKey) {
    const sub = (SUBJ.list || []).find(s => s.key === subjectKey);
    if (!sub) return [];
    const out = [];
    const mine = banks.filter(b => b.subjectKey === subjectKey);
    if (!sub.grades.length) {
      mine.forEach(b => out.push({
        key: b.key, bank: b, grade: 0, gradeLabel: '',
        volume: b.volume, label: b.volume || b.book,
        count: b.questionCount, available: true
      }));
      return out;
    }
    sub.grades.forEach(g => {
      (sub.volumes && sub.volumes.length ? sub.volumes : ['']).forEach(v => {
        const hit = mine.find(b => b.grade === g && (!v || b.volume === v));
        out.push({
          key: hit ? hit.key : `${subjectKey}-g${g}-${v}`,
          bank: hit || null, grade: g,
          gradeLabel: SUBJ.gradeNames[g - 1] || g + '年级',
          volume: v, label: `${SUBJ.gradeNames[g - 1] || g + '年级'}${v}`,
          count: hit ? hit.questionCount : 0,
          available: !!hit
        });
      });
    });
    /* 无年级的附加题库（如语文下的「成语通关」）列在教材行末尾 */
    mine.filter(b => !b.grade).forEach(b => out.push({
      key: b.key, bank: b, grade: 0, gradeLabel: '',
      volume: b.volume, label: b.volume || b.book,
      count: b.questionCount, available: true
    }));
    return out;
  }

  function subjectsView() {
    return (SUBJ.list || []).map(s => {
      const books = booksOf(s.key);
      const live = books.filter(b => b.available);
      return {
        key: s.key, name: s.name, flag: s.flag,
        available: live.length > 0,
        questionCount: live.reduce((a, b) => a + b.count, 0),
        bookCount: live.length
      };
    });
  }

  window.Bank = {
    list: banks, add, get, booksOf, subjectsView,
    CN,
    first() { return banks[0] || null; }
  };
})();
