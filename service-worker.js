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
	const url = new URL(event.request.url);

	// 1. Intercept the Web Share Target incoming POST request
	if (event.request.method === "POST" && url.pathname.endsWith("/share-target")) {
		event.respondWith(
			(async () => {
				try {
					const formData = await event.request.formData();
					const file = formData.get("recipesFile"); // Matches manifest name

					if (file) {
						const fileName = file.name;
						const fileText = await file.text();

						// Wait a brief moment for the redirected client window to be ready
						setTimeout(async () => {
							const clientsList = await self.clients.matchAll({ type: "window" });
							for (const client of clientsList) {
								// Send file name and raw text/json contents directly to scripts.js
								client.postMessage({
									type: "SHARE_TARGET_FILE",
									name: fileName,
									text: fileText
								});
							}
						}, 1000);
					}
				} catch (err) {
					console.error("Failed to parse shared file:", err);
				}

				// Redirect the PWA window back to the main UI app state
				return Response.redirect("/", 303);
			})()
		);
		return;
	}

	// 2. Your existing standard caching fetch strategy
	event.respondWith(
		caches.match(event.request).then((response) => {
			return (
				response ||
				fetch(event.request).then((fetchResponse) => {
					// Cache recipe images dynamically
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
