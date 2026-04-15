const express = require('express');
const Transfer = require('../models/Transfer');
const Asset = require('../models/Asset');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, async (req, res) => {
    try {
      let filter = {};
      if (req.user.role === 'commander' && req.user.base) {
        filter.$or = [{ fromBase: req.user.base }, { toBase: req.user.base }];
      }
      const transfers = await Transfer.find(filter)
        .populate('asset', 'assetName type')
        .populate('fromBase', 'name')
        .populate('toBase', 'name')
        .populate('initiatedBy', 'name')
        .populate('approvedBy', 'name')
        .sort('-date');
      res.json(transfers);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
  .post(protect, restrictTo('admin', 'logistics'), async (req, res) => {
    try {
      const { asset, fromBase, toBase, quantity } = req.body;
      
      const assetDoc = await Asset.findById(asset);
      if(!assetDoc || assetDoc.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient Asset Quantity at Source Base' });
      }

      if(fromBase === toBase) {
        return res.status(400).json({ message: 'Source and Destination bases cannot be same' });
      }

      const transfer = await Transfer.create({
        asset,
        fromBase,
        toBase,
        quantity,
        initiatedBy: req.user._id
      });
      
      const populatedTransfer = await Transfer.findById(transfer._id)
        .populate('asset', 'assetName type')
        .populate('fromBase', 'name')
        .populate('toBase', 'name')
        .populate('initiatedBy', 'name');

      res.status(201).json(populatedTransfer);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

router.patch('/:id/approve', protect, restrictTo('admin', 'commander'), async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    if (transfer.status !== 'pending') return res.status(400).json({ message: 'Transfer already processed' });

    // Validate Commander is from 'fromBase' or 'toBase' or is admin
    if (req.user.role === 'commander' && String(req.user.base) !== String(transfer.fromBase) && String(req.user.base) !== String(transfer.toBase)) {
      return res.status(403).json({ message: 'Not authorized to approve this transfer' });
    }

    const { status } = req.body; // 'approved' or 'rejected'
    transfer.status = status;
    transfer.approvedBy = req.user._id;

    if (status === 'approved') {
      const assetDoc = await Asset.findById(transfer.asset);
      
      if(assetDoc.quantity < transfer.quantity) {
        return res.status(400).json({ message: 'Insufficient asset quantity for approval' });
      }
      
      // Deduct from fromBase
      assetDoc.quantity -= transfer.quantity;
      await assetDoc.save();

      // Ensure asset exists in toBase, if not, wait... our Asset schema has 1 base per document.
      // Wait, an asset type is specific to a base in our simple schema. So we need to find or create the asset in toBase!
      
      let destAsset = await Asset.findOne({ 
        assetName: assetDoc.assetName, 
        base: transfer.toBase 
      });

      if (!destAsset) {
        destAsset = await Asset.create({
          assetName: assetDoc.assetName,
          type: assetDoc.type,
          quantity: transfer.quantity,
          base: transfer.toBase
        });
      } else {
        destAsset.quantity += transfer.quantity;
        await destAsset.save();
      }
    }

    await transfer.save();
    
    // repopulate
    const populated = await Transfer.findById(transfer._id)
      .populate('asset', 'assetName type')
      .populate('fromBase', 'name')
      .populate('toBase', 'name')
      .populate('initiatedBy', 'name')
      .populate('approvedBy', 'name');
      
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
