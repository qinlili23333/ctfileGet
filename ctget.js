(() => {
    /*
     * ============================================================================
     * 关键修复（2026-10 城通接口变更）
     * ============================================================================
     *
     * 1) 旧接口已废弃
     *    原版调用的 get_file_url.php?app=0&acheck=2 现在固定返回
     *    【HTTP 200 + 空 body】，于是 JSON.parse("") 抛
     *    "SyntaxError: Unexpected end of JSON input"。
     *    新接口为 get_down_url.php，且【必须】带上 getfile.php 返回的 start_time
     *    （缺了它同样返回空 body）。
     *    成功时返回 { code:200, downurl, file_size, file_name }。
     *
     * 2) ★ token 必须传给 get_down_url.php（决定下载速度，11 倍差距）
     *    实测四组对照（同一文件、同一账号）：
     *      getfile带token / getdown不带token → spd=100000   0.10 MB/s
     *      getfile不带token / getdown带token → spd=1200000  1.14 MB/s
     *      getfile带token   / getdown带token → spd=1200000  1.14 MB/s
     *    即：只在 getfile.php 带 token 完全无效，必须传给 get_down_url.php。
     *    原版两个接口都没带（get_down_url.php 是本次新引入的），所以登录用户
     *    也拿不到加速直链。
     *
     * 3) 空响应兜底
     *    原版直接写 JSON.parse(await (await fetch(...)).text())，不判 HTTP 状态、
     *    不判空、没有 try/catch，接口一返空就抛未捕获异常。
     * ============================================================================
     */
    const ctfile = {
        version: () => { return "2.6.11" },

        /*
         * 新增：统一的「请求 + 解析」封装。
         * 先校验 HTTP 状态和响应体是否为空，再解析，并把错误变成可读文案。
         * 这样任何接口异常都变成结构化返回值，而不是往控制台抛未捕获异常。
         */
        requestJSON: async (url, options = {}) => {
            const res = await fetch(url, options);
            const text = await res.text();
            if (!text) {
                throw new Error("接口返回空内容 (HTTP " + res.status + ")，通常是触发了城通风控/Cloudflare 校验、被限流，或未登录");
            }
            try {
                return JSON.parse(text);
            } catch (e) {
                throw new Error("接口返回的不是 JSON (HTTP " + res.status + "): " + text.slice(0, 200));
            }
        },

        getByLink: (link, password, token, firstcallback) => {
            console.warn("ctfile.getByLink is deprecated, use ctfile.getByID instead.");
            return ctfile.getByID(link.substring(link.lastIndexOf("/") + 1, (link.lastIndexOf("?") == -1) ? undefined : link.lastIndexOf("?")), (link.lastIndexOf("p=") == -1) ? password : link.substring(link.lastIndexOf("p=") + 2), token, firstcallback);
        },

        // token 默认值加保护：main 分支并没有定义 ctfile.buildToken，
        // 原版直接写 token = ctfile.buildToken() 会抛 TypeError。
        getByID: async (fileid, password, token = (typeof ctfile.buildToken === "function" ? ctfile.buildToken() : ""), firstCallback, preferNode = "dx") => {
            const origin = () => {
                // 兼容 node.js：原版直接引用 document，在无 DOM 环境会抛 ReferenceError
                if (typeof document !== "undefined" && document.location && document.location.origin != "file://") {
                    return document.location.origin;
                }
                return "https://ctfile.qinlili.workers.dev";
            };

            const path = id => {
                switch (id.split("-").length) {
                    case 2: {
                        return "file";
                    };
                    case 3:
                    default: {
                        return "f";
                    }
                }
            };

            // 注意：Origin / Referer 属于浏览器「禁止 JS 设置」的请求头，
            // 这里写了也不会生效，真实 Referer 由页面自身决定。保留仅为兼容旧逻辑。
            const originHeaders = { "origin": origin(), "referer": origin() };

            try {
                const jsonText = await ctfile.requestJSON(
                    "https://webapi.ctfile.com/getfile.php?path=" + path(fileid) +
                    "&f=" + fileid +
                    // 原版直接拼 password，未传密码时会拼出 "passcode=undefined"
                    "&passcode=" + (password || "") +
                    "&token=" + (token || "") +
                    "&r=" + Math.random() +
                    "&ref=" + encodeURIComponent(origin()),
                    { headers: originHeaders, credentials: "include" }
                );

                if (jsonText.code != 200) {
                    // code 423 = 需要提取码（getfile.php 也可能直接返回它）
                    if (jsonText.code == 423) {
                        return {
                            "success": false,
                            "need_passcode": true,
                            "errormsg": "该文件需要提取码，请填写后重试。"
                        };
                    }
                    // file 可能为空，原版直接取 jsonText.file.message 会二次抛错
                    return {
                        "success": false,
                        "errormsg": (jsonText.file && jsonText.file.message) || jsonText.message || ("接口返回 code=" + jsonText.code)
                    };
                }

                const file = jsonText.file || {};
                const base = {
                    "name": file.file_name,
                    "size": file.file_size,
                    "time": file.file_time,
                    // 顺带带出加速状态，供调用方展示（登录且走加速档位时为 true）
                    "accelerated": file.is_accelerated === true,
                    "logged_in": Number(file.my_uid) > 0,
                    "username": file.my_username || ""
                };
                if (firstCallback) firstCallback(base);

                // ---- VIP 账号：直接使用 VIP 高速直链 ----
                if (file.is_vip == 1) {
                    let url = false;
                    switch (preferNode) {
                        case "dx": if (file.vip_dx_url) { url = file.vip_dx_url; break; }
                        case "yd": if (file.vip_yd_url) { url = file.vip_yd_url; break; }
                        case "lt": if (file.vip_lt_url) { url = file.vip_lt_url; break; }
                        default:
                        case "us": if (file.us_downurl_a) { url = file.us_downurl_a; break; }
                    }
                    if (!url) {
                        return Object.assign({ "success": false, "errormsg": "解析结果没有可用的链接！" }, base);
                    }
                    return Object.assign({ "success": true, "link": url }, base);
                }

                // ---- 普通账号：走新接口 get_down_url.php ----
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

                if (jsonText2.code == 200 && jsonText2.downurl) {
                    return Object.assign({ "success": true, "link": jsonText2.downurl }, base);
                }
                if (jsonText2.code == 423) {
                    return Object.assign({ "success": false, "need_passcode": true, "errormsg": "该文件需要提取码（或提取码不正确）。" }, base);
                }
                return Object.assign({ "success": false, "errormsg": jsonText2.message || ("接口返回 code=" + jsonText2.code) }, base);

            } catch (e) {
                // 任何网络/解析异常都不再向上抛，统一返回结构化结果
                return {
                    "success": false,
                    "errormsg": (e && e.message) ? e.message : String(e)
                };
            }
        }
    };

    if (typeof window !== "undefined") {
        if (window.ModuleLoader && ModuleLoader.useRedbankLoaderGlobal) {
            ModuleLoader.loadLocal({ ctfile });
        } else {
            window.ctfile = ctfile;
        }
    }
    // 供 node.js 直接 require 后测试
    if (typeof module !== "undefined" && module.exports) {
        module.exports = ctfile;
    }
})();
