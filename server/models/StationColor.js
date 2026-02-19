const mongoose = require('mongoose');

const stationColorSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    index: true
  },
  selectedStationIds: {
    type: [String],
    default: []
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
stationColorSchema.index({ eventId: 1 }, { unique: true });

module.exports = mongoose.model('StationColor', stationColorSchema);
