// 석적초 AIEP 교내 연수 — 오프라인 캐시(한 번 본 안내서는 인터넷이 약해도 다시 열림)
const V = 'sj-aiep-202610081211';
const CORE = ['./', 'index.html', 'content.js?v=202610081211', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE.map(u => new Request(u, { cache:'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('sj-aiep-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return; // 제미나이·글꼴 요청은 건드리지 않음
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put('index.html', cp)); return res; }).catch(() => caches.match('index.html')));
    return;
  }
  if (u.pathname.endsWith('.bin')) {
    e.respondWith(caches.open(V).then(async c => {
      const hit = await c.match(r);
      if (hit) return hit;
      const res = await fetch(r);
      if (res.ok) { const cp = res.clone(); c.put(r, cp); }
      return res;
    }));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
