const express = require('express');
const Assignment = require('../models/Assignment');
const Asset = require('../models/Asset');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, async (req, res) => {
    try {
      let filter = {};
      if (req.user.role === 'commander' && req.user.base) {
        filter.base = req.user.base;
      }
      const assignments = await Assignment.find(filter)
        .populate('asset', 'assetName type')
        .populate('assignedBy', 'name')
        .populate('base', 'name')
        .sort('-date');
      res.json(assignments);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
  .post(protect, restrictTo('admin', 'commander', 'logistics'), async (req, res) => {
    try {
      const { asset, assignedTo, quantity, base } = req.body;
      
      const assetDoc = await Asset.findById(asset);
      if(!assetDoc || assetDoc.quantity < quantity) {
         return res.status(400).json({ message: 'Insufficient Asset Quantity' });
      }

      const userBase = req.user.role === 'admin' ? base : req.user.base;

      const assignment = await Assignment.create({
        asset,
        assignedTo,
        quantity,
        base: userBase,
        assignedBy: req.user._id
      });

      // Deduct quantity
      assetDoc.quantity -= quantity;
      await assetDoc.save();

      const populatedAssignment = await Assignment.findById(assignment._id)
        .populate('asset', 'assetName type')
        .populate('assignedBy', 'name')
        .populate('base', 'name');

      res.status(201).json(populatedAssignment);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

module.exports = router;
