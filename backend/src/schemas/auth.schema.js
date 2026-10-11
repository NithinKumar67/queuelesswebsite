const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().optional().allow("")
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required()
});

module.exports = {
  registerSchema,
  loginSchema
};