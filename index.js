require('dotenv').config()
const jwt = require('jsonwebtoken')
const express = require('express')
const http = require('http');
const app = express()
const server = http.createServer(app);
const bcrypt = require('bcrypt')
const auth = require("./middleware/auth");
const bodyParser = require("body-parser");
const port = process.env.PORT || 37000
const path = require("path");
const fs = require('fs');
const fse = require("fs-extra");
const restrictip = require("./middleware/restrictip");
const formidable = require('formidable');

function getDirectories(source) {
    return fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
}


let jsonParser = bodyParser.json()

let admins = JSON.parse(process.env.ADMINS ?? '[]');

if (admins.length == 0) {
    console.log("Warning: there are no admin accounts!")
}
if (process.env.ALLOWED_IPS == undefined) {
    console.log("Warning: all ips are allowed!")
}
if (process.env.JWT_SECRET == undefined) {
    throw new Error("Err: you don't have a jwt secret");
}

function gp(...paths) {
    return path.join(__dirname, ...paths)
}

fse.ensureDirSync(gp("public/stored"))

app.use(express.static('public'))

app.get("/api/title", (req, res) => {
    res.status(200).send(JSON.stringify({"title": process.env.TITLE ?? "Untitled Hoster"}))
});

app.post("/api/upload", jsonParser, restrictip, (req, res) => {
    const form = formidable({ multiples: true });

    form.parse(req, (err, fields, files) => {
        let keys = Object.keys(files);
        if (keys[0] == undefined) {
            return res.status(400);
        }
        let values = Object.values(files);
        let siteName = keys[0].substring(0, keys[0].indexOf("/"));
        try {
            if (fs.existsSync(gp("public/stored", siteName))) {
                fs.rmSync(gp("public/stored", siteName), { recursive: true, force: true }, (err) => {
                    if (err) {
                        console.log("error overwriting:", siteName);
                        console.log(err);
                    }
                })
            }
        } catch (e) { console.log(e); return res.status(500) }

        if (err) {
            return res.status(500).send("Unable to parse form");
        }

        for (var i = 0; i < keys.length; i++) {
            let oldPath = values[i].filepath;
            let newPath = gp("public/stored", keys[i]);

            if (newPath.includes(".git")) {
                console.log("git file skipped")
                continue;
            }

            fse.ensureDirSync(path.dirname(newPath));

            fs.copyFile(oldPath, newPath, (err) => {
                if (err) {
                    console.log("Error writing uploaded file")
                    console.log(err);
                }
            })
        }

        console.log(siteName, "has been uploaded")

        res.status(200);
    });
})

app.post('/api/reset', jsonParser, restrictip, auth, (req, res) => {
    fs.rm(gp('/public/stored'), { recursive: true }, (err) => {
        err != null && console.log(err)
        fs.mkdir(gp('/public/stored'), (err) => {
            err != null && console.log(err);
            res.status(200);
        })
    })
})

app.post("/api/delete", jsonParser, restrictip, auth, (req, res) => {
    let siteName = req.body.name ?? "---";
    fse.ensureDirSync(gp("public/stored", siteName));
    fs.rm(gp("public/stored", siteName), { recursive: true }, (err) => {
        if (err) {
            console.log("error deleting:" + siteName);
        }
    })
    console.log("deleted site:", siteName)
    res.status(200).send("passta");
})

app.post("/api/rename", jsonParser, restrictip, auth, (req, res) => {
    let oldName = req.body.oldName;
    let newName = req.body.newName;
    if (!fs.existsSync(gp("public/stored", oldName))) {
        return res.status(304).send("Original site not found");
    };
    if (fs.existsSync(gp("public/stored", newName))) {
        return res.status(304).send("Cannot overwrite site");
    };
    fs.renameSync(
        gp("public/stored", oldName),
        gp("public/stored", newName)
    );
    res.status(200).send("Ok");
})

app.post('/api/login', jsonParser, restrictip, (req, res) => {
    if (req.body.password && req.body.username) {
        bcrypt.hash(req.body.password, 10, function(err, hash) {
            let adminsList = admins.filter(i => req.body.username == i.username);
            if (adminsList.length == 0) {
                return res.status(401).send("Invalid credentials.");
            } else {
                let adminCredentials = adminsList[0];
                bcrypt.compare(req.body.password, adminCredentials.password, function(err, result) {
                    if (result) {
                        let token = jwt.sign(adminCredentials, process.env.JWT_SECRET, { expiresIn: '1h' });
                        return res.status(200).send(token);
                    } else {
                        return res.status(401).send("Invalid credentials.")
                    }
                });
            }
        });
    } else {
        return res.status(401).send("Missing username or password");
    }
})

app.get("/api/do-restrict-ip", jsonParser, restrictip, (req, res) => {
    res.sendStatus(200);
})

app.get("/api/get-sites", (req, res) => {
    res.status(200).send(JSON.stringify(getDirectories(gp('/public/stored'))))
})

app.use('/api/*', (req, res) => {
    res.status(404).send("invalid api request")
})

app.use(express.static('public/stored'))

app.use('*', express.static('public/page-not-found'))

server.listen(process.env.PORT || port, () => {
    console.log(`Listening on listening on port ${process.env.PORT || port}`)
})
