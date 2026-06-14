let accounts=[], interactions=[], posts=[], candidates=[];
const v='20260614-v1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byDate=(a,b)=>String(b.date||'').localeCompare(String(a.date||''));
function render(){
  const q=document.querySelector('#search').value.toLowerCase();
  const tier=document.querySelector('#tier').value;
  const kind=document.querySelector('#kind').value;
  const filtered=accounts.filter(a=>{
    const blob=JSON.stringify(a).toLowerCase();
    return (!q||blob.includes(q))&&(!tier||String(a.tier)===tier)&&(!kind||a.kind===kind);
  }).sort((a,b)=>(a.tier-b.tier)||String(a.handle).localeCompare(String(b.handle)));
  document.querySelector('#accountCount').textContent=`${filtered.length}/${accounts.length}`;
  document.querySelector('#accounts').innerHTML=filtered.map(a=>`<a class="card" href="https://x.com/${esc(a.handle.replace(/^@/,''))}" target="_blank" rel="noopener"><div class="handle">@${esc(a.handle.replace(/^@/,''))}</div><div class="meta"><span class="pill tier${esc(a.tier)}">Tier ${esc(a.tier)}</span><span class="pill">${esc(a.kind)}</span><span class="pill">${esc(a.status||'tracked')}</span></div><p class="reason">${esc(a.reason||'')}</p></a>`).join('')||'<p class="empty">No matching accounts.</p>';
  document.querySelector('#interactionCount').textContent=String(interactions.length);
  document.querySelector('#interactions').innerHTML=[...interactions].sort(byDate).slice(0,50).map(x=>`<a class="item" href="${esc(x.url||'#')}" target="_blank" rel="noopener"><strong>@${esc(x.from)} → @${esc(x.to)}</strong><p>${esc(x.type||'interaction')} · ${esc(x.date||'')} · ${esc(x.quality||'')}</p><p>${esc(x.summary||'')}</p></a>`).join('')||'<p class="empty">No interactions logged yet.</p>';
  document.querySelector('#postCount').textContent=String(posts.length);
  document.querySelector('#posts').innerHTML=[...posts].sort(byDate).slice(0,50).map(x=>`<a class="item" href="${esc(x.url||'#')}" target="_blank" rel="noopener"><strong>@${esc(x.handle||'')}</strong><p>${esc(x.date||'')} · ${esc(x.topic||'post')}</p><p>${esc(x.summary||'')}</p></a>`).join('')||'<p class="empty">No notable posts logged yet.</p>';
  document.querySelector('#candidateCount').textContent=String(candidates.length);
  document.querySelector('#candidates').innerHTML=[...candidates].sort(byDate).slice(0,50).map(x=>`<a class="item" href="${esc(x.evidence_url||'#')}" target="_blank" rel="noopener"><strong>@${esc(x.handle||'')}</strong><p>${esc(x.status||'candidate')} · ${esc(x.kind||'individual')} · introduced by @${esc(x.introduced_by||'')}</p><p>${esc(x.reason||'')}</p></a>`).join('')||'<p class="empty">No candidates yet.</p>';
}
Promise.all(['accounts','interactions','posts','candidates'].map(name=>fetch(`data/${name}.json?v=${v}`).then(r=>r.ok?r.json():[]))).then(([a,i,p,c])=>{accounts=a;interactions=i;posts=p;candidates=c;render();}).catch(e=>{console.error(e);document.querySelector('#accounts').innerHTML='<p class="empty">Failed to load data.</p>';});
document.querySelector('#search').addEventListener('input',render);
document.querySelector('#tier').addEventListener('change',render);
document.querySelector('#kind').addEventListener('change',render);
