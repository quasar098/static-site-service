require("dotenv").config()

module.exports = (req, res, next) => {
    const address = req.socket.localAddress;
    let allowed = JSON.parse(process.env.ALLOWED_IPS ?? '[]');
    if (allowed.length == 0) {
        return next();
    }
    for (let index in allowed) {
        if (allowed.includes(address)) {
            return next();
        }
    }
    console.log("blocked ip: " + address);
    return res.status(404).send("<h1 style='font-family: Helvetica'>There is nothing for you here</h1>")
}
