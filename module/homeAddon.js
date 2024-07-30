ModuleCache.homeAddon = {
    adLoader: {
        init: async () => {
            if (!localStorage.getItem("agreePrivacy")) {
                let read = document.createElement("p");
                read.className = "actBtn";
                read.innerText = "查看";
                read.setAttribute("aria-label", "查看隐私政策");
                read.tabIndex = 0;
                read.onclick = () => {
                    Module.yuni.showFrame('./privacy.html');
                    Module.msg.restore();
                };
                Module.msg.change("请阅读并同意隐私协议", "./icon/privacy.svg", "#FB966E", [read]);
                Module.adLoader.loadSelfAd();
            } else {
                Module.msg.restore();
                await util.sleep(1500);
                if (localStorage.adPref && localStorage.adPref == "any") {
                    //Anti uBlock Origin
                    (async () => {
                        await util.sleep(2000);
                        var xmlhttp = new XMLHttpRequest();
                        xmlhttp.onreadystatechange = function () {
                            if (this.readyState == 4) {
                                if (this.status === 200) {
                                    if (!this.responseURL.startsWith("https")) {
                                        console.log("广告被拦截");
                                        loadSelfAd();
                                    } else {
                                        (adsbygoogle = window.adsbygoogle || []).push({});
                                        util.loadScriptAsync("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1806614386308377");
                                        document.getElementById("closead").style.display = "none";
                                    }
                                }
                            }
                        };
                        xmlhttp.open("HEAD", "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", true);
                        xmlhttp.send();
                    })()
                } else {
                    Module.adLoader.loadSelfAd();
                }
            };
        },
        loadSelfAd: () => {
            console.log("加载自定义广告");
            Module.agariAD.lazyinit();
        }
    },
    agariAD: {
        lazyinit: async () => {
            console.log("Agari AD loaded. Fetch AD info...");
            let adinfo = await (await fetch("./agari.json")).json();
            switch (adinfo.type) {
                case "html": {
                    document.getElementById("selfad").innerHTML = adinfo.content;
                }
            }
        }
    }
}