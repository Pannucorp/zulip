const CACHE_NAME = 'PannuCorp-1.0.0'    
const appShell = [
    '/manifest.json',
    '/static/icons/icon-72x72.png',
    '/static/icons/icon-96x96.png',
    '/static/icons/icon-128x128.png',
    '/static/icons/icon-144x144.png',
    '/static/icons/icon-152x152.png',
    '/static/icons/icon-192x192.png',
    '/static/icons/icon-384x384.png',
    '/static/icons/icon-512x512.png',
    '/static/icons/android-chrome-192x192.png',
    '/static/icons/android-chrome-512x512.png'
];

let deferredPrompt;

self.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  // showInstallPromotion();
  console.log(`'beforeinstallprompt' event was fired.`);
});

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(appShell);
  })());
});

self.addEventListener('appinstalled',() => {
  // hideInstallPromotion();
  deferredPrompt = null;
  console.log('PWA was installed');
});

self.addEventListener('fetch', event => {
  const { request } = event

  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return
  }

  event.respondWith(async function () {
    const cache = await caches.open(CACHE_NAME)

    const cachedResponsePromise = await cache.match(request)
    const networkResponsePromise = fetch(request)

    if (request.url.startsWith(self.location.origin)) {
      event.waitUntil(async function () {
        const networkResponse = await networkResponsePromise

        await cache.put(request, networkResponse.clone())
      }())
    }

    return cachedResponsePromise || networkResponsePromise
  }())
})

self.addEventListener('activate', event => {
  event.waitUntil(async function () {
    const cacheNames = await caches.keys()

    await Promise.all(
      cacheNames.filter((cacheName) => {
        const deleteThisCache = cacheName !== CACHE_NAME

        return deleteThisCache
      }).map(cacheName => caches.delete(cacheName))
    )
  }())
})

self.addEventListener('push', event => {
  const payload = event.data ? event.data.text() : 'no payload';
  event.waitUntil(
    self.registration.showNotification('ServiceWorker Cookbook', {
      body: payload,
    })
  );
});