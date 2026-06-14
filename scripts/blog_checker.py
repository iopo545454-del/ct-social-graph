#!/usr/bin/env python3
import json, re, ssl, subprocess, sys, time, hashlib
from pathlib import Path
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, urldefrag
import urllib.request, urllib.error

ROOT = Path('/root/ct-social-graph')
SOURCES_PATH = ROOT / 'data' / 'blog-sources.json'
UPDATES_PATH = ROOT / 'data' / 'blog-updates.json'
DOCS_UPDATES_PATH = ROOT / 'docs' / 'data' / 'blog-updates.json'
DOCS_SOURCES_PATH = ROOT / 'docs' / 'data' / 'blog-sources.json'
MAX_PER_SOURCE = 12
USER_AGENT = 'Mozilla/5.0 Hermes crypto blog checker'

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.title=''; self.in_title=False; self.links=[]; self.feed_links=[]; self._a=None
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag == 'title': self.in_title=True
        if tag == 'a' and attrs.get('href'):
            self._a={'href':attrs.get('href'), 'text':''}
        if tag == 'link':
            rel=str(attrs.get('rel','')).lower(); typ=str(attrs.get('type','')).lower(); href=attrs.get('href')
            if href and 'alternate' in rel and any(x in typ for x in ['rss','atom','xml','json']): self.feed_links.append(href)
    def handle_data(self, data):
        if self.in_title: self.title += data
        if self._a is not None: self._a['text'] += data
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title=False
        if tag == 'a' and self._a:
            self.links.append(self._a); self._a=None

def now_iso(): return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def norm_url(u):
    u = urldefrag(u)[0]
    return re.sub(r'/$', '', u)
