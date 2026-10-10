# 修复说明（fix/ctfile-api-and-token）

针对上游 `main` 分支在 2026 年 10 月城通网盘接口变更后出现的**解析直接报错**与**登录用户拿不到加速直链**两个问题。

- 分支：`fix/ctfile-api-and-token`
- 提交：`2100b4a`
- 改动：`ctget.js`（`2.6.10` → `2.6.11`）、`sw.js`（`2.4.5` → `2.4.6`），共 2 文件 +181 / −111

---

## 一、问题现象

在网页版上解析任意城通链接时，控制台抛出：

```
Uncaught (in promise) SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at ctget.js:88
```

同时还有一条来自 Service Worker 的噪音报错：

```
Uncaught (in promise) TypeError: Failed to fetch
    at sw.js:32
```

页面因此完全无法出结果。此外，即使手工带上登录 token，解析出来的直链下载速度也只有 **0.10 MB/s**，与未登录状态没有区别。

---

## 二、根因分析

### 2.1 旧接口已废弃 → `JSON.parse("")` 崩溃（致命）

原版 `ctget.js` 的解析链路是：

1. `getfile.php` 拿文件元信息（含 `userid` / `file_id` / `file_chk`）
2. `get_file_url.php?uid=..&fid=..&file_chk=..&app=0&acheck=2` 拿直链

**第 2 步的接口已经废弃**。现在它固定返回：

```
HTTP/1.1 200 OK
Content-Length: 0
```

即 **HTTP 状态码 200，但响应体是空的**。而原版代码是这么写的：

```js
jsonText2 = JSON.parse(await (await fetch("https://webapi.ctfile.com/get_file_url.php?...")).text());
```

不判 HTTP 状态、不判空、没有 `try/catch`。对空字符串执行 `JSON.parse("")`，必然抛 `Unexpected end of JSON input`，且因为是 `await` 链里的未捕获异常，整个解析函数直接中断。

替代接口是 **`get_down_url.php`**，但它有一个硬性要求：**必须带上 `getfile.php` 返回的 `start_time`**（以及 `wait_seconds`），缺了它同样返回空 body。

### 2.2 token 传错了接口 → 登录用户也只能拿到免费低速档（关键）

这是本次最反直觉的一处。实测四组对照（**同一文件、同一账号、同一时刻**）：

| # | `getfile.php` 带 token | `get_down_url.php` 带 token | 返回域名 | `spd × limit` | 实际限速 |
|---|---|---|---|---|---|
| ① | ✗ | ✗ | `90-cucc-data.tv002.com` | `100000 × 1` | 0.10 MB/s |
| ② | ✗ | **✓** | `group1-ctc-data.tv002.com` | `1200000 × 1` | **1.14 MB/s** |
| ③ | **✓** | ✗ | `90-cucc-data.tv002.com` | `100000 × 1` | 0.10 MB/s |
| ④ | **✓** | **✓** | `group1-ctc-data.tv002.com` | `1200000 × 1` | **1.14 MB/s** |

结论：**决定下载速度的是 token 有没有传给 `get_down_url.php`，而不是 `getfile.php`。**

- 对照 ③：只在 `getfile.php` 带 token，速度**毫无变化**，仍是 0.10 MB/s；
- 对照 ②：只在 `get_down_url.php` 带 token，**已经满速 1.14 MB/s**。

原版两个接口都没带 token（`get_down_url.php` 是本次才引入的），所以登录用户也拿不到加速直链。**提速 11.4 倍。**

顺带解释一个常见误判：有些用户反馈「不填 token、改填 Cookie 反而有效」——那是因为 Cookie 放在请求头里，两个接口共用同一份 headers，于是被顺带发到了 `get_down_url.php`。差别不在城通，在代码。

### 2.3 Service Worker 兜底分支 → `Failed to fetch` 噪音

原版 `sw.js` 的 fetch 监听器是这样的结构：

```js
if (可缓存条件) {
    event.respondWith( /* 缓存链路 */ );
} else {
    event.respondWith(fetch(event.request));   // ← 问题在这
}
```

`else` 分支覆盖了**所有**非缓存请求，包括第三方跨域请求（Cloudflare 的 `cloudflareinsights` 统计脚本、跨域的 `webapi.ctfile.com`）。这类请求一旦被广告拦截器或网络策略拦下，`fetch` 会 reject，而 `event.respondWith()` 收到一个 rejected promise 就会在控制台抛出 `Uncaught (in promise) TypeError: Failed to fetch`。

