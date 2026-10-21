(()=>{
 const lessons=window.COURSE.lessons,byId=new Map(lessons.map(l=>[l.id,l]));let chapter=1,query='',done=new Set(),last='c1-overview';
 try{done=new Set(JSON.parse(localStorage.getItem('de-course-done')||'[]'));last=localStorage.getItem('de-course-last')||last;}catch{}
 const content=document.getElementById('content'),nav=document.getElementById('directory'),search=document.getElementById('search'),actions=document.getElementById('lesson-actions');
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function directory(){
   const active=location.hash.slice(1),list=query?lessons.filter(l=>(l.title+' '+l.text).toLowerCase().includes(query.toLowerCase())):lessons.filter(l=>l.chapter===chapter);
   document.querySelectorAll('[data-chapter]').forEach(b=>{b.classList.toggle('active',+b.dataset.chapter===chapter);b.setAttribute('aria-pressed',+b.dataset.chapter===chapter);});
   document.getElementById('nav-caption').textContent=query?'全文搜索 · '+list.length+' 节':'第'+({1:'一',2:'二',3:'三',4:'四',5:'五',6:'六'}[chapter])+'章 · '+list.length+' 节';
   nav.innerHTML=list.length?list.map((l,i)=>`<a href="#${l.id}" class="${l.id===active?'active':''}"${l.id===active?' aria-current="page"':''}><span>${query?'0'+l.chapter:String(i+1).padStart(2,'0')}</span>${escape(l.title)}${done.has(l.id)?'<span class="nav-done" aria-label="已掌握">✓</span>':''}</a>`).join(''):'<p class="search-empty">没有找到。试试“译码器”“存储器”这样的关键词。</p>';
   const n=lessons.filter(l=>done.has(l.id)).length;document.getElementById('progress-text').textContent='已自评掌握 '+n+' / '+lessons.length+' 节';document.getElementById('progress-bar').style.width=(n/lessons.length*100)+'%';
 }
 function overview(){
   const first=c=>lessons.find(l=>l.chapter===c).id;
   return `<section class="hero"><p class="eyebrow">第一至六章 / 原理、图解与习题</p><h1>看懂电路，<br>再把题<em>做对。</em></h1><p class="hero-intro">不再把每一页看成同样重要。先知道这一节要会什么，再沿着电路和波形，把为什么讲明白。</p><div class="hero-actions"><a class="action" href="#${byId.has(last)?last:'c1-overview'}">继续学习 →</a><a class="action secondary" href="#${first(1)}">从第一章补基础</a></div><div class="chapter-index">${[[1,'数制和码制','把进制转换、补码运算与BCD、格雷码分清，计算先有可靠的起点。'],[2,'逻辑代数基础','从基本运算到真值表、卡诺图和门型转换，把化简过程一步步做对。'],[3,'门电路','从 MOS 开关、传输门到 TTL，学会追踪通路，判断电平、电流与接口。'],[4,'组合逻辑电路','从真值表到译码器、选择器、加法器，建立能独立解题的设计步骤。'],[5,'半导体存储电路','分清锁存与触发，再学寄存器、RAM、ROM、容量扩展与查表实现。'],[6,'时序逻辑电路','从逐拍分析到移位、计数、改模、级联和状态机，把每一步的时刻算清楚。']].map(([c,t,d])=>`<a class="chapter-card" href="#${first(c)}"><span class="number">0${c}</span><h2>${t}</h2><p>${d}</p><span class="go">${lessons.filter(l=>l.chapter===c).length} 节 · 开始这一章 →</span></a>`).join('')}</div><div class="learning-note"><h2>每一节，都带着一道题去学。</h2><p><strong>先读学习要求。</strong>“必须会”对应分析、计算和设计；“为什么讲”解释原理在做题中有什么用。电路和波形都用可缩放的矢量图，能切换条件的地方可以直接操作。</p><p><strong>先自己判断，再展开答案。</strong>遇到不会的题，先确定它是在考逻辑功能、触发时刻，还是电气与时间条件。最后用“我能独立完成本节题目了”做一次自评。</p><p class="source-note">共 ${lessons.length} 节学习单元。阅读位置和自评保存在当前浏览器；更换设备不会自动同步。内容是配套讲解与代表题演示，保留课本顺序，不是原书全部习题答案册。</p></div></section>`;
 }
 function show(){
   const id=decodeURIComponent(location.hash.slice(1))||'overview',l=byId.get(id);actions.hidden=!l;
   if(l){
     chapter=l.chapter;last=id;try{localStorage.setItem('de-course-last',id);}catch{}
     const label=l.label||'按课本顺序学习',chapterLabel=/^第[一二三四五六七八九十\d]+章/.test(label)?label:`第${l.chapter}章 / ${label}`;
     content.innerHTML=`<article class="lesson"><p class="eyebrow">${escape(chapterLabel)}</p><h1>${escape(l.title)}</h1><div class="reading-meta"><span>${escape(l.source||'阎石主编第六版配套讲解')}</span><span>先会判断，再独立做题</span></div>${l.html}</article>`;
     document.title=l.title+' · 数字电路学习手册';document.getElementById('location').textContent='第'+l.chapter+'章 · '+l.title;
     const i=lessons.indexOf(l),prev=document.getElementById('previous'),next=document.getElementById('next');prev.disabled=i===0;next.disabled=i===lessons.length-1;
     prev.onclick=()=>{if(i>0)location.hash=lessons[i-1].id;};next.onclick=()=>{if(i+1<lessons.length)location.hash=lessons[i+1].id;};
     const m=document.getElementById('mastered');m.classList.toggle('done',done.has(id));m.textContent=done.has(id)?'✓ 已自评掌握 · 点击可撤销':'我能独立完成本节题目了';m.setAttribute('aria-pressed',done.has(id));
     m.onclick=()=>{done.has(id)?done.delete(id):done.add(id);try{localStorage.setItem('de-course-done',JSON.stringify([...done]));}catch{}m.classList.toggle('done',done.has(id));m.textContent=done.has(id)?'✓ 已自评掌握 · 点击可撤销':'我能独立完成本节题目了';m.setAttribute('aria-pressed',done.has(id));directory();};
   }else if(id==='sources'){
     content.innerHTML='<article class="lesson"><p class="eyebrow">教材与使用说明</p><h1>这份手册，怎样用。</h1><div class="goal"><p><strong>依据：</strong>《数字电子技术基础》阎石主编，第六版；《数字电子技术基础 学习辅导与习题解答》阎石、王红编，第六版。</p></div><p>第一章讲数制转换、补码和码制；第二章讲逻辑代数、描述互换、化简和门型转换；第三章沿用此前整理的完整讲义；第四章整理组合逻辑教学与图解；第五章收录锁存器、触发器、寄存器与存储器教学；第六章讲时序分析、移位寄存器、计数器、顺序脉冲和序列产生、同步设计、自启动、异步拓展、可编程实现及时间条件。页码均为教材印刷页。</p><p>讲义使用原创解释、公式、重绘矢量图及选取的代表题说明。涉及门延迟、输入阈值、芯片控制端有效电平等，优先按题设和教材对应图分析。抽象功能表与具体门电路在禁态下的输出，不应混为一谈。</p><p>模拟图按各图说明的理想逻辑模型工作。它们服务于电路分析与习题推理，不模拟晶体管模拟波形、亚稳态或所有器件寄生参数。旧版教材中的产品容量、市场现状和特定擦写电压不是当前通用规格，本站不把它们当作现行选型建议。</p><p>网站不上传两本教材 PDF。学习位置与自评只在本浏览器保存。搜索覆盖讲义正文，答案可逐个展开。</p><p><a href="#overview">回到学习首页 →</a></p></article>';document.title='教材与使用说明 · 数字电路学习手册';document.getElementById('location').textContent='教材与使用说明';
   }else{content.innerHTML=overview();document.title='把电路学明白 · 数字电子技术学习手册';document.getElementById('location').textContent='第一至六章 · 原理与做题';}
   directory();document.body.classList.remove('menu-open');document.getElementById('menu').setAttribute('aria-expanded','false');window.scrollTo({top:0,behavior:'instant'});
   content.querySelectorAll('a[href^="#"]').forEach(a=>{const target=a.getAttribute('href').slice(1);if(target.startsWith('c3-')&&!byId.has(target))a.removeAttribute('href');});
 }
 document.querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>{chapter=+b.dataset.chapter;query='';search.value='';directory();});search.oninput=()=>{query=search.value.trim();directory();};document.getElementById('menu').onclick=()=>{const open=document.body.classList.toggle('menu-open');document.getElementById('menu').setAttribute('aria-expanded',open);};document.querySelector('.skip').onclick=e=>{e.preventDefault();document.getElementById('main').focus();document.getElementById('main').scrollIntoView();};document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open');document.getElementById('menu').setAttribute('aria-expanded','false');}});
 window.addEventListener('hashchange',show);window.addEventListener('message',e=>{if(e.origin!==location.origin&&location.protocol!=='file:')return;const d=e.data;if(d?.type!=='de-course-height'||!Number.isFinite(d.height))return;const f=[...document.querySelectorAll('iframe')].find(f=>f.contentWindow===e.source);if(f)f.style.height=Math.min(5000,Math.max(90,d.height))+'px';});show();
})();

