const mongoose = require('mongoose');

const Token = require('../models/Token');
const Office = require('../models/Office');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const { predictWaitTime } = require('../utils/mlPrediction');
const ExpressError = require('../utils/ExpressError');

const {
  getTodayBounds,
  getTokenAvailability,
  expirePreviousDayUnservedTokens,
  checkQueueCanFinishBeforeClosing
} = require('../utils/officeSchedule');

const ACTIVE_STATUSES = ['WAITING', 'CALLED', 'SERVING'];
const MAX_TOKEN_NUMBER_ATTEMPTS = 5;

// Emit queue updates to clients joined to the office's Socket.IO room.
const emitQueueUpdated = (req, payload) => {
  const io = req.app.get('io');

  if (!io) {
    console.warn(
      '[Socket.IO] Socket server unavailable; queue update was not emitted.'
    );
    return;
  }

  io.to(`office:${payload.officeId}`).emit('queue:updated', payload);
};

// 1. GET /api/offices/:officeId/services/:serviceId/queue
const getQueue = async (req, res) => {
  await expirePreviousDayUnservedTokens();

  const { start, end } = getTodayBounds();
  const { officeId, serviceId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(officeId)) {
    throw new ExpressError(400, 'Invalid office ID format');
  }

  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new ExpressError(400, 'Invalid service ID format');
  }

  const office = await Office.findById(officeId);

  if (!office) {
    throw new ExpressError(404, 'Office not found');
  }

  const service = await Service.findById(serviceId);

  if (!service || service.officeId.toString() !== officeId) {
    throw new ExpressError(404, 'Service not found for this office');
  }

  const activeTokens = await Token.find({
    officeId,
    serviceId,
    status: { $in: ACTIVE_STATUSES },
    createdAt: { $gte: start, $lt: end }
  })
    .sort({ createdAt: 1 })
    .select('tokenNumber status createdAt calledAt startedAt');

  const queue = activeTokens.map((token, index) => ({
    _id: token._id,
    tokenNumber: token.tokenNumber,
    status: token.status,
    position: index + 1,
    createdAt: token.createdAt,
    calledAt: token.calledAt,
    startedAt: token.startedAt
  }));

  res.status(200).json({
    success: true,
    queue
  });
};

// 2. POST /api/tokens - Generate token
const createToken = async (req, res) => {
  await expirePreviousDayUnservedTokens();

  const now = new Date();
  const { officeId, serviceId } = req.body;

  if (!officeId || !mongoose.Types.ObjectId.isValid(officeId)) {
    throw new ExpressError(400, 'Valid officeId is required');
  }

  if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new ExpressError(400, 'Valid serviceId is required');
  }

  const office = await Office.findById(officeId);

  if (!office) {
    throw new ExpressError(404, 'Office not found');
  }

  const availability = getTokenAvailability(office, now);

  if (!availability.allowed) {
    throw new ExpressError(400, availability.message);
  }

  const service = await Service.findById(serviceId);

  if (!service || service.officeId.toString() !== officeId) {
    throw new ExpressError(404, 'Service not found for this office');
  }

  if (!service.isActive) {
    throw new ExpressError(400, 'Selected service is currently inactive');
  }

  // Prevent users from generating another active token.
  const existingActiveToken = await Token.findOne({
    userId: req.user._id,
    status: { $in: ACTIVE_STATUSES }
  });

  if (existingActiveToken) {
    throw new ExpressError(
      409,
      'You already have an active token in the queue'
    );
  }

  const capacity = await checkQueueCanFinishBeforeClosing({
    office,
    service,
    now
  });

  if (!capacity.allowed) {
    throw new ExpressError(400, capacity.message);
  }

  // Generate the token number (T001, T002, ...). Two simultaneous requests can
  // compute the same number; the unique index on tokenNumber rejects the
  // second one, so retry with the next number instead of failing with a 500.
  let token = null;

  for (let attempt = 0; attempt < MAX_TOKEN_NUMBER_ATTEMPTS; attempt++) {
    const totalTokens = await Token.countDocuments({});
    const tokenNumber = `T${String(totalTokens + 1 + attempt).padStart(3, '0')}`;

    try {
      token = await new Token({
        tokenNumber,
        userId: req.user._id,
        officeId,
        serviceId,
        status: 'WAITING',
        counterId: null
      }).save();

      break;
    } catch (error) {
      const isTokenNumberClash =
        error.code === 11000 && error.keyPattern?.tokenNumber;

      if (!isTokenNumberClash) throw error;
    }
  }

  if (!token) {
    throw new ExpressError(
      503,
      'Could not generate a token number. Please try again.'
    );
  }

  // SOCKET.IO: notify the operator queue that a token was created.
  emitQueueUpdated(req, {
    officeId: officeId.toString(),
    serviceId: serviceId.toString(),
    tokenId: token._id.toString(),
    tokenNumber: token.tokenNumber,
    status: token.status
  });

  res.status(201).json({
    success: true,
    message: 'Token generated successfully',
    token
  });
};

