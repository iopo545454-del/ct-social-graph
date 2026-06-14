
const v='20260614-graph-v2';
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
function simulate(nodes,edges,w,h){
  const by=new Map(nodes.map(n=>[n.id,n]));
  nodes.forEach((n,i)=>{ if(!Number.isFinite(n.x)){n.x=w/2+Math.cos(i)*200;n.y=h/2+Math.sin(i)*160;} if(n.tier===1){n.x=Math.min(w*.38, Math.max(100,n.x));} else if(n.kind==='project'){n.x=Math.max(w*.58,n.x)} });
  for(let t=0;t<240;t++){
    nodes.forEach(n=>{ const targetX=n.tier===1?w*.22:(n.kind==='project'?w*.75:w*.55), targetY=h*(.15+(Math.abs(hash(n.id))%100)/130); n.vx+=(targetX-n.x)*0.004; n.vy+=(targetY-n.y)*0.004; });
    for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){ const a=nodes[i],b=nodes[j]; let dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy)||1; const min=42+Math.min(70,(a.degree+b.degree)*4); if(d<min){ const f=(min-d)/d*.045; a.vx+=dx*f;b.vx-=dx*f;a.vy+=dy*f;b.vy-=dy*f; }}
    edges.forEach(e=>{const a=by.get(e.source),b=by.get(e.target); if(!a||!b)return; let dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||1; const ideal=180-Math.min(70,e.weight*8); const f=(d-ideal)/d*.015; a.vx+=dx*f;b.vx-=dx*f;a.vy+=dy*f;b.vy-=dy*f;});
    nodes.forEach(n=>{n.vx*=.82;n.vy*=.82;n.x=Math.max(40,Math.min(w-40,n.x+n.vx));n.y=Math.max(40,Math.min(h-40,n.y+n.vy));});
  }
}
function hash(s){let h=0; for(const c of s)h=(h*31+c.charCodeAt(0))|0; return h;}
function render(){
  const svg=document.querySelector('#networkSvg'); const box=svg.parentElement.getBoundingClientRect(); const w=Math.max(760,box.width), h=Math.max(620,box.height); svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const g=filterGraph(); simulate(g.nodes,g.edges,w,h); const by=new Map(g.nodes.map(n=>[n.id,n]));
  svg.innerHTML=`<defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`+
    g.edges.map(e=>{const a=by.get(e.source),b=by.get(e.target); if(!a||!b)return''; const hi=e.items.some(x=>x.quality==='high'); return `<path class="edge ${hi?'edge-hi':''}" d="M${a.x},${a.y} C${(a.x+b.x)/2},${a.y} ${(a.x+b.x)/2},${b.y} ${b.x},${b.y}" stroke-width="${1+e.weight}" data-edge="${esc(e.source+'|'+e.target)}"/>`;}).join('')+
    g.nodes.map(n=>`<g class="node node-${esc(n.kind)} tier-${esc(n.tier)}" transform="translate(${n.x},${n.y})" data-node="${esc(n.id)}"><circle r="${12+Math.min(16,n.degree*2)}"/><text x="${16+Math.min(16,n.degree*2)}" y="5">@${esc(n.id)}</text></g>`).join('');
  svg.querySelectorAll('[data-node]').forEach(el=>el.addEventListener('click',()=>inspectNode(el.dataset.node)));
  svg.querySelectorAll('[data-edge]').forEach(el=>el.addEventListener('click',()=>inspectEdge(el.dataset.edge)));
}
function inspectNode(id){ const links=state.interactions.filter(e=>norm(e.from)===id||norm(e.to)===id); const a=state.accounts.find(x=>norm(x.handle)===id); document.querySelector('#inspector').innerHTML=`<p class="eyebrow">${esc(a?.kind||'node')} · Tier ${esc(a?.tier||'?')}</p><h2>@${esc(id)}</h2><p class="muted">${esc(a?.reason||'Unregistered interaction node')}</p><h3>Connections</h3>${links.map(e=>`<a class="mini-evidence" href="${esc(e.url)}" target="_blank"><b>@${esc(e.from)} → @${esc(e.to)}</b><span>${esc(e.type)} · ${esc(e.date)} · ${esc(e.quality)}</span><p>${esc(e.summary)}</p></a>`).join('')||'<p class="muted">No visible edges.</p>'}`; }
function inspectEdge(key){ const [s,t]=key.split('|'); const items=state.interactions.filter(e=>norm(e.from)===s&&norm(e.to)===t); document.querySelector('#inspector').innerHTML=`<p class="eyebrow">edge evidence</p><h2>@${esc(s)} → @${esc(t)}</h2>${items.map(e=>`<a class="mini-evidence" href="${esc(e.url)}" target="_blank"><b>${esc(e.type)} · ${esc(e.date)} · ${esc(e.quality)}</b><p>${esc(e.summary)}</p></a>`).join('')}`;}
Promise.all(['accounts','interactions'].map(n=>fetch(`data/${n}.json?v=${v}`).then(r=>r.json()))).then(([accounts,interactions])=>{state.accounts=accounts;state.interactions=interactions;Object.assign(state,build(accounts,interactions));render();inspectNode('AustinBarack');});
document.querySelectorAll('#graphMode button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#graphMode button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.mode=b.dataset.mode;render();}));
window.addEventListener('resize',()=>render());
