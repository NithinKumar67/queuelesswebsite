const ExpressError = require('../utils/ExpressError');

const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next(
            new ExpressError(401, 'Authentication required')
        );
    }

    next();
};

module.exports = requireAuth;