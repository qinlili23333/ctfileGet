const util = {
    sleep: delay => new Promise((resolve) => setTimeout(resolve, delay)),
    random: (min, max) => {
        return Math.round(Math.random() * (max - min)) + min;
    },
    loadScriptAsync: link => {
        return new Promise(resolve => {
            let script = document.createElement("script");
            script.src = link;
            script.onload = resolve;
            document.body.appendChild(script);
        });
    },
    link: (url, external) => {
        if (external) {
            window.open(url, "_blank");
        } else {
            location.href = url;
        }
    },
    loadCssCode: (code) => {
        var style = document.createElement('style')
        style.type = 'text/css'
        style.rel = 'stylesheet'
        style.appendChild(document.createTextNode(code))
        var head = document.getElementsByTagName('head')[0]
        head.appendChild(style)
    },
    sec_to_time: s => {
        let t;
        if (s > -1) {
            let hour = Math.floor(s / 3600);
            let min = Math.floor(s / 60) % 60;
            let sec = s % 60;
            if (hour < 10) {
                t = '0' + hour + ":";
            } else {
                t = hour + ":";
            }

            if (min < 10) { t += "0"; }
            t += min + ":";
            if (sec < 10) { t += "0"; }
            t += sec.toFixed(0);
        }
        return t;
    },
    covertSizeToByte: size => {
        let temp = size;
        if (size.endsWith('KB')) {
            return parseFloat(temp.replace('KB', '')) * 1024
        }
        if (size.endsWith('MB')) {
            return parseFloat(temp.replace('MB', '')) * 1024 * 1024
        }
        if (size.endsWith('GB')) {
            return parseFloat(temp.replace('GB', '')) * 1024 * 1024 * 1024
        }
        if (size.endsWith('B')) {
            return parseFloat(temp.replace('B', ''))
        }
    },
    bytesToSize: bytes => {
        if (bytes === '0' || bytes === 0) return '0B';
        var k = 1024;
        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat(bytes / Math.pow(k, i)).toFixed(2) + sizes[i];                                                                                                      //return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    }
}
let ModuleCache = {};
const ModuleLoader = {
    useRedbankLoaderGlobal: true,
    pendingCalls: [],
    loadedRemote: [],
    checkPending: async () => {
        for (const call of ModuleLoader.pendingCalls) {
            if (Module[call.name]) {
                await call.callback();
            }
        }
    },
    loadLocal: async (part, initList) => {
        Module = Object.assign(Module, part);
        await Module.autoinit.initList(initList ? initList : Object.keys(part));
        await ModuleLoader.checkPending();
    },
    loadRemote: async (name, initList) => {
        //加载远程模块
        await util.loadScriptAsync("module/" + name + ".js");
        await ModuleLoader.loadLocal(ModuleCache[name], initList);
        delete ModuleCache[name];
        ModuleLoader.loadedRemote.push(name);
    },
    queueLoaded: async (name, callback) => {
        //确定已经置入队列加载的模块
        //调用前请确保已调用模块加载器
        if (Module[name]) {
            return await callback();
        } else {
            ModuleLoader.pendingCalls.append({ name: name, callback: callback });
            //-10表示模块尚未就绪，就绪后会自动调用
            //模块就绪时间不定，可能需要覆盖和取消的操作不要用这个
            return -10;
        }

    },
    ensureLoaded: async (name, modulename, callback) => {
        //不确定是否调用模块加载器的情况
        //确保模块加载完成执行后再回调
        if (Module[name]) {
            return await callback();
        } else {
            //高优先级加载
            if (ModuleLoader.loadedRemote.includes(modulename)) {
                //已经加载过指定模块，但模块内没有这个组件
                return -1;
            } else {
                await ModuleLoader.loadRemote(modulename);
                if (Module[name]) {
                    return await callback();
                }
                //加载了，但并没有这个组件
                return -1;
            }
        }
    }
}
let Module = {
    autoinit: {
        initEverything: async () => {
            Module.autoinit.initList(Object.keys(Module));
        },
        initList: async (list) => {
            for (const key of list) {
                if (Module[key].init && !Module[key].loaded) {
                    console.log("Module " + key + " init;");
                    await Module[key].init();
                    Module[key].loaded = true;
                }
            }
        }
    },
    netTick: {
        tick: 0,
        wait: async () => {
            await util.sleep(Math.pow(2, Module.netTick.tick) * 1000);
            Module.netTick.tick++;
        },
        reset: () => {
            Module.netTick.tick = 0;
        }
    },
    logger: {
        collect: (error) => {
            console.warn(error.message);
        }
    },
    pref: {
        init: () => {
            if (localStorage.pref) {
                Module.pref.data = JSON.parse(localStorage.pref);
            } else {
                Module.pref.sync();
            }
        },
        data: {},
        sync: () => {
            localStorage.pref = JSON.stringify(Module.pref.data);
        },
        get: (key) => {
            return Module.pref.data[key] || false;
        },
        set: (key, value) => {
            Module.pref.data[key] = value;
            Module.pref.sync();
        },
        addRecent: (icon, name, url) => {
            let recent = Module.pref.get("recent") || [];
            recent.unshift({ icon: icon, name: name, url: url });
            recent = recent.filter((value, index, self) =>
                index === self.findIndex((t) => (
                    t.place === value.place && t.name === value.name
                ))
            )
            recent = recent.slice(0, 50);
            Module.pref.set("recent", recent);
            Module.recent.render();
        }
    },
    msg: {
        restore: () => {
            const info = document.createElement("p");
            info.className = "actBtn";
            info.style.width = "24px";
            info.style.backgroundRepeat = "round";
            info.style.backgroundImage = "url(./icon/info.svg)";
            info.tabIndex = 0;
            info.setAttribute("aria-label", "关于");
            info.onclick = () => {
                Module.yuni.showNative('about');
            };
            const history = document.createElement("p");
            history.className = "actBtn";
            history.style.width = "24px";
            history.style.backgroundRepeat = "round";
            history.style.backgroundImage = "url(./icon/history.svg)";
            history.tabIndex = 0;
            history.setAttribute("aria-label", "历史记录");
            history.onclick = () => {
                Module.yuni.showFrame('./history.html');
            };
            return Module.msg.change("城通网盘解析器～(∠・ω< )⌒☆", "./icon.webp", null, [history, info]);
        },
        change: (msg, icon, color, actions) => {
            document.getElementById("msgText").innerText = msg;
            document.getElementById("msgIcon").style.backgroundImage = icon ? `url(${icon})` : "none";
            document.getElementById("topMsg").style.backgroundColor = color ? color : "#FFFFFF";
            document.getElementById("actZone").innerHTML = "";
            actions ? actions.forEach(btn => {
                document.getElementById("actZone").appendChild(btn);
                btn.setAttribute("role", "button");
                if (!btn.id) {
                    btn.id = "actBtn" + Math.random().toString(36).substr(2);
                };
                //let label = document.createElement("label");
                //label.setAttribute("for", btn.id);
                //label.innerText = btn.getAttribute("aria-label");
                //document.getElementById("actZone").appendChild(label);
            }) : null;
        },
        hide: () => {
            document.getElementById("topMsg").style.display = "none";
        },
        show: () => {
            document.getElementById("topMsg").style.display = "flex";
        },
    },
    yuni: {
        lazyinit: () => {
            util.loadCssCode(`#yuniFrame {
max-width: 600px;
margin: auto;
padding: 100%;
width: 100%;
height: calc(100% - 32px);
}

#closeBtn {
width: 100vw;
height: 32px;
border-radius: 10px 10px 0px 0px;
transition: background-color 0.2s, transform 0.3s ease-in-out;
}

#closeBtn:hover {
background-color: #cccccc;
}

#closeBtn:active {
background-color: #999999
}

#closeBtn.active {
background-color: #FADCBB
}

#yuniContainer {
transition: opacity 0.2s ease-in;
opacity: 0;
display: none;
z-index: 9999;
top: 0px;
bottom: 0px;
left: 0px;
right: 0px;
height: auto;
width: auto;
position: fixed;
background-color: rgba(0, 0, 0, 0.15);
}

#yuni {
display: flex;
flex-direction: column;
text-align: center;
width: 100vw;
height: 90vh;
border-radius: 10px 10px 0px 0px;
backdrop-filter: blur(10px) brightness(100%);
-webkit-backdrop-filter: blur(10px) brightness(100%);
background-color: rgba(255, 255, 255, 0.75);
margin-top: 100vh;
margin-bottom: 0px;
margin-left: 0px;
margin-right: 0px;
transition: margin-top 0.5s ease-out;
}

#loading {
width: 32px;
position: absolute;
margin: auto;
top: 0px;
bottom: 0px;
left: 0px;
right: 0px;
}`);
            const framediv = `<div id="yuniContainer">
<div id="yuni"> 
<img role="button" aria-label="关闭弹出页面" id="closeBtn" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDQ4IDQ4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik02IDlMNDIgOSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik02IDE5TDQyIDE5IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTYgMjZMMjQgNDBMNDIgMjYiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=">
<iframe title="弹出页面" id="yuniFrame" frameborder="0"></iframe>
<img alt="加载中" id="loading" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgd2lkdGg9JzEyMHB4JyBoZWlnaHQ9JzEyMHB4JyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCI+DQogICAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9Im5vbmUiIGNsYXNzPSJiayI+PC9yZWN0Pg0KICAgIDxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjQwIiBzdHJva2U9IiNEQ0FDODkiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMTAiIHN0cm9rZS1saW5lY2FwPSJidXR0Ij4NCiAgICAgICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ic3Ryb2tlLWRhc2hvZmZzZXQiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiBmcm9tPSIwIiB0bz0iNTAyIj48L2FuaW1hdGU+DQogICAgICAgIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InN0cm9rZS1kYXNoYXJyYXkiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiB2YWx1ZXM9IjE1MC42IDEwMC40OzEgMjUwOzE1MC42IDEwMC40Ij48L2FuaW1hdGU+DQogICAgPC9jaXJjbGU+DQo8L3N2Zz4=">
</div>
</div>`
            document.body.insertAdjacentHTML('beforeend', framediv);
            //弹出
            const rebuildFrame = url => {
                if (document.getElementById("yuniFrame")) {
                    document.getElementById("yuni").removeChild(document.getElementById("yuniFrame"));
                };
                let newFrame = document.createElement("iframe");
                newFrame.id = "yuniFrame";
                newFrame.frameBorder = 0;
                document.getElementById("closeBtn").insertAdjacentElement("afterend", newFrame)
                newFrame.src = url;
                newFrame.title = "弹出页面";
                newFrame.addEventListener("load", () => {
                    document.getElementById("loading").style.display = "none";
                    newFrame.style.padding = "0px";
                });
            };
            window.addEventListener("message", async (event) => {
                console.log(event.data)
                if (typeof event.data == "string") {
                    if (event.data == "close") {
                        document.getElementById("yuniContainer").style.opacity = 0;
                        document.getElementById("yuni").style.marginTop = "100vh";
                        await util.sleep(500);
                        document.getElementById("yuniContainer").style.display = "none";
                    }
                    if (event.data.startsWith("http")) {
                        document.getElementById("loading").style.display = "block";
                        rebuildFrame(event.data);
                    }
                }
            }, false);
            Module.yuni.showFrame = async (url, wide) => {
                //使用iframe渲染设置
                document.getElementById("yuniContainer").style.display = "block";
                await util.sleep(1);
                document.getElementById("yuniContainer").style.opacity = 1;
                document.getElementById("yuni").style.marginTop = "10vh";
                document.getElementById("loading").style.display = "block";
                rebuildFrame(url);
                if (wide) {
                    document.getElementById("yuniFrame").style.maxWidth = "100vw";
                }
            };
            Module.yuni.showNative = async (url, wide) => {
                //使用iframe渲染设置
                document.getElementById("yuniContainer").style.display = "block";
                await util.sleep(1);
                document.getElementById("yuniContainer").style.opacity = 1;
                document.getElementById("yuni").style.marginTop = "10vh";
                document.getElementById("loading").style.display = "block";
                if (document.getElementById("yuniFrame")) {
                    document.getElementById("yuni").removeChild(document.getElementById("yuniFrame"));
                };
                let newFrame = document.createElement("div");
                newFrame.id = "yuniFrame";
                newFrame.style.overflow = "auto";
                document.getElementById("closeBtn").insertAdjacentElement("afterend", newFrame);
                fetch("/yuni/" + url + ".yuniml").then(response => response.text()).then(data => {
                    newFrame.innerHTML = data;
                    newFrame.style.padding = "0px";
                    document.getElementById("loading").style.display = "none";
                });
                if (wide) {
                    document.getElementById("yuniFrame").style.maxWidth = "100vw";
                }
            };
            document.getElementById("closeBtn").addEventListener("click", async (event) => {
                event.stopPropagation();
                document.getElementById("yuni").style.marginTop = "100vh";
                document.getElementById("yuniContainer").style.opacity = 0;
                await util.sleep(500);
                document.getElementById("yuniContainer").style.display = "none";
                document.getElementById("yuni").removeChild(document.getElementById("yuniFrame"));
            })
        },
        showFrame: async (url, wide) => {
            Module.yuni.lazyinit();
            Module.yuni.showFrame(url, wide);
        },
        showNative: async (url, wide) => {
            Module.yuni.lazyinit();
            Module.yuni.showNative(url, wide);
        }
    },
    blobBtn: {
        version: "1.0.0",
        IconPack: {
            load: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0iI2U4N2E5MCI+DQogICAgPHBhdGggb3BhY2l0eT0iLjI1IiBkPSJNMTYgMCBBMTYgMTYgMCAwIDAgMTYgMzIgQTE2IDE2IDAgMCAwIDE2IDAgTTE2IDQgQTEyIDEyIDAgMCAxIDE2IDI4IEExMiAxMiAwIDAgMSAxNiA0IiAvPg0KICAgIDxwYXRoIGQ9Ik0xNiAwIEExNiAxNiAwIDAgMSAzMiAxNiBMMjggMTYgQTEyIDEyIDAgMCAwIDE2IDR6Ij4NCiAgICAgICAgPGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIGZyb209IjAgMTYgMTYiIHRvPSIzNjAgMTYgMTYiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiAvPg0KICAgIDwvcGF0aD4NCjwvc3ZnPg==",
            fail: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDQ4IDQ4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMCA0NEgzOEMzOS4xMDQ2IDQ0IDQwIDQzLjEwNDYgNDAgNDJWMTRMMzEgNEgxMEM4Ljg5NTQzIDQgOCA0Ljg5NTQzIDggNlY0MkM4IDQzLjEwNDYgOC44OTU0MyA0NCAxMCA0NFoiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMTggMjJMMzAgMzQiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMzAgMjJMMTggMzQiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMzAgNFYxNEg0MCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==",
            down: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHdpZHRoPSIyOCIgaGVpZ2h0PSIyOCIgdmlld0JveD0iMCAwIDQ4IDQ4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4wMSIvPjxwYXRoIGQ9Ik0xMS42Nzc3IDIwLjI3MUM3LjI3NDc2IDIxLjMxODEgNCAyNS4yNzY2IDQgMzBDNCAzNS41MjI4IDguNDc3MTUgNDAgMTQgNDBWNDBDMTQuOTQ3NCA0MCAxNS44NjQgMzkuODY4MyAxNi43MzI1IDM5LjYyMjEiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMzYuMDU0NyAyMC4yNzFDNDAuNDU3NyAyMS4zMTgxIDQzLjczMjQgMjUuMjc2NiA0My43MzI0IDMwQzQzLjczMjQgMzUuNTIyOCAzOS4yNTUzIDQwIDMzLjczMjQgNDBWNDBDMzIuNzg1IDQwIDMxLjg2ODQgMzkuODY4MyAzMC45OTk5IDM5LjYyMjEiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMzYgMjBDMzYgMTMuMzcyNiAzMC42Mjc0IDggMjQgOEMxNy4zNzI2IDggMTIgMTMuMzcyNiAxMiAyMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xNy4wNjU0IDMwLjExOUwyMy45OTk5IDM3LjA3NjRMMzEuMTMxOCAzMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yNCAyMFYzMy41MzgyIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+"
        },
        createBtn: (link, filename) => {
            let btn = document.createElement("div");
            btn.indl = false;
            btn.className = "dlBtn";
            btn.setAttribute("role", "button");
            btn.title = "内置下载";
            btn.addEventListener("mouseenter", event => { event.composedPath()[0].style.backgroundColor = "#86C166"; })
            btn.addEventListener("mouseleave", event => { event.composedPath()[0].style.backgroundColor = "transparent"; })
            btn.style = "-webkit-tap-highlight-color: transparent;position:relative;display: flex;flex-direction: row;margin: 4px;height: 32px;border: 1px solid #666;border-radius: 4px;background-color: #ffffff;cursor: pointer;transition: background-color 0.5s;"
            let dlicon = document.createElement("img");
            dlicon.alt = "内置下载"
            dlicon.style = "margin: 2px;width: 28px;height: 28px;transition: filter 0.5s;"
            btn.appendChild(dlicon);
            let dltitle = document.createElement("h3");
            dltitle.style = "margin:0px;text-align: center;width: 100%;transition: color 0.5s;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;";
            dltitle.innerText = "内置下载";
            btn.appendChild(dltitle);
            dlicon.src = Module.blobBtn.IconPack.down;
            let progress = document.createElement("div");
            progress.style = "position: absolute;top: 0;bottom: 0;left: 0;background-color: #A8D8B9;z-index: -1;width:0%;transition: width 0.25s ease-in-out,opacity 0.25s,background-color 1s;"
            btn.appendChild(progress);
            var xhr = new XMLHttpRequest();
            xhr.responseType = "blob";
            xhr.onprogress = event => {
                if (event.loaded && event.total) {
                    var percent = String(Number(event.loaded) / Number(event.total) * 100).substring(0, 4);
                    dltitle.innerText = "正在下载" + percent + "%";
                    progress.style.width = percent + "%";
                }
            };
            xhr.onload = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        let eleLink = document.createElement('a');
                        eleLink.download = filename;
                        eleLink.style.display = 'none';
                        const bloburl = URL.createObjectURL(xhr.response);
                        eleLink.href = bloburl;
                        document.body.appendChild(eleLink);
                        eleLink.click();
                        document.body.removeChild(eleLink);
                        dltitle.innerText = "下载成功";
                        dlicon.src = Module.blobBtn.IconPack.down;
                        btn.style.backgroundColor = "#86C166";
                        window.URL.revokeObjectURL(bloburl)
                    } else {
                        dltitle.innerText = "下载失败:" + xhr.status;
                        dlicon.src = Module.blobBtn.IconPack.fail;
                        btn.style.backgroundColor = "#F17C67";
                    }
                    btn.indl = false;
                }
            }
            xhr.onerror = () => {
                dltitle.innerText = "连接失败";
                dlicon.src = Module.blobBtn.IconPack.fail;
                btn.style.backgroundColor = "#F17C67";
            }
            btn.addEventListener("click", () => {
                if (!btn.indl) {
                    btn.indl = true;
                    xhr.open('GET', link, true)
                    xhr.send()
                    dlicon.src = Module.blobBtn.IconPack.load;
                    dltitle.innerText = "正在下载";
                }
            })
            return btn;
        }
    }
}