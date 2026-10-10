var APP_PREFIX = '城通解析';
var VERSION = '2.4.6';
var CACHE_NAME = APP_PREFIX + VERSION
var URLS = []

// Respond with cached resources
self.addEventListener('fetch', function (event) {
    if (event.request.url.indexOf("getVersionWorker") > 0) {
        event.respondWith(new Response(VERSION));
        return;
    }

    const getCacheName = url => {
        if (url.indexOf("/icon/") > 0 && url.startsWith(location.origin)) {
            return "StaticCache"
        };
        return CACHE_NAME;
    }

    const isCacheable = event.request.method == "GET" &&
        event.request.url.indexOf("http") == 0 &&
        event.request.url.indexOf("ForceNoCache") == -1 &&
        event.request.url.startsWith(location.origin) &&
        event.request.url.indexOf("auth_code") == -1;

    /*
     * 修复点：原来的 else 分支是 event.respondWith(fetch(event.request))。
     * 第三方请求（cloudflareinsights 统计脚本、跨域的 webapi.ctfile.com）被广告拦截器 /
     * 网络策略拦下时，fetch 会 reject，而 respondWith 收到 rejected promise 就会在
     * 控制台报 "Uncaught (in promise) TypeError: Failed to fetch  at sw.js:32"。
     * 这类请求本来就该交给浏览器按默认流程处理，直接 return 即可。
     */
    if (!isCacheable) {
        return;
    }

    event.respondWith(
        caches.open(getCacheName(event.request.url)).then(function (cache) {
            return cache.match(event.request).then(function (response) {
                return response || fetch(event.request).then(function (response) {
                    // 原版无条件 cache.put，对 opaque / 非 2xx 响应会抛错
                    if (response && response.ok) {
                        cache.put(event.request, response.clone());
                    }
                    return response;
                });
            });
        }).catch(function () {
            // 兜底：缓存链路任何一环失败都退回真实网络请求，且保证不抛未捕获错误
            return fetch(event.request).catch(function () {
                return new Response("", { status: 504, statusText: "Service Worker fetch failed" });
            });
        })
    );
});

// Cache resources
self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('installing cache : ' + CACHE_NAME)
            return cache.addAll(URLS)
        })
    )
})

// Delete outdated caches
self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keyList) {
            var cacheWhitelist = keyList.filter(function (key) {
                return key.indexOf(APP_PREFIX)
            })
            cacheWhitelist.push(CACHE_NAME)
            cacheWhitelist.push("StaticCache")

            return Promise.all(keyList.map(function (key, i) {
                if (cacheWhitelist.indexOf(key) === -1) {
                    console.log('deleting cache : ' + keyList[i])
                    return caches.delete(keyList[i])
                }
            }))
        })
    )
})
