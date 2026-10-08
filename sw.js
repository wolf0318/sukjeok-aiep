// 석적초 AIEP 교내 연수 — 오프라인 캐시(한 번 본 안내서는 인터넷이 약해도 다시 열림)
const V = 'sj-aiep-202610081403';
// 안내서 그림 묶음은 새로 배포해도 다시 받지 않도록 따로 둡니다. 묶음이 바뀌면 주소 끝(?v=크기)이 바뀌어 새로 받습니다.
const PACKS = 'sj-aiep-packs';
const CORE = ['./', 'index.html', 'content.js?v=202610081403', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE.map(u => new Request(u, { cache:'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('sj-aiep-') && k !== V && k !== PACKS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const scopePath = new URL(self.registration.scope).pathname;
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return; // 제미나이·글꼴 요청은 건드리지 않음
  if (r.mode === 'navigate') {
    // 첫 화면(사이트 주소)을 정상으로 받았을 때만 저장합니다. 없는 주소(404)를 첫 화면으로 저장하지 않게 합니다.
    const isApp = u.pathname === scopePath || u.pathname === scopePath + 'index.html';
    e.respondWith(fetch(r).then(res => { if (res.ok && isApp) { const cp = res.clone(); caches.open(V).then(c => c.put('index.html', cp)); } return res; }).catch(() => caches.match('index.html')));
    return;
  }
  if (u.pathname.endsWith('.bin')) {
    e.respondWith(caches.open(PACKS).then(async c => {
      const hit = await c.match(r);
      if (hit) return hit;
      const res = await fetch(r);
      if (res.ok) {
        const cp = res.clone();
        c.put(r, cp).then(() => c.keys()).then(ks => ks.forEach(k => { const ku = new URL(k.url); if (ku.pathname === u.pathname && ku.search !== u.search) c.delete(k); })).catch(() => {});
      }
      return res;
    }));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
