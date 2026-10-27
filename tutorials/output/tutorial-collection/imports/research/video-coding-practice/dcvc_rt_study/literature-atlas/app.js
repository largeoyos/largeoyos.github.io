const publicPdfFilter = document.getElementById('pdfOnly')?.parentElement; if (publicPdfFilter) for (const node of publicPdfFilter.childNodes) if (node.nodeType === 3) node.textContent = '有原文来源';
/* Buildless, offline-first archive. All catalog text is inserted as text, never HTML. */
(function () {
  'use strict';
  const dataset = window.LITERATURE_DATA || {};
  const list = value => Array.isArray(value) ? value : [];
  const meta = dataset.meta || {};
  const papers = list(dataset.papers);
  const fields = list(meta.fields);
  const levels = list(meta.readingLevels).length ? meta.readingLevels : [
    { id: 'selected', label: '方法／实验选读' }, { id: 'prior', label: '承接既有记录' },
    { id: 'screen', label: '摘要筛读' }, { id: 'none', label: '已收录，待阅读' }
  ];
  const paperById = new Map(papers.map(p => [p.id, p]));
  const fieldById = new Map(fields.map(f => [f.id, f]));
  const levelById = new Map(levels.map(l => [l.id, l]));
  const readingRank = { selected: 3, prior: 2, screen: 1, none: 0 };
  const evidenceLabels = { code: '代码审阅', experiment: '实验关联', environment: '环境预检', analysis: '离线分析' };
  const storageKey = 'dcvc-literature-atlas-queue-v1';
  const $ = id => document.getElementById(id);
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase();
  const state = { view: 'archive', query: '', field: '', year: '', level: '', newOnly: false,
    codeOnly: false, pdfOnly: false, queueOnly: false, sort: 'year-desc', compare: [], queue: new Set() };
  let currentPaper = null;
  let toastTimer;
  const focusBeforeDialog = new Map();

  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    const url = value.trim();
    if (/^[\u0000-\u0020]*[a-z][a-z\d+.-]*:/i.test(url)) return /^https?:\/\//i.test(url) ? url : '';
    if (/^[/\\]{2}/.test(url) || /[\u0000-\u001f]/.test(url)) return '';
    return url;
  }
  function searchText(paper) {
    return normalize([paper.id, paper.title, ...list(paper.authors), ...list(paper.tags), paper.summary,
      paper.question, paper.venue, ...list(paper.fields).map(id => (fieldById.get(id) || {}).label || '')].join(' '));
  }
  function filterPapers(items, criteria, queueIds) {
    const tokens = normalize(criteria.query).trim().split(/\s+/).filter(Boolean);
    const queue = queueIds instanceof Set ? queueIds : new Set(queueIds || []);
    return items.filter(p =>
      (!criteria.field || list(p.fields).includes(criteria.field)) &&
      (!criteria.year || String(p.year) === String(criteria.year)) &&
      (!criteria.level || (p.readingLevel || 'none') === criteria.level) &&
      (!criteria.newOnly || Boolean(p.addedThisRound)) &&
      (!criteria.codeOnly || Boolean(safeUrl(p.codeUrl))) &&
      (!criteria.pdfOnly || Boolean(safeUrl(p.localPdf))) &&
      (!criteria.queueOnly || queue.has(p.id)) &&
      tokens.every(token => searchText(p).includes(token))
    ).sort((a, b) => {
      if (criteria.sort === 'title') return String(a.title).localeCompare(String(b.title), 'en');
      if (criteria.sort === 'reading') return (readingRank[b.readingLevel] || 0) - (readingRank[a.readingLevel] || 0) || Number(b.year) - Number(a.year) || String(a.id).localeCompare(String(b.id));
      return (criteria.sort === 'year-asc' ? Number(a.year) - Number(b.year) : Number(b.year) - Number(a.year)) || String(a.title).localeCompare(String(b.title), 'en');
    });
  }
  function currentResults(overrides) { return filterPapers(papers, Object.assign({}, state, overrides || {}), state.queue); }
  function node(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = String(text);
    return item;
  }
  function button(text, className, action, label) {
    const item = node('button', className, text);
    item.type = 'button';
    if (label) item.setAttribute('aria-label', label);
    item.addEventListener('click', action);
    return item;
  }
  function link(text, url, className) {
    const verified = safeUrl(url);
    const item = node(verified ? 'a' : 'span', className, text);
    if (verified) { item.href = verified; item.target = '_blank'; item.rel = 'noopener noreferrer'; }
    return item;
  }
  function fieldName(id) { const f = fieldById.get(id); return f ? f.short || f.label : id; }
  function levelLabel(p) { return p.readingLabel || (levelById.get(p.readingLevel) || {}).label || '已收录，待阅读'; }
  function evidenceTypes(p) { return [...new Set(list(p.evidence).map(e => e.type).filter(Boolean))]; }
  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').classList.add('show');
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3000);
  }
  function loadQueue() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      state.queue = new Set(list(saved.ids).filter(id => paperById.has(id)));
    } catch (_) { /* Storage may be blocked for local files. Session state remains usable. */ }
  }
  function saveQueue() {
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), ids: [...state.queue] })); }
    catch (_) { toast('浏览器禁止本地存储；队列可在本次打开期间使用，请导出备份。'); }
  }
  function toggleQueue(id) {
    if (state.queue.has(id)) state.queue.delete(id); else state.queue.add(id);
    saveQueue(); render();
    if ($('paperDialog').open && currentPaper) renderDetail(currentPaper);
  }
  function toggleCompare(id) {
    if (state.compare.includes(id)) state.compare = state.compare.filter(value => value !== id);
    else if (state.compare.length < 3) state.compare.push(id);
    else { toast('最多并排比较 3 篇，请先移除一篇。'); return; }
    render();
    if ($('paperDialog').open && currentPaper) renderDetail(currentPaper);
  }
  function resetFilters() {
    Object.assign(state, { query: '', field: '', year: '', level: '', newOnly: false, codeOnly: false, pdfOnly: false, queueOnly: false, sort: 'year-desc' });
    syncControls(); render();
  }
  function syncControls() {
    $('searchInput').value = state.query;
    $('yearFilter').value = state.year;
    $('levelFilter').value = state.level;
    $('sortSelect').value = state.sort;
    ['newOnly', 'codeOnly', 'pdfOnly'].forEach(key => { $(key).checked = state[key]; });
    $('queueOnly').setAttribute('aria-pressed', String(state.queueOnly));
  }
  function setView(view) {
    state.view = ['archive', 'map', 'paths'].includes(view) ? view : 'archive';
    document.querySelectorAll('.view-tab').forEach(tab => {
      const selected = tab.dataset.view === state.view;
      tab.classList.toggle('active', selected);
      if (selected) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current');
    });
    ['archive', 'map', 'paths'].forEach(name => { $(name + 'View').hidden = name !== state.view; });
    render();
  }
  function initializeHeader() {
    const date = String(meta.updated || '').slice(0, 10);
    $('editionYear').textContent = date.slice(0, 4) || '2026';
    $('editionDate').textContent = date ? '更新于 ' + date.replaceAll('-', '.') : '持续整理中';
    $('sidebarVersion').textContent = date ? 'ARCHIVE / ' + date : 'LOCAL COLLECTION';
    $('footerDate').textContent = date ? '档案更新 ' + date + ' · 以原文和记录为准' : '以原文和记录为准';
    $('fieldTotal').textContent = String(fields.length).padStart(2, '0');
    const metrics = [
      [papers.length, '收录文献', '每篇对应独立档案'],
      [papers.filter(p => p.addedThisRound).length, '本次新增', '新条目按实际阅读记录标记'],
      [fields.length, '研究领域', '跨领域标签可重叠'],
      [papers.filter(p => safeUrl(p.localPdf)).length, '原文来源', '阅读与实验状态分别记录']
    ];
    $('metrics').replaceChildren(...metrics.map(([value, label, detail]) => {
      const item = node('div', 'metric');
      const copy = node('div'); copy.append(node('span', 'metric-label', label), node('span', 'metric-detail', detail));
      item.append(node('span', 'metric-value', String(value).padStart(2, '0')), copy);
      return item;
    }));
    [...new Set(papers.map(p => p.year).filter(Boolean))].sort((a, b) => b - a).forEach(year => {
      const option = node('option', '', year); option.value = String(year); $('yearFilter').append(option);
    });
    levels.forEach(level => { const option = node('option', '', level.label); option.value = level.id; $('levelFilter').append(option); });
    const mapNote = document.querySelector('#mapView .map-intro p');
    mapNote.textContent = '领域是研究视角，不是互斥分类。' + (meta.relationNote || '连线表示本项目整理的阅读路径，不是论文引用关系。');
  }
  function renderFields() {
    const options = [{ id: '', label: '全部文献', count: papers.length }, ...fields.map(f => Object.assign({}, f, { count: papers.filter(p => list(p.fields).includes(f.id)).length }))];
    $('fieldNav').replaceChildren(...options.map((field, index) => {
      const item = button('', 'field-button' + (state.field === field.id ? ' active' : ''), () => { state.field = field.id; render(); });
      item.setAttribute('aria-pressed', String(state.field === field.id));
      item.dataset.focusKey = 'field-' + field.id;
      item.title = field.description || field.label;
      item.append(node('span', 'field-index', index ? String(index).padStart(2, '0') : '●'), node('span', 'field-label', field.label), node('span', 'field-count', field.count));
      return item;
    }));
  }
  function renderCharts() {
    const byYear = currentResults({ year: '' });
    const allYears = [...new Set(papers.map(p => p.year).filter(Boolean))].sort((a, b) => a - b);
    const counts = allYears.map(year => byYear.filter(p => p.year === year).length);
    const max = Math.max(1, ...counts);
    $('yearChart').replaceChildren(...allYears.map((year, index) => {
      const count = counts[index];
      const item = button('', 'year-column' + (state.year === String(year) ? ' active' : ''), () => {
        state.year = state.year === String(year) ? '' : String(year); syncControls(); render();
      }, '目录年份 ' + year + ' 年，' + count + ' 篇，点击筛选');
      item.setAttribute('aria-pressed', String(state.year === String(year)));
      item.dataset.focusKey = 'year-' + year;
      const bar = node('span', 'year-bar'); bar.style.setProperty('--bar-height', Math.max(3, count / max * 60) + 'px');
      item.append(node('span', 'year-count', count || '—'), bar, node('span', 'year-number', year));
      return item;
    }));
    const depthItems = currentResults({ level: '' });
    $('depthChart').replaceChildren(...levels.map(level => {
      const count = depthItems.filter(p => (p.readingLevel || 'none') === level.id).length;
      const item = button('', 'depth-row' + (state.level === level.id ? ' active' : ''), () => { state.level = state.level === level.id ? '' : level.id; syncControls(); render(); }, level.label + '：' + count + ' 篇，点击筛选');
      item.dataset.focusKey = 'level-' + level.id;
      item.title = level.description || level.label;
      item.setAttribute('aria-pressed', String(state.level === level.id));
      const track = node('span', 'depth-track');
      const fill = node('span', 'depth-fill'); fill.style.setProperty('--bar-width', count / Math.max(depthItems.length, 1) * 100 + '%'); track.append(fill);
      item.append(node('span', '', level.label), track, node('span', 'depth-value', count));
      return item;
    }));
  }
  function rowFor(paper) {
    const row = node('article', 'paper-row'); row.dataset.paperId = paper.id;
    const main = button('', 'paper-main', () => openPaper(paper.id), '查看 ' + paper.title);
    main.dataset.focusKey = 'paper-' + paper.id;
    const text = node('div');
    const title = node('h3', 'paper-title', paper.title);
    const alias = node('div', 'paper-alias', paper.id);
    if (paper.addedThisRound) alias.append(node('span', 'new-badge', 'NEW'));
    const authors = list(paper.authors).length ? paper.authors.join(' · ') : '作者待结构化录入 · 见原文首页';
    text.append(alias, title, node('p', 'paper-authors', [authors, paper.venue || paper.version].filter(Boolean).join(' / ')));
    main.append(node('span', 'paper-year', paper.year || '—'), text);
    const classification = node('div', 'paper-classification');
    const subjects = node('div', 'paper-subjects');
    list(paper.fields).forEach(id => subjects.append(node('span', 'field-tag', fieldName(id))));
    const badges = node('div', 'record-badges');
    badges.append(node('span', 'record-badge read-' + (paper.readingLevel || 'none'), levelLabel(paper)));
    evidenceTypes(paper).forEach(type => badges.append(node('span', 'record-badge evidence-' + type, evidenceLabels[type] || '相关记录')));
    classification.append(subjects, badges);
    const actions = node('div', 'paper-actions');
    actions.append(link('PDF ↗', paper.localPdf, 'pdf-link'));
    if (!safeUrl(paper.localPdf)) actions.firstChild.textContent = '无 PDF';
    const queue = button(state.queue.has(paper.id) ? '★' : '☆', 'icon-button', () => toggleQueue(paper.id), (state.queue.has(paper.id) ? '从阅读队列移除 ' : '加入阅读队列 ') + paper.id);
    queue.title = state.queue.has(paper.id) ? '从阅读队列移除' : '加入阅读队列（仅本浏览器）';
    queue.setAttribute('aria-pressed', String(state.queue.has(paper.id)));
    queue.dataset.focusKey = 'queue-' + paper.id;
    const compare = button('⇄', 'icon-button', () => toggleCompare(paper.id), (state.compare.includes(paper.id) ? '移除比较 ' : '加入比较 ') + paper.id);
    compare.title = '加入或移除比较，最多 3 篇'; compare.setAttribute('aria-pressed', String(state.compare.includes(paper.id)));
    compare.dataset.focusKey = 'compare-' + paper.id;
    actions.append(queue, compare);
    row.append(main, classification, actions);
    return row;
  }
  function filterDescription() {
    const parts = [];
    if (state.query.trim()) parts.push('关键词「' + state.query.trim() + '」');
    if (state.field) parts.push((fieldById.get(state.field) || {}).label || state.field);
    if (state.year) parts.push('目录年份 ' + state.year + ' 年');
    if (state.level) parts.push((levelById.get(state.level) || {}).label || state.level);
    if (state.newOnly) parts.push('本次新增');
    if (state.codeOnly) parts.push('有代码入口');
    if (state.pdfOnly) parts.push('有原文来源');
    if (state.queueOnly) parts.push('本浏览器阅读队列');
    return parts;
  }
  function renderArchive(results) {
    $('resultsTitle').textContent = state.queueOnly ? '我的阅读队列' : state.field ? (fieldById.get(state.field) || {}).label || state.field : '全部文献';
    $('resultsCount').textContent = '显示 ' + results.length + ' / ' + papers.length + ' 篇';
    const filters = filterDescription();
    $('activeFilterSummary').textContent = filters.length ? '当前范围：' + filters.join(' · ') : '标题打开档案，☆ 加入本浏览器阅读队列，⇄ 并排比较最多 3 篇。';
    $('paperList').replaceChildren(...results.map(rowFor));
    $('emptyState').hidden = results.length > 0;
    if (!papers.length) {
      $('emptyState').querySelector('h3').textContent = '文献数据尚未载入';
      $('emptyState').querySelector('p').textContent = '请确认 data.js 与本页在同一目录，再重新打开。';
    }
    renderCharts();
  }
  function svgNode(tag, attributes, text) {
    const item = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes || {}).forEach(([key, value]) => item.setAttribute(key, String(value)));
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function renderMap(results) {
    const maxCount = Math.max(1, ...fields.map(f => results.filter(p => list(p.fields).includes(f.id)).length));
    $('coverageMap').replaceChildren(...fields.map((field, index) => {
      const count = results.filter(p => list(p.fields).includes(field.id)).length;
      const item = button('', 'coverage-item', () => { state.field = field.id; setView('archive'); }, field.label + '，当前范围 ' + count + ' 篇');
      const copy = node('div'); copy.append(node('h3', '', field.label), node('p', '', field.description || ''));
      const bar = node('div', 'coverage-bar'); const fill = node('i'); fill.style.setProperty('--bar-width', count / maxCount * 100 + '%'); bar.append(fill); copy.append(bar);
      item.append(node('span', 'coverage-index', String(index + 1).padStart(2, '0')), copy, node('span', 'coverage-number', count));
      return item;
    }));
    const resultIds = new Set(results.map(p => p.id));
    const relations = list(dataset.relations).filter(r => resultIds.has(r.source) && resultIds.has(r.target));
    const referencedIds = [...new Set(relations.flatMap(r => [r.source, r.target]))];
    const graphPapers = referencedIds.slice(0, 36).map(id => paperById.get(id)).filter(Boolean).sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
    $('relationCount').textContent = relations.length + ' 条阅读关联' + (referencedIds.length > 36 ? ' · 图中展示前 36 篇' : '');
    $('relationGraph').replaceChildren();
    if (graphPapers.length) {
      const years = [...new Set(graphPapers.map(p => p.year))].sort((a, b) => a - b);
      const maxGroup = Math.max(...years.map(year => graphPapers.filter(p => p.year === year).length));
      const height = Math.max(320, maxGroup * 57 + 70);
      const width = Math.max(900, years.length * 118);
      const svg = svgNode('svg', { viewBox: '0 0 ' + width + ' ' + height, role: 'img', 'aria-label': '按目录年份排列的阅读路径关联图，可点击文献节点' });
      const positions = new Map();
      years.forEach((year, index) => {
        const x = 65 + index * ((width - 130) / Math.max(years.length - 1, 1));
        svg.append(svgNode('line', { x1: x, x2: x, y1: 40, y2: height - 15, stroke: '#e4e5dc', 'stroke-dasharray': '2 5' }));
        svg.append(svgNode('text', { x, y: 22, 'text-anchor': 'middle', class: 'relation-axis' }, year));
        const group = graphPapers.filter(p => p.year === year);
        group.forEach((p, i) => positions.set(p.id, { x, y: 65 + i * ((height - 115) / Math.max(group.length - 1, 1)) }));
      });
      relations.filter(r => positions.has(r.source) && positions.has(r.target)).forEach(r => {
        const a = positions.get(r.source); const b = positions.get(r.target);
        const bend = a.x === b.x ? 45 : (b.x - a.x) / 2;
        const path = svgNode('path', { d: 'M' + a.x + ',' + a.y + ' C' + (a.x + bend) + ',' + a.y + ' ' + (b.x - bend) + ',' + b.y + ' ' + b.x + ',' + b.y, class: 'relation-edge' });
        path.append(svgNode('title', {}, r.label || '阅读路径关联')); svg.append(path);
      });
      graphPapers.forEach(p => {
        const pos = positions.get(p.id);
        const g = svgNode('g', { class: 'relation-node', transform: 'translate(' + pos.x + ' ' + pos.y + ')', tabindex: 0, role: 'button', 'aria-label': '打开 ' + p.title });
        g.append(svgNode('title', {}, p.title), svgNode('circle', { r: 5 }), svgNode('text', { y: 20, 'text-anchor': 'middle' }, p.id.length > 18 ? p.id.slice(0, 16) + '…' : p.id));
        g.addEventListener('click', () => openPaper(p.id));
        g.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPaper(p.id); } });
        svg.append(g);
      });
      $('relationGraph').append(svg);
    } else $('relationGraph').append(node('p', 'map-empty', '当前筛选范围内尚无已整理的跨文献阅读关联。'));
    $('relationList').replaceChildren(...relations.map(relation => {
      const item = node('div', 'relation-item');
      const pair = node('div');
      pair.append(button(relation.source, 'relation-paper', () => openPaper(relation.source)), node('span', '', ' → '), button(relation.target, 'relation-paper', () => openPaper(relation.target)));
      item.append(pair, node('span', '', relation.label || '编辑整理的阅读顺序'));
      return item;
    }));
  }
  function renderPaths(results) {
    const ids = new Set(results.map(p => p.id));
    const paths = list(dataset.paths).filter(path => list(path.paperIds).some(id => ids.has(id)));
    $('readingPaths').replaceChildren(...paths.map((path, index) => {
      const article = node('article', 'reading-path');
      const heading = node('div', 'path-heading');
      heading.append(node('span', 'path-number', String(index + 1).padStart(2, '0')), node('h3', '', path.title));
      const allIds = list(path.paperIds).filter(id => paperById.has(id));
      const matchingIds = allIds.filter(id => ids.has(id));
      const description = node('p', 'path-description', path.description || '');
      description.append(node('span', 'path-note', '当前显示 ' + matchingIds.length + ' / ' + allIds.length + ' 个节点 · 受上方筛选影响'));
      const steps = node('div', 'path-steps');
      matchingIds.forEach(id => {
        const paper = paperById.get(id);
        const step = button('', 'path-step', () => openPaper(id), '阅读路径：查看 ' + paper.title);
        step.append(node('span', 'path-year', paper.year + ' / ' + paper.id), node('h4', '', paper.title), node('p', '', paper.summary || ''), node('span', 'path-note', levelLabel(paper)));
        steps.append(step);
      });
      article.append(heading, description, steps); return article;
    }));
    if (!paths.length) $('readingPaths').append(node('p', 'map-empty', '当前筛选下没有已整理的阅读路径。可清除筛选查看完整路径。'));
  }
  function renderCompareBar() {
    $('compareBar').hidden = !state.compare.length;
    $('compareCount').textContent = state.compare.length + ' 篇待比较';
    $('compareNames').textContent = state.compare.join(' / ');
    $('openCompare').disabled = state.compare.length < 2;
    $('openCompare').title = state.compare.length < 2 ? '至少选择 2 篇文献' : '并排查看研究问题、记录和边界';
  }
  function render() {
    const focused = document.activeElement && document.activeElement.dataset.focusKey;
    renderFields();
    $('queueCount').textContent = state.queue.size;
    $('queueOnly').setAttribute('aria-pressed', String(state.queueOnly));
    const results = currentResults();
    if (state.view === 'archive') renderArchive(results);
    else if (state.view === 'map') renderMap(results);
    else renderPaths(results);
    renderCompareBar();
    if (focused) [...document.querySelectorAll('[data-focus-key]')].find(item => item.dataset.focusKey === focused)?.focus({ preventScroll: true });
  }
  function section(title, text, className) {
    const wrapper = node('section', 'detail-section' + (className ? ' ' + className : ''));
    wrapper.append(node('h3', '', title), node('p', '', text || '尚未整理。')); return wrapper;
  }
  function renderDetail(paper) {
    const focused = document.activeElement && document.activeElement.dataset.focusKey;
    const detail = $('paperDetail'); detail.replaceChildren();
    $('detailEyebrow').textContent = paper.id + ' / PAPER RECORD';
    const h2 = node('h2', '', paper.title); h2.id = 'detailTitle';
    detail.append(node('p', 'detail-meta', [paper.year, paper.venue, paper.version].filter(Boolean).join(' · ')), h2);
    detail.append(node('p', 'detail-authors', list(paper.authors).length ? paper.authors.join(' · ') : paper.metadataNote || '作者未结构化录入，请查原文 PDF 首页。'));
    const tags = node('div', 'detail-tags');
    list(paper.fields).forEach(id => tags.append(node('span', 'field-tag', (fieldById.get(id) || {}).label || id)));
    list(paper.tags).filter(tag => !list(paper.fields).some(id => fieldName(id) === tag)).forEach(tag => tags.append(node('span', 'field-tag', tag)));
    detail.append(tags);
    const links = node('div', 'detail-links');
    if (safeUrl(paper.localPdf)) links.append(link('原文 PDF ↗', paper.localPdf, 'button'));
    if (safeUrl(paper.sourceUrl)) links.append(link('官方来源 ↗', paper.sourceUrl, 'button secondary'));
    if (safeUrl(paper.codeUrl)) links.append(link('代码入口 ↗', paper.codeUrl, 'button secondary'));
    detail.append(links);
    const controls = node('div', 'detail-controls');
    const queueButton = button(state.queue.has(paper.id) ? '★ 已在阅读队列' : '☆ 加入阅读队列', 'text-button', () => toggleQueue(paper.id));
    queueButton.setAttribute('aria-pressed', String(state.queue.has(paper.id)));
    queueButton.dataset.focusKey = 'detail-queue-' + paper.id;
    const compareButton = button(state.compare.includes(paper.id) ? '⇄ 已加入比较' : '⇄ 加入比较', 'text-button', () => toggleCompare(paper.id));
    compareButton.setAttribute('aria-pressed', String(state.compare.includes(paper.id)));
    compareButton.dataset.focusKey = 'detail-compare-' + paper.id;
    controls.append(queueButton, compareButton); detail.append(controls, node('p', 'detail-queue-note', '阅读队列只保存在当前浏览器，不会修改论文的阅读状态。'));
    detail.append(section('这篇论文在解决什么', paper.summary), section('带着这个问题读', paper.question), section('理解与比较的边界', paper.caveat, 'caution'));
    const reading = node('section', 'detail-section'); reading.append(node('h3', '', '阅读记录'));
    const facts = node('dl', 'detail-facts');
    [['记录类型', levelLabel(paper)], ['已读页码', list(paper.readPages).length ? 'PDF 第 ' + paper.readPages.join('、') + ' 页' : '没有统一的页码记录'], ['原文页数', paper.pages ? paper.pages + ' 页' : '未记录'], ['版本', paper.version || '未结构化录入']].forEach(([label, value]) => facts.append(node('dt', '', label), node('dd', '', value)));
    reading.append(facts, node('p', 'detail-queue-note', paper.readingNote || '阅读记录反映本项目已有证据，不等于全文精读或完整复现。'));
    if (paper.sha256) { reading.append(node('p', 'detail-queue-note', '原文 PDF · SHA-256'), node('code', 'hash', paper.sha256)); }
    detail.append(reading);
    const notes = node('section', 'detail-section'); notes.append(node('h3', '', '笔记与分析'));
    const noteLinks = node('div', 'evidence-list');
    list(paper.notes).forEach(note => { const item = link('', note.url, 'evidence-link'); item.append(node('strong', '', note.label), node('small', '', '本地笔记 ↗')); noteLinks.append(item); });
    if (!list(paper.notes).length) noteLinks.append(node('p', '', '尚无关联笔记。'));
    notes.append(noteLinks); detail.append(notes);
    const evidence = node('section', 'detail-section'); evidence.append(node('h3', '', '独立的代码与实验依据'));
    evidence.append(node('p', 'detail-queue-note', meta.evidenceNote || '代码入口不等于代码审阅；相关实验不等于论文完整复现。'));
    const evidenceLinks = node('div', 'evidence-list');
    list(paper.evidence).forEach(item => {
      const entry = link('', item.url, 'evidence-link');
      entry.append(node('strong', '', (evidenceLabels[item.type] || '相关记录') + ' · ' + item.label), node('small', '', item.scope || '请打开原记录核对范围。'));
      evidenceLinks.append(entry);
    });
    if (!list(paper.evidence).length) evidenceLinks.append(node('p', '', '尚未关联独立的代码审阅、预检、离线分析或模型实验记录。'));
    evidence.append(evidenceLinks); detail.append(evidence);
    if (list(paper.relations).length) {
      const relations = node('section', 'detail-section'); relations.append(node('h3', '', '相关阅读'), node('p', 'detail-queue-note', meta.relationNote || '编辑整理的阅读建议。'));
      list(paper.relations).filter(r => paperById.has(r.id)).forEach(relation => {
        const related = paperById.get(relation.id);
        const item = button('', 'evidence-link', () => { currentPaper = related; renderDetail(related); $('paperDialog').scrollTop = 0; $('closeDetail').focus(); });
        item.append(node('strong', '', related.id + ' · ' + related.title), node('small', '', relation.reason || '阅读路径关联')); relations.append(item);
      });
      detail.append(relations);
    }
    if (focused) [...detail.querySelectorAll('[data-focus-key]')].find(item => item.dataset.focusKey === focused)?.focus({ preventScroll: true });
  }
  function openDialog(dialog, focusId) {
    focusBeforeDialog.set(dialog.id, { element: document.activeElement, key: document.activeElement && document.activeElement.dataset.focusKey });
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    if (focusId) $(focusId).focus();
  }
  function closeDialog(dialog) {
    dialog.close();
  }
  function openPaper(id) {
    const paper = paperById.get(id); if (!paper) return;
    currentPaper = paper; renderDetail(paper); openDialog($('paperDialog'), 'closeDetail'); $('paperDialog').scrollTop = 0;
  }
  function openComparison() {
    const compared = state.compare.map(id => paperById.get(id)).filter(Boolean); if (compared.length < 2) return;
    const table = node('table');
    const head = node('thead'); const headRow = node('tr'); headRow.append(node('th', '', '比较维度'));
    compared.forEach(p => { const cell = node('th'); cell.scope = 'col'; cell.append(node('span', 'paper-alias', p.id), node('h3', '', p.title)); headRow.append(cell); });
    head.append(headRow); table.append(head);
    const body = node('tbody');
    const rows = [
      ['目录年份 / 版本', p => [p.year, p.version || p.venue || '版本待补充'].join(' · ')],
      ['研究领域', p => list(p.fields).map(id => (fieldById.get(id) || {}).label || id).join(' / ')],
      ['核心机制', p => p.summary || '待整理'], ['阅读问题', p => p.question || '待整理'],
      ['比较边界', p => p.caveat || '待整理'],
      ['阅读记录', p => levelLabel(p) + (list(p.readPages).length ? ' · PDF 页 ' + p.readPages.join('、') : ' · 无统一页码')],
      ['独立证据', p => list(p.evidence).length ? list(p.evidence).map(e => (evidenceLabels[e.type] || '相关记录') + '：' + (e.scope || e.label)).join('\n') : '无独立证据关联'],
      ['代码入口', p => p.codeUrl ? '有入口；是否已审阅以独立证据为准' : '未记录入口']
    ];
    rows.forEach(([label, value]) => {
      const row = node('tr'); const heading = node('th', '', label); heading.scope = 'row'; row.append(heading);
      compared.forEach(p => row.append(node('td', '', value(p)))); body.append(row);
    });
    const resources = node('tr'); const resourcesTitle = node('th', '', '回到来源'); resourcesTitle.scope = 'row'; resources.append(resourcesTitle);
    compared.forEach(p => { const cell = node('td'); if (safeUrl(p.localPdf)) cell.append(link('原文 PDF ↗', p.localPdf, 'text-button')); cell.append(node('br')); if (safeUrl(p.sourceUrl)) cell.append(link('官方来源 ↗', p.sourceUrl, 'text-button')); resources.append(cell); });
    body.append(resources); table.append(body); $('compareTable').replaceChildren(table);
    openDialog($('compareDialog'), 'closeCompare');
  }
  function download(filename, text, mime) {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const item = node('a'); item.href = url; item.download = filename; document.body.append(item); item.click(); item.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function csvCell(value) {
    let text = String(value === undefined || value === null ? '' : value);
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }
  function makeCsv(items) {
    const rows = [['ID', '标题', '作者', '目录年份', '版本', '领域', '阅读记录', '已读PDF页码', '核心机制', '比较边界', '本地PDF', '官方来源', '代码入口', '独立证据类型']];
    items.forEach(p => rows.push([p.id, p.title, list(p.authors).join('; '), p.year, p.version, list(p.fields).map(fieldName).join('; '), levelLabel(p), list(p.readPages).join('; '), p.summary, p.caveat, p.localPdf, p.sourceUrl, p.codeUrl, evidenceTypes(p).map(type => evidenceLabels[type] || type).join('; ')]));
    return '\ufeff' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
  }
  function setupDialog(dialog) {
    dialog.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]')) document.body.style.overflow = '';
      const previous = focusBeforeDialog.get(dialog.id);
      if (previous && previous.element && previous.element.isConnected) previous.element.focus();
      else if (previous && previous.key) {
        const replacement = [...document.querySelectorAll('[data-focus-key]')].find(item => item.dataset.focusKey === previous.key);
        if (replacement) replacement.focus(); else $('searchInput').focus();
      }
    });
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) closeDialog(dialog);
    });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], input, select, [tabindex="0"]')].filter(element => element.getClientRects().length);
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }
  function bindEvents() {
    $('searchInput').addEventListener('input', event => { state.query = event.target.value; render(); });
    [['yearFilter', 'year'], ['levelFilter', 'level'], ['sortSelect', 'sort']].forEach(([id, key]) => $(id).addEventListener('change', event => { state[key] = event.target.value; render(); }));
    ['newOnly', 'codeOnly', 'pdfOnly'].forEach(key => $(key).addEventListener('change', event => { state[key] = event.target.checked; render(); }));
    ['resetFilters', 'emptyReset'].forEach(id => $(id).addEventListener('click', resetFilters));
    document.querySelectorAll('.view-tab').forEach(tab => tab.addEventListener('click', () => setView(tab.dataset.view)));
    document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); resetFilters(); setView('archive'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    $('queueOnly').addEventListener('click', () => { state.queueOnly = !state.queueOnly; setView('archive'); });
    $('exportQueue').addEventListener('click', () => {
      const ids = [...state.queue];
      download('dcvc-reading-queue.json', JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), storageScope: '当前浏览器本地队列，不修改项目阅读记录', ids, papers: ids.map(id => { const p = paperById.get(id); return { id, title: p.title, sourceUrl: p.sourceUrl, localPdf: p.localPdf }; }) }, null, 2), 'application/json;charset=utf-8');
      toast('已导出 ' + ids.length + ' 篇阅读队列。');
    });
    $('exportCsv').addEventListener('click', () => { const results = currentResults(); download('dcvc-literature-filtered.csv', makeCsv(results), 'text/csv;charset=utf-8'); toast('已导出当前 ' + results.length + ' 篇文献。'); });
    $('clearCompare').addEventListener('click', () => { state.compare = []; render(); });
    $('openCompare').addEventListener('click', openComparison);
    $('closeDetail').addEventListener('click', () => closeDialog($('paperDialog')));
    $('closeCompare').addEventListener('click', () => closeDialog($('compareDialog')));
    setupDialog($('paperDialog')); setupDialog($('compareDialog'));
    document.addEventListener('keydown', event => {
      if (event.key === '/' && !document.querySelector('dialog[open]') && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { event.preventDefault(); $('searchInput').focus(); }
    });
  }
  // Small pure API for reproducible catalog/filter checks; no mutations or network calls.
  window.LITERATURE_ATLAS_TEST = Object.freeze({ filterPapers, safeUrl, makeCsv, csvCell, searchText });
  loadQueue(); initializeHeader(); bindEvents(); syncControls(); render();
})();