这类请求本来就该交给浏览器按默认流程处理，SW 不该插手。

---

## 三、修改内容

### 3.1 `ctget.js`（`2.6.10` → `2.6.11`）

| # | 修改 | 说明 |
|---|---|---|
| 1 | 新增 `requestJSON(url, options)` | 统一的「请求 + 解析」封装：先校验 HTTP 状态与响应体是否为空，再 `JSON.parse`，异常转成可读文案。**从根上消灭 `JSON.parse("")` 崩溃。** |
| 2 | 改用 `get_down_url.php` | 替换废弃的 `get_file_url.php?app=0&acheck=2`，并补上必需的 `start_time` / `wait_seconds`。 |
| 3 | ★ **把 token 传给 `get_down_url.php`** | 本次核心修复，11 倍提速的直接来源。 |
| 4 | `token` 默认值加保护 | 原版写 `token = ctfile.buildToken()`，但 `main` 分支**并没有定义** `ctfile.buildToken`，只要调用方不显式传 token 就抛 `TypeError`。改为 `typeof ctfile.buildToken === "function" ? ... : ""`。 |
| 5 | 修掉 `passcode=undefined` | 原版直接拼 `"&passcode=" + password`，不传密码时 URL 里会出现字面量 `passcode=undefined`。改为 `(password \|\| "")`。 |
| 6 | `code 423` 识别为「需要提取码」 | `getfile.php` 与 `get_down_url.php` 都会用 423 表示需要提取码，返回 `need_passcode: true` + 可读文案，而不是笼统报错。 |
| 7 | 修 `jsonText` / `jsonText2` 隐式全局 | 原版两个变量都没声明，严格模式下会抛错，且并发调用会互相覆盖。 |
| 8 | 修 `document` 未判空 | `if (document && ...)` 在无 DOM 环境（Node）会直接抛 `ReferenceError`，改为 `typeof document !== "undefined"`。 |
| 9 | 修 `file.message` 空引用 | 非 200 分支里 `jsonText.file` 可能不存在，原版直接取 `.message` 会二次抛错，改为 `jsonText.file && jsonText.file.message`。 |
| 10 | 全链路 `try/catch` | 任何网络/解析异常都返回结构化结果，不再向调用方抛未捕获异常。 |
| 11 | 返回值新增 `accelerated` / `logged_in` / `username` | 取自 `is_accelerated` / `my_uid` / `my_username`，调用方可直接做「token 是否生效」指示灯。 |
| 12 | 新增 `module.exports = ctfile` | 便于在 Node 下 `require` 后直接跑测试。 |

修复后的核心调用：

```js
const jsonText2 = await ctfile.requestJSON(
    "https://webapi.ctfile.com/get_down_url.php" +
    "?uid=" + file.userid +
    "&fid=" + file.file_id +
    "&file_chk=" + file.file_chk +
    "&start_time=" + (file.start_time || 0) +
    "&wait_seconds=" + (file.wait_seconds || 0) +
    // ★ 关键：不带 token 只能拿到 0.10 MB/s 的免费低速直链
    "&token=" + encodeURIComponent(token || "") +
    "&rd=" + Math.random(),
    { headers: originHeaders, credentials: "include" }
);
```

同时把「VIP 账号直连 `vip_dx_url` / `vip_yd_url` / `vip_lt_url` / `us_downurl_a`」的分支补全（原版有，但用 `switch` 落空，且无链接时直接 `return` 丢失了 `name`/`size` 字段）。

### 3.2 `sw.js`（`2.4.5` → `2.4.6`）

| # | 修改 | 说明 |
|---|---|---|
| 1 | `else { event.respondWith(fetch(...)) }` → `if (!isCacheable) { return; }` | 非缓存请求直接交还浏览器默认处理，消除 `Failed to fetch` 噪音。 |
| 2 | 缓存链路补 `.catch()` 兜底 | 任何一环失败都退回真实网络请求，并保证不抛未捕获错误。 |
| 3 | `cache.put` 前判 `response.ok` | 原版无条件写入，对 opaque / 非 2xx 响应会抛错。 |
| 4 | 可缓存条件抽成 `isCacheable` 常量 | 可读性，逻辑不变。 |

---

## 四、实测验证

