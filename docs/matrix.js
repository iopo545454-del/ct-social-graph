const v='20260614-project-atlas-v1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=x=>String(x||'').replace(/^@/,'');
const qWeight=q=>q==='high'?3:q==='medium'?2:1;
const stanceWeight=s=>s==='positive'?3:s==='watching'?2:s==='neutral'?1:s==='negative'?2:1;
let data={};
Promise.all(['accounts','interactions','account-profiles'].map(n=>fetch(`data/${n}.json?v=${v}`).then(r=>r.json()))).then(([accounts,interactions,profiles])=>{data={accounts,interactions,profiles};renderMatrix();});
function projectId(p){return norm(p.handle||p.name||'unknown')}
function renderMatrix(){
  const traders=data.accounts.filter(a=>a.tier===1&&a.kind==='individual').map(a=>norm(a.handle));
  const projectSet=new Set();
  const cells=new Map();
  function addCell(t,p,item,score){ projectSet.add(p); const k=`${t}|${p}`; const c=cells.get(k)||{score:0,items:[]}; c.score+=score; c.items.push(item); cells.set(k,c); }
  for(const prof of data.profiles){
    for(const p of (prof.projects_mentioned||[])){
      const pid=projectId(p); addCell(norm(prof.handle),pid,{source:'profile', projectName:p.name, stance:p.stance||'unclear', summary:p.summary||'', evidence_urls:p.evidence_urls||[]}, stanceWeight(p.stance));
    }
  }
  for(const e of data.interactions.filter(e=>e.to_kind==='project')) addCell(norm(e.from),norm(e.to),{source:'interaction', ...e, evidence_urls:[e.url].filter(Boolean)}, qWeight(e.quality)+1);
  const projects=[...projectSet].sort((a,b)=>a.localeCompare(b));
  const wrap=document.querySelector('#matrixWrap'); wrap.style.setProperty('--cols',projects.length);
  wrap.innerHTML=`<div class="matrix-corner">Trader</div>${projects.map(p=>`<div class="matrix-col"><span>@${esc(p)}</span></div>`).join('')}`+
    traders.map(t=>`<div class="matrix-row-label">@${esc(t)}</div>`+projects.map(p=>{const c=cells.get(`${t}|${p}`); const level=!c?0:Math.min(3,Math.ceil(c.score/3)); return `<button class="matrix-cell heat h${level}" data-trader="${esc(t)}" data-project="${esc(p)}" title="@${esc(t)} × @${esc(p)}">${c?c.items.length:''}</button>`}).join('')).join('');
  wrap.querySelectorAll('.matrix-cell').forEach(el=>el.addEventListener('click',()=>inspect(el.dataset.trader,el.dataset.project,cells.get(`${el.dataset.trader}|${el.dataset.project}`))));
  const first=[...cells.keys()][0]?.split('|') || [traders[0],projects[0]]; inspect(first[0],first[1],cells.get(`${first[0]}|${first[1]}`));
}
function inspect(t,p,c){
  document.querySelector('#matrixInspector').innerHTML=`<p class="eyebrow">matrix cell</p><h2>@${esc(t)} × @${esc(p)}</h2>${c?`<p class="muted">${c.items.length} evidence row(s), score ${c.score}</p>${c.items.map(e=>`<div class="mini-evidence"><b>${esc(e.source)}${e.stance?' · '+esc(e.stance):''}${e.quality?' · '+esc(e.quality):''}</b><p>${esc(e.summary)}</p>${(e.evidence_urls||[]).map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">source</a>`).join(' ')}</div>`).join('')}`:'<p class="muted">No captured project mention.</p>'}`;
}
