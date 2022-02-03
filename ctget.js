window.ctfile = {
    version: () => { return "2.0.1" },
    getByLink: (link, password) => {
        return ctfile.getByID(link.slice(link.indexOf("/f/") + 3), password);
    },
    getByID: async (fileid, password) => {
        const origin = () => {
            //兼容node.js
            if (document && !(document.location.origin == 'file://')) {
                return document.location.origin;
            } else {
                return "https://ctfile.qinlili.workers.dev";
            }
        }
        jsonText = JSON.parse(await (await fetch("https://webapi.ctfile.com/getfile.php?path=f&f=" + fileid + "&passcode=" + password + "&token=false&r=" + Math.random() + "&ref=" + origin(), {
            "headers": {
                "origin": origin(),
                "referer": origin()
            },
        })).text());
        if (jsonText.code == 200) {
            jsonText2 = JSON.parse(await (await fetch("https://webapi.ctfile.com/get_file_url.php?uid=" + jsonText.userid + "&fid=" + jsonText.file_id + "&file_chk=" + jsonText.file_chk + "&app=0&acheck=2&rd=" + Math.random(), {
                "headers": {
                    "origin": origin(),
                    "referer": origin()
                },
            })).text());
            if (jsonText2.code == 200) {
                return {
                    "success": true,
                    "name": jsonText.file_name,
                    "size": jsonText.file_size,
                    "time": jsonText.file_time,
                    "link": jsonText2.downurl
                };
            } else {
                return {
                    "success": false,
                    "name": jsonText.file_name,
                    "size": jsonText.file_size,
                    "time": jsonText.file_time,
                    "errormsg": jsonText2.message
                };
            }
        } else {
            return {
                "success": false,
                "errormsg": jsonText.message
            };
        }
    }
}