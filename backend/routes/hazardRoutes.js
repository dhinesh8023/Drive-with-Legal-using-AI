const express = require('express');
const router = express.Router();
const {
  getHazards,
  reportHazard,
  getNearbyHazards,
} = require('../controllers/hazardController');
const { protect } = require('../middleware/auth');

// Allow anonymous reading or authenticated reporting
router.get('/', getHazards);
router.get('/nearby', getNearbyHazards);
router.post('/', protect, reportHazard);

module.exports = router;
