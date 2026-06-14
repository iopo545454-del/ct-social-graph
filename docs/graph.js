
const v='20260614-graph-v3';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x||'').replace(/^@/,'');
const qualityWeight=q=>q==='high'?3:q==='medium'?2:1;
let state={mode:'all',nodes:[],edges:[],accounts:[],interactions:[]};
function nodeKind(handle, accounts){ const a=accounts.find(x=>norm(x.handle).toLowerCase()===norm(handle).toLowerCase()); return a?.kind || 'individual'; }
function build(accounts, interactions){
  const map=new Map(), edgeMap=new Map();
  const add=(id,kind,tier=2)=>{id=norm(id); if(!map.has(id)) map.set(id,{id,kind,tier,x:Math.random()*900+80,y:Math.random()*520+80,vx:0,vy:0,degree:0}); return map.get(id)};
  accounts.forEach(a=>add(a.handle,a.kind,a.tier));
  interactions.forEach(e=>{ const from=add(e.from,'individual',1); const to=add(e.to,nodeKind(e.to,accounts),accounts.find(a=>norm(a.handle).toLowerCase()===norm(e.to).toLowerCase())?.tier||2); from.degree++; to.degree++; const key=`${from.id}->${to.id}`; const old=edgeMap.get(key)||{source:from.id,target:to.id,count:0,weight:0,items:[]}; old.count++; old.weight+=qualityWeight(e.quality); old.items.push(e); edgeMap.set(key,old); });
  return {nodes:[...map.values()],edges:[...edgeMap.values()]};
}
function filterGraph(){
  const mode=state.mode; let edges=state.edges;
  if(mode==='high') edges=edges.filter(e=>e.items.some(x=>x.quality==='high'));
  if(mode==='projects') edges=edges.filter(e=>state.nodes.find(n=>n.id===e.target)?.kind==='project');
  if(mode==='people') edges=edges.filter(e=>state.nodes.find(n=>n.id===e.target)?.kind==='individual');
  const keep=new Set(edges.flatMap(e=>[e.source,e.target]));
  return {nodes:state.nodes.filter(n=>keep.has(n.id)),edges};
}
function layout(nodes, edges, w, h){
  const connected=new Set(edges.flatMap(e=>[e.source,e.target]));
  const left=nodes.filter(n=>connected.has(n.id)&&n.tier===1).sort((a,b)=>a.id.localeCompare(b.id));
  const projects=nodes.filter(n=>connected.has(n.id)&&n.kind==='project').sort((a,b)=>b.degree-a.degree||a.id.localeCompare(b.id));
  const people=nodes.filter(n=>connected.has(n.id)&&n.tier!==1&&n.kind!=='project').sort((a,b)=>b.degree-a.degree||a.id.localeCompare(b.id));
  const place=(arr,x,y0,y1)=>arr.forEach((n,i)=>{ const t=arr.length===1?.5:i/(arr.length-1); n.x=x; n.y=y0+(y1-y0)*t; });
  place(left, Math.max(120,w*.16), 92, h-92);
  place(projects, Math.min(w-220,w*.72), 88, h-105);
  place(people, Math.min(w-160,w*.50), 110, h-120);
  // Nudge lonely candidate people upward so they don't hide project labels.
  people.forEach((n,i)=>{ n.y += (i%2?-34:34); });
}
function render(){
  const svg=document.querySelector('#networkSvg'); const box=svg.parentElement.getBoundingClientRect(); const w=Math.max(760,box.width), h=Math.max(620,box.height); svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const g=filterGraph(); layout(g.nodes,g.edges,w,h); const by=new Map(g.nodes.map(n=>[n.id,n]));
  svg.innerHTML=`<defs><filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M 42 0 L 0 0 0 42" fill="none" stroke="rgba(255,255,255,.045)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)"/>`+
    g.edges.map(e=>{const a=by.get(e.source),b=by.get(e.target); if(!a||!b)return''; const hi=e.items.some(x=>x.quality==='high'); return `<path class="edge ${hi?'edge-hi':''}" d="M${a.x},${a.y} C${(a.x+b.x)/2},${a.y} ${(a.x+b.x)/2},${b.y} ${b.x},${b.y}" stroke-width="${Math.min(10,2+e.weight*.9)}" data-edge="${esc(e.source+'|'+e.target)}"/>`;}).join('')+
    g.nodes.map(n=>`<g class="node node-${esc(n.kind)} tier-${esc(n.tier)}" transform="translate(${n.x},${n.y})" data-node="${esc(n.id)}"><circle r="${16+Math.min(20,n.degree*3)}"/><text x="${23+Math.min(20,n.degree*3)}" y="6">@${esc(n.id)}</text></g>`).join('');
  svg.querySelectorAll('[data-node]').forEach(el=>el.addEventListener('click',()=>inspectNode(el.dataset.node)));
  svg.querySelectorAll('[data-edge]').forEach(el=>el.addEventListener('click',()=>inspectEdge(el.dataset.edge)));
}
function inspectNode(id){ const links=state.interactions.filter(e=>norm(e.from)===id||norm(e.to)===id); const a=state.accounts.find(x=>norm(x.handle)===id); document.querySelector('#inspector').innerHTML=`<p class="eyebrow">${esc(a?.kind||'node')} · Tier ${esc(a?.tier||'?')}</p><h2>@${esc(id)}</h2><p class="muted">${esc(a?.reason||'Unregistered interaction node')}</p><h3>Connections</h3>${links.map(e=>`<a class="mini-evidence" href="${esc(e.url)}" target="_blank"><b>@${esc(e.from)} → @${esc(e.to)}</b><span>${esc(e.type)} · ${esc(e.date)} · ${esc(e.quality)}</span><p>${esc(e.summary)}</p></a>`).join('')||'<p class="muted">No visible edges.</p>'}`; }
function inspectEdge(key){ const [s,t]=key.split('|'); const items=state.interactions.filter(e=>norm(e.from)===s&&norm(e.to)===t); document.querySelector('#inspector').innerHTML=`<p class="eyebrow">edge evidence</p><h2>@${esc(s)} → @${esc(t)}</h2>${items.map(e=>`<a class="mini-evidence" href="${esc(e.url)}" target="_blank"><b>${esc(e.type)} · ${esc(e.date)} · ${esc(e.quality)}</b><p>${esc(e.summary)}</p></a>`).join('')}`;}
Promise.all(['accounts','interactions'].map(n=>fetch(`data/${n}.json?v=${v}`).then(r=>r.json()))).then(([accounts,interactions])=>{state.accounts=accounts;state.interactions=interactions;Object.assign(state,build(accounts,interactions));render();inspectNode('AustinBarack');});
document.querySelectorAll('#graphMode button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#graphMode button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.mode=b.dataset.mode;render();}));
window.addEventListener('resize',()=>render());
