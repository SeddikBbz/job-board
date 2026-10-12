/* JobBoard service worker: offline page, cached static files, network-first public pages.
   Bump VERSION to drop old caches after changing this file. */
importScripts('/sw-rules.js')

const VERSION = 'v1'
const STATIC_CACHE = `static-${VERSION}`
const PAGE_CACHE = `pages-${VERSION}`
const OFFLINE_URL = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGE_CACHE).then((cache) => cache.add(OFFLINE_URL)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC_CACHE, PAGE_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// The page asks the waiting worker to take over when the user clicks "Reload"
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const strategy = self.cacheStrategy(request.url, request.method, self.location.origin)
  if (strategy === 'none') return

  if (strategy === 'static') {
    // Cache first: these files have unique names per build
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) caches.open(STATIC_CACHE).then((c) => c.put(request, res.clone()))
            return res
          }),
      ),
    )
    return
  }

  if (request.mode === 'navigate') {
    // Network first; offline: the last copy of this page, else the offline page
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) caches.open(PAGE_CACHE).then((c) => c.put(request, res.clone()))
          return res
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match(OFFLINE_URL))),
    )
  }
})