def fetch(url):
    req=urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept':'text/html,application/rss+xml,application/atom+xml,application/xml;q=0.9,*/*;q=0.8'})
    with urllib.request.urlopen(req, timeout=25, context=ssl.create_default_context()) as r:
        data=r.read(1200000)
        return r.geturl(), r.status, r.headers.get('content-type',''), data.decode('utf-8','ignore')
def title_from_url(url):
    path=urlparse(url).path.strip('/').split('/')[-1]
    path=re.sub(r'[-_]+',' ', path)
    return path[:90] or url

def parse_feed(text, base):
    items=[]
    # simple RSS/Atom support
    for block in re.findall(r'<item\b.*?</item>', text, flags=re.I|re.S) + re.findall(r'<entry\b.*?</entry>', text, flags=re.I|re.S):
        title=re.search(r'<title[^>]*>(.*?)</title>', block, flags=re.I|re.S)
        link=re.search(r'<link[^>]*href=["\']([^"\']+)', block, flags=re.I|re.S) or re.search(r'<link[^>]*>(.*?)</link>', block, flags=re.I|re.S)
        date=re.search(r'<(?:pubDate|published|updated)[^>]*>(.*?)</(?:pubDate|published|updated)>', block, flags=re.I|re.S)
        if link:
            items.append({'title':clean(title.group(1)) if title else title_from_url(link.group(1)), 'url':norm_url(urljoin(base, clean(link.group(1)))), 'published':clean(date.group(1))[:80] if date else None})
    return items

def clean(s):
    s=re.sub(r'<!\[CDATA\[(.*?)\]\]>', r'\1', s or '', flags=re.S)
    s=re.sub(r'<[^>]+>',' ',s)
    return ' '.join(s.split())

def looks_article(href, text, source_url):
    u=urlparse(href); base=urlparse(source_url)
    if u.netloc and u.netloc != base.netloc: return False
    path=(u.path or '').lower()
    if not path or path in ['/', '/read', '/blog', '/posts', '/posts/', '/writing', '/content', '/resources', '/blockchain-letter', '/posts/podcast']:
        return False
    bad=['/tag/','/tags/','/category/','/author/','/page/','/login','/signup','/subscribe','/privacy','/terms','/careers','/jobs','/contact','/about','/focus-areas/','/team/','/portfolio','/events']
    if any(b in path for b in bad): return False
    good=['/posts/','/post/','/blog/','/writing/','/writings/','/research/','/insights/','/resources/','/content/','/read/','/blockchain-letter/','/articles/','/article/','/reports/']
    if any(g in path for g in good): return True
    return bool(text and len(text.strip()) > 18 and re.search(r'20\d{2}|crypto|bitcoin|ethereum|token|market|stablecoin|defi|research', text, re.I))

def scrape_source(src):
    url=src['url']; final=url; status=None; title=''; err=None; items=[]; feeds=[]
    try:
        final,status,ctype,text=fetch(url)
        if 'xml' in ctype or '<rss' in text[:500].lower() or '<feed' in text[:500].lower():
            items=parse_feed(text, final)
        p=LinkParser(); p.feed(text[:800000]); title=clean(p.title)[:140]; feeds=[urljoin(final,f) for f in p.feed_links]
        if not items and feeds:
            try:
                ffinal,_,_,ftext=fetch(feeds[0]); items=parse_feed(ftext, ffinal)
            except Exception: pass
        if not items:
            seen=set()
            for a in p.links:
                href=norm_url(urljoin(final,a.get('href',''))); text=clean(a.get('text',''))
                if href in seen or not looks_article(href,text,final): continue
                seen.add(href); items.append({'title': text[:140] or title_from_url(href), 'url': href, 'published': None})
        items=items[:MAX_PER_SOURCE]
    except Exception as e:
        err=f'{type(e).__name__}: {str(e)[:180]}'
    return {'name':src['name'], 'tier':src['tier'], 'source_url':url, 'final_url':final, 'status':status, 'page_title':title, 'error':err, 'feed_urls':feeds[:3], 'items':items, 'checked_at':now_iso()}

def load_json(path, default):
    if path.exists():
        try: return json.loads(path.read_text())
        except Exception: return default
    return default

def main():
    sources=json.loads(SOURCES_PATH.read_text())
    active=[s for s in sources if s.get('status')=='active']
    old={'articles':[], 'sources':[], 'last_checked':None} if '--rebuild' in sys.argv else load_json(UPDATES_PATH, {'articles':[], 'sources':[], 'last_checked':None})
    known={a.get('url') for a in old.get('articles', [])}
    results=[scrape_source(s) for s in active]
    articles=[]; new=[]
    seen=set()
    for res in results:
        for it in res['items']:
            url=it.get('url')
            if not url or url in seen: continue
            seen.add(url)
            row={
              'id': hashlib.sha1(url.encode()).hexdigest()[:12],
              'source': res['name'], 'tier': res['tier'], 'title': it.get('title') or title_from_url(url),
              'url': url, 'published': it.get('published'), 'first_seen': now_iso(),
              'source_url': res['source_url']
            }
            old_match=next((a for a in old.get('articles', []) if a.get('url')==url), None)
            if old_match: row['first_seen']=old_match.get('first_seen', row['first_seen'])
            elif url not in known and '--rebuild' not in sys.argv: new.append(row)
            articles.append(row)
    # Keep old articles too if no longer on first page, bounded.
    existing_urls={a['url'] for a in articles}
    for a in old.get('articles', []):
        if a.get('url') not in existing_urls:
            articles.append(a)
    articles=articles[:500]
    out={'last_checked':now_iso(), 'new_count':len(new), 'sources':results, 'articles':articles}
    for path in [UPDATES_PATH, DOCS_UPDATES_PATH]:
        path.parent.mkdir(parents=True, exist_ok=True); path.write_text(json.dumps(out, indent=2)+"\n")
    DOCS_SOURCES_PATH.write_text(json.dumps(sources, indent=2)+"\n")
    if new:
        subprocess.run(['git','add','data/blog-updates.json','docs/data/blog-updates.json','docs/data/blog-sources.json','data/blog-sources.json'], cwd=ROOT, check=False)
        subprocess.run(['git','commit','-m',f'update blog watcher ({len(new)} new)'], cwd=ROOT, check=False)
        subprocess.run(['git','push'], cwd=ROOT, check=False)
        print('New crypto research/blog posts detected:')
        for a in new[:20]: print(f"- {a['source']}: {a['title']} — {a['url']}")
    else:
        # stay silent for cron no_agent unless manually run; env opt-in
        if '--verbose' in sys.argv:
            print(f"No new posts. Checked {len(results)} active sources.")
if __name__=='__main__': main()
