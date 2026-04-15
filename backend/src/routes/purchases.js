const express = require('express');
const Purchase = require('../models/Purchase');
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
      const purchases = await Purchase.find(filter)
        .populate('asset', 'assetName type')
        .populate('purchasedBy', 'name')
        .populate('base', 'name')
        .sort('-date');
      res.json(purchases);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
  .post(protect, restrictTo('admin', 'commander', 'logistics'), async (req, res) => {
    try {
      const { asset, quantity, base } = req.body;
      
      const purchase = await Purchase.create({
        asset,
        quantity,
        purchasedBy: req.user._id,
        base: req.user.role === 'admin' ? base : req.user.base
      });

      // Update asset inventory
      const assetToUpdate = await Asset.findById(asset);
      if(assetToUpdate) {
        assetToUpdate.quantity += Number(quantity);
        await assetToUpdate.save();
      }

      const populatedPurchase = await Purchase.findById(purchase._id)
        .populate('asset', 'assetName type')
        .populate('purchasedBy', 'name')
        .populate('base', 'name');

      res.status(201).json(populatedPurchase);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

module.exports = router;
