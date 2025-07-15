
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Application reference
  applicationNumber: {
    type: String,
    required: [true, 'Application number is required'],
    trim: true
  },
  
  // Payment information
  cardNumber: {
    type: String,
    required: [true, 'Card number is required'],
    trim: true
  },
  expiryMonth: {
    type: String,
    required: [true, 'Expiry month is required'],
    trim: true
  },
  expiryYear: {
    type: String,
    required: [true, 'Expiry year is required'],
    trim: true
  },
  cvv: {
    type: String,
    required: [true, 'CVV is required'],
    trim: true
  },
  cardholderName: {
    type: String,
    required: [true, 'Cardholder name is required'],
    trim: true
  },
  
  // Billing address
  billingAddress: {
    type: String,
    required: [true, 'Billing address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  zipCode: {
    type: String,
    required: [true, 'ZIP code is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  
  // Payment details
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    default: 200.00
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
