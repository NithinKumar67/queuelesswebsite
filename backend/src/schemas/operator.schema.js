const Joi = require('joi');

const counterStatusSchema = Joi.object({
  status: Joi.string()
    .valid('AVAILABLE', 'PAUSED', 'OFFLINE')
    .required()
});

module.exports = {
  counterStatusSchema
};