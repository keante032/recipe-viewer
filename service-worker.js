const CACHE_NAME = "recipe-cache-v1";
const urlsToCache = ["/", "/index.html", "/styles.css", "/scripts.js", "/manifest.json", "/icons/icon-192x192.png", "/icons/icon-512x512.png"];

self.addEventListener("install", (event) => {
	self.skipWaiting(); // Force activation immediately
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(urlsToCache);
		})
	);
});

self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);

	// Intercept the GET share target
	if (url.pathname.includes("share-target")) {
		const sharedText = url.searchParams.get("shared_text") || url.searchParams.get("shared_url");

		if (sharedText) {
			event.respondWith(
				(async () => {
					try {
						const cache = await caches.open(CACHE_NAME);
						await cache.put(new Request("/temporary-shared-file-data"), new Response(sharedText, { headers: { "Content-Type": "text/plain" } }));
					} catch (err) {
						console.error("Failed to cache shared GET query stream:", err);
					}
					// Safely redirect to your main index file without server interference
					return Response.redirect("./", 303);
				})()
			);
			return;
		}
	}

	// Standard caching strategy
	event.respondWith(
		caches.match(event.request).then((response) => {
			return (
				response ||
				fetch(event.request).then((fetchResponse) => {
					if (url.pathname.endsWith(".jpg") || url.pathname.endsWith(".png")) {
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
		self.clients.claim(), // Take control of open pages immediately
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
