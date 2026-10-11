// Central error handler. Known client errors keep their status/message;
// database errors are translated; unexpected 5xx messages are not leaked.
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || 'Something went wrong!';

    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path || 'value'}`;
    } else if (err.name === 'ValidationError' && err.errors) {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((item) => item.message)
            .join(', ');
    } else if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate value: the record already exists';
    } else if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Malformed JSON in request body';
    }

    if (statusCode >= 500) {
        console.error(err);

        if (process.env.NODE_ENV === 'production') {
            message = 'Something went wrong!';
        }
    }

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorHandler;
