'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={tabs:[],saved:[],bookmarks:[],brandName:'TabMori',view:'all',query:'',layout:'grid'};
const tones=['#b8a6ff','#85e8c4','#ffbe7b','#70b8ff','#f28daf','#d7e36d'];
const demo=[
 {id:1,title:'Designing interfaces that feel inevitable',url:'https://www.figma.com/community',favIconUrl:''},
 {id:2,title:'tab-out · GitHub',url:'https://github.com/zarazhangrui/tab-out',favIconUrl:''},
 {id:3,title:'Pull requests · tab-out',url:'https://github.com/zarazhangrui/tab-out/pulls',favIconUrl:''},
 {id:4,title:'Ambient focus mix',url:'https://www.youtube.com/watch?v=focus',favIconUrl:''},
 {id:5,title:'Product roadmap',url:'https://www.notion.so/roadmap',favIconUrl:''},
 {id:6,title:'Inbox (4)',url:'https://mail.google.com/mail/u/0/#inbox',favIconUrl:''}
];
function safeUrl(url){try{return new URL(url)}catch{return null}}
function domain(tab){const u=safeUrl(tab.url);return u?u.hostname.replace(/^www\./,''):'其他'}
function favicon(tab){if(tab.favIconUrl)return tab.favIconUrl;if(globalThis.chrome?.runtime?.id)return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(tab.url)}&size=32`;return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain(tab))}&sz=32`}
function escapeHtml(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
async function load(){
  try{if(location.protocol!=='chrome-extension:')throw new Error('preview');state.tabs=(await chrome.tabs.query({})).filter(t=>/^https?:|^file:/.test(t.url||''));const x=await chrome.storage.local.get(['saved','brandName','roomName']);state.saved=x.saved||[];state.brandName=x.brandName||x.roomName||state.brandName;const tree=await chrome.bookmarks.getTree();state.bookmarks=flattenBookmarks(tree)}catch{state.tabs=demo;state.saved=[];state.bookmarks=[{id:'b1',title:'灵感收藏：设计系统',url:'https://www.figma.com/community'},{id:'b2',title:'GitHub',url:'https://github.com'}]}
  updateBrand();
  render();
}
function flattenBookmarks(nodes,out=[]){for(const n of nodes){if(n.url)out.push({id:`bookmark-${n.id}`,bookmarkId:n.id,title:n.title||n.url,url:n.url});if(n.children)flattenBookmarks(n.children,out)}return out}
function groupsFor(tabs){const map=new Map();tabs.forEach(t=>{const d=domain(t);if(!map.has(d))map.set(d,[]);map.get(d).push(t)});return [...map].sort((a,b)=>b[1].length-a[1].length)}
function duplicateUrls(){const counts={};state.tabs.forEach(t=>counts[t.url]=(counts[t.url]||0)+1);return new Set(Object.keys(counts).filter(u=>counts[u]>1))}
function visibleTabs(){let tabs=state.view==='saved'?state.saved:state.view==='bookmarks'?state.bookmarks:state.tabs;const dupes=duplicateUrls();if(state.view==='duplicates')tabs=tabs.filter(t=>dupes.has(t.url));if(state.query){const q=state.query.toLowerCase();tabs=tabs.filter(t=>(t.title+' '+t.url+' '+domain(t)).toLowerCase().includes(q))}return tabs}
function render(){
  const dupes=duplicateUrls(),groups=groupsFor(visibleTabs());
  $('#tabCount').textContent=state.tabs.length;$('#groupCount').textContent=groupsFor(state.tabs).length;$('#navCount').textContent=state.tabs.length;$('#savedCount').textContent=state.saved.length;$('#dupeCount').textContent=[...dupes].length;$('#bookmarkCount').textContent=state.bookmarks.length;
  const titles={all:['全部标签','按站点自动整理'],saved:['稍后阅读','可打开、移除或批量清空'],duplicates:['重复页面','保留一份，移除多余副本'],bookmarks:['Chrome 收藏','按标题、网址或域名搜索']};$('#viewTitle').textContent=titles[state.view][0];$('#viewSub').textContent=titles[state.view][1];
  $('#cleanDupes').hidden=state.view!=='duplicates';
  $('#grid').className='grid';$('#grid').innerHTML=groups.map((g,i)=>groupHtml(g,i,dupes)).join('');$('#empty').classList.toggle('hidden',groups.length>0);bindRows();
}
function groupHtml([host,tabs],i,dupes){const color=tones[i%tones.length],saved=state.view==='saved',bookmarks=state.view==='bookmarks';return `<article class="group" style="--tone:${color};animation-delay:${Math.min(i,8)*35}ms"><div class="group-head"><div class="domain-icon">${escapeHtml(host[0]||'?')}</div><div class="group-title"><h3>${escapeHtml(host)}</h3><p>${tabs.length} 个${bookmarks?'收藏':saved?'稍后项目':'标签页'}</p></div><button class="group-menu" title="更多">···</button></div><div>${tabs.slice(0,12).map(t=>`<div class="tab-row" data-id="${t.id||''}" data-url="${escapeHtml(t.url)}"><img class="favicon" src="${escapeHtml(favicon(t))}" alt=""/><div class="tab-copy"><div class="tab-title">${escapeHtml(t.title||'未命名标签')}${dupes.has(t.url)&&!saved&&!bookmarks?' <span class="dupe">重复</span>':''}</div><div class="tab-url">${escapeHtml((safeUrl(t.url)?.pathname||'').slice(0,55))}</div></div><div class="row-actions">${saved?'<button class="close" title="从稍后阅读移除">×</button>':bookmarks?'<button class="open" title="打开收藏">↗</button>':'<button class="save" title="稍后阅读">◇</button><button class="close" title="关闭">×</button>'}</div></div>`).join('')}</div>${bookmarks?'':saved?'<div class="group-footer"><button class="clear-saved close-group">清空此组</button></div>':'<div class="group-footer"><button class="save-group">◇ 全部稍后读</button><button class="close-group">关闭此空间</button></div>'}</article>`}
function bindRows(){
  $$('.tab-row').forEach(row=>{row.onclick=e=>{if(e.target.closest('button'))return;activate(row)};row.querySelector('.save')?.addEventListener('click',()=>saveOne(row));row.querySelector('.open')?.addEventListener('click',()=>openUrl(row.dataset.url));row.querySelector('.close')?.addEventListener('click',()=>state.view==='saved'?removeSaved(row.dataset.url,row):closeIds([Number(row.dataset.id)],row))});
  $$('.group').forEach(card=>{card.querySelector('.clear-saved')?.addEventListener('click',()=>removeSavedGroup([...card.querySelectorAll('.tab-row')].map(r=>r.dataset.url),card));if(state.view==='all'||state.view==='duplicates'){card.querySelector('.close-group')?.addEventListener('click',()=>closeIds([...card.querySelectorAll('.tab-row')].map(r=>Number(r.dataset.id)),card));card.querySelector('.save-group')?.addEventListener('click',()=>Promise.all([...card.querySelectorAll('.tab-row')].map(saveOne)).then(()=>toast('整个空间已放入稍后阅读'))) }});
}
async function openUrl(url){try{await chrome.tabs.create({url})}catch{window.open(url,'_blank')}}
async function activate(row){
  const url=row.dataset.url;
  if(state.view==='saved'||state.view==='bookmarks')return openUrl(url);
  try{
    const live=await chrome.tabs.query({});
    const cachedId=Number(row.dataset.id);
    const match=live.find(t=>t.id===cachedId)||live.find(t=>t.url===url);
    if(!match){toast('这个标签已经关闭了');return load()}
    await chrome.tabs.update(match.id,{active:true});
    await chrome.windows.update(match.windowId,{focused:true});
  }catch{toast('无法跳转，请刷新后重试')}
}
async function removeSaved(url,el){state.saved=state.saved.filter(x=>x.url!==url);try{await chrome.storage.local.set({saved:state.saved})}catch{}el.classList.add('closing');setTimeout(render,160);toast('已从稍后阅读移除')}
async function removeSavedGroup(urls,el){const set=new Set(urls);state.saved=state.saved.filter(x=>!set.has(x.url));try{await chrome.storage.local.set({saved:state.saved})}catch{}el.classList.add('closing');setTimeout(render,160);toast('已清空这组稍后阅读')}
async function saveOne(row){const url=row.dataset.url,t=state.tabs.find(x=>x.url===url)||{url,title:row.querySelector('.tab-title').textContent};if(!state.saved.some(x=>x.url===url)){state.saved.push({id:t.id,url:t.url,title:t.title,favIconUrl:t.favIconUrl,savedAt:Date.now()});try{await chrome.storage.local.set({saved:state.saved})}catch{}toast('已放入稍后阅读');render()}}
async function closeIds(ids,el){ids=ids.filter(Number.isFinite);el.classList.add('closing');try{await chrome.tabs.remove(ids)}catch{}state.tabs=state.tabs.filter(t=>!ids.includes(t.id));setTimeout(render,180)}
async function cleanDupes(){const by={};state.tabs.forEach(t=>(by[t.url]??=[]).push(t));const ids=Object.values(by).flatMap(x=>x.slice(1).map(t=>t.id));if(!ids.length)return toast('没有重复标签，干净得很');await closeIds(ids,$('#grid'));toast(`收走了 ${ids.length} 个重复标签`)}
function toast(s){const t=$('#toast');t.textContent=s;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),1800)}
$$('.nav').forEach(b=>b.onclick=()=>{$$('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.view=b.dataset.view;render()});
$('#search').oninput=e=>{state.query=e.target.value;render()};$('#cleanDupes').onclick=cleanDupes;
const now=new Date();$('#dateText').textContent=now.toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});
function updateBrand(){const name=state.brandName||'TabMori';$('#brandName').textContent=name;$('#brandMark').textContent=Array.from(name)[0]?.toUpperCase()||'T'}
$('#brandName').onclick=()=>{$('#nameInput').value=state.brandName;$('#nameError').textContent='';$('#nameDialog').showModal();$('#nameInput').focus();$('#nameInput').select()};
$('#cancelName').onclick=()=>$('#nameDialog').close();
let nameComposing=false;
function limitNameInput(){const input=$('#nameInput'),chars=Array.from(input.value);if(chars.length>10){input.value=chars.slice(0,10).join('');$('#nameError').textContent='最多输入 10 个字'}else{$('#nameError').textContent=''}}
$('#nameInput').addEventListener('compositionstart',()=>{nameComposing=true});
$('#nameInput').addEventListener('compositionend',()=>{nameComposing=false;limitNameInput()});
$('#nameInput').addEventListener('input',()=>{if(!nameComposing)limitNameInput()});
$('#nameForm').onsubmit=async e=>{e.preventDefault();const name=$('#nameInput').value.trim();if(!name){$('#nameError').textContent='请输入名称';return}if(Array.from(name).length>10){$('#nameError').textContent='名称不能超过 10 个字';return}state.brandName=name;updateBrand();try{await chrome.storage.local.set({brandName:name});await chrome.storage.local.remove('roomName')}catch{}$('#nameDialog').close();toast('名称已保存')};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#search').focus();$('#search').select()}if(e.key==='Escape'&&document.activeElement===$('#search')){$('#search').value='';state.query='';render();$('#search').blur()}});
globalThis.chrome?.tabs?.onRemoved?.addListener(load);globalThis.chrome?.tabs?.onCreated?.addListener(load);globalThis.chrome?.tabs?.onUpdated?.addListener(load);load();
