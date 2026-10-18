(function(root){
'use strict';
const KEY='pytorch-field-notes-v2',OLD='pytorch-field-notes-v1';
const IDS=Array.from({length:36},(_,i)=>`L${String(i+1).padStart(2,'0')}`);
const RIDS=Array.from({length:36},(_,i)=>`R${String(i+1).padStart(2,'0')}`);
const researchFresh=()=>Object.fromEntries(RIDS.map(id=>[id,{status:'todo',bookmark:false,note:''}]));
const statuses={todo:'未开始',doing:'学习中',review:'待复习',blocked:'环境阻塞',done:'已掌握'};
const fresh=()=>({version:2,startDate:null,theme:'light',lessons:Object.fromEntries(IDS.map(id=>[id,{status:'todo',minutes:0,note:''}])),research:researchFresh(),seminars:{M03:{status:'todo',bookmark:false,note:''}},meetings:[],legacy:null,updatedAt:null});
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function validate(raw){
 const s=raw?.state||raw;if(!obj(s))throw Error('备份不是有效对象');
 if((raw?.version===1||!s.version)&&obj(s.tasks)){const n=fresh();n.legacy=s;return n;}
 if(s.version!==2||!obj(s.lessons))throw Error('不支持的备份版本或缺少课时记录');
 const n=fresh();
 if(s.seminars!==undefined){
  if(!obj(s.seminars))throw Error('专题记录格式错误');
  const v=s.seminars.M03;
  if(v!==undefined){if(!obj(v)||!['todo','reading','review','done'].includes(v.status)||typeof v.bookmark!=='boolean'||typeof v.note!=='string'||v.note.length>100000)throw Error('M03 专题记录格式错误');n.seminars.M03={status:v.status,bookmark:v.bookmark,note:v.note};}
 }
 if(s.research!==undefined){
  if(!obj(s.research))throw Error('研究阅读记录格式错误');
  for(const id of RIDS){const r=s.research[id];if(r===undefined)continue;
   if(!obj(r)||!['todo','reading','review','done'].includes(r.status)||typeof r.bookmark!=='boolean'||typeof r.note!=='string'||r.note.length>100000)throw Error(`${id} 的阅读记录格式错误`);
   n.research[id]={status:r.status,bookmark:r.bookmark,note:r.note};
  }
 }
 for(const id of IDS){const v=s.lessons[id];if(v===undefined)continue;
  if(!obj(v)||!Object.hasOwn(statuses,v.status)||!Number.isFinite(v.minutes)||v.minutes<0||v.minutes>100000||typeof v.note!=='string'||v.note.length>100000)throw Error(`${id} 的状态、用时或笔记格式错误`);
  n.lessons[id]={status:v.status,minutes:v.minutes,note:v.note};}
 if(!Array.isArray(s.meetings)||s.meetings.length>1000)throw Error('组会记录格式错误');
 n.meetings=s.meetings.map(m=>{if(!obj(m)||!['id','date','title','lesson','terms','body'].every(k=>typeof m[k]==='string'&&m[k].length<=100000))throw Error('组会记录字段错误');return Object.fromEntries(['id','date','title','lesson','terms','body'].map(k=>[k,m[k]]));});
 if(s.startDate!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(s.startDate)||!Number.isFinite(Date.parse(s.startDate))))throw Error('开始日期无效');
 n.startDate=s.startDate;n.theme=s.theme==='dark'?'dark':'light';n.legacy=s.legacy??null;n.updatedAt=typeof s.updatedAt==='string'?s.updatedAt:null;return n;
}
function load(storage){let warning='',state=fresh(),raw='';try{raw=storage.getItem(KEY);if(raw)state=validate(JSON.parse(raw));else{const old=storage.getItem(OLD);if(old){try{state.legacy=JSON.parse(old);}catch{state.legacy={unparsed:old};}warning='已保留旧版记录，新课程需要独立自检。';}}}catch(e){if(raw)state.legacy={unreadableCurrentBackup:raw};warning='无法读取本地记录：'+e.message+'。原始内容已保留在档案中，请先导出备份。';}return{state,warning};}
function save(storage,state){state.updatedAt=new Date().toISOString();try{storage.setItem(KEY,JSON.stringify(state));return{ok:true};}catch(e){return{ok:false,message:'浏览器无法保存：'+e.message+'。内容仍在当前页面，请立即导出备份。'};}}
root.CourseState={KEY,OLD,IDS,statuses,fresh,validate,load,save};
})(typeof window==='undefined'?globalThis:window);
