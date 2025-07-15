
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  submitPermitApplication,
  getPermitById,
  getAllPermits,
  updatePermitStatus
} = require('../controllers/permitController');

// @route   POST /api/permits/apply
// @desc    Submit permit application
// @access  Public
router.post('/apply', upload.array('documents', 10), submitPermitApplication);

// @route   GET /api/permits/:id
// @desc    Get permit by ID
// @access  Public (in real app, this would be protected)
router.get('/:id', getPermitById);

// @route   GET /api/permits
// @desc    Get all permits (admin only in real app)
// @access  Public (in real app, this would be protected)
router.get('/', getAllPermits);

// @route   PUT /api/permits/:id/status
// @desc    Update permit status (admin only in real app)
// @access  Public (in real app, this would be protected)
router.put('/:id/status', updatePermitStatus);

module.exports = router;
