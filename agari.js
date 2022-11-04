console.log("Agari AD loaded. Fetch AD info...");
(async () => {
    let adinfo = await (await fetch("./agari.json")).json();
    switch (adinfo.type) {
        case "html": {
            document.getElementById("selfad").innerHTML = adinfo.content;
        }
    }
})();