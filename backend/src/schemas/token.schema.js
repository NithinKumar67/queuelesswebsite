const Joi = require('joi');
const mongoose = require('mongoose');

const isValidObjectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('"{#label}" must be a valid MongoDB ObjectId');
  }
  return value;
};

const createTokenSchema = Joi.object({
  officeId: Joi.string().required().custom(isValidObjectId, 'ObjectId Validation'),
  serviceId: Joi.string().required().custom(isValidObjectId, 'ObjectId Validation')
});

module.exports = {
  createTokenSchema
};