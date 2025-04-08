const CACHE_NAME = "recipe-cache-v1";
const urlsToCache = ["/", "/index.html", "/styles.css", "/scripts.js", "/manifest.json", "/icons/icon-192x192.png", "/icons/icon-512x512.png"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(urlsToCache);
		})
	);
});

self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			return (
				response ||
				fetch(event.request).then((fetchResponse) => {
					// Cache recipe images dynamically
					if (event.request.url.endsWith(".jpg") || event.request.url.endsWith(".png")) {
						return caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, fetchResponse.clone());
							return fetchResponse;
						});
					}
					return fetchResponse;
				})
			);
		})
	);
});

self.addEventListener("activate", (event) => {
	const cacheWhitelist = [CACHE_NAME];
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (!cacheWhitelist.includes(cacheName)) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});
