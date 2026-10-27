(function(global){
 'use strict';
 const segments=['1111110','0110000','1101101','1111001','0110011','1011011','0011111','1110000','1111111','1110011','0001101','0011001','0100011','1001011','0001111','0000000'];
 const model={
  decoder(type,address,s1,s2,s3){const size=type==='42'?10:8,enabled=type==='42'||(s1===1&&s2===0&&s3===0);return Array.from({length:size},(_,i)=>enabled&&i===address?0:1);},
  display(n,lt,rbi,bi){const zero=lt===1&&rbi===0&&n===0;if(bi===0)return {bits:'0000000',rbo:0,mode:'外部BI′=0：全部灭灯'};if(lt===0)return {bits:'1111111',rbo:1,mode:'LT′=0：灯测试全亮'};if(zero)return {bits:'0000000',rbo:0,mode:'本位为0且RBI′=0：灭零并拉低RBO′'};return {bits:segments[n],rbo:1,mode:'正常译码；采用教材6、9字形'};},segments
 };
 if(typeof module!=='undefined'&&module.exports)module.exports=model;
 if(typeof document==='undefined')return;
 const esc=t=>String(t).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const text=(x,y,t,size=14,anchor='start')=>`<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}">${esc(t)}</text>`;
 const wire=(d,on=false)=>`<path d="${d}" fill="none" stroke="${on?'#ab5032':'#537263'}" stroke-width="${on?3:2}"/>`;
 const rect=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#eaf0e5" stroke="#537263" stroke-width="1.5"/>`;
 for(const root of document.querySelectorAll('[data-lab^="k-"]')){
  const name=root.dataset.lab,display=name==='k-display-live';
  let s=display?{n:6,lt:1,rbi:1,bi:1}:{type:'138',address:5,s1:1,s2:0,s3:0};
  const host=window.courseState?.()||window.openai;
  const saved=host?.widgetState?.privateContent;
  if(saved)for(const k of Object.keys(s)){
   if(k==='type'){if(['138','42'].includes(saved[k]))s[k]=saved[k];}
   else if(Number.isInteger(saved[k])&&saved[k]>=0&&saved[k]<=(['n','address'].includes(k)?15:1))s[k]=saved[k];
  }
  function select(key,label,opts){return `<label>${esc(label)}<select data-key="${key}">${opts.map(([v,t])=>`<option value="${v}">${esc(t)}</option>`).join('')}</select></label>`;}
  const bit=[['0','0 · 低电平'],['1','1 · 高电平']];
  let controls=display?
   select('n','输入编号',[...Array(16)].map((_,i)=>[i,`${i} · ${i.toString(2).padStart(4,'0')}`]))+select('lt','灯测试 LT′',bit)+select('rbi','灭零输入 RBI′',bit)+select('bi','BI′/RBO′外部状态',[[1,'释放 / 正常允许'],[0,'外部拉低 / 灭灯']]):
   select('type','器件',[[138,'74HC138 · 3—8'],[42,'74HC42 · BCD—10']])+select('address','输入编号',[...Array(16)].map((_,i)=>[i,i]))+select('s1','S₁（138高有效）',bit)+select('s2','S′₂（138低有效）',bit)+select('s3','S′₃（138低有效）',bit);
  root.innerHTML=`<div class="lab-controls">${controls}</div><div style="overflow-x:auto"><svg role="img" style="display:block;width:100%;min-width:400px;max-width:640px;margin:auto" viewBox="0 0 400 400"></svg></div><div class="lab-status" aria-live="polite"></div>`;
  const svg=root.querySelector('svg'),status=root.querySelector('.lab-status');
  function render(){
   for(const input of root.querySelectorAll('[data-key]'))input.value=s[input.dataset.key];
   let o='';
   if(display){
    const r=model.display(s.n,s.lt,s.rbi,s.bi);svg.setAttribute('viewBox','0 0 400 410');
    o+=`<title>7448段码与控制端</title>`+text(200,25,'7448 · 教材表4.4.7',16,'middle');
    o+=rect(16,68,131,232)+text(81,101,'7448',17,'middle')+text(27,133,'输入 '+s.n.toString(2).padStart(4,'0'),13)+text(27,164,'LT′ = '+s.lt,13)+text(27,192,'RBI′ = '+s.rbi,13)+text(27,220,'RBO′ = '+r.rbo,13);
    const coords=[[223,57,93,12],[321,74,12,96],[321,191,12,96],[223,292,93,12],[207,191,12,96],[207,74,12,96],[223,175,93,12]];
    coords.forEach(([x,y,w,h],i)=>{o+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${r.bits[i]==='1'?'#ab5032':'#e2e7dc'}"/>`;const px=(i===1||i===2)?353:(i===4||i===5)?187:x+w/2,py=(i===0)?45:(i===3)?328:(i===6)?199:y+h/2+5;o+=text(px,py,'abcdefg'[i],13,'middle');});
    o+=wire('M 147 250 H 181')+text(166,278,'7路',12,'middle')+text(200,366,'a b c d e f g = '+r.bits.split('').join(' '),14,'middle')+text(200,398,'1亮 · 0灭 · 共阴显示的逻辑模型',13,'middle');
    status.textContent=r.mode+'。BI′/RBO′是同一端；此处“释放”表示允许器件自行拉低。';svg.dataset.bits=r.bits;svg.dataset.rbo=r.rbo;
   }else{
    if(s.type==='138'&&s.address>7)s.address=7;
    root.querySelector('[data-key="address"]').value=s.address;
    for(const op of root.querySelector('[data-key="address"]').options)op.disabled=s.type==='138'&&Number(op.value)>7;
    for(const k of ['s1','s2','s3'])root.querySelector(`[data-key="${k}"]`).disabled=s.type==='42';
    const outputs=model.decoder(s.type,s.address,s.s1,s.s2,s.s3),h=130+outputs.length*34;svg.setAttribute('viewBox',`0 0 400 ${h}`);
    o+='<title>译码器地址、控制与低有效输出</title>'+text(200,25,'74HC'+s.type+' · 输出0表示选中',16,'middle')+rect(118,65,135,h-132)+text(186,100,'74HC'+s.type,16,'middle');
    o+=text(18,145,'地址',14)+text(18,172,s.address.toString(2).padStart(s.type==='42'?4:3,'0'),16)+wire('M 61 166 H 118');
    if(s.type==='138')o+=text(18,238,'S₁ = '+s.s1,13)+text(18,268,'S′₂= '+s.s2,13)+text(18,298,'S′₃= '+s.s3,13);
    else o+=text(18,237,'10—15',13)+text(18,263,'拒绝伪码',13);
    outputs.forEach((v,i)=>{const y=121+i*34;o+=`<circle cx="257" cy="${y}" r="4" fill="#fffef9" stroke="#537263"/>`+wire(`M 261 ${y} H 297`,v===0)+text(306,y+5,`Y′${i}=${v}`,14);});
    o+=text(200,h-25,outputs.includes(0)?'唯一低输出：Y′'+outputs.indexOf(0):'全部输出1；不是高阻Z',14,'middle');
    status.textContent=s.type==='138'?'先检查(S₁,S′₂,S′₃)=(1,0,0)，再按4A₂+2A₁+A₀选路。':'74HC42没有这里的138控制端；输入0—9选一路，10—15十路全高。';svg.dataset.outputs=outputs.join('');
   }
   svg.innerHTML=o;
  }
  root.addEventListener('change',event=>{const k=event.target.dataset.key;if(!k)return;s[k]=k==='type'?event.target.value:Number(event.target.value);render();host?.setWidgetState({privateContent:s,modelContent:{...s,chapter:4}});});
  render();
 }
})(typeof globalThis==='undefined'?this:globalThis);
