var staticCacheName = "django-pwa-v" + new Date().getTime();
var filesToCache = [
    '/manifest.json',
    '/login',
    '/static/icons/',
    '/static/splash/',
    '/static/images/',
];

self.addEventListener("install", event => {
    this.skipWaiting();
    event.waitUntil(
        caches.open(staticCacheName)
            .then(cache => {
                console.log("service workder installed!");
                return cache.addAll(filesToCache);
            }).catch(err=>console.log("service worker failed:", err))
    )
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            console.log("service workder activated!");
            return Promise.all(
                cacheNames
                    .filter(cacheName => (cacheName.startsWith("django-pwa-")))
                    .filter(cacheName => (cacheName !== staticCacheName))
                    .map(cacheName => caches.delete(cacheName))
            );
        }).catch(err=>console.log("service worker activate failed:", err))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                console.log("fetch succeed!")

                if (response) {
                    return response;
                } else {
                    return fetch(event.request).then(function(res) {
                        return caches.open('dynamic').then(function(cache) {
                            cache.put(event.request.url, res.clone());
                            return res;
                        });
                    });
                }
            })
            .catch((err) => {
                console.log("fetch failed;", err);
                return caches.match('/login');
            })
    )
});