
const mongoose = require('mongoose');

const Office = require('../models/Office');
const Service = require('../models/Service');
const ExpressError = require('../utils/ExpressError');

// POST /api/admin/offices/:officeId/services - Create service
const createService = async (req, res) => {
  const { officeId } = req.params;

  const {
    name,
    description,
    averageServiceTime,
    isActive,
    requiredDocuments = []
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(officeId)) {
    throw new ExpressError(400, 'Invalid office ID format');
  }

  const office = await Office.findById(officeId);
  if (!office) {
    throw new ExpressError(404, 'Office not found');
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new ExpressError(400, 'Service name is required');
  }

  if (averageServiceTime === undefined || averageServiceTime === null) {
    throw new ExpressError(400, 'averageServiceTime is required');
  }

  const parsedTime = Number(averageServiceTime);
  if (isNaN(parsedTime) || parsedTime < 1) {
    throw new ExpressError(400, 'averageServiceTime must be a number >= 1');
  }

  const service = new Service({
    officeId,
    name: name.trim(),
    description: description ? description.trim() : undefined,
    averageServiceTime: parsedTime,
    requiredDocuments,
    isActive: isActive !== undefined ? Boolean(isActive) : true
  });

  await service.save();

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    service
  });
};

// PUT /api/admin/services/:serviceId - Update service
const updateService = async (req, res) => {
  const { serviceId } = req.params;

  const {
    name,
    description,
    averageServiceTime,
    isActive,
    requiredDocuments
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new ExpressError(400, 'Invalid service ID format');
  }

  const service = await Service.findById(serviceId);
  if (!service) {
    throw new ExpressError(404, 'Service not found');
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new ExpressError(400, 'Service name cannot be empty');
    }
    service.name = name.trim();
  }

  if (description !== undefined) {
    service.description = description ? description.trim() : '';
  }

  if (averageServiceTime !== undefined) {
    const parsedTime = Number(averageServiceTime);
    if (isNaN(parsedTime) || parsedTime < 1) {
      throw new ExpressError(400, 'averageServiceTime must be a number >= 1');
    }
    service.averageServiceTime = parsedTime;
  }

  if (isActive !== undefined) {
    service.isActive = Boolean(isActive);
  }

  if (requiredDocuments !== undefined) {
    service.requiredDocuments = requiredDocuments;
  }

  await service.save();

  res.status(200).json({
    success: true,
    message: 'Service updated successfully',
    service
  });
};

// DELETE /api/admin/services/:serviceId - Soft delete service
const deleteService = async (req, res) => {
  const { serviceId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new ExpressError(400, 'Invalid service ID format');
  }

  const service = await Service.findById(serviceId);
  if (!service) {
    throw new ExpressError(404, 'Service not found');
  }

  service.isActive = false;
  await service.save();

  res.status(200).json({
    success: true,
    message: 'Service deactivated successfully',
    service
  });
};

module.exports = {
  createService,
  updateService,
  deleteService
};
