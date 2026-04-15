const express = require('express');
const Asset = require('../models/Asset');
const Purchase = require('../models/Purchase');
const Transfer = require('../models/Transfer');
const Assignment = require('../models/Assignment');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, async (req, res) => {
    try {
      let filter = {};
      // If Commander, restrict to their base
      if (req.user.role === 'commander' && req.user.base) {
        filter.base = req.user.base;
      }
      const assets = await Asset.find(filter).populate('base', 'name location');
      res.json(assets);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
  .post(protect, restrictTo('admin', 'commander'), async (req, res) => {
    try {
      const asset = await Asset.create(req.body);
      res.status(201).json(asset);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

module.exports = router;
