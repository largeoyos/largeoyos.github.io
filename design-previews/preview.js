const body = document.body;
const personal = body.dataset.page === 'personal';
const design = body.dataset.design;
const spaces = [
  ['01', '博客', '记录学习、观察和想法。', '../blog/index.html'],
  ['02', 'AI 教学', '人工智能与计算机科学学习笔记。', '../ai-tutorials/index.html'],
  ['03', '游戏', '桌游和网页小游戏。', '../games/index.html'],
  ['04', '工具箱', '计算器和在线实用工具。', '../tools/index.html'],
  ['05', '全球行情', '观察市场的变化。', '../markets/index.html'],
  ['06', '快捷导航', '常用网站与学习资源。', '../quick-nav/index.html'],
  ['07', '教程与科研文库', '系统整理的课程、论文和学习资料。', '../tutorials/index.html'],
  ['08', '量化实验室', '研究和探索量化方法。', '../quant-lab/index.html']
];
const workspace = `<nav class="top"><a class="brand" href="#top">LarGeoYos<span>.</span></a><div><a href="#spaces">探索空间</a><a href="../index.html#calendar-section">每日历</a></div></nav><main id="top"><section class="hero reveal"><p class="eyebrow">A PERSONAL WORKSPACE / 个人数字空间</p><h1>${design === 'b' ? '探索。<br>创造。<br><em>继续向前。</em>' : '想法，<br>有了去处。'}</h1><p class="intro">学习、记录、创造与玩乐。<br>这里收藏着一些正在生长的想法。</p><a class="action" href="#spaces">向下探索 <span>↓</span></a><span class="hero-index">SCROLL TO EXPLORE　↓</span></section><section class="statement reveal"><p class="eyebrow">01 / EVERY DAY</p><h2>每一天，<br>都值得留下一点痕迹。</h2><p>看看今天的日历，给自己一个开始的理由。</p><a class="action" href="../index.html#calendar-section">打开每日签到日历 ↗</a></section><section id="spaces" class="spaces"><div class="section-heading reveal"><p class="eyebrow">02 / EXPLORE</p><h2>一个空间，<br>许多可能。</h2><p>从一个感兴趣的地方开始。</p></div><div class="space-grid">${spaces.map(([n,t,d,u])=>`<a class="space reveal" href="${u}"><span class="number">${n} /</span><h3>${t}</h3><p>${d}</p><span class="arrow">↗</span></a>`).join('')}</div></section></main><footer>LarGeoYos <span>设计探索 · 主站预览</span></footer>`;
const personalPage = `<nav class="top"><a class="brand" href="#top">L<span>.</span></a><div><a href="#about">关于</a><a href="#work">经历与作品</a><a href="#contact">联系</a></div></nav><main id="top"><section class="personal-hero reveal"><p class="eyebrow">PERSONAL HOMEPAGE / 个人主页</p><h1>${design === 'b' ? '你好，<br>我是 <em>LarGeoYos.</em>' : 'LarGeoYos'}</h1><p class="intro">在学习中探索，在实践中积累。<br><span>这里是个人主页的设计预览，具体介绍待补充。</span></p><a class="action" href="#about">了解更多 ↓</a><div class="portrait" aria-label="照片占位"><span>PHOTO<br>待添加照片</span></div></section><section id="about" class="personal-section reveal"><p class="eyebrow">01 / ABOUT</p><div><h2>关于我</h2><p class="body-copy">这里可以介绍你的背景、关注的领域，以及你希望别人如何认识你。内容由你确认后填写。</p><div class="detail-row"><span>目前</span><strong>教育或工作经历待补充</strong></div><div class="detail-row"><span>关注</span><strong>研究方向与兴趣待补充</strong></div></div></section><section id="work" class="personal-section reveal"><p class="eyebrow">02 / SELECTED WORK</p><div><h2>经历与作品</h2><div class="work-item"><span>01</span><div><h3>项目名称待补充</h3><p>用一两句话介绍项目、研究或作品。</p></div><span>↗</span></div><div class="work-item"><span>02</span><div><h3>经历或成果待补充</h3><p>可以展示教育经历、论文、奖项或其他值得分享的事。</p></div><span>↗</span></div></div></section><section id="contact" class="personal-section contact reveal"><p class="eyebrow">03 / CONTACT</p><div><h2>保持联系。</h2><p>邮箱及公开联系方式待补充。</p></div></section></main><footer>LarGeoYos <span>设计探索 · 个人主页预览</span></footer>`;
body.innerHTML = personal ? personalPage : workspace;
// Keep the preview copy tied to the site's actual purpose.
if (!personal) {
  document.querySelector('.hero h1').innerHTML = design === 'b' ? '学习，<br>创造，<br>探索。' : '记录与探索';
  document.querySelector('.hero .intro').innerHTML = '博客、学习资料、游戏和工具。<br>欢迎来到 LarGeoYos 的数字空间。';
  document.querySelector('.statement h2').innerHTML = '每日签到日历';
  document.querySelector('.statement > p:last-of-type').textContent = '查看日期、农历与每日运势。';
  document.querySelector('.section-heading h2').textContent = '探索站点';
  document.querySelector('.section-heading > p:last-child').textContent = '选择一个栏目开始浏览。';
}
if (personal) {
  document.querySelector('.personal-hero h1').textContent = 'LarGeoYos';
  document.querySelector('.personal-hero .intro').innerHTML = '个人简介待补充。<br><span>教育背景、研究兴趣与经历可在确认后填写。</span>';
}
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => { el.classList.add('animate'); observer.observe(el); });
}
