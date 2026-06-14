const v='20260614-pages-v1';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=x=>Array.isArray(x)?x:[];
const byDate=(a,b)=>String(b.date||b.profile_updated_at||'').localeCompare(String(a.date||a.profile_updated_at||''));
const link=u=>u?`<a href="${esc(u)}" target="_blank" rel="noopener">source</a>`:'';
async function load(name,fallback){try{const r=await fetch(`data/${name}.json?v=${v}`);return r.ok?await r.json():fallback}catch{return fallback}}
function urls(xs){return arr(xs).slice(0,6).map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">source</a>`).join(' · ')}
function item(title, meta, body, url){return `<div class="item-block">${url?`<a href="${esc(url)}" target="_blank" rel="noopener">`:''}<strong>${title}</strong>${url?'</a>':''}<p class="muted">${meta}</p><p>${body}</p></div>`}
function extractEvidence({posts,interactions,profiles,themes}){
  const rows=[];
  arr(posts).forEach(p=>rows.push({date:p.date, who:p.handle, kind:'post', entity:p.topic||p.project||'', note:p.summary||'', url:p.url, why:p.why_logged||p.why||''}));
  arr(interactions).forEach(i=>rows.push({date:i.date, who:i.from, kind:i.type||'interaction', entity:i.to, note:i.summary||'', url:i.url, why:i.quality||''}));
  arr(profiles).forEach(p=>{
    arr(p.projects_mentioned).forEach(x=>rows.push({date:p.profile_updated_at, who:p.handle, kind:'project mention', entity:x.name||x.handle, note:x.summary||'', url:arr(x.evidence_urls)[0], why:x.stance||''}));
    arr(p.likes).forEach(x=>rows.push({date:p.profile_updated_at, who:p.handle, kind:'like', entity:x.theme, note:x.summary||'', url:arr(x.evidence_urls)[0], why:x.confidence||''}));
    arr(p.dislikes).forEach(x=>rows.push({date:p.profile_updated_at, who:p.handle, kind:'fade/dislike', entity:x.theme, note:x.summary||'', url:arr(x.evidence_urls)[0], why:x.confidence||''}));
  });
  return rows.sort(byDate);
}
function mentionRows(profiles,posts){
  const rows=[];
  arr(profiles).forEach(p=>arr(p.projects_mentioned).forEach(x=>rows.push({entity:x.name||x.handle||'Unknown', by:p.handle, stance:x.stance||'unclear', note:x.summary||'', urls:x.evidence_urls||[]})));
  arr(posts).forEach(p=>{ if(p.project||p.topic) rows.push({entity:p.project||p.topic, by:p.handle, stance:p.stance||'not labeled', note:p.summary||'', urls:p.url?[p.url]:[]})});
  return rows;
}
function renderEvidence(data){const rows=extractEvidence(data); return rows.length?`<div class="stack">${rows.map(r=>item(`${esc(r.kind)} · @${esc(r.who||'')}`, `${esc(r.date||'undated')} · ${esc(r.entity||'')}${r.why?' · '+esc(r.why):''}`, esc(r.note||''), r.url)).join('')}</div>`:'<p class="empty">No evidence captured yet. The initial backfill job is scheduled/running; this page will populate from posts, interactions, and profiles.</p>'}
function renderAccounts(data){const accts=arr(data.accounts); const profiles=arr(data.profiles); return `<div class="cards two">${accts.map(a=>{const p=profiles.find(x=>String(x.handle).toLowerCase()===String(a.handle).toLowerCase()); return `<div class="card"><div class="handle">@${esc(a.handle)}</div><div class="meta"><span class="pill tier${esc(a.tier)}">Tier ${esc(a.tier)}</span><span class="pill">${esc(a.kind)}</span></div><p>${esc(p?.taste_summary||a.reason||'Awaiting evidence stream.')}</p><p class="muted">likes: ${arr(p?.likes).length} · fades: ${arr(p?.dislikes).length} · projects: ${arr(p?.projects_mentioned).length}</p><a href="https://x.com/${esc(String(a.handle).replace(/^@/,''))}" target="_blank" rel="noopener">Open X profile</a></div>`}).join('')}</div>`}
function renderMentions(data){const rows=mentionRows(data.profiles,data.posts); return rows.length?`<div class="tableish">${rows.map(r=>`<div class="row"><strong>${esc(r.entity)}</strong><span>@${esc(r.by)}</span><span>${esc(r.stance)}</span><p>${esc(r.note)}</p><p>${urls(r.urls)}</p></div>`).join('')}</div>`:'<p class="empty">No project/person mentions extracted yet.</p>'}
function renderInteractions(data){const xs=arr(data.interactions).sort(byDate); return xs.length?`<div class="stack">${xs.map(x=>item(`@${esc(x.from)} → @${esc(x.to)}`, `${esc(x.date||'')} · ${esc(x.type||'interaction')} · ${esc(x.quality||'')}`, esc(x.summary||''), x.url)).join('')}</div>`:'<p class="empty">No interaction evidence logged yet.</p>'}
function renderThemes(data){const themes=arr(data.themes?.themes||data.themes); return themes.length?`<div class="cards two">${themes.map(t=>`<div class="card"><h2>${esc(t.theme)}</h2><p>${esc(t.summary||'')}</p><p class="muted">momentum: ${esc(t.momentum||'unclear')}</p><p class="muted">positive: ${arr(t.accounts_positive).map(x=>'@'+esc(x)).join(', ')||'—'}</p><p>${urls(t.evidence_urls)}</p></div>`).join('')}</div>`:'<p class="empty">No theme buckets extracted yet. This stays intentionally light: examples first, synthesis second.</p>'}
function renderReview(data){const rows=[]; arr(data.candidates).forEach(c=>rows.push({title:`Candidate: @${c.handle||c.name}`, meta:`${c.kind||''} · introduced by @${c.introduced_by||''}`, note:c.reason||'', url:c.evidence_url})); arr(data.profiles).forEach(p=>arr(p.open_questions).forEach(q=>rows.push({title:`@${p.handle}`, meta:'open question', note:q}))); return rows.length?`<div class="stack">${rows.map(r=>item(esc(r.title),esc(r.meta),esc(r.note),r.url)).join('')}</div>`:'<p class="empty">No review items yet.</p>'}
async function main(){
  const [accounts,interactions,posts,candidates,profiles,themes]=await Promise.all([load('accounts',[]),load('interactions',[]),load('posts',[]),load('candidates',[]),load('account-profiles',[]),load('theme-map',{themes:[]})]);
  const data={accounts,interactions,posts,candidates,profiles,themes};
  const view=document.body.dataset.view;
  const map={evidence:renderEvidence,accounts:renderAccounts,mentions:renderMentions,interactions:renderInteractions,themes:renderThemes,review:renderReview};
  document.querySelector('#viewRoot').innerHTML=(map[view]||renderEvidence)(data);
}
main().catch(e=>{console.error(e);document.querySelector('#viewRoot').innerHTML='<p class="empty">Failed to load view data.</p>'});
