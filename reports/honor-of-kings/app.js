(() => {
  'use strict';
  const report = window.HOK_REPORT;
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  if (!report?.heroes?.length) {
    $('#result-count').textContent = '本地资料未能载入。请确认 data.js 与网页放在同一文件夹后刷新。';
    $('#load-more').hidden = true;
    return;
  }
  const heroById = new Map(report.heroes.map(h => [h.id, h]));
  const normalize = value => value.toLowerCase().replace(/[\s()（）·\-_]/g, '');
  const searchIndex = new Map(report.heroes.map(h => [h.id, normalize([h.name, h.pinyin, ...h.aliases, h.title, h.theme, ...h.skillNames, ...h.roles, ...h.lanes, ...h.mechanics].join(' '))]));
  const lanes = ['对抗路', '打野', '中路', '发育路', '游走'];
  const params = new URLSearchParams(location.search);
  const state = {
    query: (params.get('q') || '').slice(0, 100),
    lane: lanes.includes(params.get('lane')) ? params.get('lane') : '',
    difficulty: ['基础', '进阶', '挑战'].includes(params.get('difficulty')) ? params.get('difficulty') : '',
    role: ['战士', '法师', '坦克', '刺客', '射手', '辅助'].includes(params.get('role')) ? params.get('role') : '',
    sort: ['guide', 'name', 'difficulty'].includes(params.get('sort')) ? params.get('sort') : 'guide',
    limit: 24, matches: [], hero: null
  };
  const dialog = $('#hero-dialog');
  let opener = null;
  let detailSequence = [];
  let toastTimer;
  const laneGuides = {
    对抗路: { kicker: '边线 · 独立处理问题', title: '扛得住对线，也赶得上支援。', text: '通常先独自处理一条边线。换血、清线、观察打野位置，再判断带线还是参团。坦克侧重开团和承伤，战士更常寻找侧翼与单带机会。', duties: ['守住兵线', '牵制边路', '开团 / 切后排'], example: '亚瑟、夏侯惇适合学习基础；花木兰、关羽需要更多操作与地图判断。', first: '练习重点：清完线再支援，别让无人处理的兵线白白推掉自己的塔。' },
    打野: { kicker: '野区 · 资源与节奏', title: '把刷野路线，变成有效支援。', text: '通过野区取得经济与经验，观察各路状态再抓人，并与队友争夺中立资源。先看附近队友有没有行动空间；没有线权时，争夺容易变成以少打多。', duties: ['规划刷野', '支援抓人', '争夺中立资源'], example: '赵云、典韦可以练基础节奏；李白、露娜、镜更依赖熟练度与进场判断。', first: '练习重点：惩击与打野装备按游戏当前规则选择，抓不到人也要及时回到发育路线。' },
    中路: { kicker: '中线 · 连接两侧战场', title: '先拿到行动空间，再帮助队友。', text: '中路线短、连接两侧野区。清线后通过安全路线支援，或在塔前用消耗与控制争取时间。法刺要找进场窗口，远程法师则要守住输出距离。', duties: ['处理中线', '支援边路', '法伤 / 控制'], example: '小乔可以练消耗与爆发；王昭君适合学控区；不知火舞需要更多进退练习。', first: '练习重点：对方中单消失时发信号，转线先看草丛和敌方打野动向。' },
    发育路: { kicker: '持续输出 · 经济转伤害', title: '活着输出，比多追一步更重要。', text: '通常由射手承担持续伤害和推塔任务。前期重视补兵与生存，中后期跟随团队，在安全范围内攻击可以碰到的敌人；不必每次都越过前排追后排。', duties: ['稳定发育', '持续输出', '兵线推进'], example: '狄仁杰有解控，适合练走射；后羿、鲁班七号操作直观，但更需要队友保护。', first: '练习重点：给自己留一个逃生技能，敌方刺客没有出现时不要独自向前。' },
    游走: { kicker: '团队支持 · 让队友更好发挥', title: '看见机会，也照顾队友的退路。', text: '围绕团队提供视野、控制、回复或保护。前期按实际需求帮助中路、野区或发育路，避免全程机械跟人。开团前确认队友距离，保护时关注谁会成为集火目标。', duties: ['视野与信息', '开团 / 反开', '回复 / 保护'], example: '刘禅适合练控制与推进；蔡文姬练治疗站位；大乔、鲁班大师更依赖团队配合。', first: '练习重点：低经济不等于低影响；开团成功的前提是队友能跟上。' }
  };

  function syncURL() {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries({ q: state.query, lane: state.lane, difficulty: state.difficulty, role: state.role, sort: state.sort === 'guide' ? '' : state.sort, hero: state.hero })) {
      if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
    }
    try { history.replaceState(null, '', url); } catch { /* Some file:// viewers restrict history writes. Reading still works. */ }
  }

  function ordered(heroes) {
    const copy = [...heroes];
    const byName = (a, b) => a.pinyin.localeCompare(b.pinyin, 'en');
    if (state.sort === 'name') return copy.sort(byName);
    if (state.sort === 'difficulty') return copy.sort((a, b) => a.difficultyScore - b.difficultyScore || byName(a, b));
    return copy.sort((a, b) => {
      const rank = h => { const i = report.recommended.indexOf(h.id); return i < 0 ? 99 : i; };
      return rank(a) - rank(b) || byName(a, b);
    });
  }

  function heroName(h, detail = false) {
    const split = h.name.match(/^(.*?)\((.*?)\)$/);
    if (!split) return esc(h.name);
    return `${esc(split[1])}<${detail ? 'small' : 'span'} class="card-subname">${esc(split[2])}</${detail ? 'small' : 'span'}>`;
  }

  function heroCard(h) {
    const level = { 基础: 1, 进阶: 2, 挑战: 3 }[h.difficulty];
    const badge = report.recommended.includes(h.id) ? '入门起点' : h.variant;
    return `<button type="button" class="hero-card" data-hero="${h.id}" data-difficulty="${h.difficulty}" aria-label="阅读${esc(h.name)}：${esc(h.theme)}，${h.lanes.join('、')}，${h.difficulty}">
      <div class="card-picture"><img src="${h.avatar}" alt="${esc(h.name)}官方头像" width="320" height="320" loading="lazy" decoding="async">${badge ? `<span class="card-badge">${esc(badge)}</span>` : ''}</div>
      <div class="card-body"><div class="card-title"><h3>${heroName(h)}</h3><span aria-hidden="true">↗</span></div><p class="card-theme">${esc(h.theme)}</p><div class="card-tags">${h.lanes.map(l => `<span>${l}</span>`).join('')}</div><div class="card-bottom"><span>${h.difficulty} · ${h.roles.join(' / ')}</span><span class="difficulty-dots" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${i <= level ? 'on' : ''}"></i>`).join('')}</span></div></div></button>`;
  }

  function renderAtlas({ reset = true, updateURL = true } = {}) {
    if (reset) state.limit = 24;
    const query = normalize(state.query.trim());
    state.matches = ordered(report.heroes.filter(h => (!query || searchIndex.get(h.id).includes(query)) && (!state.lane || h.lanes.includes(state.lane)) && (!state.difficulty || h.difficulty === state.difficulty) && (!state.role || h.roles.includes(state.role))));
    const visible = state.matches.slice(0, state.limit);
    $('#hero-grid').innerHTML = visible.map(heroCard).join('');
    $('#empty-state').hidden = !!state.matches.length;
    $('#load-more').hidden = visible.length >= state.matches.length;
    $('#shown-count').textContent = state.matches.length ? `已展示 ${visible.length} / ${state.matches.length} 个条目` : '';
    $('#result-count').innerHTML = `找到 <b>${state.matches.length}</b> 个条目 <span> / 共 ${report.entryCount} 个 · 多分路英雄可同时出现在不同分路</span>`;
    document.querySelectorAll('[data-filter-lane]').forEach(button => {
      const active = button.dataset.filterLane === state.lane;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    if (updateURL) syncURL();
  }

  function resetFilters() {
    state.query = ''; state.lane = ''; state.difficulty = ''; state.role = ''; state.sort = 'guide';
    $('#search').value = ''; $('#difficulty').value = ''; $('#role').value = ''; $('#sort').value = 'guide';
    renderAtlas();
  }

  function showLane(name) {
    const guide = laneGuides[name];
    if (!guide) return;
    const count = report.heroes.filter(h => h.lanes.includes(name)).length;
    $('#lane-content').innerHTML = `<article class="lane-description"><p class="lane-kicker">${guide.kicker}</p><h3>${guide.title}</h3><p>${guide.text}</p><div class="lane-duties">${guide.duties.map(d => `<span>${d}</span>`).join('')}</div><p class="lane-example"><b>英雄例子：</b>${guide.example}</p><p class="lane-example">${guide.first}</p><button type="button" class="text-link" data-pick-lane="${name}">查看 ${count} 个${name}条目 →</button></article>`;
    document.querySelectorAll('[data-lane-guide]').forEach(button => { const active = button.dataset.laneGuide === name; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    document.querySelectorAll('[data-route]').forEach(path => path.classList.toggle('active', path.dataset.route === name));
  }

  function relation(label, ids) {
    return `<div class="relation-row"><span>${label}</span><div class="relation-heroes">${ids.length ? ids.map(id => {
      const h = heroById.get(id);
      return `<button type="button" class="relation-hero" data-hero="${id}"><img src="${h.avatar}" alt="" width="30" height="30" loading="lazy"><span>${esc(h.name)}</span></button>`;
    }).join('') : '<span>该项官网未提供完整资料</span>'}</div></div>`;
  }

  function openHero(id, keepSequence = false) {
    const h = heroById.get(String(id));
    if (!h) return;
    if (!dialog.open) opener = document.activeElement;
    if (!keepSequence || !detailSequence.includes(h.id)) detailSequence = (state.matches.some(x => x.id === h.id) ? state.matches : ordered(report.heroes)).map(x => x.id);
    const index = detailSequence.indexOf(h.id);
    state.hero = h.id;
    const build = report.buildGuides[h.build];
    $('#hero-detail').innerHTML = `<div class="detail-topbar"><span>英雄研究笔记 / ${String(index + 1).padStart(2, '0')} · ${detailSequence.length}</span><button type="button" class="detail-close" data-close autofocus>返回图鉴 <span aria-hidden="true">×</span></button></div>
      <div class="detail-layout"><aside class="detail-side"><img class="detail-avatar" src="${h.avatar}" alt="${esc(h.name)}官方头像" width="320" height="320"><p class="eyebrow">${h.variant ? esc(h.variant) : 'HERO PROFILE'}</p><h2 id="detail-name">${heroName(h, true)}</h2><p class="detail-title">${esc(h.title)} · ${h.roles.join(' / ')}</p><div class="card-tags">${h.lanes.map(l => `<span>${l}</span>`).join('')}</div><div class="detail-difficulty"><b>${h.difficulty}</b> <span> / 官网操作门槛 ${h.difficultyScore} / 10</span></div><p class="detail-side-note">资料核对：${report.reviewed}<br>下方连招与打法为机制分析，不是胜率或强度结论。${h.secondaryLanes.length ? `<br>官网另列尝试分路：${h.secondaryLanes.filter(l => !h.lanes.includes(l)).join('、') || '与主要分路重合'}；建议先熟悉主要分路。` : ''}</p><a class="detail-source" href="${h.source}" target="_blank" rel="noopener noreferrer">核对官方技能资料 ↗</a></aside>
      <div class="detail-main"><h3 class="detail-theme">${esc(h.theme)}</h3><section class="detail-block"><h3>技能机制 · 读懂这一套能力</h3><div class="mechanic-list">${h.mechanics.map(line => { const pos = line.indexOf('：'); return `<p><b>${esc(pos < 0 ? '机制' : line.slice(0, pos))}</b>${esc(pos < 0 ? line : line.slice(pos + 1))}</p>`; }).join('')}</div><p class="skill-name-list">官网技能名称：${h.skillNames.map(esc).join(" · ")}</p></section><section class="detail-block"><h3>入门操作顺序</h3><div class="combo-box">${esc(h.combo)}</div><p class="build-framework">数字指技能按钮，普攻需手动穿插。顺序依距离、资源、形态和敌方技能调整；多形态英雄先以客户端按钮与说明为准。</p></section><div class="detail-tactics"><section class="detail-block"><h3>前期与发育</h3><p>${esc(h.early)}</p></section><section class="detail-block"><h3>团战任务</h3><p>${esc(h.team)}</p></section></div><section class="detail-block"><h3>出装思路 · ${esc(build[0])}</h3><p><span class="detail-build-name">这名英雄：</span>${esc(h.buildNote)}</p><p class="build-framework">${esc(build[1])}</p></section><section class="detail-block mistake-box"><h3>最值得避免的失误</h3><p>${esc(h.mistake)}</p></section><section class="detail-block"><h3>搭档与对抗 · 官网参考</h3>${relation('协作搭档', h.partners)}${relation('较有利对抗', h.favorable)}${relation('需要提防', h.difficult)}<p class="relation-note">这些组合来自同一官方条目的关系字段，可能滞后于技能重做。它们是机制线索，实际结果取决于分路、装备、熟练度与队伍配合，不是必胜关系。</p></section>${h.sourceNote ? `<p class="source-warning">资料差异：${esc(h.sourceNote)}</p>` : ''}</div></div>
      <div class="detail-bottom"><button type="button" data-prev ${index <= 0 ? 'disabled' : ''}>← 上一位</button><button type="button" data-copy>复制英雄链接 ↗</button><small>官方机制摘要 / 编者实战分析</small><button type="button" data-next ${index >= detailSequence.length - 1 ? 'disabled' : ''}>下一位 →</button></div>`;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
    dialog.scrollTop = 0;
    dialog.querySelector('[data-close]').focus({ preventScroll: true });
    syncURL();
  }

  function toast(message) {
    clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500);
  }

  document.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.hero) { openHero(button.dataset.hero); return; }
    if (button.hasAttribute('data-close')) { dialog.close(); return; }
    if (button.hasAttribute('data-prev') || button.hasAttribute('data-next')) {
      const index = detailSequence.indexOf(state.hero) + (button.hasAttribute('data-next') ? 1 : -1);
      openHero(detailSequence[index], true); return;
    }
    if (button.hasAttribute('data-copy')) {
      const url = new URL(location.href); url.searchParams.set('hero', state.hero);
      try { await navigator.clipboard.writeText(url.href); toast(location.protocol === 'file:' ? '已复制本地英雄链接。分享给别人时，请一并提供报告文件夹。' : '已复制英雄链接'); }
      catch { toast('当前浏览器未允许复制，请复制地址栏中的英雄链接。'); }
      return;
    }
    if (button.dataset.laneGuide) { showLane(button.dataset.laneGuide); return; }
    if (button.hasAttribute('data-filter-lane')) { state.lane = button.dataset.filterLane; renderAtlas(); return; }
    if (button.dataset.pickLane) { resetFilters(); state.lane = button.dataset.pickLane; renderAtlas(); $('#atlas').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); return; }
    if (button.hasAttribute('data-reset') || button.id === 'reset-filters') resetFilters();
  });
  $('#search').addEventListener('input', event => { state.query = event.target.value; renderAtlas(); });
  ['difficulty', 'role', 'sort'].forEach(key => { $(`#${key}`).addEventListener('change', event => { state[key] = event.target.value; renderAtlas(); }); });
  $('#load-more').addEventListener('click', () => { state.limit += 24; renderAtlas({ reset: false }); });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !dialog.open && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input,textarea,select,[contenteditable]')) { event.preventDefault(); $('#search').focus(); }
  });
  dialog.addEventListener('close', () => { state.hero = null; document.body.classList.remove('modal-open'); syncURL(); if (opener?.isConnected) opener.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  $('#starter-heroes').innerHTML = report.recommended.map(id => { const h = heroById.get(id); return `<button type="button" class="starter-hero" data-hero="${id}" aria-label="阅读入门英雄${h.name}"><img src="${h.avatar}" width="51" height="51" alt="" loading="lazy"><strong>${h.name}</strong><small>${h.lanes[0]}</small></button>`; }).join('');
  $('#all-sources').innerHTML = [...report.heroes].sort((a, b) => a.pinyin.localeCompare(b.pinyin, 'en')).map(h => `<a href="${h.source}" target="_blank" rel="noopener noreferrer">${esc(h.name)} ↗</a>`).join('');
  $('#search').value = state.query; $('#difficulty').value = state.difficulty; $('#role').value = state.role; $('#sort').value = state.sort;
  showLane('对抗路');
  renderAtlas({ updateURL: false });
  const requestedHero = params.get('hero');
  if (requestedHero) { if (heroById.has(requestedHero)) openHero(requestedHero); else toast('链接中的英雄未收录，已展示完整图鉴。'); }
})();
