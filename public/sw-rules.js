// Which requests the service worker may cache. Plain JS so both the worker (importScripts)
// and the unit tests can load it. Returns 'static', 'page' or 'none'.
;(function (scope) {
  // Private or per-user: never stored on the device
  var NEVER = [/^\/api(\/|$)/, /^\/admin(\/|$)/, /^\/dashboard(\/|$)/, /^\/login/, /^\/register/,
    /^\/forgot-password/, /^\/reset-password/, /^\/monitoring/, /^\/next\//]
  var STATIC = [/^\/_next\/static\//, /^\/icons\//, /\.(?:woff2?|png|svg|ico|webp)$/]

  scope.cacheStrategy = function (url, method, origin) {
    if (method !== 'GET') return 'none'
    var u = new URL(url)
    if (u.origin !== origin) return 'none'
    if (NEVER.some(function (re) { return re.test(u.pathname) })) return 'none'
    if (STATIC.some(function (re) { return re.test(u.pathname) })) return 'static'
    return 'page'
  }
})(typeof self !== 'undefined' ? self : globalThis)
