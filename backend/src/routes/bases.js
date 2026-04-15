const express = require('express');
const Base = require('../models/Base');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, async (req, res) => {
    try {
      const bases = await Base.find({});
      res.json(bases);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
  .post(protect, restrictTo('admin'), async (req, res) => {
    try {
      const base = await Base.create(req.body);
      res.status(201).json(base);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

module.exports = router;
