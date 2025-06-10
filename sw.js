const CACHE_NAME = "tiktok-clone-v1";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                "/daohuyenmy/favicon.ico",
                "/daohuyenmy/index.html",
                "/daohuyenmy/offline.html",
                "/daohuyenmy/placeholder.jpg",
                "/daohuyenmy/sw.js",
                "/daohuyenmy/videos.json"
            ]);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => 
            Promise.all(cacheNames.map(cacheName => 
                !cacheNames.includes(CACHE_NAME) && caches.delete(cacheName)
            ))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const requestUrl = new URL(event.request.url);
    const cacheKey = new Request(requestUrl.origin + requestUrl.pathname, {
        method: event.request.method,
        headers: event.request.headers,
        mode: 'cors',
        cache: 'default',
        credentials: 'omit'
    });

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(cacheKey);
            if (cachedResponse) {
                console.log("From cache:", event.request.url);
                return cachedResponse;
            }

            return fetch(event.request, { mode: 'cors', credentials: 'omit' }).then(async (networkResponse) => {
                if (networkResponse.ok && (event.request.url.includes("tongtrankien1605.github.io/daohuyenmy") || event.request.url.includes("raw.githubusercontent.com"))) {
                    console.log("Caching:", event.request.url);
                    const clonedResponse = networkResponse.clone();
                    await cache.put(cacheKey, clonedResponse);
                }
                return networkResponse;
            }).catch(async (err) => {
                console.error("Fetch failed:", err);
                // Xóa cache video không còn trong videos.json
                const videoResponse = await fetch("/daohuyenmy/videos.json");
                if (videoResponse.ok) {
                    const videos = await videoResponse.json();
                    const validURLs = videos.videos.map(v => v.url);
                    const cachedKeys = await cache.keys();
                    cachedKeys.forEach(async (key) => {
                        if (!validURLs.includes(key.url) && key.url.match(/\.(mp4|webm|ogg)$/i)) {
                            await cache.delete(key);
                        }
                    });
                }
                return caches.match('/offline.html');
            });
        })
    );
});