const mongoose = require('mongoose');

const User = require('../models/User');
const Office = require('../models/Office');
const Counter = require('../models/Counter');
const Token = require('../models/Token');
const ExpressError = require('../utils/ExpressError');

// 1. GET /api/admin/offices - Get All Offices
const getOffices = async (req, res) => {
  const offices = await Office.find({});
  res.status(200).json({
    success: true,
    offices
  });
};

// 2. GET /api/admin/offices/:officeId/counters - Get Office Counters
const getOfficeCounters = async (req, res) => {
  const { officeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(officeId)) {
    throw new ExpressError(400, 'Invalid office ID format');
  }

  const office = await Office.findById(officeId);
  if (!office) {
    throw new ExpressError(404, 'Office not found');
  }

  const counters = await Counter.find({ officeId }).populate(
    'currentTokenId',
    'tokenNumber status'
  );

  res.status(200).json({
    success: true,
    counters
  });
};

// 3. POST /api/admin/offices/:officeId/counters - Create Counter
const createCounter = async (req, res) => {
  const { officeId } = req.params;
  const { name, number } = req.body;

  if (!mongoose.Types.ObjectId.isValid(officeId)) {
    throw new ExpressError(400, 'Invalid office ID format');
  }

  if (!name || name.trim() === '') {
    throw new ExpressError(400, 'Counter name is required');
  }

  if (number === undefined || number === null || number < 1) {
    throw new ExpressError(400, 'Counter number must be a positive integer (>= 1)');
  }

  const office = await Office.findById(officeId);
  if (!office) {
    throw new ExpressError(404, 'Office not found');
  }

  const existingCounter = await Counter.findOne({ officeId, number });
  if (existingCounter) {
    throw new ExpressError(409, 'Counter number already exists for this office');
  }

  const counter = new Counter({
    officeId,
    name: name.trim(),
    number,
    status: 'AVAILABLE',
    currentTokenId: null
  });

  await counter.save();

  res.status(201).json({
    success: true,
    message: 'Counter created successfully',
    counter
  });
};

