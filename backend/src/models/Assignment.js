const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
  },
  assignedTo: {
    type: String,
    required: true, // e.g., "Alpha Squad", "Operation Desert Storm"
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  base: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
