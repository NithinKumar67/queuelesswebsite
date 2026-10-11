const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
    officeId: {
        type: Schema.Types.ObjectId,
        ref: 'Office',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    averageServiceTime: {
        type: Number,
        required: true,
        min: 1
    },

    requiredDocuments: {
        type: [String],
        default: [],
        set: (documents) =>
            documents.map((document) => document.trim()).filter(Boolean)
    },

    isActive: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    timestamps: true
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;