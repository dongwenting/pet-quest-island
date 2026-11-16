/* ==========================================================================
   房间氛围主题：昼夜 × 季节自动切换 + 手动预览
   --------------------------------------------------------------------------
   - 自动模式按设备本地时间与月份推导：清晨 / 午后 / 黄昏 / 夜晚 × 春夏秋冬
   - 只写 #petStage 的 data-tod / data-season / data-scene，具体视觉全交给
     css/room-theme.css 的 CSS 变量，JS 不碰任何像素
   - 偏好存独立 localStorage key，不写进 Store 存档，避免污染云同步
   ========================================================================== */
(function () {
  var KEY = 'xuexi.roomtheme.v1';
  var el = function (id) { return document.getElementById(id); };

  var TODS = [
    { id: 'auto',  name: '自动', icon: '🕒' },
    { id: 'dawn',  name: '清晨', icon: '🌅' },
    { id: 'noon',  name: '午后', icon: '☀️' },
    { id: 'dusk',  name: '黄昏', icon: '🌇' },
    { id: 'night', name: '夜晚', icon: '🌙' }
  ];
  var SEASONS = [
    { id: 'auto',   name: '自动', icon: '🗓️' },
    { id: 'spring', name: '春',   icon: '🌸' },
    { id: 'summer', name: '夏',   icon: '🌿' },
    { id: 'autumn', name: '秋',   icon: '🍁' },
    { id: 'winter', name: '冬',   icon: '❄️' }
  ];
  var TOD_LABEL = { dawn: '清晨', noon: '午后', dusk: '黄昏', night: '夜晚' };
  var TOD_ICON = { dawn: '🌅', noon: '☀️', dusk: '🌇', night: '🌙' };
  var SEASON_LABEL = { spring: '春日', summer: '夏日', autumn: '秋日', winter: '冬日' };
  var SEASON_ICON = { spring: '🌸', summer: '🌿', autumn: '🍁', winter: '❄️' };
  var ROOM_MOOD = {
    dawn:  { kitchen: '厨房晨光',   living: '客厅清晨',   bedroom: '卧室微亮' },
    noon:  { kitchen: '厨房正午',   living: '午后暖阳',   bedroom: '白日安静' },
    dusk:  { kitchen: '厨房晚照',   living: '客厅黄昏',   bedroom: '卧室暮色' },
    night: { kitchen: '厨房夜灯',   living: '客厅夜色',   bedroom: '卧室星夜' }
  };

  /* ---------- 偏好 ---------- */
  function readPref() {
    var o = {};
    try { o = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { }
    return { tod: o.tod || 'auto', season: o.season || 'auto' };
  }
  function savePref() {
    try { localStorage.setItem(KEY, JSON.stringify(pref)); } catch (e) { }
  }
  var pref = readPref();

  /* 5–10 清晨、10–16 午后、16–19 黄昏、其余夜晚 */
  function autoTod(h) {
    if (h >= 5 && h < 10) return 'dawn';
    if (h >= 10 && h < 16) return 'noon';
    if (h >= 16 && h < 19) return 'dusk';
    return 'night';
  }
  /* 3–5 春、6–8 夏、9–11 秋、12–2 冬 */
  function autoSeason(m) {
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }
  function current() {
    var d = new Date();
    return {
      tod: pref.tod === 'auto' ? autoTod(d.getHours()) : pref.tod,
      season: pref.season === 'auto' ? autoSeason(d.getMonth() + 1) : pref.season,
      auto: pref.tod === 'auto' && pref.season === 'auto'
    };
  }
  function sceneId() {
    try { return (window.Store && Store.currentScene && Store.currentScene()) || 'living'; }
    catch (e) { return 'living'; }
  }

  /* ---------- 星点 / 浮尘：只生成一次 ---------- */
  var particlesBuilt = false;
  function buildParticles() {
    if (particlesBuilt) return;
    var stars = el('paStars'), motes = el('paMotes');
    if (!stars || !motes) return;
    particlesBuilt = true;
    var html = '', i, s;
    for (i = 0; i < 16; i++) {
      /* 前 12 颗集中在窗外，后 4 颗撒在屋里，制造夜的通透感 */
      var inWindow = i < 12;
      var x = inWindow ? (64 + Math.random() * 32) : (8 + Math.random() * 52);
      var y = inWindow ? (4 + Math.random() * 42) : (5 + Math.random() * 30);
      var sz = (1.8 + Math.random() * 2.4).toFixed(1);
      html += '<i style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%;' +
        '--sz:' + sz + 'px;--dur:' + (2.2 + Math.random() * 2.8).toFixed(1) + 's;' +
        '--delay:-' + (Math.random() * 4).toFixed(1) + 's"></i>';
    }
    stars.innerHTML = html;
    html = '';
    for (i = 0; i < 14; i++) {
      var ms = (3 + Math.random() * 5).toFixed(1);
      var drift = ((Math.random() - .5) * 110).toFixed(0);
      html += '<i style="left:' + (4 + Math.random() * 92).toFixed(1) + '%;' +
        '--sz:' + ms + 'px;--dur:' + (10 + Math.random() * 11).toFixed(1) + 's;' +
        '--delay:-' + (Math.random() * 20).toFixed(1) + 's;--drift:' + drift + 'px"></i>';
    }
    motes.innerHTML = html;
  }

  /* ---------- 控件 ---------- */
  function chipsHtml(list, cur, key) {
    return list.map(function (o) {
      return '<button class="tp-chip' + (cur === o.id ? ' on' : '') + '"' +
        ' data-k="' + key + '" data-v="' + o.id + '" type="button">' +
        o.icon + ' ' + o.name + '</button>';
    }).join('');
  }
  function renderChips() {
    var t = el('todChips'), s = el('seasonChips');
    if (t) t.innerHTML = chipsHtml(TODS, pref.tod, 'tod');
    if (s) s.innerHTML = chipsHtml(SEASONS, pref.season, 'season');
  }

  function bindUI() {
    var toggle = el('themeToggle'), panel = el('themePanel');
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        panel.hidden = !panel.hidden;
        toggle.textContent = panel.hidden ? '切换氛围 ›' : '收起 ‹';
        toggle.setAttribute('aria-expanded', String(!panel.hidden));
        if (window.SFX && SFX.tap) SFX.tap();
      });
      /* 点击面板与按钮以外的地方收起 */
      document.addEventListener('click', function (e) {
        if (panel.hidden) return;
        if (panel.contains(e.target) || toggle.contains(e.target)) return;
        panel.hidden = true;
        toggle.textContent = '切换氛围 ›';
        toggle.setAttribute('aria-expanded', 'false');
      });
    }
    ['todChips', 'seasonChips'].forEach(function (id) {
      var box = el(id);
      if (!box) return;
      box.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('.tp-chip') : null;
        if (!b) return;
        var k = b.dataset.k, v = b.dataset.v;
        if (!k || !v || pref[k] === v) return;
        pref[k] = v;
        savePref();
        apply();
        if (window.SFX && SFX.tap) SFX.tap();
        var label = k === 'tod'
          ? (v === 'auto' ? '时段改为跟随时间' : '已切换到' + TOD_LABEL[v])
          : (v === 'auto' ? '季节改为跟随月份' : '已切换到' + SEASON_LABEL[v]);
        if (window.UI && UI.toast) UI.toast(label);
      });
    });
  }

  /* ---------- 应用主题 ---------- */
  var lastKey = '';
  function apply(scene) {
    var stage = el('petStage');
    if (!stage) return;
    buildParticles();
    var c = current();
    var sid = scene || sceneId();
    stage.dataset.tod = c.tod;
    stage.dataset.season = c.season;
    stage.dataset.scene = sid;
    stage.classList.toggle('pa-paused', !!document.hidden);

    var key = c.tod + '|' + c.season + '|' + sid + '|' + pref.tod + '|' + pref.season;
    if (key === lastKey) return;
    lastKey = key;
    renderChips();
    var now = el('themeNow');
    if (now) {
      var mood = (ROOM_MOOD[c.tod] || {})[sid] || '';
      now.textContent = TOD_ICON[c.tod] + ' ' + SEASON_ICON[c.season] + ' ' +
        SEASON_LABEL[c.season] + ' · ' + TOD_LABEL[c.tod] + ' · ' + mood +
        (c.auto ? ' · 跟随时间' : ' · 手动');
    }
  }

  /* ---------- 时间推进 ---------- */
  function watch() {
    /* 每分钟核对一次；跨过时段边界或换季时自动换氛围 */
    setInterval(function () { if (!document.hidden) apply(); }, 60000);
    document.addEventListener('visibilitychange', function () {
      apply();
    });
    window.addEventListener('focus', function () { apply(); });
  }

  function init() {
    bindUI();
    apply();
    watch();
  }

  window.RoomTheme = {
    apply: apply,
    current: current,
    set: function (tod, season) {
      if (tod) pref.tod = tod;
      if (season) pref.season = season;
      savePref(); apply();
    },
    reset: function () { pref = { tod: 'auto', season: 'auto' }; savePref(); apply(); },
    init: init
  };

  init();
})();
