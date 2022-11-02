require("dotenv").config()

module.exports = (req, res, next) => {
    const address = req.body.address ?? (req.query.address ?? 'ANON');
    let allowed = JSON.parse(process.env.ALLOWED_IPS ?? '[]');
    if (allowed.length == 0) {
        return next();
    }
    for (let index in allowed) {
        if (allowed.includes(address)) {
            return next();
        }
    }
    if (address != "ANON") {
        console.log("blocked ip: " + address);
    } else {
        console.log("no moar ANON")
    }
    return res.sendStatus(404);
}
