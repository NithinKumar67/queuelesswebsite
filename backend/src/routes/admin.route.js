const express = require('express');

const wrapAsync = require('../utils/wrapAsync');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const {
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
} = require('../controllers/admin.controller');
const validate = require('../middleware/validate');

const {
  createCounterSchema,
  updateCounterSchema,
  createStaffSchema,
  updateStaffSchema,
  staffAssignmentSchema
} = require('../schemas/admin.schema');

const router = express.Router();

// Enforce authentication & admin authorization on all routes
router.use(requireAuth, requireRole('admin'));

// Office & Counter management
router.get('/offices', wrapAsync(getOffices));
router.get('/offices/:officeId/counters', wrapAsync(getOfficeCounters));

router.post(
  '/offices/:officeId/counters',
  validate(createCounterSchema),
  wrapAsync(createCounter)
);

router.put(
  '/counters/:counterId',
  validate(updateCounterSchema),
  wrapAsync(updateCounter)
);

router.delete('/counters/:counterId', wrapAsync(deleteCounter));

// Staff management
router.get('/staff', wrapAsync(getStaff));

router.post(
  '/staff',
  validate(createStaffSchema),
  wrapAsync(createStaff)
);

router.put(
  '/staff/:staffId',
  validate(updateStaffSchema),
  wrapAsync(updateStaff)
);

router.delete('/staff/:staffId', wrapAsync(deleteStaff));

router.patch(
  '/staff/:staffId/assignment',
  validate(staffAssignmentSchema),
  wrapAsync(updateStaffAssignment)
);
module.exports = router;