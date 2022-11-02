const jwt = require("jsonwebtoken");
require("dotenv").config()

const verifyToken = (req, res, next) => {
    const token = req.body.token;
    if (!token) {  // no token present
        console.log(req.body)
        res.status(403).send("A token is require for auth")
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {  // token is present but not a valid token
        return res.status(401).send("Invalid Token")
    }
    return next();
}

module.exports = verifyToken
