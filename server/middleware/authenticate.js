const { User } = require('../models/user');

// the actual code will not run until we'll call next
const authenticate = async function (req, res, next) {
    const token = req.header('x-auth');

    try {
        const user = await User.findByToken(token);

        if (!user) {
            return Promise.reject();
        }

        req.user = user;
        req.token = token;
        next();
    } catch (e) {
        res.status(401).send();
    }
};

module.exports = { authenticate };
