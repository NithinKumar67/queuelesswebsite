const ExpressError = require('../utils/ExpressError');

const requireRole = (...roles) => {
    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return next(
                new ExpressError(403, 'Access denied')
            );
        }

        next();
    };
};

module.exports = requireRole;