// 4. PUT /api/admin/counters/:counterId - Update Counter
const updateCounter = async (req, res) => {
  const { counterId } = req.params;
  const { name, number, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(counterId)) {
    throw new ExpressError(400, 'Invalid counter ID format');
  }

  const counter = await Counter.findById(counterId);
  if (!counter) {
    throw new ExpressError(404, 'Counter not found');
  }

  if (status !== undefined) {
    const allowedStatuses = ['AVAILABLE', 'PAUSED', 'OFFLINE'];
    if (!allowedStatuses.includes(status)) {
      throw new ExpressError(
        400,
        `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
      );
    }
    counter.status = status;
  }

  if (name !== undefined) {
    if (name.trim() === '') {
      throw new ExpressError(400, 'Counter name cannot be empty');
    }
    counter.name = name.trim();
  }

  if (number !== undefined) {
    if (number < 1) {
      throw new ExpressError(400, 'Counter number must be a positive integer (>= 1)');
    }

    const duplicateCounter = await Counter.findOne({
      officeId: counter.officeId,
      number,
      _id: { $ne: counterId }
    });

    if (duplicateCounter) {
      throw new ExpressError(
        409,
        'Another counter with this number already exists in this office'
      );
    }

    counter.number = number;
  }

  await counter.save();

  res.status(200).json({
    success: true,
    message: 'Counter updated successfully',
    counter
  });
};

// 5. DELETE /api/admin/counters/:counterId - Delete Counter
const deleteCounter = async (req, res) => {
  const { counterId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(counterId)) {
    throw new ExpressError(400, 'Invalid counter ID format');
  }

  const counter = await Counter.findById(counterId);
  if (!counter) {
    throw new ExpressError(404, 'Counter not found');
  }

  const activeToken = await Token.findOne({
    counterId,
    status: { $in: ['CALLED', 'SERVING'] }
  });

  if (activeToken) {
    throw new ExpressError(
      409,
      'Cannot delete counter while it has an active token in CALLED or SERVING status'
    );
  }

  await Counter.findByIdAndDelete(counterId);

  res.status(200).json({
    success: true,
    message: 'Counter deleted successfully'
  });
};

// 6. GET /api/admin/staff - Get All Staff (Operators)
const getStaff = async (req, res) => {
  const staff = await User.find({ role: 'operator' })
    .select('name email phone role officeId counterId createdAt')
    .populate('officeId', 'name code type')
    .populate('counterId', 'name number status');

  res.status(200).json({
    success: true,
    staff
  });
};

// 7. POST /api/admin/staff - Create Staff Account
const createStaff = async (req, res) => {
  const { name, email, password, phone, officeId, counterId } = req.body;

  if (!name || name.trim() === '') {
    throw new ExpressError(400, 'Name is required');
  }
  if (!email || email.trim() === '') {
    throw new ExpressError(400, 'Email is required');
  }
  if (!password || password.length < 6) {
    throw new ExpressError(400, 'Password must be at least 6 characters long');
  }
  if (!officeId || !mongoose.Types.ObjectId.isValid(officeId)) {
    throw new ExpressError(400, 'Valid officeId is required');
  }
  if (!counterId || !mongoose.Types.ObjectId.isValid(counterId)) {
    throw new ExpressError(400, 'Valid counterId is required');
  }

  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingUser) {
    throw new ExpressError(409, 'Email is already registered');
  }

  const office = await Office.findById(officeId);
  if (!office) {
    throw new ExpressError(404, 'Office not found');
  }

  const counter = await Counter.findById(counterId);
  if (!counter) {
    throw new ExpressError(404, 'Counter not found');
  }

  if (counter.officeId.toString() !== officeId.toString()) {
    throw new ExpressError(400, 'Selected counter does not belong to the selected office');
  }

  const newStaff = new User({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    role: 'operator',
    officeId,
    counterId
  });

  const registeredStaff = await User.register(newStaff, password);

  res.status(201).json({
    success: true,
    message: 'Staff created successfully',
    staff: {
      id: registeredStaff._id,
      name: registeredStaff.name,
      email: registeredStaff.email,
      phone: registeredStaff.phone,
      role: registeredStaff.role,
      officeId: registeredStaff.officeId,
      counterId: registeredStaff.counterId
    }
  });
};

// 8. PUT /api/admin/staff/:staffId - Update Staff Info
const updateStaff = async (req, res) => {
  const { staffId } = req.params;
  const { name, email, phone } = req.body;

  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    throw new ExpressError(400, 'Invalid staff ID format');
  }

  const staff = await User.findOne({ _id: staffId, role: 'operator' });
  if (!staff) {
    throw new ExpressError(404, 'Staff member not found');
  }

  if (name !== undefined) {
    if (name.trim() === '') {
      throw new ExpressError(400, 'Name cannot be empty');
    }
    staff.name = name.trim();
  }

  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === '') {
      throw new ExpressError(400, 'Email cannot be empty');
    }

    const duplicateUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: staffId }
    });
    if (duplicateUser) {
      throw new ExpressError(409, 'Email is already in use by another user');
    }

    staff.email = normalizedEmail;
  }

  if (phone !== undefined) {
    staff.phone = phone.trim();
  }

  await staff.save();

  res.status(200).json({
    success: true,
    message: 'Staff updated successfully',
    staff: {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      officeId: staff.officeId,
      counterId: staff.counterId
    }
  });
};

// 9. DELETE /api/admin/staff/:staffId - Delete Staff
const deleteStaff = async (req, res) => {
  const { staffId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    throw new ExpressError(400, 'Invalid staff ID format');
  }

  const staff = await User.findOne({ _id: staffId, role: 'operator' });
  if (!staff) {
    throw new ExpressError(404, 'Staff member not found');
  }

  if (staff.counterId) {
    const activeToken = await Token.findOne({
      counterId: staff.counterId,
      status: { $in: ['CALLED', 'SERVING'] }
    });

    if (activeToken) {
      throw new ExpressError(
        409,
        'Cannot delete staff member while their assigned counter has an active token in progress'
      );
    }
  }

  await User.findByIdAndDelete(staffId);

  res.status(200).json({
    success: true,
    message: 'Staff deleted successfully'
  });
};

// 10. PATCH /api/admin/staff/:staffId/assignment - Update Staff Assignment
const updateStaffAssignment = async (req, res) => {
  const { staffId } = req.params;
  const { officeId, counterId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    throw new ExpressError(400, 'Invalid staff ID format');
  }
  if (!officeId || !mongoose.Types.ObjectId.isValid(officeId)) {
    throw new ExpressError(400, 'Valid officeId is required');
  }
  if (!counterId || !mongoose.Types.ObjectId.isValid(counterId)) {
    throw new ExpressError(400, 'Valid counterId is required');
  }

  const staff = await User.findOne({ _id: staffId, role: 'operator' });
  if (!staff) {
    throw new ExpressError(404, 'Staff member not found');
  }

  const office = await Office.findById(officeId);
  if (!office) {
    throw new ExpressError(404, 'Office not found');
  }

  const counter = await Counter.findById(counterId);
  if (!counter) {
    throw new ExpressError(404, 'Counter not found');
  }

  if (counter.officeId.toString() !== officeId.toString()) {
    throw new ExpressError(400, 'Selected counter does not belong to the selected office');
  }

  staff.officeId = officeId;
  staff.counterId = counterId;

  await staff.save();

  res.status(200).json({
    success: true,
    message: 'Staff assignment updated successfully',
    staff: {
      id: staff._id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      officeId: staff.officeId,
      counterId: staff.counterId
    }
  });
};

module.exports = {
  getOffices,
  getOfficeCounters,
  createCounter,
  updateCounter,
  deleteCounter,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffAssignment
};