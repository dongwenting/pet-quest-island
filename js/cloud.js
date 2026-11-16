/* ===== 云服务接入 =====
 * WorkBuddy 账号登录 + 整档云存档（saves 表，data 列存整档 JSON）。
 * - 未登录：照常用 localStorage，功能不变。
 * - 登录后：Store.save() 时防抖推云；登录/启动时拉云存档合并。
 * SDK 走 CDN 全局 WorkBuddyCloud（纯静态站，无构建步骤）。
 * 依赖公开配置（无任何密钥），由 index.html 内联注入 window.__CLOUD_CFG__。
 */
(function () {
  const POLL_MS = 1500;      // 本地改动后防抖推云间隔
  const UID_KEY = 'xuexi.cloud.anon.uid';

  const el = id => document.getElementById(id);

  let cloud = null;
  let lastCloudEtag = 0;     // 本地最近一次已同步的 updated_at（用于冲突判断）
  let pushTimer = null;
  let pulling = false;
  let session = null;        // 当前登录会话（null = 未登录）

  function cfg() {
    return (window.__CLOUD_CFG__) || {};
  }

  function ready() {
    if (cloud) return true;
    if (!window.WorkBuddyCloud || !window.WorkBuddyCloud.createWorkBuddyCloud) return false;
    const c = cfg();
    if (!c.endpoint || !c.publishableKey) return false;
    cloud = window.WorkBuddyCloud.createWorkBuddyCloud({
      endpoint: c.endpoint,
      oauthRelayBaseUrl: c.oauthRelayBaseUrl || undefined,
      publishableKey: c.publishableKey
    });
    return true;
  }

  /* 事件：登录/登出后通知 UI 刷新 */
  const listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(f => { try { f(session); } catch (e) { } }); }

  /* 未登录也能有一个稳定 id，用于后续「游客 → 登录」合并（当前整档合并，暂留） */
  function anonUid() {
    let u = null;
    try { u = localStorage.getItem(UID_KEY); } catch (e) { }
    if (!u) { u = 'g' + Math.random().toString(36).slice(2, 12); try { localStorage.setItem(UID_KEY, u); } catch (e) { } }
    return u;
  }

  /* 当前是否已登录 */
  function isLoggedIn() { return !!session; }
  function getName() { return (session && session.user && (session.user.name || session.user.email)) || null; }

  /* 恢复会话（不发起任何跳转） */
  async function restore() {
    if (!ready()) return null;
    try {
      const { data, error } = await cloud.auth.getSession();
      if (error) { session = null; return null; }
      session = data && data.user ? data : null;
      emit();
      return session;
    } catch (e) { session = null; return null; }
  }

  /* 处理 OAuth 回调（若 URL 带 code/state/provider） */
  async function handleCallback() {
    if (!ready()) return null;
    try {
      const url = new URL(location.href);
      if (!url.searchParams.has('code') && !url.searchParams.has('error')) return null;
      const provider = url.searchParams.get('provider');
      if (provider !== 'workbuddy') return null;
      if (typeof cloud.auth.handleWorkBuddyCallback !== 'function') return null;
      const { data, error } = await cloud.auth.handleWorkBuddyCallback();
      if (error) { session = null; emit(); return null; }
      session = data && data.user ? data : null;
      /* 清掉回调参数，保留业务参数（sharecode 等） */
      for (const k of ['code', 'state', 'provider']) url.searchParams.delete(k);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
      emit();
      return session;
    } catch (e) { return null; }
  }

  /* 登录：WorkBuddy 账号统一登录（跳 Relay，同标签回跳） */
  async function login() {
    if (!ready()) return { error: { message: '云服务未就绪' } };
    const back = new URL(location.href);
    back.pathname = '/';
    for (const k of ['code', 'state', 'provider']) back.searchParams.delete(k);
    const { data, error } = await cloud.auth.signInWithOAuth({
      provider: 'workbuddy',
      redirectTo: back.toString()
    });
    if (error) return { error };
    location.assign(data.url);
    return {};
  }

  async function logout() {
    if (!ready()) return;
    try { await cloud.auth.signOut(); } catch (e) { }
    session = null;
    emit();
  }

  /* 拉取云端存档（整档 data）。返回 { data, updatedAt } 或 null */
  async function pullSave() {
    if (!ready() || !session) return null;
    try {
      const { data, error } = await cloud.database
        .from('saves')
        .select('data, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return { error };
      if (!data) return null;
      return { data: data.data, updatedAt: data.updated_at, error: null };
    } catch (e) { return { error: e }; }
  }

  /* 推送整档（存在则 upsert，不存在则 insert）。 */
  async function pushSave(payload) {
    if (!ready() || !session) return { error: new Error('not-logged-in') };
    try {
      /* 先找本用户已有记录 */
      const existed = await cloud.database.from('saves').select('id').limit(1).maybeSingle();
      const row = { data: payload };
      if (session.user && session.user.name) row.owner_name = session.user.name;
      if (existed.data && existed.data.id) {
        const { error } = await cloud.database.from('saves').update(row).eq('id', existed.data.id);
        return { error };
      } else {
        const { error } = await cloud.database.from('saves').insert(row);
        return { error };
      }
    } catch (e) { return { error: e }; }
  }

  /** 由 store.js 调用：本次本地 save 后触发（防抖推云） */
  function onLocalSave() {
    if (!session) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      pushTimer = null;
      if (!window.Store) return;
      const r = await pushSave(window.Store.exportJson ? JSON.parse(window.Store.exportJson()) : window.Store.s);
      if (r && r.error) notifyStatus('云同步失败：' + (r.error.message || '网络异常'));
    }, POLL_MS);
  }

  /** 登录成功后：拉云并与本地做字段级合并（不再整档覆盖，避免刷新丢档 / 花卡忽多忽少） */
  async function syncAfterLogin() {
    if (!session) return;
    const saved = await pullSave();
    if (saved && saved.error) { notifyStatus('拉取云存档失败，先用本地进度'); return; }
    if (saved && saved.data && window.Store && window.Store.mergeRemote) {
      try {
        const r = window.Store.mergeRemote(saved.data);
        lastCloudEtag = saved.updatedAt ? new Date(saved.updatedAt).getTime() : 0;
        notifyStatus(r.newCards && r.newCards.length
          ? `已合并云端进度 · 补上 ${r.newCards.length} 张花卡`
          : '已合并云端进度');
        if (window.UI) UI.renderCoin();
        if (window.App) App.go(App.current);
      } catch (e) { notifyStatus('云端存档格式异常，沿用本地'); }
    } else if (window.Store) {
      /* 云端无存档：把本地推上去 */
      const r = await pushSave(JSON.parse(window.Store.exportJson()));
      if (!r.error) notifyStatus('本地进度已同步到云端');
    }
  }

  const notifyStatus = (function () {
    let t = null;
    return function (msg) {
      if (window.UI) UI.toast(msg);
      else if (window.console) console.info('[cloud]', msg);
    };
  })();

  window.Cloud = {
    ready, isLoggedIn, getName, login, logout, restore, handleCallback,
    onLocalSave, syncAfterLogin, onChange
  };
})();