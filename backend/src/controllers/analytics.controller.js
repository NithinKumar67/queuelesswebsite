const mongoose = require('mongoose');

const Token = require('../models/Token');
const Office = require('../models/Office');
const ExpressError = require('../utils/ExpressError');
const { TIME_ZONE } = require('../utils/officeSchedule');

// Hour of day in the offices' time zone (IST), not UTC, so the buckets
// line up with office opening hours shown in the frontend.
const HOUR_IN_OFFICE_TZ = {
  $hour: { date: '$createdAt', timezone: TIME_ZONE }
};

// 1. GET /api/admin/analytics/queue - Overall Queue Analytics
const getQueueAnalytics = async (req, res) => {
  const [
    totalTokens,
    waitingTokens,
    calledTokens,
    servingTokens,
    completedTokens,
    skippedTokens,
    cancelledTokens
  ] = await Promise.all([
    Token.countDocuments({}),
    Token.countDocuments({ status: 'WAITING' }),
    Token.countDocuments({ status: 'CALLED' }),
    Token.countDocuments({ status: 'SERVING' }),
    Token.countDocuments({ status: 'COMPLETED' }),
    Token.countDocuments({ status: 'SKIPPED' }),
    Token.countDocuments({ status: 'CANCELLED' })
  ]);

  res.status(200).json({
    success: true,
    analytics: {
      totalTokens,
      waitingTokens,
      calledTokens,
      servingTokens,
      completedTokens,
      skippedTokens,
      cancelledTokens
    }
  });
};

// 2. GET /api/admin/analytics/peak-hours - Overall Peak Hours
const getOverallPeakHours = async (req, res) => {
  const peakHours = await Token.aggregate([
    {
      $project: {
        hour: HOUR_IN_OFFICE_TZ
      }
    },
    {
      $group: {
        _id: '$hour',
        tokenCount: { $sum: 1 }
      }
    },
    {
      $sort: { tokenCount: -1 }
    },
    {
      $project: {
        _id: 0,
        hour: '$_id',
        tokenCount: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    peakHours
  });
};

// 3. GET /api/offices/:officeId/analytics/peak-hours - Office Peak Hours
const getOfficePeakHours = async (req, res) => {
  const { officeId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(officeId)) {
    throw new ExpressError(400, 'Invalid office ID format');
  }

  const office = await Office.findById(officeId);
  if (!office) {
    throw new ExpressError(404, 'Office not found');
  }

  const peakHours = await Token.aggregate([
    {
      $match: {
        officeId: new mongoose.Types.ObjectId(officeId)
      }
    },
    {
      $project: {
        hour: HOUR_IN_OFFICE_TZ
      }
    },
    {
      $group: {
        _id: '$hour',
        tokenCount: { $sum: 1 }
      }
    },
    {
      $sort: { tokenCount: -1 }
    },
    {
      $project: {
        _id: 0,
        hour: '$_id',
        tokenCount: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    office: {
      id: office._id,
      name: office.name
    },
    peakHours
  });
};

module.exports = {
  getQueueAnalytics,
  getOverallPeakHours,
  getOfficePeakHours
};