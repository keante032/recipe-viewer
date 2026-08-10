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

	// 1. Intercept the Share Target Request
	if (event.request.method === "POST" && url.pathname.includes("share-target")) {
		event.respondWith(
			(async () => {
				try {
					const formData = await event.request.formData();
					const file = formData.get("shared_files");

					if (file) {
						const fileText = await file.text();

						// Put the shared text data into a temporary cache route
						// This prevents data loss during the redirect process
						const cache = await caches.open(CACHE_NAME);
						await cache.put(
							new Request("/temporary-shared-file-data"),
							new Response(fileText, {
								headers: { "Content-Type": "text/plain" }
							})
						);
					}
				} catch (err) {
					console.error("Failed to temporarily cache shared target data:", err);
				}

				// Redirect back to the PWA home screen root folder safely
				return Response.redirect("./", 303);
			})()
		);
		return;
	}

	// 2. Standard Application Fetch Caching Strategy
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
