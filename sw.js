const CACHE_NAME = 'lm-consig-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icone-72.png',
    '/icone-96.png',
    '/icone-128.png',
    '/icone-144.png',
    '/icone-152.png',
    '/icone-192.png',
    '/icone-384.png',
    '/icone-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    // Intercept requests for the Google Apps Script URL
    if (event.request.url.includes('script.google.com/macros/s/AKfycbw1O5IXNRp6FOpQlsoUclx_4rn4HHIslnBIEpTCKJMpv0ESS0mpNg3DcJ6p1RFE8Q51/exec')) {
        // For the Google Apps Script, always try to fetch from network to get the latest version
        event.respondWith(
            fetch(event.request).catch(() => {
                // If network fails, you might want to return a fallback page or a cached version if available
                // For a web app that relies heavily on live data, this might not be ideal.
                // For now, we'll just let the fetch fail if offline.
                console.log('Network request for Google Apps Script failed. App may not function offline.');
                return new Response('<h1>Offline</h1><p>Não foi possível carregar o aplicativo offline. Verifique sua conexão com a internet.</p>', { headers: { 'Content-Type': 'text/html' } });
            })
        );
    } else {
        // For other assets (like PWA shell files), try cache first, then network
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then(response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        // IMPORTANT: Clone the response. A response is a stream
                        // and can only be consumed once. We need to consume it once
                        // to cache it and once for the browser to consume the response.
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
                })
        );
    }
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
});
