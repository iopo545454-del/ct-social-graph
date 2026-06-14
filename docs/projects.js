
const v='20260614-project-atlas-v1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const idOf=p=>String(p.handle||p.name||'unknown').replace(/^@/,'');
let profiles=[], projects=[];
function collect(){
  const map=new Map();
  for(const prof of profiles){
    for(const p of (prof.projects_mentioned||[])){
      const key=idOf(p).toLowerCase();
      const rec=map.get(key)||{id:idOf(p), name:p.name, handle:p.handle, mentions:[], stances:new Set(), evidence:new Set()};
      rec.mentions.push({trader:prof.handle, stance:p.stance||'unclear', summary:p.summary||'', evidence_urls:p.evidence_urls||[]});
      rec.stances.add(p.stance||'unclear');
      (p.evidence_urls||[]).forEach(u=>rec.evidence.add(u));
      map.set(key,rec);
    }
  }
  projects=[...map.values()].sort((a,b)=>b.mentions.length-a.mentions.length || b.evidence.size-a.evidence.size || a.name.localeCompare(b.name));
}
function render(){
  const q=document.querySelector('#atlasSearch').value.toLowerCase();
  const stance=document.querySelector('#stanceFilter').value;
  const filtered=projects.filter(p=>{
    const blob=JSON.stringify({...p,stances:[...p.stances],evidence:[...p.evidence]}).toLowerCase();
    return (!q||blob.includes(q)) && (!stance||p.mentions.some(m=>m.stance===stance));
  });
  const traders=new Set(projects.flatMap(p=>p.mentions.map(m=>m.trader)));
  document.querySelector('#atlasStats').innerHTML=`<div><b>${projects.length}</b><span>projects / tickers</span></div><div><b>${traders.size}</b><span>seed traders with mentions</span></div><div><b>${projects.reduce((n,p)=>n+p.mentions.length,0)}</b><span>trader-project rows</span></div><div><b>${projects.reduce((n,p)=>n+p.evidence.size,0)}</b><span>evidence links</span></div>`;
  document.querySelector('#projectGrid').innerHTML=filtered.map((p,i)=>`<button class="project-card stance-${esc([...p.stances][0])}" data-i="${i}"><div class="project-name">${esc(p.name)}</div><div class="project-handle">${p.handle?'@'+esc(p.handle):'ticker / unhandled entity'}</div><div class="project-meta"><span>${p.mentions.length} trader${p.mentions.length>1?'s':''}</span><span>${p.evidence.size} links</span><span>${esc([...p.stances].join(' / '))}</span></div><div class="mention-chips">${p.mentions.map(m=>`<span>@${esc(m.trader)} · ${esc(m.stance)}</span>`).join('')}</div></button>`).join('')||'<p class="empty">No matching projects.</p>';
  document.querySelectorAll('.project-card').forEach((el,idx)=>el.addEventListener('click',()=>inspect(filtered[idx])));
  if(filtered[0]) inspect(filtered[0]);
}
function inspect(p){
  document.querySelector('#projectInspector').innerHTML=`<p class="eyebrow">${esc([...p.stances].join(' / '))}</p><h2>${esc(p.name)}</h2><p class="muted">${p.handle?'@'+esc(p.handle):'No canonical X handle captured yet'} · ${p.mentions.length} trader mention(s) · ${p.evidence.size} evidence link(s)</p>${p.mentions.map(m=>`<div class="project-evidence"><h3>@${esc(m.trader)} <span>${esc(m.stance)}</span></h3><p>${esc(m.summary)}</p>${m.evidence_urls.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>`).join('')}</div>`).join('')}`;
}
Promise.all(['account-profiles'].map(n=>fetch(`data/${n}.json?v=${v}`).then(r=>r.json()))).then(([p])=>{profiles=p;collect();render();});
document.querySelector('#atlasSearch').addEventListener('input',render);
document.querySelector('#stanceFilter').addEventListener('change',render);
