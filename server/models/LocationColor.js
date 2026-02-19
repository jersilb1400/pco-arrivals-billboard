const mongoose = require('mongoose');

const locationColorSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    index: true
  },
  assignments: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Ensure one document per event
locationColorSchema.index({ eventId: 1 }, { unique: true });

module.exports = mongoose.model('LocationColor', locationColorSchema);
