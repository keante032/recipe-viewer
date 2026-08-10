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

	// 1. Bulletproof Share Target Interception
	// Checks for POST requests containing '/share-target' regardless of trailing slashes
	if (event.request.method === "POST" && url.pathname.includes("/share-target")) {
		// We create the redirect response IMMEDIATELY so the static server never sees the POST
		const redirectResponse = Response.redirect("/", 303);

		// Process the file payload in the background using waitUntil to keep the worker alive
		event.waitUntil(
			(async () => {
				try {
					const formData = await event.request.formData();
					const file = formData.get("shared_files"); // Must match manifest name

					if (file) {
						const fileName = file.name;
						const fileText = await file.text();

						// Broadcast the file contents to all open PWA windows
						const clientsList = await self.clients.matchAll({ type: "window" });
						for (const client of clientsList) {
							client.postMessage({
								type: "SHARE_TARGET_FILE",
								name: fileName,
								text: fileText
							});
						}
					}
				} catch (err) {
					console.error("Service Worker failed to process shared file data:", err);
				}
			})()
		);

		// Serve the redirect right away to clear the 405 error
		event.respondWith(redirectResponse);
		return;
	}

	// 2. Your existing standard caching fetch strategy
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
