require('dotenv').config()
const express = require('express')
const jwt = require('jsonwebtoken')
const app = express()
const bcrypt = require('bcrypt')
const auth = require("./middleware/auth");
const bodyParser = require("body-parser");
const port = process.env.PORT || 37000

let jsonParser = bodyParser.json()

let admins = [
    {
        username: "quasar098",
        password: "$2b$10$6qH9M1cmXqRnx3cDxronhuRX29sekxhanJw07wkuZ4gFH16eRdcHK"  // 'password' is the password
    }
]
let count = 0

app.use(express.static('public'))

app.get('/api/count', (req, res) => {
    res.status(200).send({count: count})
})

app.post('/api/increment', (req, res) => {
    count += 1
    res.status(200).send({count: count})
})

app.post('/api/reset', jsonParser, auth, (req, res) => {
    count = 0
    res.status(200).send({count: count})
})
app.post('/api/login', jsonParser, (req, res) => {
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
app.use('/api/*', (req, res) => {
    res.status(404).send("invalid api request")
})

app.use('*', express.static('public/page-not-found'))

app.listen(port, () => {
    console.log(`Counter app listening on port ${port}`)
})
