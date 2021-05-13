const http = require("http");
const fs = require("fs");

const baseUrlRegex = /http[s]?:\/\/[\w\d\.]+\//;

const fileListPath = "filelist.json";
let fileList = JSON.parse(fs.readFileSync(fileListPath).toString());

function download(x) {
    let url = fileList[x].url;
    let etag = fileList[x].etag;

    http.get(url, (res) => {

        if (res.headers.location !== undefined) {
            let name = res.headers.location.split("/");
            name = decodeURI(name[name.length - 1]);

            let dir = name.split('_')[0].toLowerCase() + '/';

            if (fs.existsSync(dir) !== true) {
                fs.mkdirSync(dir);
            }

            let baseUrl = url.match(baseUrlRegex)[0];
            http.get(baseUrl + res.headers.location, (res) => {
                res.setEncoding('utf-8');

                if (res.headers.etag != etag || fs.existsSync(dir + name) == false) {
                    console.log("Downloading", name);

                    let file = fs.createWriteStream(dir + name);

                    res.pipe(file);

                    res.on("end", () => {
                        console.log(name, "download complete.");
                        fileList[x].etag = res.headers.etag;
                        downloads(x + 1);
                    });
                } else {
                    console.log(name, "no changed.");
                    downloads(x + 1);
                }
            });
        }
    });
}

var downloads = function (x) {
    if (x < fileList.length) {
        console.log(x + 1 + '/'+ fileList.length)
        download(x);
    } else {
        fs.writeFileSync(fileListPath, JSON.stringify(fileList, null, 4));
    }
};

downloads(0);