// 3. GET /api/tokens/my-active
const getMyActiveToken = async (req, res) => {
  await expirePreviousDayUnservedTokens();

  const { start, end } = getTodayBounds();

  const activeToken = await Token.findOne({
    userId: req.user._id,
    status: { $in: ACTIVE_STATUSES },
    $or: [
      { createdAt: { $gte: start, $lt: end } },
      { status: 'SERVING' }
    ]
  })
    .populate('officeId', 'name code type')
    .populate('serviceId', 'name averageServiceTime');

  if (!activeToken) {
    return res.status(200).json({
      success: true,
      token: null
    });
  }

  let queuePosition = null;
  let estimatedWaitTimeMinutes = null;
  let baselineWaitTimeMinutes = null;
  let waitTimeModel = null;
  let activeCounters = null;

  if (activeToken.status === 'WAITING') {
    const tokensAhead = await Token.countDocuments({
      officeId: activeToken.officeId._id,
      serviceId: activeToken.serviceId._id,
      status: { $in: ACTIVE_STATUSES },
      createdAt: {
        $gte: start,
        $lt: end,
        $lte: activeToken.createdAt
      }
    });

    queuePosition = tokensAhead;

    // AVAILABLE counters remain active even while serving a token.
    activeCounters = await Counter.countDocuments({
      officeId: activeToken.officeId._id,
      status: 'AVAILABLE'
    });

    const prediction = await predictWaitTime({
      peopleAhead: Math.max(0, queuePosition - 1),
      averageServiceTime: activeToken.serviceId.averageServiceTime,
      activeCounters
    });

    estimatedWaitTimeMinutes = prediction.predictedWaitTime;
    baselineWaitTimeMinutes = prediction.baselineWaitTime;
    waitTimeModel = prediction.modelUsed;
  }

  res.status(200).json({
    success: true,
    token: activeToken,
    queuePosition,
    estimatedWaitTimeMinutes,
    baselineWaitTimeMinutes,
    waitTimeModel,
    activeCounters
  });
};

// 4. GET /api/tokens/:tokenId
const getTokenById = async (req, res) => {
  await expirePreviousDayUnservedTokens();

  const { start, end } = getTodayBounds();
  const { tokenId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tokenId)) {
    throw new ExpressError(400, 'Invalid token ID format');
  }

  const token = await Token.findById(tokenId)
    .populate('officeId', 'name code type')
    .populate('serviceId', 'name averageServiceTime')
    .populate('counterId', 'number');

  if (!token) {
    throw new ExpressError(404, 'Token not found');
  }

  // Citizens can only view their own tokens.
  if (
    req.user.role === 'citizen' &&
    token.userId.toString() !== req.user._id.toString()
  ) {
    throw new ExpressError(403, 'Access denied to this token');
  }

  let queuePosition = null;
  let estimatedWaitTimeMinutes = null;
  let baselineWaitTimeMinutes = null;
  let waitTimeModel = null;
  let activeCounters = null;

  if (token.status === 'WAITING') {
    const tokensAhead = await Token.countDocuments({
      officeId: token.officeId._id,
      serviceId: token.serviceId._id,
      status: { $in: ACTIVE_STATUSES },
      createdAt: {
        $gte: start,
        $lt: end,
        $lte: token.createdAt
      }
    });

    queuePosition = tokensAhead;

    // AVAILABLE counters remain active even while serving a token.
    activeCounters = await Counter.countDocuments({
      officeId: token.officeId._id,
      status: 'AVAILABLE'
    });

    const prediction = await predictWaitTime({
      peopleAhead: Math.max(0, queuePosition - 1),
      averageServiceTime: token.serviceId.averageServiceTime,
      activeCounters
    });

    estimatedWaitTimeMinutes = prediction.predictedWaitTime;
    baselineWaitTimeMinutes = prediction.baselineWaitTime;
    waitTimeModel = prediction.modelUsed;
  }

  res.status(200).json({
    success: true,
    token,
    queuePosition,
    estimatedWaitTimeMinutes,
    baselineWaitTimeMinutes,
    waitTimeModel,
    activeCounters
  });
};

// 5. PATCH /api/tokens/:tokenId/cancel
const cancelToken = async (req, res) => {
  const { tokenId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tokenId)) {
    throw new ExpressError(400, 'Invalid token ID format');
  }

  const existing = await Token.findById(tokenId);

  if (!existing) {
    throw new ExpressError(404, 'Token not found');
  }

  // Citizens can only cancel their own tokens.
  if (
    req.user.role === 'citizen' &&
    existing.userId.toString() !== req.user._id.toString()
  ) {
    throw new ExpressError(403, 'Access denied to cancel this token');
  }

  // Atomic status change: if an operator moved the token on (e.g. completed
  // it) between the read above and now, the update matches nothing.
  const token = await Token.findOneAndUpdate(
    { _id: tokenId, status: { $in: ACTIVE_STATUSES } },
    { $set: { status: 'CANCELLED' } },
    { new: true }
  );

  if (!token) {
    const current = await Token.findById(tokenId).select('status');

    throw new ExpressError(
      400,
      `Cannot cancel token with status '${current?.status ?? existing.status}'`
    );
  }

  // Free the counter if it was holding this token.
  await Counter.updateMany(
    { currentTokenId: token._id },
    { $set: { currentTokenId: null } }
  );

  // SOCKET.IO: notify operators that the token was cancelled.
  emitQueueUpdated(req, {
    officeId: token.officeId.toString(),
    serviceId: token.serviceId.toString(),
    tokenId: token._id.toString(),
    tokenNumber: token.tokenNumber,
    status: token.status
  });

  res.status(200).json({
    success: true,
    message: 'Token cancelled successfully',
    token
  });
};

module.exports = {
  getQueue,
  createToken,
  getMyActiveToken,
  getTokenById,
  cancelToken
};