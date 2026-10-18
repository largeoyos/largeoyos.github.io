'use strict';
const C=window.COURSE,S=window.CourseState;
let storage;
try{storage=window.localStorage;}catch{storage={getItem(){throw Error('本地存储被禁用');},setItem(){throw Error('本地存储被禁用');}};}
const loaded=S.load(storage);let state=loaded.state;
let toastTimer,saveTimer,copyIndex=0;const copies=new Map();
const main=document.querySelector('#main');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=l=>`#lesson/${l.id}`;
const dateToday=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function warn(message){const el=document.querySelector('#storageWarning');el.textContent=message;el.hidden=!message;}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
function persist(){clearTimeout(saveTimer);const result=S.save(storage,state);document.querySelector('#saveStatus').textContent=result.ok?'已保存 '+new Date().toLocaleTimeString('zh-CN'):'保存失败，请导出备份';if(!result.ok)warn(result.message);return result.ok;}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(persist,300);}
function applyTheme(){document.body.classList.toggle('dark',state.theme==='dark');document.querySelector('#themeButton').textContent=state.theme==='dark'?'浅色':'深色';document.querySelector('#themeButton').setAttribute('aria-label',state.theme==='dark'?'切换浅色模式':'切换深色模式');}
function codeBlock(code,command=false){const id=String(++copyIndex);copies.set(id,code);return `<div class="code-wrap ${command?'command':''}"><button data-copy="${id}" aria-label="复制这段代码">复制</button><pre><code>${esc(code)}</code></pre></div>`;}
function disclosure(title,body){return `<details class="disclosure"><summary>${title}</summary>${body}</details>`;}
function download(name){return `<a href="downloads/${encodeURIComponent(name)}" download>${esc(name)}</a>`;}
function renderNav(){const current=location.hash.split('/')[1];document.querySelector('#courseNav').innerHTML=C.weeks.map(w=>{
 const lessons=C.lessons.filter(l=>l.week===w.number);const done=lessons.filter(l=>state.lessons[l.id].status==='done').length;
 return `<details ${lessons.some(l=>l.id===current)||(!current&&w.number===1)?'open':''}><summary>第 ${w.number} 周 · ${esc(w.title)} <small>${done}/3</small></summary>${lessons.map(l=>`<a class="lesson-link ${state.lessons[l.id].status==='done'?'done':''}" href="${link(l)}" ${l.id===current?'aria-current="page"':''}><span>${l.id}</span><span>${esc(l.title)}</span></a>`).join('')}</details>`;
 }).join('');}