### 4.1 token 对照（见 2.2 节表格）

- 带 token：`spd=1200000` → **1.14 MB/s**，`accelerated=true`，`logged_in=true`，`username=<登录账号>`
- 不带 token：`spd=100000` → **0.10 MB/s**

### 4.2 回归测试（8 组 14 项，全部通过）

| 用例 | 结果 |
|---|---|
| 带 token 解析 | ✅ 拿到文件名/大小、识别已登录、拿到加速直链 |
| 不带 token 解析 | ✅ 正常返回低速直链 |
| **完全不传 token 参数** | ✅ 不抛 `TypeError`，仍能解析成功（原版必崩） |
| **不传密码** | ✅ 返回「该文件需要提取码，请填写后重试。」（原版会拼出 `passcode=undefined`） |
| 错误提取码 | ✅ 返回结构化错误，不抛异常 |
| 无效文件 ID | ✅ 返回「分享链接打开不完整。」，不抛未捕获异常 |
| README 公开示例 | ✅ 解析成功并拿到加速直链 |
| 直链实际下载前 512KB | ✅ `HTTP 206`，收到 524288 bytes |

> 注：直链请求**必须带 `Range` 头**，否则 CDN 会返回 503。

### 4.3 结论

`JSON.parse("")` 崩溃已消除；登录用户直链由 0.10 MB/s 提升到 1.14 MB/s；SW 控制台噪音已消除。

---

## 五、如何验证

### 方式一：看直链里的 `spd`

解析成功后，检查返回直链的 query：

```
...&spd=1200000&limit=1...   → 加速生效，约 1.14 MB/s
...&spd=100000&limit=1...    → 免费低速档，约 0.10 MB/s
```

也可以直接看返回值里的 `accelerated` 字段（`true` 表示 token 生效）。

### 方式二：Node 直接跑（无需浏览器）

```js
// 需要 Node 18+（依赖全局 fetch）
const ctfile = require('./ctget.js');

const TOKEN = process.env.CT_TOKEN || '';        // 登录后获取，64 位十六进制
const FID   = '54168721-8439138596-b78c55';      // 替换为你的文件 ID

(async () => {
    const r = await ctfile.getByID(FID, '4900', TOKEN);
    console.log(r.success, r.name, r.size, r.accelerated, r.logged_in, r.username);
    console.log(r.link);
})();
```

预期输出中 `accelerated` 为 `true`，直链 `spd=1200000`。

---

## 六、兼容性与影响面

- **对外接口不变**：`getByID` / `getByLink` 的调用方式与返回字段（`success` / `name` / `size` / `time` / `link` / `errormsg`）完全向后兼容，只**新增**了 `accelerated` / `logged_in` / `username` / `need_passcode`。
- **浏览器侧**：`ctget.js` 仍以 `window.ctfile` 暴露，`ModuleLoader` 分支保留。
- **Node 侧**：新增 `module.exports`，不影响浏览器加载。
- **`sw.js`**：仅调整非缓存请求的处理方式，缓存行为与缓存名规则未变，VERSION 递增可让老用户自动更新缓存。

---

## 七、已知限制与后续建议

1. **token 有效期未确认**。建议调用方在 `accelerated === false && logged_in === true` 时提示用户重新登录（`logged_in` 由 `my_uid > 0` 判定）。
2. **VIP 直链分支未经实测**。当前测试账号非 VIP，`is_vip` 字段不存在，`vip_*_url` 分支属顺带补齐，欢迎有 VIP 账号的同学验证。
3. **高频请求会被限流**。城通在短时间内多次请求会返回空 body。批量解析场景建议**串行 + 间隔 ≥ 400ms**，失败重试 1 次。
4. **单条直链满速额度约 15.9MB**。下载大文件需按 15MB 分片，每片重新换取直链；分片请求必须带 `Range` 头。
5. `originHeaders` 里的 `Origin` / `Referer` 属于浏览器「禁止 JS 设置」的请求头，写了也不会生效（真实 Referer 由页面自身决定）。保留仅为兼容旧逻辑，**请勿据此判断安全性**。

---

## 附：改动统计

```
ctget.js | 242 ++++++++++++++++++++++++++++++++++++++-------------------------
sw.js    |  50 +++++++++----
2 files changed, 181 insertions(+), 111 deletions(-)
```

---

*本修复由 WorkBuddy 与 DeepSeek V4.1 协作完成。*
