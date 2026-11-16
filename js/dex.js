/* ===== 群芳谱 · 108 张花卡卡册 =====
 * 不分组，按编号 001-108 平铺；已发过的卡不再发，所以没有重复与兑换。
 * 学科/年级信息不进入卡面，只留在抽卡记录里。
 */
(function () {
  const el = id => document.getElementById(id);
  let mounted = false;
  let filter = 'all';
  let query = '';

  function shell() {
    if (mounted) return;
    mounted = true;
    el('dexFilters').addEventListener('click', e => {
      const b = e.target.closest('.df');
      if (!b) return;
      filter = b.dataset.f;
      el('dexFilters').querySelectorAll('.df').forEach(x => x.classList.toggle('active', x === b));
      render();
    });
    el('dexSearch').addEventListener('input', e => { query = e.target.value.trim(); render(); });
  }

  function visible(f, has) {
    if (filter === 'owned' && !has) return false;
    if (filter === 'missing' && has) return false;
    if (filter === 'rare' && f.rarity === '普通') return false;
    if (query) {
      const q = query.toLowerCase();
      const byText = (f.name + f.saying).toLowerCase().indexOf(q) >= 0;
      /* 编号只在纯数字查询时精确匹配，避免 "81"+"081" 拼出 "108" 这类误命中 */
      const byNo = /^\d+$/.test(q) &&
        (String(f.n) === String(Number(q)) || String(f.n).padStart(3, '0') === q);
      if (!byText && !byNo) return false;
    }
    return true;
  }

  function silhouette() {
    return `<div class="fg-sil">
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <g fill="#c9d1dc">
          <ellipse cx="30" cy="19" rx="9" ry="10"/>
          <ellipse cx="30" cy="19" rx="9" ry="10" transform="rotate(72 30 30)"/>
          <ellipse cx="30" cy="19" rx="9" ry="10" transform="rotate(144 30 30)"/>
          <ellipse cx="30" cy="19" rx="9" ry="10" transform="rotate(216 30 30)"/>
          <ellipse cx="30" cy="19" rx="9" ry="10" transform="rotate(288 30 30)"/>
          <circle cx="30" cy="30" r="6.5" fill="#b6c0cd"/>
        </g>
      </svg>
      <span>?</span>
    </div>`;
  }

  /* 收集规则 + 最近获得记录：每张卡都能查到从哪来，避免「凭空多卡」的困惑 */
  function renderRules() {
    const box = el('dexRules');
    if (!box || !window.Cards) return;
    const rules = (Cards.RULES || []).map(r => `
      <div class="dr-row"><span class="dr-icon">${r.icon}</span>
        <div class="dr-text"><b>${r.name}</b><small>${r.desc}</small></div>
        <em>${r.gain}</em></div>`).join('');
    const logs = (Cards.logOfVolume ? Cards.logOfVolume() : []).slice(0, 6);
    const logHtml = logs.length ? logs.map(x => {
      const f = Cards.byN(x.n);
      const d = new Date(x.at || Date.now());
      const date = `${d.getMonth() + 1}/${d.getDate()}`;
      return `<li><span>${FlowerArt.pad(x.n)} ${f ? f.name : '花卡'}</span><em>${x.from || '通关奖励'} · ${date}</em></li>`;
    }).join('') : '<li class="dr-empty">还没有获得记录，通关一个单元就能开出第一张</li>';
    box.innerHTML = `
      <details class="dr-panel">
        <summary><b>📜 花卡从哪来？</b><span>收集规则与获得记录</span><i>展开</i></summary>
        <div class="dr-body">
          <div class="dr-list">${rules}</div>
          <div class="dr-log"><h4>本辑最近获得</h4><ul>${logHtml}</ul></div>
        </div>
      </details>`;
    const panel = box.querySelector('details');
    const tag = panel.querySelector('summary i');
    panel.addEventListener('toggle', () => { tag.textContent = panel.open ? '收起' : '展开'; });
  }

  function render() {
    shell();
    const vol = Cards.volume();
    const owned = new Set(Cards.owned());
    const n = owned.size;
    el('dexSub').textContent = `集齐 108 张可召唤花仙子，已召唤 ${Store.s.flowers.summoned || 0} 次`;
    el('dexCount').textContent = `${n} / ${Cards.TOTAL}`;
    el('dexBar').style.width = (n / Cards.TOTAL * 100) + '%';
    renderRules();

    const last = (Store.s.flowers.log || [])[0];
    const lastCard = last ? Cards.byN(last.n) : null;
    if (lastCard) {
      el('dexHint').textContent = `最近获得 ${FlowerArt.pad(last.n)} ${lastCard.name}（${last.from}）`;
      el('dexHint').style.display = '';
    } else {
      el('dexHint').style.display = 'none';
    }

    const cards = Cards.FLOWERS.filter(f => visible(f, owned.has(f.n)));
    const box = el('dexGrid');
    if (!cards.length) {
      box.innerHTML = '<div class="fg-empty">没有符合条件的花卡，换个筛选试试</div>';
    } else {
      box.innerHTML = cards.map(f => {
        const has = owned.has(f.n);
        const cls = f.rarity === '传说' ? 'legend' : f.rarity === '珍稀' ? 'rare' : 'common';
        /* 稀有印记已画进卡面（flowerart.js 的金属徽章），格子不再叠加角标 */
        return `<button class="fg-cell ${has ? 'got' : 'miss'} r-${cls}"
          data-n="${f.n}" type="button" title="${FlowerArt.pad(f.n)} · ${f.name}">
          ${has
            ? `<img src="${FlowerArt.tile(f, vol)}" alt="${f.name}" loading="lazy"><i class="fg-shine"></i>`
            : `${silhouette()}<span class="fg-no">${FlowerArt.pad(f.n)}</span>`}
        </button>`;
      }).join('');
      box.querySelectorAll('.fg-cell').forEach(b => {
        b.addEventListener('click', () => openCard(Cards.byN(Number(b.dataset.n)), owned.has(Number(b.dataset.n))));
      });
    }

    const sb = el('summonBox');
    if (Cards.complete()) {
      sb.innerHTML = `<div class="summon-ready">
        <div class="sr-title">108 张全部集齐！</div>
        <p>花仙子正在等你，召唤后可开启第${vol + 1}辑继续收集。</p>
        <button class="btn btn-primary" id="summonBtn" type="button">召唤花仙子</button>
      </div>`;
      el('summonBtn').addEventListener('click', () => Cards.showSummon(() => render()));
    } else {
      sb.innerHTML = `<div class="summon-locked">
        <b>还差 ${Cards.remaining()} 张</b><span>第 ${vol} 辑</span>
      </div>`;
    }

    /* 召唤过就常驻一个重温入口：不消耗任何资源，随时能再看一次变身 */
    const summoned = Store.s.flowers.summoned || 0;
    const rp = el('dexReplay');
    if (summoned > 0) {
      rp.style.display = '';
      rp.innerHTML = `<button class="dex-replay-btn" type="button">✨ 已召唤 ${summoned} 次 · 重温花仙子变身</button>`;
      rp.querySelector('button').onclick = () => Cards.showReplay();
    } else {
      rp.style.display = 'none';
      rp.innerHTML = '';
    }
  }

  function openCard(f, has) {
    if (!f) return;
    const vol = Cards.volume();
    const rec = has ? Cards.lastOf(f.n) : null;
    const when = rec ? new Date(rec.at).toLocaleDateString('zh-CN') : '';
    const cls = f.rarity === '传说' ? 'legend' : f.rarity === '珍稀' ? 'rare' : 'common';
    const crown = has && cls !== 'common'
      ? `<div class="fc-crown ${cls}">${cls === 'legend' ? '👑 传说限定 · 镭射金卡' : '💎 珍稀卡 · 星钻描边'}</div>` : '';
    const html = `<div class="fc-detail ${has ? cls : ''}">
      <img class="fc-big" src="${has ? FlowerArt.front(f, vol) : FlowerArt.back(vol)}" alt="${f.name}">
      <div class="fc-info">
        <div class="fc-no">No.${FlowerArt.pad(f.n)} · ${f.rarity}</div>
        ${crown}
        <h3>${has ? f.name : '还没收集到'}</h3>
        <p class="fc-saying">${has ? '「' + f.saying + '」' : '多做题通关，就有机会遇到它'}</p>
        <p class="fc-from">${has && rec ? `来自 ${rec.from} · ${when}` : '固定卡池 · 发过的卡不会重复出现'}</p>
        <p class="fc-note">群芳谱 · 第${vol}辑 · ${FlowerArt.pad(f.n)} / 108</p>
      </div>
    </div>`;
    UI.dialog({ html: html, wide: true, buttons: [{ label: '关闭' }], sound: false });
  }

  window.Dex = { render };
})();
