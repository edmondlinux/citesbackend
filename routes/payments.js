
const express = require('express');
const router = express.Router();
const {
  processPayment,
  getPaymentById,
  getPaymentsByApplication
} = require('../controllers/paymentController');

// @route   POST /api/payments/process
// @desc    Process payment
// @access  Public
router.post('/process', processPayment);

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Public (in real app, this would be protected)
router.get('/:id', getPaymentById);

// @route   GET /api/payments/application/:applicationNumber
// @desc    Get payments by application number
// @access  Public (in real app, this would be protected)
router.get('/application/:applicationNumber', getPaymentsByApplication);

module.exports = router;
