const express = require('express');

const wrapAsync = require('../utils/wrapAsync');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const {
  getQueueAnalytics,
  getOverallPeakHours,
  getOfficePeakHours
} = require('../controllers/analytics.controller');

const router = express.Router();

// Admin Analytics Routes
router.get(
  '/admin/analytics/queue',
  requireAuth,
  requireRole('admin'),
  wrapAsync(getQueueAnalytics)
);

router.get(
  '/admin/analytics/peak-hours',
  requireAuth,
  requireRole('admin'),
  wrapAsync(getOverallPeakHours)
);

// Public / General Office Analytics Route
router.get(
  '/offices/:officeId/analytics/peak-hours',
  wrapAsync(getOfficePeakHours)
);

module.exports = router;