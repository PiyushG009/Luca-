const CACHE_NAME = 'lucaverse-shell-v4-stable'
const OFFLINE_FALLBACK = '/app.html'
const APP_SHELL = [
  '/',
  '/index.html',
  '/app.html',
  '/auth.html',
  '/landing.css',
  '/app.css',
  '/app.js',
  '/nowplaying.js',
  '/supabase.js',
  '/pwa.js',
  '/manifest.webmanifest',
  '/Lucaverse.png'
]

const SHELL_PATHS = new Set(APP_SHELL)

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

async function cacheShellResponse(request, response) {
  const cacheableRequest = typeof request === 'string' ? new Request(request) : request
  if (!response || !response.ok || cacheableRequest.method !== 'GET') return response
  const cache = await caches.open(CACHE_NAME)
  cache.put(cacheableRequest, response.clone()).catch(() => {})
  return response
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match(OFFLINE_FALLBACK))
    )
    return
  }

  if (!SHELL_PATHS.has(url.pathname)) return

  event.respondWith(
    caches.match(request).then(async (cached) => {
      const network = fetch(request)
        .then((response) => cacheShellResponse(request, response))
        .catch(() => null)

      if (cached) {
        network.catch(() => {})
        return cached
      }

      return network.then((response) => response || caches.match(OFFLINE_FALLBACK))
    })
  )
})
