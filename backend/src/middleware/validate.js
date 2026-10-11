const ExpressError = require('../utils/ExpressError');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      const message = error.details
        .map((detail) => detail.message)
        .join(', ');

      return next(new ExpressError(400, message));
    }

    req.body = value;
    next();
  };
};

module.exports = validate;