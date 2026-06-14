const v='20260614-blog-watch-v1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data={articles:[],sources:[],last_checked:null}, sources=[];
function render(){
 const q=document.querySelector('#blogSearch').value.toLowerCase(); const tier=document.querySelector('#tierFilter').value;
 const rows=(data.articles||[]).filter(a=>(!tier||String(a.tier)===tier)&&(!q||JSON.stringify(a).toLowerCase().includes(q)));
 const active=sources.filter(s=>s.status==='active').length; const blocked=sources.length-active;
 document.querySelector('#blogStats').innerHTML=`<div><b>${sources.length}</b><span>tracked sources</span></div><div><b>${active}</b><span>active checks</span></div><div><b>${data.articles?.length||0}</b><span>links captured</span></div><div><b>${blocked}</b><span>blocked/gated/offline</span></div>`;
 document.querySelector('#articleCount').textContent=`${rows.length} shown`;
 document.querySelector('#articleTape').innerHTML=rows.map(a=>`<a class="blog-row" href="${esc(a.url)}" target="_blank" rel="noopener"><span class="pill tier${a.tier}">Tier ${esc(a.tier)}</span><strong>${esc(a.title)}</strong><p>${esc(a.source)} · first seen ${esc(a.first_seen||'unknown')}</p><small>${esc(a.url)}</small></a>`).join('')||'<p class="empty">No matching posts.</p>';
 document.querySelector('#sourceCount').textContent=`${sources.length} sources`;
 document.querySelector('#sourceList').innerHTML=sources.map(s=>`<a class="source-row status-${esc(s.status)}" href="${esc(s.url)}" target="_blank" rel="noopener"><b>${esc(s.name)}</b><span>Tier ${esc(s.tier)} · ${esc(s.status)}</span><p>${esc(s.notes||'')}</p></a>`).join('');
}
Promise.all([fetch(`data/blog-updates.json?v=${v}`).then(r=>r.json()).catch(()=>({articles:[],sources:[],last_checked:null})),fetch(`data/blog-sources.json?v=${v}`).then(r=>r.json())]).then(([d,s])=>{data=d;sources=s;render();});
document.querySelector('#blogSearch').addEventListener('input',render); document.querySelector('#tierFilter').addEventListener('change',render);
