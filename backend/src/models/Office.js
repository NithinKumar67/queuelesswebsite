const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    name: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const officeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      required: true,
      enum: ['REVENUE', 'DEVELOPMENT']
    },

    description: {
      type: String,
      trim: true
    },

    address: {
      type: String,
      required: true,
      trim: true
    },

    mandal: {
      type: String,
      required: true,
      trim: true
    },

    district: {
      type: String,
      required: true,
      trim: true
    },

    state: {
      type: String,
      required: true,
      trim: true
    },

    // Office working days: Sunday = 0, Saturday = 6
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6],
      validate: {
        validator: (days) =>
          days.every(
            (day) =>
              Number.isInteger(day) &&
              day >= 0 &&
              day <= 6
          ),
        message:
          'workingDays values must be integers from 0 (Sunday) to 6 (Saturday)'
      }
    },

    // Token generation starts at 8:00 AM IST
    openingTime: {
      type: String,
      default: '08:00',
      match: /^([01]\d|2[0-3]):[0-5]\d$/
    },

    // Office closing time is 8:00 PM IST
    closingTime: {
      type: String,
      default: '20:00',
      match: /^([01]\d|2[0-3]):[0-5]\d$/
    },

    // Allow token generation until closing time
    tokenCutoffMinutes: {
      type: Number,
      min: 0,
      max: 180,
      default: 0
    },

    holidays: {
      type: [holidaySchema],
      default: []
    }
  },
  { timestamps: true }
);


officeSchema.pre('validate', function validateOfficeHours() {
  const toMinutes = (value) => {
    if (
      typeof value !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)
    ) {
      return null;
    }

    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const opening = toMinutes(this.openingTime);
  const closing = toMinutes(this.closingTime);

  if (
    opening !== null &&
    closing !== null &&
    closing <= opening
  ) {
    this.invalidate(
      'closingTime',
      'closingTime must be later than openingTime'
    );
  }
});


const Office = mongoose.model('Office', officeSchema);

module.exports = Office;