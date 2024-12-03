(() => {
    const ctfile = {
        version: () => { return "2.6.9" },
        buildToken: () => {
            let token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            return token;
        },
        getByLink: (link, password, token, firstcallback) => {
            console.warn("ctfile.getByLink is deprecated, use ctfile.getByID instead.");
            return ctfile.getByID(link.substring(link.lastIndexOf("/") + 1, (link.lastIndexOf("?") == -1) ? undefined : link.lastIndexOf("?")), (link.lastIndexOf("p=") == -1) ? password : link.substring(link.lastIndexOf("p=") + 2), token, firstcallback);
        },
        getByID: async (fileid, password, token = ctfile.buildToken(), firstCallback, preferNode = "dx") => {
            const origin = () => {
                //兼容node.js
                if (document && !(document.location.origin == 'file://')) {
                    return document.location.origin;
                } else {
                    return "https://ctfile.qinlili.workers.dev";
                }
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
            }
            jsonText = JSON.parse(await (await fetch("https://webapi.ctfile.com/getfile.php?path=" + path(fileid) + "&f=" + fileid + "&passcode=" + password + "&token=" + token + "&r=" + Math.random() + "&ref=" + origin(), {
                "headers": {
                    "origin": origin(),
                    "referer": origin()
                },
            })).text());
            if (jsonText.code == 200) {
                if (firstCallback) {
                    firstCallback({
                        "name": jsonText.file.file_name,
                        "size": jsonText.file.file_size,
                        "time": jsonText.file.file_time,
                    })
                };
                if (jsonText.file.is_vip == 1) {
                    let url = false;
                    switch (preferNode) {
                        case "dx":
                            if (jsonText.file.vip_dx_url) {
                                url = jsonText.file.vip_dx_url;
                                break;
                            };
                        case "yd":
                            if (jsonText.file.vip_yd_url) {
                                url = jsonText.file.vip_yd_url;
                                break;
                            }
                        case "lt":
                            if (jsonText.file.vip_lt_url) {
                                url = jsonText.file.vip_lt_url;
                                break;
                            }
                        default:
                        case "us":
                            if (jsonText.file.us_downurl_a) {
                                url = jsonText.file.us_downurl_a;
                                break;
                            }
                    }
                    if (!url) {
                        return {
                            "success": false,
                            "name": jsonText.file.file_name,
                            "size": jsonText.file.file_size,
                            "time": jsonText.file.file_time,
                            "errormsg": "解析结果没有可用的链接！"
                        };
                    }
                    return {
                        "success": true,
                        "name": jsonText.file.file_name,
                        "size": jsonText.file.file_size,
                        "time": jsonText.file.file_time,
                        "link": url
                    };
                } else {
                    jsonText2 = JSON.parse(await (await fetch("https://webapi.ctfile.com/get_file_url.php?uid=" + jsonText.file.userid + "&fid=" + jsonText.file.file_id + "&file_chk=" + jsonText.file.file_chk + "&app=0&acheck=2&rd=" + Math.random(), {
                        "headers": {
                            "origin": origin(),
                            "referer": origin()
                        },
                    })).text());
                    if (jsonText2.code == 200) {
                        return {
                            "success": true,
                            "name": jsonText.file.file_name,
                            "size": jsonText.file.file_size,
                            "time": jsonText.file.file_time,
                            "link": jsonText2.downurl
                        };
                    } else {
                        if (jsonText2.code == 302) {
                            return {
                                "success": false,
                                "name": jsonText.file.file_name,
                                "size": jsonText.file.file_size,
                                "time": jsonText.file.file_time,
                                "errormsg": "需要登录！"
                            };
                        } else {
                            return {
                                "success": false,
                                "name": jsonText.file.file_name,
                                "size": jsonText.file.file_size,
                                "time": jsonText.file.file_time,
                                "errormsg": jsonText2.message
                            };
                        }
                    }
                }
            } else {
                return {
                    "success": false,
                    "errormsg": jsonText.file.message
                };
            }
        }
    };
    if (window.ModuleLoader && ModuleLoader.useRedbankLoaderGlobal) {
        ModuleLoader.loadLocal({ ctfile });
    } else {
        window.ctfile = ctfile;
    }
})();
