function loadCssCode(code) {
    var style = document.createElement('style')
    style.type = 'text/css'
    style.rel = 'stylesheet'
    style.appendChild(document.createTextNode(code))
    var head = document.getElementsByTagName('head')[0]
    head.appendChild(style)
}
loadCssCode(`#setFrame {
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

#floatMenuContainer {
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

#floatMenu {
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
const framediv = `<div id="floatMenuContainer">
<div id="floatMenu">
    <img id="closeBtn" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDQ4IDQ4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik02IDlMNDIgOSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik02IDE5TDQyIDE5IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTYgMjZMMjQgNDBMNDIgMjYiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=">
    <iframe id="setFrame" frameborder="0"></iframe>
    <img id="loading" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgd2lkdGg9JzEyMHB4JyBoZWlnaHQ9JzEyMHB4JyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCI+DQogICAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9Im5vbmUiIGNsYXNzPSJiayI+PC9yZWN0Pg0KICAgIDxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjQwIiBzdHJva2U9IiNEQ0FDODkiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMTAiIHN0cm9rZS1saW5lY2FwPSJidXR0Ij4NCiAgICAgICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ic3Ryb2tlLWRhc2hvZmZzZXQiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiBmcm9tPSIwIiB0bz0iNTAyIj48L2FuaW1hdGU+DQogICAgICAgIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InN0cm9rZS1kYXNoYXJyYXkiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiB2YWx1ZXM9IjE1MC42IDEwMC40OzEgMjUwOzE1MC42IDEwMC40Ij48L2FuaW1hdGU+DQogICAgPC9jaXJjbGU+DQo8L3N2Zz4=">
</div>
</div>`
document.body.insertAdjacentHTML('beforeend', framediv);
//弹出
const rebuildFrame = url => {
    if (document.getElementById("setFrame")) {
        document.getElementById("floatMenu").removeChild(document.getElementById("setFrame"));
    };
    let newFrame = document.createElement("iframe");
    newFrame.id = "setFrame";
    newFrame.frameBorder = 0;
    document.getElementById("closeBtn").insertAdjacentElement("afterend", newFrame)
    newFrame.src = url;
    newFrame.addEventListener("load", () => {
        document.getElementById("loading").style.display = "none";
        newFrame.style.padding = "0px";
    });
};
window.addEventListener("message", async (event) => {
    console.log(event.data)
    if (typeof event.data == "string") {
        if (event.data == "close") {
            document.getElementById("floatMenuContainer").style.opacity = 0;
            document.getElementById("floatMenu").style.marginTop = "100vh";
            await sleep(500);
            document.getElementById("floatMenuContainer").style.display = "none";
        }
        if (event.data.startsWith("http")) {
            document.getElementById("loading").style.display = "block";
            rebuildFrame(event.data);
        }
    }
}, false);
const showFrameSet = async (url, wide) => {
    //使用iframe渲染设置
    document.getElementById("floatMenuContainer").style.display = "block";
    await sleep(1);
    document.getElementById("floatMenuContainer").style.opacity = 1;
    document.getElementById("floatMenu").style.marginTop = "10vh";
    document.getElementById("loading").style.display = "block";
    rebuildFrame(url);
    if (wide) {
        document.getElementById("setFrame").style.maxWidth = "100vw";
    }
}
document.getElementById("closeBtn").addEventListener("click", async (event) => {
    event.stopPropagation();
    document.getElementById("floatMenu").style.marginTop = "100vh";
    document.getElementById("floatMenuContainer").style.opacity = 0;
    await sleep(500);
    document.getElementById("floatMenuContainer").style.display = "none";
    document.getElementById("floatMenu").removeChild(document.getElementById("setFrame"));
})