const express = require('express');

const wrapAsync = require('../utils/wrapAsync');
const requireAuth = require('../middleware/requireAuth');
const {
  getOffices,
  getOfficeById,
  getOfficeServices
} = require('../controllers/office.controller');

const router = express.Router();

// Apply auth middleware to all office routes
router.use(requireAuth);

router.get('/', wrapAsync(getOffices));
router.get('/:officeId', wrapAsync(getOfficeById));
router.get('/:officeId/services', wrapAsync(getOfficeServices));

module.exports = router;