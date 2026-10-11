const Joi = require('joi');

const requiredDocumentsSchema = Joi.array()
  .items(Joi.string().trim().min(1).max(100))
  .max(20);

const createServiceSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().trim().optional().allow(''),
  averageServiceTime: Joi.number().integer().min(1).required(),
  requiredDocuments: requiredDocumentsSchema.optional(),
  isActive: Joi.boolean().optional()
});

const updateServiceSchema = Joi.object({
  name: Joi.string().trim().optional(),
  description: Joi.string().trim().optional().allow(''),
  averageServiceTime: Joi.number().integer().min(1).optional(),
  requiredDocuments: requiredDocumentsSchema.optional(),
  isActive: Joi.boolean().optional()
}).min(1);

module.exports = {
  createServiceSchema,
  updateServiceSchema
};
