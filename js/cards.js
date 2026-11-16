/* ===== 群芳谱 · 抽卡引擎 / 翻卡浮层 / 召唤仪式 =====
 * 规则（用户确认）：
 *  - 卡池固定 108 张，与学科、年级、册无关；不分组，按编号 001-108 平铺。
 *  - 只从「本辑未发放」的卡里抽，已发过的不再发 → 天然无重复，无需保底/兑换。
 *  - 机会来源：单元宝箱、打卡周期宝箱、期末大关、每日任务全清、金币商店花种宝箱。
 *  - 集齐 108 张 → 召唤花仙子（一次性奖励 + 解锁限定伙伴）→ 开启第二辑继续循环。
 */
(function () {
  const el = id => document.getElementById(id);
  const F = window.FLOWERS || [];
  const TOTAL = 108;
  const WEIGHT = { '普通': 5, '珍稀': 2, '传说': 1 };
  const SHOP_PRICE = 80;
  const SHOP_LIMIT = 3;
  const SUMMON_COINS = 500;
  let timers = [];
  let afterClose = null;

  function st() {
    if (!Store.s.flowers) {
      Store.s.flowers = { volume: 1, owned: [], summoned: 0, summonedVol: 0, log: [], pending: [], shopDate: '', shopCount: 0, taskDate: '', finalDate: '' };
    }
    /* 兼容旧档：pending 存「已入库但还没给用户看过」的卡，刷新后补播翻卡动画，
       避免出现「卡悄悄多出来」的观感 */
    if (!Array.isArray(Store.s.flowers.pending)) Store.s.flowers.pending = [];
    if (!Array.isArray(Store.s.flowers.log)) Store.s.flowers.log = [];
    if (!Array.isArray(Store.s.flowers.owned)) Store.s.flowers.owned = [];
    return Store.s.flowers;
  }
  function rollDay() {
    const s = st(), t = Store.today();
    if (s.shopDate !== t) { s.shopDate = t; s.shopCount = 0; }
  }
  function byN(n) { return F.find(f => f.n === n) || null; }
  function volume() { return st().volume; }
  function owned() { return st().owned.slice(); }
  function count() { return st().owned.length; }
  function remaining() { return Math.max(0, TOTAL - count()); }
  function complete() { return count() >= TOTAL; }
  function lastOf(n) {
    return (st().log || []).find(x => x.n === n && x.vol === st().volume) || null;
  }
  /* 本辑「已入库但还没展示过」的花卡：启动时补播翻卡动画，消除凭空多卡 */
  function pendingCards() {
    const s = st();
    return (s.pending || []).filter(p => p.vol === s.volume).map(p => byN(p.n)).filter(Boolean);
  }
  /* 本辑完整获得记录（按时间倒序），供规则说明 / 溯源 */
  function logOfVolume() {
    const v = st().volume;
    return (st().log || []).filter(x => x.vol === v).slice();
  }
  /* 规则文案：与代码实现的发放入口保持一致 */
  const RULES = [
    { icon: '🎁', name: '单元宝箱', desc: '一个单元 4 课全部通关后开箱', gain: '每次 1 张 · 每个宝箱仅一次' },
    { icon: '🏆', name: '期末大关', desc: '通关期末大关且拿到至少 1 星', gain: '每次 3 张 · 每天限一次' }
  ];

  function pick() {
    const have = new Set(st().owned);
    const pool = F.filter(f => !have.has(f.n));
    if (!pool.length) return null;
    const total = pool.reduce((a, f) => a + (WEIGHT[f.rarity] || 1), 0);
    let r = Math.random() * total, chosen = pool[0];
    for (const f of pool) { r -= (WEIGHT[f.rarity] || 1); if (r <= 0) { chosen = f; break; } }
    return chosen;
  }

  function draw(source) {
    rollDay();
    const s = st();
    const f = pick();
    if (!f) return null;
    if (s.owned.includes(f.n)) return null;      // 双保险：本辑内绝不重复发放
    const rec = { n: f.n, from: source, at: Date.now(), vol: s.volume };
    s.owned.push(f.n);
    s.log.unshift(rec);
    /* 记录待展示：只有真正弹出翻卡浮层后才清掉，中途刷新也能补播 */
    s.pending.push(rec);
    /* 每辑最多 108 条，全部保留：花卡详情要能查到每张卡是从哪个宝箱来的 */
    Store.save();
    return f;
  }
  function drawMany(k, source) {
    const out = [];
    for (let i = 0; i < k; i++) { const f = draw(source); if (f) out.push(f); }
    return out;
  }

  /* ---------- 花卡来源（仅限做题通关） ---------- */
  function chest() { return draw('单元宝箱'); }            // 通关一个单元
  function finalLeft() { rollDay(); return st().finalDate !== Store.today(); }
  function claimFinal() {
    if (!finalLeft() || complete()) return [];
    const cards = drawMany(3, '期末大关');
    st().finalDate = Store.today();
    Store.save();
    return cards;
  }
  function taskLeft() { rollDay(); return st().taskDate !== Store.today(); }
  /* 每日任务全清不再送花卡（花卡仅由做题通关获取），保留 taskLeft 兼容旧档字段 */

  /* ---------- 召唤花仙子 ---------- */
  function canSummon() { return complete(); }
  /* 每辑只结算一次奖励：同一辑重复召唤只播动画，不再加金币 */
  function summon() {
    if (!complete()) return { ok: false };
    const s = st();
    const first = s.summonedVol !== s.volume;
    if (first) {
      s.summonedVol = s.volume;
      s.summoned = (s.summoned || 0) + 1;
      Store.s.fairyUnlocked = true;
      Store.addCoins(SUMMON_COINS, true);
      Store.save();
      UI.renderCoin();
    }
    return { ok: true, first, coins: first ? SUMMON_COINS : 0, volume: s.volume };
  }
  function nextVolume() {
    const s = st();
    s.volume += 1;
    s.owned = [];
    s.log = [];
    s.pending = [];
    s.shopDate = ''; s.shopCount = 0;
    s.taskDate = ''; s.finalDate = '';
    Store.save();
  }

  /* ---------- 翻卡浮层 ---------- */
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function flip(node) {
    if (node.classList.contains('flipped')) return;
    const f = byN(Number(node.dataset.n));
    if (!f) return;
    node.classList.add('flipped');
    if (f.rarity === '传说') node.classList.add('r-legend');
    else if (f.rarity === '珍稀') node.classList.add('r-rare');
    node.querySelector('img').src = FlowerArt.front(f, volume());
    node.querySelector('.cdf-name').textContent = `${FlowerArt.pad(f.n)} · ${f.name}`;
    if (window.SFX) SFX.coin();
  }

  function show(list, source, onDone) {
    if (!list || !list.length) return;
    clearTimers();
    /* 展示即视为已告知，清掉待补播记录，避免刷新后重复弹 */
    st().pending = (st().pending || []).filter(p => !list.some(f => f.n === p.n));
    Store.save();
    afterClose = onDone || null;
    el('cdfKicker').textContent = source || '神秘宝箱';
    el('cdfHead').textContent = list.length > 1 ? `一次抽到 ${list.length} 张花卡！` : '抽到一张花卡！';
    el('cdfHint').textContent = '点卡片可提前翻开 · 发过的卡不会再出现';
    el('cdfCards').className = 'cdf-cards n' + Math.min(list.length, 3);
    el('cdfCards').innerHTML = list.map(f => `
      <button class="cdf-card" data-n="${f.n}" type="button">
        <img src="${FlowerArt.back(volume())}" alt="花卡背面">
        <span class="cdf-name">???</span>
      </button>`).join('');
    el('cdfConfetti').innerHTML = Array.from({ length: 14 }, (_, i) =>
      `<i style="left:${(i * 7.1 + 3) % 100}%;background:${['#ffc800', '#58cc02', '#1cb0f6', '#ff6b9a', '#ce82ff'][i % 5]};animation-delay:${(i % 5) * .12}s"></i>`
    ).join('');
    const fx = el('cardFx');
    fx.classList.remove('on');
    void fx.offsetWidth;
    fx.classList.add('on');
    if (window.SFX) SFX.levelUp();
    el('cdfCards').querySelectorAll('.cdf-card').forEach(b => {
      b.addEventListener('click', () => flip(b));
    });
    list.forEach((_, i) => timers.push(setTimeout(() => {
      const node = el('cdfCards').querySelectorAll('.cdf-card')[i];
      if (node) flip(node);
    }, 520 + i * 280)));
  }

  function closeCards() {
    clearTimers();
    const fx = el('cardFx');
    if (!fx.classList.contains('on')) return;
    fx.classList.remove('on');
    if (window.SFX) SFX.tap();
    const cb = afterClose; afterClose = null;
    if (cb) cb();
  }

  /* ---------- 召唤仪式 ---------- */
  function showSummon(onDone) {
    const r = summon();
    if (!r.ok) { UI.toast('还没集齐 108 张哦'); return; }
    const replay = !r.first;
    if (window.FairyFx) {
      FairyFx.play({
        kicker: `第${r.volume}辑 · 108 张全部集齐`,
        body: replay
          ? `花仙子又转了个圈，裙摆上的花瓣落了一地。`
          : `你把整整一本群芳谱都收齐了，花仙子应约而来。<br>` +
            `获得 <b>${r.coins} 金币</b>，并解锁限定伙伴「花仙子」。`,
        coins: replay ? null : r.coins,
        nextLabel: `开启第${r.volume + 1}辑`,
        onNext: () => {
          nextVolume();
          if (window.Characters) { Characters.refreshText(); Characters.apply(); }
          if (window.Dex && App.current === 'dex') Dex.render();
          UI.renderCoin();
          UI.toast(`第${volume()}辑已开启 · 花仙子伙伴已解锁，去「我的」换上吧`);
          if (onDone) onDone();
        }
      });
    } else {
      nextVolume();
      if (onDone) onDone();
    }
  }

  /* 花卡页的「重温」：不改变任何存档，只重播变身 */
  function showReplay() {
    if (!window.FairyFx) return;
    FairyFx.play({
      kicker: `第${volume()}辑 · 花仙子回忆`,
      body: `花仙子在原地转了个圈，裙摆上的花瓣又开了满屏。`,
      coins: null,
      nextLabel: '关闭',
      onNext: null
    });
  }

  /* ---------- 事件 ---------- */
  el('cdfClose').addEventListener('click', closeCards);
  el('cardFx').addEventListener('click', e => { if (e.target === el('cardFx')) closeCards(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && el('cardFx').classList.contains('on')) closeCards();
  });

  window.Cards = {
    TOTAL, SHOP_PRICE, SHOP_LIMIT, SUMMON_COINS,
    FLOWERS: F, byN, volume, owned, count, remaining, complete, lastOf,
    RULES, pendingCards, logOfVolume,
    draw, drawMany, chest,
    finalLeft, claimFinal, taskLeft,
    canSummon, summon, nextVolume, show, showSummon, showReplay, closeCards
  };
})();
