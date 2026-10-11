const mongoose = require('mongoose');

const Office = require('../models/Office');
const Service = require('../models/Service');
const ExpressError = require('../utils/ExpressError');

// GET /api/offices - List all offices
const getOffices = async (req, res) => {
  const offices = await Office.find({});
  res.status(200).json({
    success: true,
    offices
  });
};

// GET /api/offices/:officeId - Single office details
const getOfficeById = async (req, res) => {
  const { officeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(officeId)) {
    throw new ExpressError(400, 'Invalid office ID format');
  }

  const office = await Office.findById(officeId);

  if (!office) {
    throw new ExpressError(404, 'Office not found');
  }

  res.status(200).json({
    success: true,
    office
  });
};

// GET /api/offices/:officeId/services - Active services for an office
const getOfficeServices = async (req, res) => {
  const { officeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(officeId)) {
    throw new ExpressError(400, 'Invalid office ID format');
  }

  const office = await Office.findById(officeId);

  if (!office) {
    throw new ExpressError(404, 'Office not found');
  }

  const services = await Service.find({
    officeId,
    isActive: true
  });

  res.status(200).json({
    success: true,
    services
  });
};

module.exports = {
  getOffices,
  getOfficeById,
  getOfficeServices
};