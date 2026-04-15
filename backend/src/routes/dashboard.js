const express = require('express');
const Asset = require('../models/Asset');
const Purchase = require('../models/Purchase');
const Transfer = require('../models/Transfer');
const Assignment = require('../models/Assignment');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/metrics', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'commander' && req.user.base) {
      filter = { base: req.user.base };
    }

    const totalAssetsItems = await Asset.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    const assetsByType = await Asset.aggregate([
      { $match: filter },
      { $group: { _id: '$type', total: { $sum: '$quantity' } } }
    ]);

    // count recent activity
    let transferFilter = {};
    if (req.user.role === 'commander' && req.user.base) {
       transferFilter = { $or: [{ fromBase: req.user.base }, { toBase: req.user.base }] };
    }
    const pendingTransfers = await Transfer.countDocuments({ ...transferFilter, status: 'pending' });

    res.json({
      totalAssets: totalAssetsItems.length > 0 ? totalAssetsItems[0].total : 0,
      assetsByType,
      pendingTransfers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
