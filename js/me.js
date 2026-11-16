/* ===== 我的 / 错题本 / 数据 ===== */
(function () {
  const el = id => document.getElementById(id);
  let mounted = false;

  function shell() {
    if (mounted) return;
    mounted = true;
    el('soundToggle').addEventListener('change', e => {
      Store.s.settings.sound = e.target.checked; Store.save();
      el('voiceToggle').disabled = !e.target.checked;
      if (e.target.checked) SFX.tap();
    });
    el('voiceToggle').addEventListener('change', e => {
      Store.s.settings.voice = e.target.checked; Store.save();
      SFX.previewVoice();
    });
    el('animToggle').addEventListener('change', e => {
      Store.s.settings.anim = e.target.checked; Store.save();
      document.body.classList.toggle('no-anim', !e.target.checked);
    });
    el('exportBtn').addEventListener('click', doExport);
    el('importBtn').addEventListener('click', () => el('importFile').click());
    el('importFile').addEventListener('change', doImport);
    el('wrongRedoAll').addEventListener('click', () => {
      const ids = Store.s.wrong.slice(0, 30);
      if (!ids.length) { UI.toast('错题本是空的，去闯关吧'); return; }
      SFX.tap();
      Quiz.drill(ids);
    });
    el('resetBtn').addEventListener('click', () => {
      UI.confirm({
        char: 'sad',
        title: '真的要清空吗？',
        body: `所有关卡、金币、卡牌和${Characters.name()}的成长都会消失，<br>建议先在上面「导出存档」备份一份。`,
        stayText: '再想想',
        leaveText: '确定清空',
        onLeave: () => {
          Store.reset();
          Characters.apply();
          Characters.refreshText();
          UI.toast('进度已清空');
          render();
          UI.renderCoin();
          Home.render();
        }
      });
    });

    /* ---- 云服务 ---- */
    el('cloudLoginBtn').addEventListener('click', async () => {
      if (!window.Cloud) { UI.toast('云服务未加载'); return; }
      const r = await Cloud.login();
      if (r && r.error) UI.toast('登录失败：' + (r.error.message || '请稍后重试'));
    });
    el('cloudLogoutBtn').addEventListener('click', async () => {
      SFX.tap();
      await Cloud.logout();
      renderCloud();
      UI.toast('已退出登录');
    });
    if (window.Cloud) {
      Cloud.onChange(() => renderCloud());
      renderCloud();
    }
  }

  /* 渲染云存档状态 */
  function renderCloud() {
    const logged = !!(window.Cloud && Cloud.isLoggedIn());
    const name = logged ? Cloud.getName() : null;
    el('cloudTitle').textContent = logged ? '云存档 · 已登录' : '云存档';
    el('cloudSub').textContent = logged
      ? (name ? `已用「${name}」登录，进度自动同步` : '已登录，进度自动同步')
      : '登录后可跨设备同步进度';
    el('cloudLoginBtn').classList.toggle('hidden', logged);
    el('cloudLogoutBtn').classList.toggle('hidden', !logged);
  }

  function render() {
    shell();
    const s = Store.s;
    let r = 0, w = 0;
    Object.values(s.qstats).forEach(v => { r += v.r || 0; w += v.w || 0; });
    const total = r + w;
    el('meCoins').textContent = s.coins;
    el('meQuestions').textContent = total;
    el('meAccuracy').textContent = (total ? Math.round(r / total * 100) : 0) + '%';
    el('meDays').textContent = Store.studyDays();
    el('charName').textContent = Characters.name();
    el('soundToggle').checked = !!s.settings.sound;
    el('voiceToggle').checked = s.settings.voice !== false;
    el('voiceToggle').disabled = !s.settings.sound;
    el('animToggle').checked = !!s.settings.anim;

    const box = el('wrongList');
    const ids = s.wrong.slice(0, 30);
    el('wrongCount').textContent = ids.length ? `(${s.wrong.length})` : '';
    el('wrongRedoAll').classList.toggle('hidden', !ids.length);
    box.innerHTML = '';
    if (!ids.length) {
      box.innerHTML = '<div class="card" style="text-align:center;color:#8f949c;font-size:13px">暂无错题，保持住！</div>';
      return;
    }
    ids.forEach(id => {
      const q = Engine.ALL.find(x => x.id === id);
      if (!q) return;
      const st = s.qstats[id] || { r: 0, w: 0 };
      const bk = (window.Bank && Bank.get(q.bankKey)) || null;
      const stg = bk && bk.stages[q.unit - 1];
      const unitLabel = stg && stg.unitNoun === '关' ? stg.subtitle
        : `第${['一','二','三','四','五','六','七','八','九','十'][q.unit - 1] || q.unit}单元`;
      const div = document.createElement('div');
      div.className = 'wrong-item';
      div.innerHTML = `
        <div class="wi-stem">${q.stem.replace(/\n/g, '<br>')}</div>
        <div class="wi-foot">
          <span class="wi-meta">${unitLabel} · 答错 ${st.w} 次</span>
          <button class="wi-redo" type="button">再做一次</button>
        </div>`;
      div.addEventListener('click', () => UI.modal({
        emoji: '📖',
        title: '错题解析',
        body: `<div style="text-align:left;font-size:13px;line-height:1.7">
            <p style="margin:0 0 8px">${q.stem.replace(/\n/g, '<br>')}</p>
            <p style="margin:0 0 8px;color:#3c8a00"><b>正确答案：${Engine.answerText(q)}</b></p>
            <p style="margin:0;color:#8f949c">${q.ex || '暂无解析'}</p>
          </div>`,
        okText: '明白了',
        wide: true
      }));
      div.querySelector('.wi-redo').addEventListener('click', e => {
        e.stopPropagation();
        SFX.tap();
        Quiz.drill([id]);
      });
      box.appendChild(div);
    });
  }

  function doExport() {
    const blob = new Blob([Store.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date(), p = n => n < 10 ? '0' + n : '' + n;
    a.href = URL.createObjectURL(blob);
    a.download = `萌宠闯关岛存档_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    UI.toast('存档已导出');
  }

  function doImport(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        Store.importJson(reader.result);
        UI.modal({ emoji: '✅', title: '导入成功', body: '存档已恢复，页面将刷新。', okText: '刷新' , onOk: () => location.reload() });
      } catch (err) {
        UI.modal({ emoji: '⚠️', title: '导入失败', body: '文件格式不正确，请选择导出的 JSON 存档。', okText: '关闭' });
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  }

  window.Me = { render };
})();
