require('dotenv').config()
const express = require('express')
const jwt = require('jsonwebtoken')
const app = express()
const bcrypt = require('bcrypt')
const auth = require("./middleware/auth");
const bodyParser = require("body-parser");
const port = process.env.PORT || 37000
const path = require("path");
const fs = require('fs');
const restrictip = require("./middleware/restrictip");

function getDirectories(source) {
    return fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
}

let jsonParser = bodyParser.json()

let admins = [
    {
        username: "quasar098",
        password: "$2b$10$6qH9M1cmXqRnx3cDxronhuRX29sekxhanJw07wkuZ4gFH16eRdcHK"  // 'password' is the password
    }
]

app.use(restrictip, express.static('public'))

app.post('/api/reset', jsonParser, restrictip, auth, (req, res) => {
    fs.rm(path.join(__dirname, '/public/stored'), { recursive: true }, (err) => {
        err != null && console.log(err)
        fs.mkdir(path.join(__dirname, '/public/stored'), (err) => {
            err != null && console.log(err);
            res.status(200);
        })
    })
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

app.get("/api/get-sites", (req, res) => {
    res.status(200).send(JSON.stringify(getDirectories(path.join(__dirname, '/public/stored'))))
})

app.use('/api/*', (req, res) => {
    res.status(404).send("invalid api request")
})

app.use('*', express.static('public/page-not-found'))

app.listen(port, () => {
    console.log(`Listening on listening on port ${port}`)
})
