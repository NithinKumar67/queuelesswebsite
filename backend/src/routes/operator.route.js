const express = require('express');

const wrapAsync = require('../utils/wrapAsync');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const {
  getDashboard,
  getQueue,
  callNextToken,
  startToken,
  completeToken,
  skipToken,
  recallToken,
  updateCounterStatus
} = require('../controllers/operator.controller');
const validate = require('../middleware/validate');

const {
  counterStatusSchema
} = require('../schemas/operator.schema');

const router = express.Router();

// Enforce authentication & operator authorization on all routes
router.use(requireAuth, requireRole('operator'));

router.get('/dashboard', wrapAsync(getDashboard));
router.get('/queue', wrapAsync(getQueue));

router.post('/tokens/next', wrapAsync(callNextToken));
router.post('/tokens/:tokenId/start', wrapAsync(startToken));
router.post('/tokens/:tokenId/complete', wrapAsync(completeToken));
router.post('/tokens/:tokenId/skip', wrapAsync(skipToken));
router.post('/tokens/:tokenId/recall', wrapAsync(recallToken));

router.patch(
  '/counter/status',
  validate(counterStatusSchema),
  wrapAsync(updateCounterStatus)
);

module.exports = router;