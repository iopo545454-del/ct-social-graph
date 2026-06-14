
const v='20260614-graph-v1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x||'').replace(/^@/,'');
const qWeight=q=>q==='high'?3:q==='medium'?2:1;
let data={};
Promise.all(['accounts','interactions','account-profiles'].map(n=>fetch(`data/${n}.json?v=${v}`).then(r=>r.json()))).then(([accounts,interactions,profiles])=>{data={accounts,interactions,profiles};renderMatrix();});
function renderMatrix(){
  const traders=data.accounts.filter(a=>a.tier===1&&a.kind==='individual').map(a=>norm(a.handle));
  const projects=[...new Set(data.interactions.filter(e=>e.to_kind==='project').map(e=>norm(e.to)))].sort();
  const cells=new Map();
  for(const e of data.interactions.filter(e=>e.to_kind==='project')){const k=`${norm(e.from)}|${norm(e.to)}`; const c=cells.get(k)||{score:0,items:[]}; c.score+=qWeight(e.quality); c.items.push(e); cells.set(k,c);}
  const wrap=document.querySelector('#matrixWrap');
  wrap.style.setProperty('--cols',projects.length);
  wrap.innerHTML=`<div class="matrix-corner">Trader</div>${projects.map(p=>`<div class="matrix-col"><span>@${esc(p)}</span></div>`).join('')}`+
    traders.map(t=>`<div class="matrix-row-label">@${esc(t)}</div>`+projects.map(p=>{const c=cells.get(`${t}|${p}`); const level=!c?0:Math.min(3,Math.ceil(c.score/2)); return `<button class="matrix-cell heat h${level}" data-trader="${esc(t)}" data-project="${esc(p)}" title="@${esc(t)} × @${esc(p)}">${c?c.items.length:''}</button>`}).join('')).join('');
  wrap.querySelectorAll('.matrix-cell').forEach(el=>el.addEventListener('click',()=>inspect(el.dataset.trader,el.dataset.project,cells.get(`${el.dataset.trader}|${el.dataset.project}`))));
  const first=[...cells.keys()][0]?.split('|') || [traders[0],projects[0]];
  inspect(first[0],first[1],cells.get(`${first[0]}|${first[1]}`));
}
function inspect(t,p,c){
  const prof=data.profiles.find(x=>norm(x.handle)===t);
  let projectMention=prof?.projects_mentioned?.find(x=>norm(x.handle||x.name).toLowerCase()===p.toLowerCase() || String(x.name||'').toLowerCase().includes(p.toLowerCase()));
  document.querySelector('#matrixInspector').innerHTML=`<p class="eyebrow">matrix cell</p><h2>@${esc(t)} × @${esc(p)}</h2>${c?`<p class="muted">${c.items.length} interaction(s), score ${c.score}</p>${c.items.map(e=>`<a class="mini-evidence" href="${esc(e.url)}" target="_blank"><b>${esc(e.type)} · ${esc(e.date)} · ${esc(e.quality)}</b><p>${esc(e.summary)}</p></a>`).join('')}`:'<p class="muted">No direct logged interaction yet.</p>'}${projectMention?`<h3>Profile note</h3><p>${esc(projectMention.summary)}</p>`:''}`;
}
