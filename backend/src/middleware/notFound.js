const ExpressError = require('../utils/ExpressError');

const notFound = (req, res, next) => {
    next(new ExpressError(404, 'Route not found'));
};

module.exports = notFound;