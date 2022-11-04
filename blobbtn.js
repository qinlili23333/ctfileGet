window.blobBtn = {
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
        btn.addEventListener("mouseenter", event => { event.path[0].style.backgroundColor = "#86C166"; })
        btn.addEventListener("mouseleave", event => { event.path[0].style.backgroundColor = "transparent"; })
        btn.style = "-webkit-tap-highlight-color: transparent;position:relative;display: flex;flex-direction: row;margin: 4px;height: 32px;border: 1px solid #666;border-radius: 4px;background-color: #ffffff;cursor: pointer;transition: background-color 0.5s;"
        let dlicon = document.createElement("img");
        dlicon.style = "margin: 2px;width: 28px;height: 28px;transition: filter 0.5s;"
        btn.appendChild(dlicon);
        let dltitle = document.createElement("h3");
        dltitle.style = "margin:0px;text-align: center;width: 100%;transition: color 0.5s;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;";
        dltitle.innerText = "内置下载";
        btn.appendChild(dltitle);
        dlicon.src = blobBtn.IconPack.down;
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
                    dlicon.src = blobBtn.IconPack.down;
                    btn.style.backgroundColor = "#86C166";
                    window.URL.revokeObjectURL(bloburl)
                } else {
                    dltitle.innerText = "下载失败:" + xhr.status;
                    dlicon.src = blobBtn.IconPack.fail;
                    btn.style.backgroundColor = "#F17C67";
                }
                btn.indl = false;
            }
        }
        xhr.onerror = () => {
            dltitle.innerText = "连接失败";
            dlicon.src = blobBtn.IconPack.fail;
            btn.style.backgroundColor = "#F17C67";
        }
        btn.addEventListener("click", () => {
            if (!btn.indl) {
                btn.indl = true;
                xhr.open('GET', link, true)
                xhr.send()
                dlicon.src = blobBtn.IconPack.load;
                dltitle.innerText = "正在下载";
            }
        })
        return btn;
    }
}