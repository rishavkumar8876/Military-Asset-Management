const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['vehicle', 'weapon', 'ammunition'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  base: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);
