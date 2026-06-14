const v='20260614-blog-watch-v1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const idOf=p=>String(p.handle||p.name||'unknown').replace(/^@/,'');
const normUrl=u=>String(u||'').replace(/\?.*$/,'').replace(/\/$/,'');
let profiles=[], posts=[], interactions=[], projects=[], mentionRows=[];
let activeProjectKey=null;

function dateForUrl(url){
  const u=normUrl(url);
  const hitPost=posts.find(p=>normUrl(p.url)===u);
  if(hitPost?.date) return hitPost.date;
  const hitInt=interactions.find(x=>normUrl(x.url)===u);
  if(hitInt?.date) return hitInt.date;
  return 'undated';
}
function summaryForUrl(url, fallback){
  const u=normUrl(url);
  const hitPost=posts.find(p=>normUrl(p.url)===u);
  if(hitPost?.summary) return hitPost.summary;
  const hitInt=interactions.find(x=>normUrl(x.url)===u);
  if(hitInt?.summary) return hitInt.summary;
  return fallback || '';
}
function collect(){
  const map=new Map();
  const rows=[];
  for(const prof of profiles){
    for(const p of (prof.projects_mentioned||[])){
      const key=idOf(p).toLowerCase();
      if(!key) continue;
      const rec=map.get(key)||{id:idOf(p), key, name:p.name, handle:p.handle, mentions:[], stances:new Set(), evidence:new Set()};
      rec.mentions.push({trader:prof.handle, stance:p.stance||'unclear', summary:p.summary||'', evidence_urls:p.evidence_urls||[]});
      rec.stances.add(p.stance||'unclear');
      (p.evidence_urls||[]).forEach(u=>{
        rec.evidence.add(u);
        rows.push({
          projectKey:key,
          projectName:p.name || idOf(p),
          projectHandle:p.handle,
          trader:prof.handle,
          stance:p.stance||'unclear',
          url:u,
          date:dateForUrl(u),
          summary:summaryForUrl(u,p.summary),
        });
      });
      map.set(key,rec);
    }
  }
  projects=[...map.values()].sort((a,b)=>b.mentions.length-a.mentions.length || b.evidence.size-a.evidence.size || a.name.localeCompare(b.name));
  mentionRows=rows.sort((a,b)=>{
    const da=a.date==='undated'?'0000-00-00':a.date;
    const db=b.date==='undated'?'0000-00-00':b.date;
    return db.localeCompare(da) || a.projectName.localeCompare(b.projectName);
  });
}
function currentFilters(){return {q:document.querySelector('#atlasSearch').value.toLowerCase(), stance:document.querySelector('#stanceFilter').value};}
function filteredProjects(){
  const {q,stance}=currentFilters();
  return projects.filter(p=>{
    const blob=JSON.stringify({...p,stances:[...p.stances],evidence:[...p.evidence]}).toLowerCase();
    return (!q||blob.includes(q)) && (!stance||p.mentions.some(m=>m.stance===stance));
  });
}
function filteredMentions(){
  const {q,stance}=currentFilters();
  return mentionRows.filter(r=>{
    const blob=JSON.stringify(r).toLowerCase();
    return (!q||blob.includes(q)) && (!stance||r.stance===stance);
  });
}
function render(){
  const filtered=filteredProjects();
  const visibleMentions=filteredMentions();
  const traders=new Set(projects.flatMap(p=>p.mentions.map(m=>m.trader)));
  document.querySelector('#atlasStats').innerHTML=`<div><b>${projects.length}</b><span>projects / tickers</span></div><div><b>${traders.size}</b><span>seed traders with mentions</span></div><div><b>${mentionRows.length}</b><span>tweet-linked mentions</span></div><div><b>${projects.reduce((n,p)=>n+p.evidence.size,0)}</b><span>evidence links</span></div>`;
  document.querySelector('#mentionTimeline').innerHTML=visibleMentions.map(r=>`<a class="mention-row ${activeProjectKey===r.projectKey?'active':''}" href="${esc(r.url)}" target="_blank" rel="noopener" data-project="${esc(r.projectKey)}"><time>${esc(r.date)}</time><strong>${esc(r.projectName)}</strong><span>@${esc(r.trader)} · ${esc(r.stance)}</span><p>${esc(r.summary)}</p></a>`).join('')||'<p class="empty">No matching mentions.</p>';
  document.querySelector('#mentionCount').textContent=String(visibleMentions.length);
  document.querySelectorAll('.mention-row').forEach(el=>{
    el.addEventListener('mouseenter',()=>selectProject(el.dataset.project,false));
    el.addEventListener('focus',()=>selectProject(el.dataset.project,false));
  });
  document.querySelector('#projectGrid').innerHTML=filtered.map((p,i)=>`<button class="project-card stance-${esc([...p.stances][0])} ${activeProjectKey===p.key?'active':''}" data-key="${esc(p.key)}"><div class="project-name">${esc(p.name)}</div><div class="project-handle">${p.handle?'@'+esc(p.handle):'ticker / unhandled entity'}</div><div class="project-meta"><span>${p.mentions.length} trader${p.mentions.length>1?'s':''}</span><span>${p.evidence.size} links</span><span>${esc([...p.stances].join(' / '))}</span></div><div class="mention-chips">${p.mentions.map(m=>`<span>@${esc(m.trader)} · ${esc(m.stance)}</span>`).join('')}</div></button>`).join('')||'<p class="empty">No matching projects.</p>';
  document.querySelectorAll('.project-card').forEach(el=>el.addEventListener('click',()=>selectProject(el.dataset.key,true)));
  const selected=projects.find(p=>p.key===activeProjectKey) || filtered[0];
  if(selected){ activeProjectKey=selected.key; inspect(selected); }
}
function selectProject(key, rerender=true){
  activeProjectKey=key;
  const p=projects.find(x=>x.key===key);
  if(p) inspect(p);
  if(rerender) render();
  else {
    document.querySelectorAll('.project-card,.mention-row').forEach(el=>el.classList.toggle('active', el.dataset.project===key || el.dataset.key===key));
  }
}
function inspect(p){
  const rows=mentionRows.filter(r=>r.projectKey===p.key);
  document.querySelector('#projectInspector').innerHTML=`<p class="eyebrow">${esc([...p.stances].join(' / '))}</p><h2>${esc(p.name)}</h2><p class="muted">${p.handle?'@'+esc(p.handle):'No canonical X handle captured yet'} · ${p.mentions.length} trader mention(s) · ${p.evidence.size} evidence link(s)</p><div class="inspector-timeline">${rows.map(r=>`<a class="project-evidence compact" href="${esc(r.url)}" target="_blank" rel="noopener"><h3>${esc(r.date)} · @${esc(r.trader)} <span>${esc(r.stance)}</span></h3><p>${esc(r.summary)}</p><b>open tweet ↗</b></a>`).join('')}</div>${p.mentions.map(m=>`<div class="project-evidence"><h3>@${esc(m.trader)} <span>${esc(m.stance)}</span></h3><p>${esc(m.summary)}</p>${m.evidence_urls.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>`).join('')}</div>`).join('')}`;
}
Promise.all(['account-profiles','posts','interactions'].map(n=>fetch(`data/${n}.json?v=${v}`).then(r=>r.json()))).then(([p,po,i])=>{profiles=p;posts=po;interactions=i;collect();render();});
document.querySelector('#atlasSearch').addEventListener('input',render);
document.querySelector('#stanceFilter').addEventListener('change',render);
