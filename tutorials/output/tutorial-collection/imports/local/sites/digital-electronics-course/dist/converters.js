/* Chapter 8: ideal textbook models. Voltages are V; time units are explicit. */
(()=>{
 'use strict';
 const M={
  dac:(n,d,ref,g=-1)=>g*ref*d/2**n,
  signed:(d,n)=>d>=2**(n-1)?d-2**n:d,
  quant(v,n,ref,mode='floor'){
   const m=2**n,delta=mode==='round'?2*ref/(2*m-1):ref/m;
   const d=Math.min(m-1,Math.max(0,Math.floor(v/delta+(mode==='round'?.5:0)+1e-12)));
   return{d,delta,value:d*delta,error:d*delta-v,overload:v<0||v>ref};
  },
  sar(v,n,ref,mode='floor'){
   const delta=mode==='round'?2*ref/(2**(n+1)-1):ref/2**n;let d=0,steps=[];
   for(let b=n-1;b>=0;b--){const trial=d+2**b,threshold=(trial-(mode==='round'?.5:0))*delta,keep=v+1e-12>=threshold;if(keep)d=trial;steps.push({b,trial,threshold,keep,d});}return{d,delta,steps};
  },
  gain:(n,d,ratio,feedback=false)=>feedback?(d? -ratio*2**n/d:null):-ratio*d/2**n,
  reference:(n,ref,change)=>({limit:Math.abs(ref)/(2*(2**n-1)),lsb:Math.abs(ref)/2**n,errorLSB:(2**n-1)*Math.abs(change/ref)}),
  dual:(v,ref,N,clock)=>({t1:N/clock,t2:N/clock*v/ref,count:N*v/ref}),
  noise:(hz,ms,phase)=>ms? (Math.cos(phase)-Math.cos(2*Math.PI*hz*ms/1000+phase))/(2*Math.PI*hz*ms/1000):Math.sin(phase),
  sigma(x,count=64){let u=0,b=0,bits=[],states=[0];for(let i=0;i<count;i++){u+=x-(2*b-1);b=u>1e-12?1:0;bits.push(b);states.push(u);}return{bits,states,density:bits.reduce((a,b)=>a+b,0)/count};},
  half(v){const h=Math.min(3,Math.floor(v*4)),coarse=h/4,r=v-coarse,l=Math.min(3,Math.floor(r*16+1e-12));return{h,coarse,r,l,d:4*h+l};},
  vf:(v,R,tw,I=.001)=>v/(I*R*tw),
  lm:(rt,ct,rl,rs)=>rs/(1.9*Math.log(3)*rt*ct*rl),
  settle:t=>20*Math.exp(-t/1.2)*Math.cos(4*t),
  wave(mode){if(mode==='johnson')return[0,8,12,14,15,7,3,1];if(mode==='ram')return[0,1,3,7,15,15,7,3,1,0];return Array.from({length:16},(_,i)=>i);}
 };
 if(typeof window!=='undefined')window.ConverterModels=M;
 if(typeof module!=='undefined')module.exports=M;
 if(typeof document==='undefined')return;
 const root=document.querySelector('[data-lab]');if(!root)return;
 const kind=root.dataset.lab;
 const C={ink:'var(--foreground)',green:'var(--primary)',blue:'var(--blue)',orange:'var(--orange)',red:'var(--red)',muted:'var(--muted-foreground)',line:'var(--border)'};
 const E=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const F=(x,k=4)=>Number.isFinite(x)?String(+x.toFixed(k)):'—',B=(d,n=4)=>d.toString(2).padStart(n,'0');
 const T=(x,y,t,a='start',color='ink',size=12)=>`<text x="${x}" y="${y}" text-anchor="${a}" style="font-size:${size}px;fill:${C[color]||color}">${E(t)}</text>`;
 const W=(d,color='ink',dash=false)=>`<path d="${d}" fill="none" stroke="${C[color]||color}" stroke-width="${color==='green'?2.5:1.5}" stroke-linejoin="round"${dash?' stroke-dasharray="4 3"':''}/>`;
 const dot=(x,y,color='ink')=>`<circle cx="${x}" cy="${y}" r="2.6" fill="${C[color]}"/>`;
 const box=(x,y,w,h,label,color='ink')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="var(--card)" stroke="${C[color]}"/>`+T(x+w/2,y+h/2+4,label,'middle',color);
 const gnd=(x,y)=>W(`M${x} ${y} v6 m-9 0 h18 m-14 5 h10 m-7 5 h4`);
 const arr=(x,y,x2,y2,color='green')=>{let a=Math.atan2(y2-y,x2-x);return W(`M${x} ${y} L${x2} ${y2} M${x2-6*Math.cos(a-.5)} ${y2-6*Math.sin(a-.5)} L${x2} ${y2} L${x2-6*Math.cos(a+.5)} ${y2-6*Math.sin(a+.5)}`,color);};
 function R(x,y,len,label='',vertical=false){let o;if(vertical)o=W(`M${x} ${y} v${len*.25} M${x} ${y+len*.75} V${y+len}`)+`<rect x="${x-5}" y="${y+len*.25}" width="10" height="${len*.5}" fill="var(--card)" stroke="${C.ink}"/>`;else o=W(`M${x} ${y} h${len*.25} M${x+len*.75} ${y} H${x+len}`)+`<rect x="${x+len*.25}" y="${y-5}" width="${len*.5}" height="10" fill="var(--card)" stroke="${C.ink}"/>`;return o+(label?T(vertical?x+12:x+len/2,vertical?y+len/2+4:y-12,label,vertical?'start':'middle'): '');}
 function cap(x,y,len,label='',vertical=false){return (vertical?W(`M${x} ${y} v${len/2-4} m-10 0 h20 m-20 8 h20 m-10 0 v${len/2-4}`):W(`M${x} ${y} h${len/2-4} m0 -10 v20 m8 -20 v20 m0 -10 h${len/2-4}`))+(label?T(vertical?x+15:x+len/2,vertical?y+len/2+4:y-16,label,vertical?'start':'middle'):'');}
 // Opamp input terminals are (x,y-13), (x,y+13); output is (x+55,y).
 const amp=(x,y)=>`<path d="M${x} ${y-30} V${y+30} L${x+55} ${y}Z" fill="var(--card)" stroke="${C.ink}"/>`+T(x+7,y-9,'−')+T(x+7,y+18,'+');
 function sumAmp(x,y,label='RF') {return amp(x,y)+W(`M${x-20} ${y-13} H${x} M${x-20} ${y-13} V${y-65} H${x-5} M${x+50} ${y-65} H${x+70} V${y} H${x+55} M${x+70} ${y} H${x+90} M${x-10} ${y+13} H${x} M${x-10} ${y+13} V${y+40}`)+R(x-5,y-65,55,label)+gnd(x-10,y+40)+dot(x-20,y-13)+dot(x+70,y)+T(x-25,y-23,'0V','end','green')+T(x+90,y-10,'vₒ','end');}
 const input=(k,label,val,min,max,step=1)=>`<label>${label}<input type="number" data-key="${k}" value="${val}" min="${min}" max="${max}" step="${step}"></label>`;
 const select=(k,label,items)=>`<label>${label}<select data-key="${k}">${items.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>`;
 const button=(k,label)=>`<button type="button" data-action="${k}">${label}</button>`;
 const bitButtons=(n=4)=>Array.from({length:n},(_,i)=>button('bit'+(n-i-1),'')).join('');
 let s,svg,status,render;
 function init(defaults,controls='',buttons=''){
  s={...defaults};const saved=window.openai?.widgetState?.privateContent;
  if(saved&&typeof saved==='object')for(const k in defaults)if(typeof saved[k]===typeof defaults[k]&&(typeof saved[k]!=='number'||Number.isFinite(saved[k])))s[k]=saved[k];
  root.classList.add('converter-lab');root.innerHTML=`<div class="lab-controls">${controls}</div><div class="lab-buttons">${buttons}</div><svg role="img"></svg><div class="lab-status" role="status" aria-live="polite"></div>`;svg=root.querySelector('svg');status=root.querySelector('.lab-status');
  root.querySelectorAll('[data-key]').forEach(el=>{const k=el.dataset.key;if(el.type==='number'){s[k]=Math.min(+el.max,Math.max(+el.min,s[k]));}else if(![...el.options].some(o=>o.value===s[k]))s[k]=defaults[k];el.value=s[k];el.addEventListener('change',()=>{s[k]=el.type==='number'?Math.min(+el.max,Math.max(+el.min,Number.isFinite(+el.value)?+el.value:defaults[k])):el.value;if(el.type==='number'&&+el.step===1)s[k]=Math.round(s[k]);el.value=s[k];if('step' in s)s.step=0;update();});});
  root.querySelectorAll('[data-action^="bit"]').forEach(el=>el.onclick=()=>{s.d^=2**(+el.dataset.action.slice(3));update();});
 }
 function bind(k,f){root.querySelector(`[data-action="${k}"]`).onclick=()=>{f();update();};}
 function update(){render();root.querySelectorAll('[data-action^="bit"]').forEach(el=>{const b=+el.dataset.action.slice(3),v=(s.d>>b)&1;el.textContent='d'+b+' = '+v;el.setAttribute('aria-pressed',String(!!v));});window.openai?.setWidgetState({modelContent:{topic:kind,...s},privateContent:s})?.catch(()=>{});}
 function show(title,h,drawing,desc,data={}){svg.setAttribute('viewBox',`0 0 360 ${h}`);svg.setAttribute('aria-label',title);svg.innerHTML='<title>'+E(title)+'</title>'+drawing;status.textContent=desc;for(const [k,v]of Object.entries(data))svg.dataset[k]=typeof v==='object'?JSON.stringify(v):v;}
 function plot(y,h,xmax,ymin,ymax,pts,color='blue',xlabel='t',ylabel='V'){
  const x0=45,x1=337,top=y+25,bot=y+h-26,X=t=>x0+(x1-x0)*t/xmax,Y=v=>bot-(bot-top)*(v-ymin)/(ymax-ymin);
  let p=W(`M${x0} ${top} V${bot} H${x1}`)+T(10,y+14,ylabel)+T(x1,y+14,xlabel,'end')+T(x0-5,top+4,F(ymax,2),'end')+T(x0-5,bot+4,F(ymin,2),'end')+T(x0,bot+18,'0','middle')+T(x1,bot+18,F(xmax,2),'middle');
  if(ymin<0&&ymax>0)p+=W(`M${x0} ${Y(0)} H${x1}`,'line',true)+T(x0-5,Y(0)+4,'0','end');
  if(pts?.length)p+=W(pts.map(([t,v],i)=>(i?'L':'M')+X(t)+' '+Y(v)).join(' '),color);
  return{p,X,Y,top,bot};
 }
 const points=(fn,end,n=240)=>Array.from({length:n+1},(_,i)=>{const t=i*end/n;return[t,fn(t)];});
 const codeControls=()=>input('ref','VREF / V',8,1,10,.5);
 function weightedDrawing(d,ref){let o=T(12,20,'1 → VREF；0 → 地。右侧为同一求和节点。');
  for(let k=0;k<4;k++){const b=3-k,y=65+52*k,v=(d>>b)&1;o+=T(14,y-10,'d'+b+' = '+v)+box(13,y,58,25,v?'VREF':'GND',v?'green':'muted')+W(`M71 ${y+12} H87`)+R(87,y+12,84,['R','2R','4R','8R'][k])+W(`M171 ${y+12} H190`,'green')+dot(190,y+12);}
  o+=W('M190 77 V300 H225')+sumAmp(245,313,'RF=R/2')+T(175,386,'VREF = '+ref+' V','middle');return o;}
 function chipDrawing(bias=false){let o=box(16,65,164,140,'')+T(98,176,'AD7520','middle')+T(27,90,'VREF')+T(174,76,'RF','end')+T(174,111,'Iout1','end')+T(174,144,'Iout2','end')+T(85,198,'d₉ … d₀','middle')+T(85,29,'VDD','middle')+W('M0 86 H16 M85 40 V65 M180 86 H325 V139 M180 120 H235 M180 153 H220 V179 M220 146 H235 M220 146 V153 M85 205 V240')+amp(235,133)+W('M290 133 H337 M325 133 V139')+gnd(220,179)+T(337,120,'vₒ','end')+R(115,86,43,'',false)+W('M115 86 H105 V120 H180 M158 86 H180')+dot(105,120)+T(85,260,'数字量 D','middle');
  if(bias)o+=T(202,19,'VB')+R(202,27,62,'RB',true)+W('M202 89 V120')+dot(202,120);return o;}
 if(kind==='a-chain'){
  init({route:'adc'},select('route','观察方向',[['adc','模拟输入 → 数字处理'],['dac','数字码 → 模拟输出']]));
  render=()=>{const labels=s.route==='adc'?['连续输入 vᵢ','取样与保持','量化与编码','数字码 D','寄存／处理']:['数字码 D','寄存器锁存','按位控制开关','DAC模拟输出','缓冲／重建'];let o='';labels.forEach((l,i)=>{o+=box(83,20+i*63,194,40,l,i===2?'green':'ink');if(i<4)o+=arr(180,60+i*63,180,80+i*63);});show('转换方向与信号链',345,o,s.route==='adc'?'时间离散与幅值离散是不同步骤；数字结果对应采样时刻。':'DAC根据参考比例把代码变为模拟电压；最终波形也取决于更新时刻。');};
 }else if(kind==='a-weights'){
  init({d:11,ref:8},codeControls(),bitButtons());render=()=>{let o=T(16,24,'4位正向比例示例：vₒ = VREF × D / 16');for(let k=0;k<4;k++){let b=3-k,v=(s.d>>b)&1;o+=box(18,50+k*53,45,30,'d'+b,v?'green':'muted')+T(83,70+k*53,`${v} × ${2**b} = ${v*2**b}`)+T(326,70+k*53,F(s.ref*v*2**b/16)+' V','end',v?'green':'muted');}show('位权与码值',320,o+T(18,296,`D = ${B(s.d)}₂ = ${s.d}；vₒ = ${F(s.ref*s.d/16)} V`),`每位贡献相加；1 LSB = ${F(s.ref/16)} V。`,{code:s.d,output:s.ref*s.d/16});};
 }else if(kind==='a-opamp'){
  init({v:2},input('v','v₁ / V',2,-4,4,.5));render=()=>{let o=T(15,32,'理想负反馈：v₊ = 0，v₋ ≈ 0')+T(15,77,'v₁='+s.v+'V')+R(80,83,85,'10kΩ')+W('M165 83 H190 V187 H225')+T(15,132,'v₂=1V')+R(80,138,85,'20kΩ')+W('M165 138 H190')+dot(190,138)+sumAmp(245,200,'10kΩ')+arr(173,178,221,178)+T(16,300,'iΣ = v₁/10kΩ + 1V/20kΩ')+T(16,329,'vₒ = −10kΩ × iΣ = '+F(-s.v-.5)+' V');show('反相求和放大器',360,o,'电流不流入理想运放输入端；它经反馈支路到输出。',{output:-s.v-.5});};
 }else if(kind==='a-weighted'){
  init({d:5,ref:5},codeControls(),bitButtons());render=()=>show('四位权电阻DAC',415,weightedDrawing(s.d,s.ref),`D=${s.d}；RF=R/2，vₒ=−${s.ref}×${s.d}/16=${F(-s.ref*s.d/16)} V。`,{output:-s.ref*s.d/16});
 }else if(kind==='a-ladder'){
  init({stage:'0'},select('stage','从末端合并',[['0','原网络：所有末端都是0V'],['1','末端2R并2R = R'],['2','串R得2R，再并2R'],['3','重复到参考端：总电阻R']]));render=()=>{let o=T(15,24,'参考端在右；所有开关目的地等效为0V。')+W('M290 65 H335')+T(335,53,'VREF','end');for(let i=0;i<4;i++){let x=92+66*i;o+=R(x,65,83,'2R',true)+gnd(x,148)+dot(x,65)+T(x,213,['I/16','I/8','I/4','I/2'][i],'middle');if(i<3)o+=R(x,65,66,'R');}o+=W('M92 65 H34')+R(34,65,83,'',true)+gnd(34,148)+T(34,193,'2R','middle')+T(34,213,'I/16','middle');const texts=['从最左侧两条2R开始合并。','末端两条2R并联，等效为R。','R与串联R合成2R，再与支路2R并联。','总等效R；总电流I=VREF/R。'];o+=box(18,244,324,42,['末端：2R ∥ 2R = R','等效R再串R，得到2R','再并当前支路2R，仍为R','参考源所见：R；I = VREF / R'][+s.stage],'green')+T(18,315,'各分叉两边等效相等，所以电流各一半。');show('倒T网络逐级等效',340,o,texts[+s.stage]);};
 }else if(kind==='a-steering'){
  init({d:11},'',bitButtons());render=()=>{let o=T(14,22,'VREF>0；每条权电流恒定，只改变去向。');for(let i=0;i<4;i++){let b=3-i,y=63+56*i,v=(s.d>>b)&1;o+=T(16,y-8,['I/2','I/4','I/8','I/16'][i])+arr(16,y,95,y)+dot(95,y)+W(`M95 ${y} L${v?149:130} ${v?y:y+18}`,v?'green':'muted')+W(`M149 ${y} H220`)+dot(220,y)+gnd(130,y+18)+T(172,y-10,'d'+b+'='+v);}
  o+=W('M220 63 V275 H225')+sumAmp(245,288,'RF=R')+T(18,374,'IΣ / I = '+s.d+'/16');show('电流转向式DAC',402,o,`数字0把电流送地，1送虚地。vₒ/VREF = −${s.d}/16。`,{code:s.d});};
 }else if(kind==='a-chip'){
  init({d:512},input('d','10位内部码D',512,0,1023));render=()=>show('AD7520典型连接',295,chipDrawing()+T(18,282,'VREF = −10V；RF = R'),`内部反馈电阻接法；D=${B(s.d,10)}，输出=${F(10*s.d/1024,6)} V。`,{output:10*s.d/1024});
 }else if(kind==='a-current'){
  init({d:10},'',bitButtons());render=()=>{let o=T(14,22,'恒流源从节点吸走电流；位0改从地吸取。');for(let i=0;i<4;i++){let x=30+50*i,b=3-i,v=(s.d>>b)&1;o+=W(`M${x} 92 V110 M${x} 134 V160`)+W(`M${x} 134 L${v?x:x+20} ${v?110:120}`,v?'green':'muted')+gnd(x+20,120)+`<circle cx="${x}" cy="179" r="18" fill="var(--card)" stroke="${C.ink}"/>`+arr(x,167,x,191)+W(`M${x} 197 V250`)+dot(x,92)+T(x,68,'d'+b+'='+v,'middle')+T(x+10,226,['I/2','I/4','I/8','I/16'][i]);}
  o+=W('M30 92 H225 V287 M30 250 H180')+T(126,271,'负电源 VEE','middle')+sumAmp(245,300,'RF')+T(18,377,'RF·I = 8V；vₒ = '+F(s.d/2)+' V');show('吸电流型DAC',405,o,'电流流出求和点，因此运放输出正电压经RF提供补给。示意电流源省略内部偏置。',{output:s.d/2});};
 }else if(kind==='a-string'){
  init({d:5},input('d','3位代码D',5,0,7));render=()=>{let o=T(30,22,'VREF=8V')+W('M60 30 V42');for(let k=0;k<8;k++){let y=42+34*k,code=7-k;o+=R(60,y,34,'',true)+dot(60,y+34)+W(`M60 ${y+34} H142`,s.d===code?'green':'line')+T(97,y+28,code+'V','middle',s.d===code?'green':'muted');}o+=gnd(60,314)+box(142,54,65,258,'选择树')+W(`M142 ${76+34*(7-s.d)} L207 183`,'green')+arr(207,183,240,183)+box(240,158,100,50,F(s.d)+' V','green')+T(247,236,'高阻缓冲输出')+T(142,354,'D = '+B(s.d,3));show('电阻串与抽头选择',382,o,`选择第${s.d}个抽头，理想空载vₒ=8×${s.d}/8=${s.d} V。`,{output:s.d});};
 }else if(kind==='a-cap'){
  init({d:10,stage:'convert'},select('stage','阶段',[['convert','断开复位，按码切换'],['reset','复位：全部下板接地']]),bitButtons());render=()=>{let o=T(15,22,'公共上极板：复位后初始总电荷为0');for(let i=0;i<5;i++){let x=35+62*i,v=i<4?((s.d>>(3-i))&1):0,active=s.stage==='convert'&&v;o+=W(`M${x} 75 V92`)+cap(x,92,65,'',true)+W(`M${x} 157 V183`)+box(x-25,183,50,25,active?'8V':'0V',active?'green':'ink')+T(x+15,139,['8C','4C','2C','C','C′'][i])+dot(x,75);}
  o+=W('M35 75 H321 V110')+T(321,130,'vₒ','middle')+W('M159 75 V49')+W(s.stage==='reset'?'M159 49 H204':'M159 49 L197 32')+gnd(204,49)+T(248,45,'复位S')+T(18,260,'总电容 = 8C+4C+2C+C+C′ = 16C')+T(18,290,'C′ = C；VREF = 8V');let out=s.stage==='reset'?0:s.d/2;show('电荷再分配DAC',320,o,`当前${s.stage==='reset'?'复位':'转换'}：vₒ=${F(out)} V。转换时上板浮置；需高输入阻抗读取。`,{output:out});};
 }else if(kind==='a-codes'){
  init({d:5},input('d','3位原始位串数值',5,0,7));render=()=>{let signed=M.signed(s.d,3),changed=s.d^4,o=T(180,32,'同一串码 '+B(s.d,3),'middle','green',19);[['无符号整数',s.d],['二进制补码',signed],['偏移二进制（零点100）',s.d-4]].forEach(([a,b],i)=>o+=box(15,60+i*55,330,40,a+' → '+b));o+=arr(180,226,180,254)+box(45,266,270,44,'只翻最高位：'+B(s.d,3)+' → '+B(changed,3),'green');show('三种编码解释',340,o,`若外部原码是补码B=${signed}，翻MSB后内部D′=${changed}，满足D′=B+4。`,{signed,offset:changed});};
 }else if(kind==='a-bipolar'){
  init({d:4,mode:'offset'},select('mode','输入码解释',[['offset','内部偏移码'],['signed','外部补码：先翻MSB']])+input('d','3位码数值',4,0,7));render=()=>{let d=s.mode==='signed'?s.d^4:s.d,out=d-4;show('双极性求和DAC',360,chipDrawing(true)+T(18,284,'3位缩小示例：VREF=−8V，VB=+8V')+T(18,308,'RF=R，RB=2R；vₒ=D′−4')+T(18,336,'内部 D′='+B(d,3)+'；输出 '+out+' V'),`此图用AD7520结构表示通用偏置接法，计算按3位示例。当前${s.mode==='signed'?'先翻外部MSB':'直接输入内部码'}。`,{output:out,code:d});};
 }else if(kind==='a-errors'){
  init({mode:'gain'},select('mode','误差类型',[['offset','零点偏移 +0.7 LSB'],['gain','比例增大8%'],['weight','MSB仅6.8 LSB']]));render=()=>{const actual=d=>s.mode==='offset'?d+.7:s.mode==='gain'?d*1.08:(d>=8?d-8+6.8:d),g=plot(16,280,15,0,17,points(x=>x,15,15),'muted','D','输出 / LSB');let o=g.p+W(Array.from({length:16},(_,d)=>(d?'L':'M')+g.X(d)+' '+g.Y(actual(d))).join(' '),'green');for(let d=0;d<16;d++)o+=dot(g.X(d),g.Y(actual(d)),'green');o+=T(16,328,'灰：理想；绿：含所选误差')+T(16,355,'0111 → 1000：'+F(actual(7))+' → '+F(actual(8)));show('DAC静态误差',385,o,'各误差只用来说明曲线形态，数值为教学示例。权重误差可导致进位时输出反而下降。');};
 }else if(kind==='a-reference'){
  init({n:8,change:20},input('n','有效位数n',8,3,12)+input('change','参考偏差 / mV',20,0,30,.1));render=()=>{const a=M.reference(s.n,10,s.change/1000),g=plot(18,265,1,0,Math.max(1,a.errorLSB*1.12),[[0,0],[1,a.errorLSB]],'green','D / Dmax','误差 / LSB');show('参考误差预算',375,g.p+W(`M45 ${g.Y(.5)} H337`,'orange',true)+T(330,g.Y(.5)-7,'0.5 LSB','end','orange')+T(16,326,'允许参考偏差 ≤ '+F(a.limit*1000,5)+' mV')+T(16,352,'最坏误差 = '+F(a.errorLSB)+' LSB'),a.errorLSB<=.5?'满足参考自身的半LSB预算；其他误差需要另留预算。':'超过参考自身的半LSB预算。有效位数越高，对参考稳定度要求越严。',{error:a.errorLSB});};
 }else if(kind==='a-settle'){
  init({t:2},input('t','观察时刻 / μs',2,0,10,.1));render=()=>{let last=0;for(let i=0;i<=20000;i++)if(Math.abs(M.settle(i/2000))>.5)last=i/2000;const g=plot(18,275,10,-20,20,points(M.settle,10,1000),'blue','t / μs','误差 / LSB');let o=`<rect x="45" y="${g.Y(.5)}" width="292" height="${g.Y(-.5)-g.Y(.5)}" fill="var(--accent)"/>`+g.p+W(`M45 ${g.Y(.5)} H337 M45 ${g.Y(-.5)} H337`,'green',true)+W(`M${g.X(last)} ${g.top} V${g.bot}`,'red',true)+dot(g.X(s.t),g.Y(M.settle(s.t)),'orange')+T(16,329,'最后进入±0.5 LSB：约 '+F(last,3)+' μs')+T(16,355,'当前误差：'+F(M.settle(s.t))+' LSB');show('建立时间示意',385,o,'教学振铃模型；时间常数不对应某个真实芯片。误差第一次为0后仍可能再次超带。');};
 }
 else if(kind==='a-wave'){
  init({mode:'counter',step:0},select('mode','数据源',[['counter','16进制计数：Δ=0.625V'],['johnson','4位扭环：Δ=0.5V'],['ram','十进制查RAM：Δ=0.5V']]),button('next','下一拍')+button('reset','回到初态'));
  bind('next',()=>{s.step=(s.step+1)%M.wave(s.mode).length;});bind('reset',()=>s.step=0);
  render=()=>{let a=M.wave(s.mode),scale=s.mode==='counter'?.625:.5;s.step%=a.length;let pts=[];for(let i=0;i<a.length;i++)pts.push([i,a[i]*scale],[i+1,a[i]*scale]);let g=plot(150,240,a.length,0,10,pts,'blue','时钟周期','vₒ / V'),o=box(15,25,100,48,'地址／状态')+arr(115,49,137,49)+box(137,25,80,48,B(a[s.step]))+arr(217,49,239,49)+box(239,25,106,48,'DAC')+T(18,112,`第${s.step}拍：数据 ${a[s.step]}，输出 ${F(a[s.step]*scale)} V`)+g.p+W(`M${g.X(s.step)} ${g.top} V${g.bot}`,'orange',true)+dot(g.X(s.step),g.Y(a[s.step]*scale),'orange');show('计数与查表波形',415,o,`一周期${a.length}拍。${s.mode==='ram'?'只读地址0～9，高6位地址固定0。':'图从给定全0初态起画。'}`,{code:a[s.step],output:a[s.step]*scale,period:a.length});};
 }else if(kind==='a-gain'){
  init({d:128,mode:'input'},select('mode','DAC所在位置',[['input','输入支路：RF/R=10'],['feedback','反馈支路：R/Ri=0.1']])+input('d','8位代码D',128,0,255));
  render=()=>{let fb=s.mode==='feedback',gain=M.gain(8,s.d,fb?.1:10,fb),o=T(16,24,'条件等效：Req = 256R / D')+amp(222,193)+W('M277 193 H334 M222 206 H208 V228')+gnd(208,228)+W('M190 180 H222 M190 180 V95 H207 M292 95 H310 V193')+dot(190,180)+dot(310,193)+T(15,171,'vᵢ')+T(334,181,'vₒ','end')+W('M15 180 H55 M156 180 H190');
   o+=fb?R(55,180,101,'Ri')+box(207,77,85,36,'DAC Req'):box(55,162,101,36,'DAC Req')+R(207,95,85,'RF');o+=T(18,285,'D = '+B(s.d,8))+T(18,316,gain===null?'D=0：反馈失效，无线性增益':'Aᵥ = '+F(gain,6),'start',gain===null?'red':'green');show('可编程增益条件等效图',350,o,fb?'DAC在反馈支路，D=0时不再有正常负反馈。此图是虚地条件下的等效模型。':'DAC在输入支路，D=0时不向求和点送信号电流。参考源总负载仍需按完整网络分析。',{gain:gain===null?'undefined':gain});};
 }else if(kind==='a-sampling'){
  init({freq:900},input('freq','余弦频率 / Hz',900,50,1950,50));render=()=>{const fs=1000,alias=Math.abs(((s.freq+fs/2)%fs)-fs/2),g=plot(20,290,6,-1.2,1.2,points(t=>Math.cos(2*Math.PI*s.freq*t/1000),6,600),'blue','t / ms','幅值');let o=g.p+W(points(t=>Math.cos(2*Math.PI*alias*t/1000),6,300).map(([t,v],i)=>(i?'L':'M')+g.X(t)+' '+g.Y(v)).join(' '),'orange',true);for(let k=0;k<=6;k++)o+=dot(g.X(k),g.Y(Math.cos(2*Math.PI*s.freq*k/1000)),'green');o+=T(16,342,'采样率固定1000次/s，绿点每1ms一个')+T(16,368,'蓝：原信号；橙虚线：'+F(alias)+' Hz余弦');show('采样混叠演示',397,o,`采样点上的余弦完全相同。等效低频为${alias}Hz；${s.freq>=500?'达到或超过奈奎斯特边界，需警惕歧义。':'当前频率低于采样率一半。'}`,{alias});};
 }else if(kind==='a-quantize'){
  init({v:.62,mode:'round'},select('mode','课本分级',[['floor','图(a)：向下取整，Δ=1/8'],['round','图(b)：改进，Δ=2/15']])+input('v','输入 / V',.62,0,1,.01));render=()=>{let q=M.quant(s.v,3,1,s.mode),pts=[];for(let d=0;d<8;d++){let lo=Math.max(0,(d-(s.mode==='round'?.5:0))*q.delta),hi=d===7?1:(d+1-(s.mode==='round'?.5:0))*q.delta;pts.push([lo,d*q.delta],[hi,d*q.delta]);}let g=plot(18,280,1,0,1,pts,'green','输入 / V','代表电压 / V'),o=g.p+W(`M45 ${g.Y(0)} L337 ${g.Y(1)}`,'muted',true)+W(`M${g.X(s.v)} ${g.bot} V${g.Y(q.value)}`,'orange',true)+dot(g.X(s.v),g.Y(q.value),'orange')+T(16,337,`D = ${B(q.d,3)}，代表电压 ${F(q.value,6)} V`)+T(16,366,`e = 代表值 − 输入 = ${F(q.error,6)} V`);show('量化阶梯与输入',395,o,`Δ=${F(q.delta,6)} V；阈值相等时归上一级，1V处限于最大码111。${s.mode==='floor'?'误差界限为一个步长。':'规定范围内误差绝对值不超过半步长。'}`,{code:q.d,error:q.error,delta:q.delta});};
 }else if(kind==='a-hold'){
  init({v:2,mode:'track',held:-2},select('mode','开关状态',[['track','取样：开关闭合'],['hold','保持：开关断开']])+input('v','当前输入 / V',2,-4,4,.5));
  render=()=>{if(s.mode==='track')s.held=-s.v;let closed=s.mode==='track',o=T(16,25,'教材基本型：RI=RF，跟踪稳态vₒ=−vᵢ')+T(15,163,'vᵢ')+R(24,175,65,'RI')+W('M89 175 H106 M146 175 H222')+dot(106,175)+dot(146,175)+W(closed?'M106 175 H146':'M106 175 L139 154',closed?'green':'ink')+T(128,206,'S','middle')+amp(222,188)+W('M277 188 H337 M222 201 H211 V227')+gnd(211,227)+W('M106 175 V65 H176 M254 65 H315 V188')+R(176,65,78,'RF')+W('M190 175 V115 H216 M276 115 H315')+cap(216,115,60,'CH')+dot(315,115)+dot(315,188)+dot(190,175)+T(337,177,'vₒ','end')+T(18,285,'当前输入：'+F(s.v)+' V')+T(18,316,'输出：'+F(s.held)+' V','start','green');show('反相取样保持电路',350,o,closed?'理想稳态跟踪；获取过程简化为瞬时完成。切到保持后再改变输入可观察区别。':'理想保持：忽略漏电和开关注入，输入变化不再改变当前保持值。',{output:s.held});};
 }else if(kind==='a-flash'){
  init({v:.5},input('v','输入 / V',.5,0,1,.01));render=()=>{let q=M.quant(s.v,3,1,'round'),o=T(16,21,'VREF=1V；比较器按低阈值到高阈值排列');for(let k=1;k<8;k++){let y=53+(k-1)*42,on=s.v+1e-12>=(2*k-1)/15;o+=T(16,y+5,(2*k-1)+'/15 V')+W(`M72 ${y} H100`)+`<path d="M100 ${y-13} V${y+13} L132 ${y}Z" fill="var(--card)" stroke="${C.ink}"/>`+T(110,y+4,'≥','middle','ink',10)+W(`M132 ${y} H198`,on?'green':'muted')+T(152,y-8,'C'+k+'='+Number(on),'start',on?'green':'muted');}o+=box(198,40,60,285,'编码器')+arr(258,182,280,182)+box(280,159,66,46,B(q.d,3),'green')+T(18,371,'温度计码 C₇…C₁ = '+Array.from({length:7},(_,i)=>Number(q.d>=7-i)).join(''));show('并联比较型ADC',405,o,`输入同时送入各比较器，图将共同输入省略在“≥”判定中。跨过${q.d}个门槛，输出${B(q.d,3)}。`,{code:q.d});};
 }else if(kind==='a-half'){
  init({v:.7},input('v','输入 / V',.7,0,1,.01));render=()=>{let a=M.half(s.v),o=T(18,24,'4位示例：两级各2位，VREF=1V')+box(20,50,100,40,'输入 '+F(s.v)+'V')+arr(120,70,152,70)+box(152,50,170,40,'粗ADC：H='+a.h)+arr(237,90,237,118)+box(152,118,170,40,'DAC：'+F(a.coarse)+'V')+arr(237,158,237,187)+box(30,187,292,42,'相减残差 r='+F(a.r)+'V')+arr(176,229,176,255)+box(30,255,292,42,'×4 → '+F(4*a.r)+'V → 细ADC L='+a.l)+arr(176,297,176,323)+box(30,323,292,42,'D=4H+L='+a.d+' = '+B(a.d),'green');show('分级转换与残差',395,o,'使用向下取整子级的理想模型；满范围端点限码。2+2位需3+3=6个比较器，纯4位需15个。',{code:a.d,coarse:a.coarse,residue:a.r});};
 }else if(kind==='a-pipeline'){
  init({step:0},'',button('next','推进一拍')+button('reset','从样本0开始'));bind('next',()=>s.step++);bind('reset',()=>s.step=0);render=()=>{let o=T(18,24,'当前时钟编号：'+s.step);for(let i=0;i<3;i++){let n=s.step-i;o+=box(20,50+i*75,320,50,`第${i+1}级：${n<0?'尚无样本':'样本 '+n}`,n>=0?'green':'muted');if(i<2)o+=arr(180,100+i*75,180,123+i*75);}o+=box(20,303,320,48,s.step>=2?'输出：样本 '+(s.step-2)+' 的完整结果':'输出：流水线尚未填满','green')+T(18,385,'前级位段须延迟到同一样本的低位到齐。');show('三段流水线样本对齐',415,o,'按课本周期编号展示：样本N进入后，在N+2对应输出。稳定后每拍有一个新结果。',{sample:s.step>=2?s.step-2:-1});};
 }else if(kind==='a-sar'){
  init({v:5.3,mode:'floor',step:0},select('mode','比较阈值',[['floor','无偏移：试码×0.5V'],['round','课本半LSB偏移；Δ=16/31V']])+input('v','保持输入 / V',5.3,0,8,.1),button('next','下一次比较')+button('reset','重新开始'));
  bind('next',()=>s.step=Math.min(4,s.step+1));bind('reset',()=>s.step=0);render=()=>{let a=M.sar(s.v,4,8,s.mode);s.step=Math.min(4,s.step);let o=box(15,18,100,38,'输入 '+F(s.v)+'V')+arr(115,37,138,37)+box(138,18,80,38,'比较器')+arr(218,37,240,37)+box(240,18,105,38,'SAR')+W('M292 56 V86 H185')+box(105,68,80,36,'DAC')+W('M105 86 H93 V61 H178 V56')+T(18,137,'试码')+T(115,137,'阈值/V')+T(224,137,'决定')+T(338,137,'保留码','end');for(let i=0;i<4;i++){let r=a.steps[i],y=169+i*42,active=i<s.step;o+=T(18,y,active?B(r.trial):'····','start',active?'ink':'muted')+T(115,y,active?F(r.threshold,3):'—')+T(224,y,active?(r.keep?'保留':'撤掉'):'待比较','start',active?'green':'muted')+T(338,y,active?B(r.d):'····','end');}o+=T(18,371,s.step===4?'完成：'+B(a.d)+'，代表 '+F(a.d*a.delta,5)+' V':'当前已确定 '+s.step+' 位，继续比较。');show('逐次逼近逐位实验',403,o,'输入在转换期间保持。比较电压≤输入则保留当前位，否则清除；以前确定的位保持。',{code:s.step?a.steps[s.step-1].d:0,step:s.step,final:a.d});};
 }else if(kind==='a-dual'){
  init({v:2},input('v','输入 / V',2,0,5,.25));render=()=>{let a=M.dual(s.v,5,1000,100000),end=10+s.v*2,g=plot(190,235,20,-5.5,.5,[[0,0],[10,-s.v],[end,0]],'blue','t / ms','积分输出 / V'),o=T(18,21,'示例RC=10ms，第一段T₁=10ms')+box(15,50,86,38,'vᵢ / −5V')+arr(101,69,125,69)+box(125,50,100,38,'反相积分')+arr(225,69,248,69)+box(248,50,98,38,'回零检测')+arr(295,88,295,116)+box(181,116,165,38,'关闸，保留计数D')+T(18,178,'复位 → 积输入 → 积参考回零')+g.p+W(`M${g.X(10)} ${g.top} V${g.bot}`,'orange',true)+T(g.X(10),g.bot+18,'T₁=10','middle','orange')+T(18,458,`T₂=${F(a.t2*1000)}ms；计数D=${F(a.count)}`);show('双积分分段波形',490,o,`固定第一段10ms，回零段${F(a.t2*1000)}ms，总积分${F((a.t1+a.t2)*1000)}ms。${s.v===5?'5V端点需检查所用计数器是否溢出。':''}`,{count:a.count,t2:a.t2});};
 }else if(kind==='a-noise'){
  init({ms:20,phase:45},input('ms','积分窗 / ms',20,5,100,5)+input('phase','初相 / 度',45,0,360,15));render=()=>{let phi=s.phase*Math.PI/180,mean=M.noise(50,s.ms,phi),g=plot(20,275,s.ms,-1.2,1.2,points(t=>Math.sin(Math.PI*t/10+phi),s.ms),'blue','t / ms','干扰幅值');let shade='';for(let i=0;i<200;i++){let t=(i+.5)*s.ms/200,v=Math.sin(Math.PI*t/10+phi);shade+=`<rect x="${g.X(i*s.ms/200)}" y="${g.Y(Math.max(0,v))}" width="1.47" height="${Math.abs(g.Y(v)-g.Y(0))}" fill="var(--${v>=0?'accent':'secondary'})"/>`;}let o=shade+g.p+W(`M45 ${g.Y(mean)} H337`,'orange',true)+T(18,334,'窗口内平均干扰 = '+F(mean,6))+T(18,361,'50Hz，整周期20ms；相位可任意改变。');show('积分平均抑制干扰',391,o,Math.abs(mean)<1e-8?'本次窗口平均为0；整周期窗口能对任意初相保持抵消。':'窗口未抵消干扰。改变相位后平均值会改变。',{mean});};
 }else if(kind==='a-sigma'){
  init({x:.25},input('x','输入 / VREF',.25,-1,1,.125));render=()=>{let a=M.sigma(s.x),o=T(18,25,'输入 − 反馈 → 积分 → 1位判决 → 反馈');for(let i=0;i<64;i++){let x=18+(i%16)*20,y=53+Math.floor(i/16)*30;o+=box(x,y,18,24,String(a.bits[i]),a.bits[i]?'green':'muted');}let min=Math.min(-1,...a.states),max=Math.max(1,...a.states),g=plot(185,195,64,min-.25,max+.25,a.states.map((v,i)=>[i,v]),'blue','时钟编号','积分状态');o+=g.p+T(18,414,`1的比例：${a.bits.reduce((a,b)=>a+b,0)}/64 = ${F(a.density)}`)+T(18,441,`密度反推输入：${F(2*a.density-1)} × VREF`);show('一阶Σ-Δ位密度',470,o,'这里只演示恒定输入、理想一阶环路及有限窗口计数；不代表真实器件的滤波、噪声和精度。',{density:a.density});};
 }else if(kind==='a-vf'){
  init({v:2,tg:5},input('v','输入 / V',2,0,5,.1)+input('tg','闸门 / ms',5,1,20,1));render=()=>{let f=s.v*20000,N=f*s.tg/1000,o=T(18,24,'比例K=20kHz/V')+box(18,50,100,44,F(s.v)+' V')+arr(118,72,143,72)+box(143,50,195,44,'V-F：'+F(f/1000)+' kHz')+arr(240,94,240,124)+box(143,124,195,44,'闸门：'+s.tg+' ms')+arr(240,168,240,198)+box(143,198,195,44,'计数：'+F(N),'green')+T(18,282,'闸门关闭 → 锁存结果 → 清零计数器')+T(18,320,'N = K × vᵢ × TG = '+F(N))+T(18,351,'1个计数等效 '+F(1000/(20000*s.tg))+' V');show('V-F固定门宽计数',386,o,'显示理想平均计数；实际异步闸门可能有约一个计数边界误差。把TG换成秒再代公式。',{count:N,frequency:f});};
 }else if(kind==='a-lm331'){
  init({ct:10,v:5},input('ct','CT / nF',10,5,50,5)+input('v','输入 / V',5,0,5,.5));render=()=>{let tau=10000*s.ct*1e-9,t1=tau*Math.log(3),k=M.lm(10000,s.ct*1e-9,47000,10000),g=plot(18,240,t1*1e6,0,15,points(t=>15*(1-Math.exp(-t/(tau*1e6))),t1*1e6),'blue','t / μs','vCT / V'),o=g.p+W(`M45 ${g.Y(10)} H337`,'orange',true)+T(330,g.Y(10)-8,'2VCC/3','end','orange')+T(18,298,'RT=10kΩ，RL=47kΩ，RS=10kΩ')+T(18,326,'T₁=RT·CT·ln3 = '+F(t1*1e6,3)+' μs')+T(18,354,'K='+F(k,3)+' Hz/V；f='+F(k*s.v,3)+' Hz')+T(18,382,'本图保留ln3，正文例题用近似1.1。');show('LM331计时与电荷平衡',414,o,'先算定时电容达到门槛的时间，再用平均电荷平衡求频率。CL的作用是平滑，不是决定这个T₁。',{frequency:k*s.v,t1});};
 }
 if(render)update();
})();
