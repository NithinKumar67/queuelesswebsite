const Joi = require('joi');
const mongoose = require('mongoose');

const isValidObjectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('"{#label}" must be a valid MongoDB ObjectId');
  }
  return value;
};

const createCounterSchema = Joi.object({
  name: Joi.string().trim().required(),
  number: Joi.number().integer().min(1).required()
});

const updateCounterSchema = Joi.object({
  name: Joi.string().trim().optional(),
  number: Joi.number().integer().min(1).optional(),
  status: Joi.string().valid('AVAILABLE', 'PAUSED', 'OFFLINE').optional()
}).min(1);

const createStaffSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().optional().allow(''),
  officeId: Joi.string().required().custom(isValidObjectId, 'ObjectId Validation'),
  counterId: Joi.string().required().custom(isValidObjectId, 'ObjectId Validation')
});

const updateStaffSchema = Joi.object({
  name: Joi.string().trim().optional(),
  email: Joi.string().email().trim().lowercase().optional(),
  phone: Joi.string().trim().optional().allow('')
});

const staffAssignmentSchema = Joi.object({
  officeId: Joi.string().required().custom(isValidObjectId, 'ObjectId Validation'),
  counterId: Joi.string().required().custom(isValidObjectId, 'ObjectId Validation')
});

module.exports = {
  createCounterSchema,
  updateCounterSchema,
  createStaffSchema,
  updateStaffSchema,
  staffAssignmentSchema
};