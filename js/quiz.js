/* ===== 答题流程（全站单选题） =====
 * 题库注册时已把填空 / 多选 / 判断统一转成四选一或二选一，
 * 这里只处理单选题。一节课的作答状态写进 localStorage，刷新后可接着答。
 */
(function () {
  const el = id => document.getElementById(id);
  const SKEY = 'xuexi.quiz.v1';
  const SESSION_TTL = 12 * 3600 * 1000;   // 超过 12 小时的半局作废

  const Q = {
    level: null, qs: [], i: 0, checked: false, drill: false,
    picked: null, correct: 0, combo: 0, maxCombo: 0, coins: 0, hintUsed: false
  };
  let mounted = false;
  /* iOS 上「完成」按钮可能被幽灵点击 / 连点触发两次，finish() 会重复结算
     金币与星级。用一次性锁保证一课只结算一次。 */
  let finishing = false;

  /* ---------- 存档 ---------- */
  function saveSession() {
    if (!Q.level || Q.drill) return;   // 错题重做是临时的，不写续答存档
    try {
      localStorage.setItem(SKEY, JSON.stringify({
        levelId: Q.level.id,
        qids: Q.qs.map(q => q.id),
        i: Q.i, correct: Q.correct, combo: Q.combo, maxCombo: Q.maxCombo,
        coins: Q.coins, hintUsed: Q.hintUsed,
        picked: Q.picked, checked: Q.checked,
        at: Date.now()
      }));
    } catch (e) { }
  }
  function readSession() {
    let raw = null;
    try { raw = localStorage.getItem(SKEY); } catch (e) { }
    if (!raw) return null;
    try {
      const o = JSON.parse(raw);
      if (!o || !o.levelId || !o.qids || Date.now() - (o.at || 0) > SESSION_TTL) return null;
      return o;
    } catch (e) { return null; }
  }
  function clearSession() {
    try { localStorage.removeItem(SKEY); } catch (e) { }
  }

  function shell() {
    if (mounted) return;
    mounted = true;
    el('quizClose').addEventListener('click', () => {
      SFX.tap();
      UI.confirm({
        char: 'sad',
        title: Q.drill ? '要退出重做吗？' : '要退出这一课吗？',
        body: Q.drill
          ? `还有 <b>${Math.max(0, Q.qs.length - Q.i)}</b> 道错题没做完，<br>答对的题才会从错题本移出哦。`
          : `本关还剩 <b>${Math.max(0, Q.qs.length - Q.i)}</b> 道题，退出后这一关要重新开始，<br>${Characters.name()}会有点难过哦。`,
        stayText: '再坚持一下',
        leaveText: '退出',
        onLeave: () => { SFX.tap(); clearSession(); App.go(Q.drill ? 'me' : 'home'); }
      });
    });
    el('quizAction').addEventListener('click', onAction);
  }

  const CN = Engine.CN || ['一', '二', '三', '四', '五', '六', '七', '八'];
  const DIFF = { 1: '★☆☆', 2: '★☆☆', 3: '★★☆', 4: '★★★' };
  const TYPE_NAME = { single: '单选' };   // 题库注册时已全部统一为单选题

  function start(levelId) {
    shell();
    const lv = Engine.levelById(levelId);
    if (!lv) return;
    Q.drill = false;
    Q.level = lv;
    Q.qs = Engine.pickQuestions(lv);
    Q.i = 0; Q.checked = false; Q.picked = null;
    Q.correct = 0; Q.combo = 0; Q.maxCombo = 0; Q.coins = 0; Q.hintUsed = false;
    finishing = false;
    App.go('quiz');
    render();
    saveSession();
  }

  /* 错题重做：只做指定的错题，答对后 Store.recordAnswer 会自动把它移出错题本 */
  function drill(ids) {
    shell();
    const seen = new Set();
    const qs = (ids || []).map(id => Engine.BY_ID[id])
      .filter(q => q && !seen.has(q.id) && seen.add(q.id));
    if (!qs.length) { UI.toast('这些题目已经不在题库里了'); return; }
    Q.drill = true;
    Q.level = { id: '__drill__', unit: 0, lessonName: '错题重做', kind: 'drill' };
    Q.qs = qs.slice(0, 30);
    Q.i = 0; Q.checked = false; Q.picked = null;
    Q.correct = 0; Q.combo = 0; Q.maxCombo = 0; Q.coins = 0; Q.hintUsed = false;
    finishing = false;
    App.go('quiz');
    render();
  }

  /* 刷新后回到上次的位置 */
  function resume() {
    const s = readSession();
    if (!s) return false;
    const lv = Engine.levelById(s.levelId);
    if (!lv) { clearSession(); return false; }
    const qs = s.qids.map(id => Engine.BY_ID[id]);
    if (qs.some(q => !q) || !qs.length) { clearSession(); return false; }
    shell();
    Q.level = lv;
    Q.qs = qs;
    Q.i = Math.min(s.i || 0, qs.length - 1);
    Q.correct = s.correct || 0;
    Q.combo = s.combo || 0;
    Q.maxCombo = s.maxCombo || 0;
    Q.coins = s.coins || 0;
    Q.hintUsed = !!s.hintUsed;
    /* 旧存档里多选/填空的 picked 是数组或字符串，转成单选后丢弃，避免误判 */
    const p = s.picked;
    Q.picked = (p == null || (typeof p !== 'number' && qs[Q.i].type === 'single')) ? null : p;
    Q.checked = !!s.checked;
    finishing = false;
    App.go('quiz');
    render(!Q.checked);
    if (Q.checked) paint(Q.qs[Q.i], Q.picked, { replay: true });
    return true;
  }

  function renderMeta(q) {
    if (Q.drill) {
      el('quizMeta').innerHTML = `
        <span class="qm-chip qm-type">${TYPE_NAME[q.type] || '单选'}</span>
        <span class="qm-chip qm-diff ${q.lv >= 4 ? 'hard' : (q.lv >= 3 ? 'mid' : 'easy')}">难度 ${DIFF[q.lv] || DIFF[3]}</span>
        <span class="qm-chip qm-src">错题重做 · 答对即移出错题本</span>`;
      return;
    }
    /* 用题库自带的单元称谓：成语通关显示「第一关」，教材显示「第一单元」 */
    const curUnit = Q.level.unit ? (window.Engine && Engine.unitById && Engine.unitById(Q.level.unit)) : null;
    const src = curUnit ? curUnit.subtitle
      : (Q.level.unit ? `第${CN[Q.level.unit - 1] || Q.level.unit}单元` : '期末复习');
    const lesson = Q.level.lessonName || '综合';
    el('quizMeta').innerHTML = `
      <span class="qm-chip qm-type">${TYPE_NAME[q.type] || '单选'}</span>
      <span class="qm-chip qm-diff ${q.lv >= 4 ? 'hard' : (q.lv >= 3 ? 'mid' : 'easy')}">难度 ${DIFF[q.lv] || DIFF[3]}</span>
      <span class="qm-chip qm-src">${src} · ${lesson}</span>`;
  }

  function renderRamp(answered) {
    el('quizRamp').innerHTML = Q.qs.map((q, i) => {
      const h = 7 + q.lv * 4;
      const cls = 'qr-step' +
        (i < Q.i || (answered && i === Q.i) ? ' done' : '') +
        (i === Q.i && !answered ? ` current d${q.lv}` : '');
      return `<i class="${cls}" style="height:${h}px" title="第${i + 1}题 · 难度${q.lv}"></i>`;
    }).join('') + `<span class="qr-label">共 ${Q.qs.length} 题 · 由易到难 →</span>`;
  }

  function render(fresh) {
    if (fresh !== false) { Q.picked = null; Q.checked = false; }
    const q = Q.qs[Q.i];
    el('quizProgress').style.width = (Q.i / Q.qs.length * 100) + '%';
    el('quizCount').textContent = `${Q.i + 1}/${Q.qs.length}`;
    el('quizStem').textContent = q.stem;
    Characters.mood(el('quizMascotImg'), 'normal');
    renderMeta(q);
    renderRamp(false);
    el('quizCombo').classList.toggle('on', Q.combo >= 2);
    el('quizCombo').querySelector('span').textContent = Q.combo;
    renderOptions(q);

    const fb = el('quizFeedback');
    fb.className = 'feedback';
    const btn = el('quizAction');
    btn.textContent = '检查';
    btn.disabled = true;
    btn.className = 'btn btn-primary';
    renderHintBtn();
  }

  /* ---------- 单选题作答区 ---------- */
  function renderOptions(q) {
    const box = el('quizOptions');
    box.className = 'options t-single';
    box.innerHTML = '';
    const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
    q.options.forEach((text, idx) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.dataset.idx = idx;
      b.innerHTML = `<span class="opt-key">${keys[idx] || idx + 1}</span><span class="opt-text"></span>`;
      b.querySelector('.opt-text').textContent = text;
      b.addEventListener('click', () => pick(idx));
      box.appendChild(b);
    });
  }

  function renderHintBtn() {
    let btn = el('quizHint');
    const has = (Store.s.inv.hint || 0) > 0;
    if (!has || Q.hintUsed) { if (btn) btn.remove(); return; }
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'quizHint';
      btn.className = 'hint-btn';
      btn.addEventListener('click', useHint);
      document.querySelector('.quiz-top').appendChild(btn);
    }
    btn.innerHTML = `<img src="images/item_hint.png" alt=""><span>${Store.s.inv.hint}</span>`;
  }

  function useHint() {
    if (Q.checked) return;
    const q = Q.qs[Q.i];
    if (!Store.useItem('hint')) return;
    Q.hintUsed = true;
    SFX.tap();
    const wrongs = q.options.map((_, i) => i).filter(i => i !== q.answer);
    Engine.shuffle(wrongs).slice(0, 2).forEach(i => {
      const node = document.querySelector(`.opt[data-idx="${i}"]`);
      if (node) { node.classList.add('dim'); node.disabled = true; }
    });
    renderHintBtn();
    UI.toast('提示卡已使用');
  }

  function pick(idx) {
    if (Q.checked) return;
    Q.picked = idx;
    document.querySelectorAll('.opt').forEach(n => n.classList.toggle('picked', +n.dataset.idx === idx));
    el('quizAction').disabled = false;
    SFX.tap();
  }

  /* ---------- 判分 ---------- */
  function evaluate(q, picked) {
    return picked === q.answer;
  }

  /* iPad Safari 一次点按可能派发两次 click（尤其刚切屏后）。
     250ms 内同一按钮的重复触发直接忽略，避免「检查」被连点成「继续」、
     或最后一题被连点导致 finish() 触发两次。 */
  let lastActionAt = 0;
  function onAction() {
    const now = Date.now();
    if (now - lastActionAt < 250) return;
    lastActionAt = now;
    if (!Q.checked) return check();
    return next();
  }

  function collect() {
    return Q.picked;
  }

  function check() {
    const q = Q.qs[Q.i];
    const picked = collect();
    const ok = evaluate(q, picked);
    Q.checked = true;
    Q.picked = picked;
    let shielded = false;

    if (ok) {
      Q.combo++; Q.maxCombo = Math.max(Q.maxCombo, Q.combo);
      Q.correct++;
      Q.coins += Engine.ECON.coinForCorrect(q, Q.combo);
      Store.recordAnswer(q.id, true);
    } else {
      if (Q.combo > 0 && (Store.s.inv.shield || 0) > 0) { Store.useItem('shield'); shielded = true; }
      if (!shielded) Q.combo = 0;
      Store.recordAnswer(q.id, false);
    }
    paint(q, picked, { shielded });
    saveSession();
  }

  /* 把判分结果画到界面上（恢复进度时也复用） */
  function paint(q, picked, opt) {
    const o = opt || {};
    const ok = evaluate(q, picked);
    const shielded = !!o.shielded;

    document.querySelectorAll('.opt').forEach(n => {
      const i = +n.dataset.idx;
      n.classList.remove('picked');
      if (i === q.answer) n.classList.add('correct');
      else if (i === picked) n.classList.add('wrong');
      n.disabled = true;
    });

    Characters.mood(el('quizMascotImg'), ok ? 'happy' : 'sad');
    const fb = el('quizFeedback');
    let spoken = null;      // 记下要说的话，等解析真正显示出来再发声

    if (ok) {
      fb.className = 'feedback ok show';
      /* 画面文案与女童声说出口的完全是同一句 */
      const praise = SFX.praiseText();
      const gain = o.replay ? 0 : Engine.ECON.coinForCorrect(q, Q.combo);
      el('feedbackTitle').textContent = `${praise}！` + (gain ? ` +${gain} 金币` : '');
      el('feedbackText').textContent = q.ex || '';
      spoken = { ok: true, text: praise };
    } else {
      fb.className = 'feedback no show';
      const cheer = SFX.cheerText();
      el('feedbackTitle').textContent = `${cheer}！正确答案是 ${Engine.answerText(q)}`;
      el('feedbackText').textContent = (q.ex || '') + (shielded ? '（连击保护生效，连击保留）' : '');
      spoken = { ok: false, text: cheer };
    }

    el('quizCombo').classList.toggle('on', Q.combo >= 2);
    el('quizCombo').querySelector('span').textContent = Q.combo;
    el('quizProgress').style.width = ((Q.i + 1) / Q.qs.length * 100) + '%';
    renderRamp(true);

    const btn = el('quizAction');
    btn.textContent = Q.i === Q.qs.length - 1 ? '完成' : '继续';
    btn.disabled = false;
    btn.className = 'btn btn-primary';

    /* 声音与「解析面板显示」同步，而不是点「检查」的瞬间就响。
       .feedback 由 display:none 切到 show 并带 0.2s 弹入动画，浏览器要到下一帧才绘制；
       取动画中段 110ms 发声，解析已经看得见，声音与它同时到达。
       token 防止用户飞快点「继续」后声音错落在下一题。 */
    if (!o.replay && spoken) {
      const token = Q.i + ':' + Q.checked;
      setTimeout(() => {
        if (token !== Q.i + ':' + Q.checked) return;
        if (spoken.ok) {
          SFX.correct(spoken.text);
          if (Q.combo >= 3) setTimeout(() => SFX.coin(), 220);
        } else {
          SFX.answerWrong(spoken.text);
        }
      }, 110);
    }
  }

  function next() {
    if (Q.i < Q.qs.length - 1) {
      Q.i++;
      render();
      saveSession();
      return;
    }
    finish();
  }

  function finish() {
    if (finishing) return;
    finishing = true;
    if (Q.drill) return finishDrill();
    const total = Q.qs.length;
    const acc = Q.correct / total;
    const stars = acc >= 1 ? 3 : acc >= 0.75 ? 2 : acc >= 0.5 ? 1 : 0;
    const coins = Q.coins + Engine.ECON.starBonus(stars);

    const unit = Q.level.unit;
    const u = unit ? Engine.unitById(unit) : null;
    const chestKey = u ? u.chestKey : '';
    const completeBefore = unit ? Engine.unitComplete(unit) : false;
    Store.finishLevel(Q.level.id, stars, Math.round(acc * 100));
    /* 以「奖励收据」判断宝箱是否真的开过，不再只看 hasChest——后者可能被
       云端合并或异常提前置真，导致平板端跳过宝箱、金币花卡凭空消失。 */
    const alreadyAwarded = !!(chestKey && Store.chestAwarded && Store.chestAwarded(chestKey));
    const chestUnlocked = !!(stars > 0 && unit && !completeBefore &&
      Engine.unitComplete(unit) && chestKey && !alreadyAwarded);
    /* 持久化「待领宝箱」：刷新页面 / 切到别的页再回来，地图仍会停在宝箱 */
    if (chestUnlocked && Store.setPendingChest) Store.setPendingChest(chestKey);
    if (coins) Store.addCoins(coins);
    const isFinal = Q.level.id === Engine.FINAL_ID;
    const finalCards = (isFinal && stars > 0 && Cards.finalLeft()) ? Cards.claimFinal() : [];
    Store.save();
    clearSession();

    el('resultStars').innerHTML = [0, 1, 2].map(i =>
      `<svg viewBox="0 0 24 24" class="${i < stars ? 'on' : ''}"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/></svg>`
    ).join('');

    const titles = { 3: '完美通关！', 2: '做得不错！', 1: '过关啦！', 0: '差一点点' };
    el('resultTitle').textContent = titles[stars];
    el('resultSub').textContent = stars === 0
      ? '正确率不足 50%，再挑战一次就能过关'
      : (chestUnlocked
        ? `${u.subtitle} 4 课全部通关！先去把宝箱打开吧`
        : (stars === 3 ? '全部答对，学得真扎实' : '继续加油，三星就在前面'));
    el('rsAccuracy').textContent = Math.round(acc * 100) + '%';
    el('rsCoins').textContent = '+' + coins;
    el('rsCombo').textContent = Q.maxCombo;

    const cardBox = el('resultCards');
    cardBox.innerHTML = chestUnlocked
      ? `<div class="unlock-chip chest-chip">🎁 ${u.subtitle} 4 课全通关 · 宝箱已亮起，去地图打开它</div>`
      : '';
    cardBox.classList.toggle('hidden', !cardBox.innerHTML);

    /* 本单元刚通关：主按钮变成「去开宝箱」，回地图后停在宝箱处，开完再进下一单元。
       先 setChestFocus 再 App.go('home')，只渲染一次；旧版先 go 再 focusChest 会
       触发两次 render + 两次滚动竞争，在 iPad 上容易滚到下一单元第一课。 */
    el('resultContinue').textContent = chestUnlocked ? '去开宝箱' : '返回地图';
    let continued = false;
    el('resultContinue').onclick = () => {
      if (continued) return;                 // 防 iOS 幽灵点击重复触发
      continued = true;
      SFX.tap();
      if (chestUnlocked && window.Home && Home.setChestFocus) Home.setChestFocus(u.n);
      App.go('home');
    };
    const retry = el('resultRetry');
    retry.classList.toggle('hidden', stars !== 0);
    retry.onclick = () => { SFX.tap(); start(Q.level.id); };

    App.go('result');
    [0, 1, 2].forEach(i => { if (i < stars) setTimeout(() => SFX.star(i), 220 + i * 180); });
    /* 成功通关：星星逐颗点亮后再来一段上行号角，0 星不算通关不播 */
    if (stars > 0) setTimeout(() => SFX.levelClear(), 220 + stars * 180 + 120);
    if (chestUnlocked) setTimeout(() => SFX.levelUp(), 1200);
    /* 期末大关花卡：结算后必定弹一次翻卡，不再依赖「返回地图」按钮。
       以前用户中途离开，卡已入库却没看过动画，刷新后就变成「凭空多几张」。 */
    if (finalCards.length) setTimeout(() => Cards.show(finalCards, '期末大关'), 1350);
  }

  /* 错题重做结算：不记星级、不开宝箱，只结算答题金币，答对的题已移出错题本 */
  function finishDrill() {
    const total = Q.qs.length;
    const acc = total ? Q.correct / total : 0;
    const stars = acc >= 1 ? 3 : acc >= 0.75 ? 2 : acc >= 0.5 ? 1 : 0;
    const coins = Q.coins;
    if (coins) Store.addCoins(coins, true);
    Store.save();
    clearSession();
    UI.renderCoin();

    el('resultStars').innerHTML = [0, 1, 2].map(i =>
      `<svg viewBox="0 0 24 24" class="${i < stars ? 'on' : ''}"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/></svg>`
    ).join('');
    el('resultTitle').textContent = acc === 1 ? '错题全部掌握！' : '又巩固了一遍';
    el('resultSub').textContent = acc === 1
      ? `答对 ${Q.correct}/${total} 题，这些题已从错题本移出`
      : `答对 ${Q.correct}/${total} 题，答对的题已从错题本移出`;
    el('rsAccuracy').textContent = Math.round(acc * 100) + '%';
    el('rsCoins').textContent = '+' + coins;
    el('rsCombo').textContent = Q.maxCombo;

    const cardBox = el('resultCards');
    cardBox.innerHTML = '';
    cardBox.classList.add('hidden');

    el('resultContinue').textContent = '返回错题本';
    el('resultContinue').onclick = () => { SFX.tap(); Q.drill = false; App.go('me'); };
    const retry = el('resultRetry');
    retry.classList.add('hidden');
    retry.onclick = null;

    App.go('result');
    [0, 1, 2].forEach(i => { if (i < stars) setTimeout(() => SFX.star(i), 220 + i * 180); });
  }

  window.Quiz = {
    start, drill, resume, clear: clearSession,
    hasSession: () => !!readSession(),
    state: Q
  };
})();
