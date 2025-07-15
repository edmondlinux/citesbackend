
const mongoose = require('mongoose');

const permitSchema = new mongoose.Schema({
  // Applicant Information
  applicantInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    organization: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
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
      required: [true, 'Zip code is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    }
  },

  // Permit Information
  permitInfo: {
    permitType: {
      type: String,
      required: [true, 'Permit type is required'],
      enum: ['transportation', 'import', 'export', 're-export']
    }
  },

  // Species Information
  speciesInfo: {
    commonName: {
      type: String,
      required: [true, 'Common name is required'],
      trim: true
    },
    scientificName: {
      type: String,
      required: [true, 'Scientific name is required'],
      trim: true
    },
    citesAppendix: {
      type: String,
      required: [true, 'CITES Appendix is required'],
      enum: ['I', 'II', 'III']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
      enum: ['commercial research', 'scientific research', 'educational', 'breeding in captivity', 'personal', 'other']
    },
    sourceCode: {
      type: String,
      required: [true, 'Source code is required'],
      enum: ['WC', 'CB', 'R', 'O', 'I', 'U']
    },
    description: {
      type: String,
      trim: true
    }
  },

  // Source Information
  sourceInfo: {
    acquisitionDate: {
      type: Date,
      required: [true, 'Acquisition date is required']
    },
    sourceDetails: {
      type: String,
      trim: true
    }
  },

  // Transportation Information
  transportationInfo: {
    transportMethod: {
      type: String,
      trim: true
    },
    transportDate: {
      type: Date
    },
    originAddress: {
      type: String,
      trim: true
    },
    destinationAddress: {
      type: String,
      trim: true
    },
    expectedShipmentDate: {
      type: Date
    },
    portOfEntry: {
      type: String,
      trim: true
    }
  },

  // Document Information
  documents: [{
    url: {
      type: String, // Cloudinary URL
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Application Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },

  // Application Tracking
  applicationNumber: {
    type: String,
    unique: true
  },

  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate application number before saving
permitSchema.pre('save', function(next) {
  if (this.isNew && !this.applicationNumber) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.applicationNumber = `CITES-${timestamp}-${random}`.toUpperCase();
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Permit', permitSchema);