function lessonRow(l){return `<a href="${link(l)}">${l.id} ${esc(l.title)}</a>`;}
function home(){
 const values=Object.values(state.lessons),done=values.filter(v=>v.status==='done').length;
 const next=C.lessons.find(l=>['doing','review'].includes(state.lessons[l.id].status))||C.lessons.find(l=>state.lessons[l.id].status==='todo');
 const blocked=C.lessons.filter(l=>state.lessons[l.id].status==='blocked');const review=C.lessons.filter(l=>state.lessons[l.id].status==='review');
 return `<div class="meta"><span>为本科见习准备的中文实践课程</span><span>36 课 · 本地自学</span></div><h1>从张量出发，<br>走到真正的码流。</h1><p class="intro">把组会里的概念，变成你能运行、解释和修改的实验。先完成八周基础，再用四周进入超先验、上下文建模和研究实践。</p>
 <section class="next-lesson"><div><small>${next?'下一步，按掌握程度前进':'当前路线状态'}</small><h2>${next?esc(next.title):done===36?'十二周课程已完成':'先解决待完成的环境阻塞'}</h2><p>${next?esc(next.goal):'整理学习证据与未解决问题，再决定下一步。'}</p></div>${next?`<a class="button primary" href="${link(next)}">${next.id} · 开始学习</a>`:'<a class="button" href="#notes">整理笔记</a>'}</section>
 <div class="home-progress"><span>${done} / 36 课已掌握</span><span>已记录 ${(values.reduce((s,v)=>s+v.minutes,0)/60).toFixed(1)} 小时</span><span>课程状态由你自检确认</span></div><div class="progress-line" role="progressbar" aria-label="课程掌握进度" aria-valuemin="0" aria-valuemax="36" aria-valuenow="${done}"><span style="width:${done/36*100}%"></span></div>
 <div class="fields"><label>学习开始日（可以调整）<input type="date" id="startDate" value="${esc(state.startDate||'')}"></label><p class="muted">${state.startDate?'建议日期只作参考，未学会的课可以顺延。':'开始第一课时自动记录日期，不按日历催进度。'}</p></div>
 ${review.length?`<p>待复习：${review.map(lessonRow).join(' · ')}</p>`:''}${blocked.length?`<p>环境阻塞：${blocked.map(lessonRow).join(' · ')}。其他课程仍可继续。</p>`:''}
 <aside class="seminar-entry"><small>组会专题 · M03</small><h2><a href="#seminar/M03">第三次组会：从理解到生成与行动</a></h2><p>VLA、长视频、生成模型、可控编辑与文字超分。五条研究线按需选读，不增加每周必修预算。</p></aside><h2>每周怎样学</h2><p>三次主课，每次约 150 分钟；组会约 90 分钟、复盘 60 分钟，再留最多两小时机动。组会超过预算，就减少当周选做题。</p><p>每课按「讲解 → 运行示例 → 独立练习 → 自检 → 对照答案」进行。把代码复制运行只是起点；能解释一次修改及其结果，才标记为“已掌握”。</p>
 <div class="actions"><a class="button" href="#lab">运行环境与练习包</a><a class="button" href="downloads/完整教案.html" target="_blank" rel="noopener">打印完整教案</a>${download('完整教案.md')}</div>
 <h2>十二周学习路线</h2>${C.weeks.map(w=>{
  let dates='';if(state.startDate){const d=new Date(state.startDate+'T12:00:00');d.setDate(d.getDate()+(w.number-1)*7);const e=new Date(d);e.setDate(e.getDate()+6);dates=` · 建议 ${d.toLocaleDateString('zh-CN')}—${e.toLocaleDateString('zh-CN')}`;}
  const ls=C.lessons.filter(l=>l.week===w.number);return `${w.number===9?'<h2 class="route-phase">四周进阶 · 从模型走向研究问题</h2>':''}<section class="route-row"><span class="week-number">${String(w.number).padStart(2,'0')}</span><div><h3>${esc(w.title)}</h3><p>${esc(w.outcome)}${dates}</p><div class="route-links">${ls.map(lessonRow).join('')}</div></div><a class="button" href="${link(ls[0])}">进入本周</a></section>`;
 }).join('')}`;
}
function resourceReading(r){const v=C.resources.find(x=>x.id===r.resource);return `<div class="reading"><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.title)}</a><p>${esc(r.section)} · 建议 ${r.minutes} 分钟</p><small>${esc(v.author)} · ${v.language} · ${v.level} · 核验 ${v.checked}</small></div>`;}
function lessonPage(l){
 const v=state.lessons[l.id];const n=l.number;
 return `<article class="lesson-body"><div class="meta"><a href="#home">学习路线</a><span>第 ${l.week} 周 · ${l.id}</span><span>150 分钟 · ${n<=24?'入门阶段':'进阶阶段'}</span></div><h1>${esc(l.title)}</h1><p class="intro">${esc(l.goal)}</p>
 <div class="objective"><p><strong>先修：</strong>${esc(l.prerequisite)}</p><p><strong>组会联系：</strong>${esc(l.connection)}</p><p><strong>学习节奏：</strong>回顾 10 分钟 → 讲解与阅读 35 → 跑示例 25 → 独立练习 50 → 自检记录 30。</p></div>
 <div class="actions"><a href="#lesson/${l.id}/exercise">跳到独立练习</a><a href="#lesson/${l.id}/record">打开本课记录</a><button data-print>打印本课</button></div>
 <h2>先理解这个问题</h2>${l.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}<div class="formula" aria-label="本课核心公式">${esc(l.formula)}</div><p class="example"><strong>算一个小例子：</strong>${esc(l.example)}</p>
 <h2>带着目的读资料</h2>${l.reading.map(resourceReading).join('')}${disclosure('选读：中文视频与延伸',resourceReading(l.supplement)+'<p class="muted">视频用于补充直觉，不需要整套刷完。保留作者课程索引，避免链接到搬运内容。</p>')}
 <h2>运行与观察</h2><p>${esc(l.shell)}。先从<a href="#lab">实验台</a>下载完整练习包；示例使用共享工具 course_lab.py，网页本身不运行 Python。</p>${codeBlock(l.command,true)}<p><strong>预期：</strong>${esc(l.expected)}</p>
 ${disclosure('查看可运行参考示例',codeBlock(l.code))}${l.supportCode?disclosure('相关工具实现：展开读懂调用背后的代码',codeBlock(l.supportCode)):''}
 <p><strong>常见错误：</strong>${esc(l.error)}</p>
 <section class="exercise" id="exercise"><h2>动手，把这一课做出来</h2><p>${esc(l.task)}</p><div class="actions"><button data-script="${l.id}" data-kind="starter">下载本课练习 .py</button><a href="downloads/课程练习与答案.zip" download>下载共享工具与完整练习包</a></div>
 ${disclosure('提示 1：从哪里开始',`<p>${esc(l.hints[0])}</p>`)}${disclosure('提示 2：检查关键步骤',`<p>${esc(l.hints[1])}</p>`)}${disclosure('参考答案：先尝试，再对照',`<p>按上面的预期输出和验收条件检查。代码中的 assert 是程序自检，文字题请对照下方解释。</p>${codeBlock(l.code)}<button data-script="${l.id}" data-kind="answer">下载本课答案 .py</button>`)}<p><strong>选做：</strong>${esc(l.extra)}</p></section>
 <h2>三个问题，检查理解</h2>${l.qa.map((q,i)=>`<section class="question"><p><strong>${i+1}.</strong> ${esc(q.question)}</p><details><summary>查看解释</summary><p>${esc(q.answer)}</p></details></section>`).join('')}
 <h2>本课过关标准</h2><ul class="checklist">${l.checks.map(x=>`<li>${esc(x)}</li>`).join('')}<li>不看答案，能解释自己修改的一处代码。</li></ul><p class="muted">没通过时：${n>1?`返回 <a href="#lesson/L${String(n-1).padStart(2,'0')}">上一课</a>复习先修内容`:'缩小输入，先逐行打印中间值'}，再做本课小例子。学习状态不自动根据代码文件或历史结果判断。</p>
 <section class="lesson-record" id="record"><h2>留下本课证据</h2><div class="fields"><label>学习状态<select id="lessonStatus" data-lesson="${l.id}">${Object.entries(S.statuses).map(([k,t])=>`<option value="${k}" ${v.status===k?'selected':''}>${t}</option>`).join('')}</select></label><label>累计实际分钟<input id="lessonMinutes" data-lesson="${l.id}" type="number" min="0" max="100000" step="1" value="${v.minutes}"></label></div><label for="lessonNote">发现、报错、结果文件和还没想明白的问题</label><textarea id="lessonNote" data-lesson="${l.id}" maxlength="100000" placeholder="写下实际运行命令、一个观察和一个问题。">${esc(v.note)}</textarea></section>
 <nav class="pager" aria-label="课时翻页">${n>1?`<a href="#lesson/L${String(n-1).padStart(2,'0')}">上一课 · L${String(n-1).padStart(2,'0')}</a>`:'<a href="#home">返回路线</a>'}${n<36?`<a href="#lesson/L${String(n+1).padStart(2,'0')}">下一课 · L${String(n+1).padStart(2,'0')}</a>`:'<a href="#notes">整理最终笔记</a>'}</nav></article>`;
}
function library(){return `<h1>资料库</h1><p class="intro">每课只选一至两项必读。先读指定小节，遇到具体问题再向外扩展。</p><div class="filters"><input type="search" id="resourceSearch" placeholder="搜索主题、作者或章节" aria-label="搜索资料"><select id="resourceWeek" aria-label="按周筛选"><option value="">全部课程</option>${C.weeks.map(w=>`<option value="${w.number}">第 ${w.number} 周</option>`).join('')}</select><select id="resourceLanguage" aria-label="语言"><option value="">全部语言</option><option>中文</option><option>英文</option></select><select id="resourceType" aria-label="必读或选读"><option value="">必读与选读</option><option value="required">必读</option><option value="optional">选读</option></select><select id="resourceTopic" aria-label="主题"><option value="">全部主题</option>${[...new Set(C.lessons.flatMap(l=>l.tags))].map(t=>`<option>${t}</option>`).join('')}</select></div><p id="resourceCount" class="muted" aria-live="polite"></p><div id="resourceResults"></div>`;}
function filterResources(){
 const text=document.querySelector('#resourceSearch').value.trim().toLowerCase(),week=document.querySelector('#resourceWeek').value,language=document.querySelector('#resourceLanguage').value,type=document.querySelector('#resourceType').value,topic=document.querySelector('#resourceTopic').value;
 const rows=C.resources.map(r=>{const uses=C.lessons.flatMap(l=>[...l.reading.map(x=>({...x,kind:'required'})),{...l.supplement,kind:'optional'}].filter(x=>x.resource===r.id&&(!week||l.week===Number(week))&&(!topic||l.tags.includes(topic))&&(!type||x.kind===type)).map(x=>({l,...x})));return{r,uses};}).filter(({r,uses})=>uses.length&&(!language||r.language===language)&&(!text||(r.title+r.author+uses.map(u=>u.section+u.l.title).join('')).toLowerCase().includes(text)));
 document.querySelector('#resourceCount').textContent=`${rows.length} 项资料；每项注明对应课程及阅读范围。`;
 document.querySelector('#resourceResults').innerHTML=rows.length?rows.map(({r,uses})=>`<article class="resource-item"><h3><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a></h3><p>${esc(r.author)} · ${r.language} · ${r.level} · 链接核验 ${r.checked}</p>${uses.map(u=>`<p><span class="badge">${u.kind==='required'?'必读':'选读'}</span><a href="${link(u.l)}">${u.l.id}</a> ${esc(u.section)} · ${u.minutes} 分钟</p>`).join('')}</article>`).join(''):'<p class="empty">没有匹配资料。试试减少筛选条件或换一个关键词。</p>';
}
function markdown(text){let inCode=false,buffer=[],html=[];const inline=s=>esc(s).replace(/`([^`]+)`/g,'<code>$1</code>');for(const line of text.split('\n')){if(line.startsWith('```')){if(inCode){html.push(codeBlock(buffer.join('\n'),true));buffer=[];}inCode=!inCode;continue;}if(inCode){buffer.push(line);continue;}if(line.startsWith('### '))html.push('<h3>'+inline(line.slice(4))+'</h3>');else if(line.startsWith('## '))html.push('<h2>'+inline(line.slice(3))+'</h2>');else if(line.startsWith('# '))html.push('<h2>'+inline(line.slice(2))+'</h2>');else if(line.trim())html.push('<p>'+inline(line)+'</p>');}return html.join('');}
function lab(){return `<h1>实验台</h1><p class="intro">正文可离线学，代码在本机执行。Windows 完成基础训练，WSL 独立环境负责 CompressAI 真实码流。</p><h2>教学文件与练习包</h2><ul class="download-list"><li>${download('课程练习与答案.zip')}：36 份练习、36 份答案、共享工具和指南。</li><li>${download('完整教案.md')}：全部讲解、代码、问答与资料定位。</li><li>${download('资料索引.md')} · ${download('运行指南.md')}</li><li><a href="downloads/完整教案.html" target="_blank" rel="noopener">完整打印版</a>：在浏览器中打印或保存为 PDF。</li></ul>
 <h2>验证记录</h2><div class="status-block"><p>${esc(C.validation.summary)}</p><p><strong>Linux：</strong>${esc(C.validation.linux)}</p><p><strong>本地：</strong>${esc(C.validation.localSummary||'正在核对参考答案')}</p>${C.validation.notes?`<ul>${C.validation.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}<p class="muted">这些是教案制作时的验证，不代表你已经完成学习。你的状态需要独立自检。</p></div>
 <h2>已完成的教学基准</h2><p>这是五张 Kodak 图片上的实际测量，供你学习 CSV 字段和作图；正式报告仍应记录自己的运行环境与命令。</p><div class="actions">${(C.validation.benchmarkFiles||[]).map(download).join('')}</div><img class="measured-rd" src="downloads/实测RD-2026-09-23.svg" alt="五张 Kodak 图片的实测 JPEG、因子化先验与超先验率失真曲线"><p class="muted">各点为五张图的逐图指标算术平均；横轴采用完整文件 bpp。曲线不能代表全数据集上的一般性能。</p>
 <h2>实验记录模板</h2><p>每次保留：问题与预先假设、唯一变量、固定条件、图片清单与哈希、模型及版本、随机种子、像素范围、命令、原始 CSV、图表、结论与限制。</p>${codeBlock('实验问题：\n预先假设：\n唯一变量：\n固定条件：\n数据来源 / 训练与测试是否重叠：\n代码版本 / 软件与硬件：\n运行命令：\n结果文件：\n观察：\n替代解释与限制：\n下一步：',true)}<button id="downloadReportTemplate">下载报告模板</button><div class="environment">${markdown(C.environment)}</div>`;}
function notes(){return `<h1>学习笔记</h1><p class="intro">把观察与猜想分开记。保留运行命令、结果位置和仍不确定的地方。</p><div class="actions"><button class="primary" id="addMeeting">新增组会记录</button><button id="exportNotes">导出全部笔记 Markdown</button></div><div id="meetingList">${state.meetings.map(m=>`<section class="meeting" data-meeting="${esc(m.id)}"><h3>${esc(m.title||'组会记录')}</h3><div class="fields"><label>日期<input type="date" data-field="date" value="${esc(m.date)}"></label><label>报告或主题<input data-field="title" value="${esc(m.title)}" maxlength="300" placeholder="例如：神经视频压缩"></label><label>关联课程<select data-field="lesson"><option value="">暂不关联</option>${C.lessons.map(l=>`<option value="${l.id}" ${m.lesson===l.id?'selected':''}>${l.id} ${esc(l.title)}</option>`).join('')}</select></label></div><label>相关术语<input data-field="terms" value="${esc(m.terms)}" placeholder="如：bpp、超先验、PTQ"></label><p><label>问题、方法、评价、我的疑问<textarea data-field="body" maxlength="100000">${esc(m.body)}</textarea></label></p></section>`).join('')||'<p class="empty">还没有组会记录。听到一个具体问题，就从这里开始记。</p>'}</div><h2>课时笔记</h2><div class="note-list">${C.lessons.filter(l=>state.lessons[l.id].note).map(l=>`<article><a href="${link(l)}/record">${l.id} ${esc(l.title)}</a><p>${esc(state.lessons[l.id].note)}</p></article>`).join('')||'<p class="empty">课时页下方填写的记录会汇总到这里。</p>'}</div>`;}
function glossary(){return `<h1>术语与概念演示</h1><p class="intro">先用小例子建立直觉，再回到课程里的公式与实验。下面的 RD 数据明确为示意，不是模型评测。</p>
 <section class="demo"><h2>张量：形状变化不等于交换轴</h2>${[['n','批量 N',1],['c','通道 C',3],['h','高度 H',32],['w','宽度 W',32]].map(([id,title,v])=>`<label>${title}<input id="shape-${id}" type="number" min="1" max="2048" value="${v}" data-demo></label>`).join('')}<p id="shapeOutput" class="demo-output" aria-live="polite"></p><p class="muted">HWC → CHW 用 permute；新增批量轴用 unsqueeze。元素数不变不代表语义不变。</p></section>
 <section class="demo"><h2>量化：改变步长，看误差</h2><label>量化步长 Δ<input type="range" min="0.05" max="1" step="0.05" value="0.25" id="quantStep" data-demo></label><p id="quantOutput" class="demo-output" aria-live="polite"></p><p class="muted">固定 y=0.37；使用 ties-to-even，与本课 PyTorch round 的半整数规则一致。本示例不含截断。</p></section>
 <section class="demo"><h2>率失真：不同曲线可能交叉</h2><label>观察工作点<input type="range" min="0" max="3" step="1" value="1" id="rdPoint" data-demo></label><svg id="rdDemo" viewBox="0 0 580 290" role="img" aria-label="示意 RD 曲线，非实测数据"></svg><p id="rdOutput" aria-live="polite"></p><p class="muted">横轴 bpp，纵轴 PSNR。A、B 全部是教学示意值，不能用于评价任何真实模型。</p></section>
 <h2>常用术语</h2>${C.glossary.map(([en,zh,meaning,id])=>`<section class="glossary-row"><strong>${esc(en)}<br><small>${esc(zh)}</small></strong><p>${esc(meaning)} <a href="#lesson/${id}">回到 ${id}</a></p></section>`).join('')}`;}
function demos(){const get=id=>Math.max(1,Math.min(2048,Number(document.querySelector('#shape-'+id).value)||1));const n=get('n'),c=get('c'),h=get('h'),w=get('w');document.querySelector('#shapeOutput').textContent=`NCHW = [${n}, ${c}, ${h}, ${w}] → 每批 ${n*c*h*w} 个值 → float32 数据约 ${(n*c*h*w*4/1024).toFixed(1)} KiB（不含对象开销）`;
 const step=Number(document.querySelector('#quantStep').value),x=.37/step,base=Math.floor(x),q=Math.abs(x-base-.5)<1e-10?(base%2===0?base:base+1):Math.round(x);document.querySelector('#quantOutput').textContent=`Δ=${step.toFixed(2)}；q=${q}；重建=${(q*step).toFixed(3)}；误差=${Math.abs(.37-q*step).toFixed(3)} ≤ ${(step/2).toFixed(3)}`;
 const a=[28,31,33,34],b=[27,30,33.5,35],bp=[.15,.3,.5,.8],sel=Number(document.querySelector('#rdPoint').value);const sx=x=>60+x*550,sy=y=>250-(y-25)*20;
 document.querySelector('#rdDemo').innerHTML=`<path d="M60 30V250H535" stroke="currentColor" fill="none"/><text x="16" y="22">PSNR</text><text x="482" y="280">bpp</text><text x="320" y="25">教学示意 · 非实测</text>${[26,30,34].map(y=>`<text x="22" y="${sy(y)}">${y}</text>`).join('')}${bp.map(x=>`<text x="${sx(x)-10}" y="270">${x}</text>`).join('')}${[[a,'var(--accent)','A'],[b,'var(--blue)','B']].map(([v,color,label],j)=>`<polyline points="${v.map((y,i)=>`${sx(bp[i])},${sy(y)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2"/><circle cx="${sx(bp[sel])}" cy="${sy(v[sel])}" r="6" fill="${color}"/><text x="65" y="${30+j*20}" style="fill:${color}">${label}</text>`).join('')}`;
 document.querySelector('#rdOutput').textContent=`在 ${bp[sel]} bpp 的示意点：A=${a[sel]} dB，B=${b[sel]} dB。优势随工作区间改变。`;
}
function archive(){return `<div class="archive"><h1>学习档案</h1><p>八周旧计划的任务编号与新课程不同，因此只归档，不按位置继承完成状态。原 localStorage 键保持不变；更换浏览器或访问地址时，请使用备份恢复。</p><p><a href="legacy-v1/index.html" target="_blank" rel="noopener">打开保留的旧版页面</a></p>${state.legacy?`<button id="exportLegacy">${state.legacy.unreadableCurrentBackup?'导出无法读取的新版原始记录':'导出旧版原始记录'}</button><pre>${esc(JSON.stringify(state.legacy,null,2))}</pre>`:'<p class="empty">当前浏览器没有检测到旧版数据。如果旧记录在别的浏览器中，先在那里导出备份，再用页顶“恢复”导入。</p>'}</div>`;}
function render(){copies.clear();copyIndex=0;const parts=(location.hash||'#home').slice(1).split('/');const view=parts[0];const l=C.lessons.find(l=>l.id===parts[1]);
 main.innerHTML=rViews.includes(view)?renderResearch(view,parts[1]):view==='lesson'?(l?lessonPage(l):'<h1>未找到课程</h1><p><a href="#home">返回学习路线</a></p>'):({home,library,lab,notes,glossary,archive}[view]||home)();
 document.title=(view==='lesson'&&l?l.id+' '+l.title:'从张量到码流')+' · 见习前哨';renderNav();document.querySelector('#mobileContents > summary').textContent='十二周课程目录';if(rViews.includes(view)){setupResearch(view,parts);document.title=(view==='chapter'?(R.chapters.find(c=>c.id===parts[1])?.title||'研究章节'):view==='seminar'?'第三次组会 · VIDAR':'研究地图')+' · 见习前哨';}
 document.querySelectorAll('.masthead nav a').forEach(a=>{if(a.hash===`#${view}`||(view==='lesson'&&a.hash==='#home')||(rViews.includes(view)&&a.hash==='#research'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(view==='library')filterResources();if(view==='glossary')demos();
 if(parts[2]){requestAnimationFrame(()=>document.getElementById(parts[2])?.scrollIntoView());}else{window.scrollTo(0,0);main.focus({preventScroll:true});}
}
function blobDownload(text,name,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function exportBackup(){persist();blobDownload(JSON.stringify({version:2,exportedAt:new Date().toISOString(),state},null,2),`见习前哨-学习备份-${dateToday()}.json`,'application/json');toast('备份已导出');}
async function importBackup(event){const file=event.target.files?.[0];if(!file)return;try{if(file.size>64*1024*1024)throw Error('备份超过 64 MB');const parsed=JSON.parse(await file.text());const incoming=S.validate(parsed);
 if(!(parsed.state||parsed).research)incoming.research=state.research;
 if(incoming.legacy&&((parsed.version===1)||!parsed.version)){incoming.lessons=state.lessons;incoming.meetings=state.meetings;incoming.startDate=state.startDate;incoming.theme=state.theme;}
 try{storage.setItem('pytorch-field-notes-v2-before-import',JSON.stringify(state));}catch(e){throw Error('无法保存导入前快照；请先导出当前备份，再恢复：'+e.message);}
 state=incoming;persist();applyTheme();render();toast('备份已恢复；导入前快照已保留');
 }catch(e){warn('导入失败，当前记录未改变：'+e.message);}finally{event.target.value='';}}
document.addEventListener('click',async e=>{
 if(e.target.closest('.skip')){e.preventDefault();main.focus();main.scrollIntoView();return;}
 const copy=e.target.closest('[data-copy]');if(copy){const text=copies.get(copy.dataset.copy)||'';try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);else throw Error('clipboard unavailable');toast('已复制');}catch{const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();toast(ok?'已复制':'自动复制不可用，请选中代码复制');}return;}
 const script=e.target.closest('[data-script]');if(script){const l=C.lessons.find(l=>l.id===script.dataset.script);const code=script.dataset.kind==='starter'?l.starter:`from pathlib import Path\nimport sys\nsys.path.insert(0,str(Path(__file__).resolve().parents[1]))\nfrom course_lab import *\n\n${l.code}\n\nif __name__ == '__main__':\n    lesson${String(l.number).padStart(2,'0')}()\n`;blobDownload(code,l.id+'.py');toast('请放入练习包对应的 exercises 或 answers 目录');return;}
 if(e.target.closest('[data-print]')){document.querySelectorAll('main details').forEach(d=>d.open=true);window.print();}
 if(e.target.id==='addMeeting'){state.meetings.unshift({id:globalThis.crypto?.randomUUID?.()||String(Date.now()),date:dateToday(),title:'',lesson:'',terms:'',body:''});persist();render();}
 if(e.target.id==='exportLegacy'){const unreadable=state.legacy?.unreadableCurrentBackup;blobDownload(unreadable||JSON.stringify({version:1,state:state.legacy},null,2),unreadable?'无法读取的新版原始记录.json':'旧版学习记录.json','application/json');}
 if(e.target.id==='exportNotes'){const text=['# 学习笔记',...C.lessons.filter(l=>state.lessons[l.id].note).map(l=>`## ${l.id} ${l.title}\n\n${state.lessons[l.id].note}`),...state.meetings.map(m=>`## ${m.date} ${m.title}\n\n关联课程：${m.lesson}\n术语：${m.terms}\n\n${m.body}`)].join('\n\n');blobDownload(text,'学习与组会笔记.md');}
 if(e.target.id==='downloadReportTemplate')blobDownload('# 实验报告\n\n## 问题与预先假设\n\n## 唯一变量与固定条件\n\n## 数据与环境\n\n## 命令与原始结果文件\n\n## 观察与解释\n\n## 限制与下一步\n','实验报告模板.md');
});
document.addEventListener('input',e=>{
 if(e.target.id==='lessonNote'){state.lessons[e.target.dataset.lesson].note=e.target.value;scheduleSave();}
 if(e.target.id==='lessonMinutes'){const n=Number(e.target.value);if(Number.isFinite(n)&&n>=0&&n<=100000){state.lessons[e.target.dataset.lesson].minutes=n;scheduleSave();}}
 const m=e.target.closest('[data-meeting]');if(m&&e.target.dataset.field){const item=state.meetings.find(x=>x.id===m.dataset.meeting);item[e.target.dataset.field]=e.target.value;scheduleSave();}
 if(e.target.closest('.filters'))filterResources();if(e.target.hasAttribute('data-demo'))demos();
});
document.addEventListener('change',e=>{
 if(e.target.id==='lessonStatus'){const id=e.target.dataset.lesson;state.lessons[id].status=e.target.value;if(!state.startDate&&e.target.value!=='todo')state.startDate=dateToday();persist();renderNav();toast('状态已更新，按你的自检结果记录');}
 if(e.target.id==='startDate'){state.startDate=e.target.value||null;persist();render();}
});
document.querySelector('#themeButton').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';applyTheme();persist();});
document.querySelector('#exportButton').addEventListener('click',exportBackup);
document.querySelector('#importInput').addEventListener('change',importBackup);
document.querySelector('label[for=importInput]').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();document.querySelector('#importInput').click();}});
window.addEventListener('hashchange',()=>{if(saveTimer)persist();render();});
window.addEventListener('pagehide',()=>{if(saveTimer)persist();});
const mobileMedia=matchMedia('(max-width:760px)');
if(mobileMedia.matches)document.querySelector('#mobileContents').open=false;
mobileMedia.addEventListener('change',event=>{document.querySelector('#mobileContents').open=!event.matches;});
applyTheme();if(loaded.warning)warn(loaded.warning);render();
