
const Permit = require('../models/Permit');
const cloudinary = require('../config/cloudinary');
const sendEmail = require('../utils/emailService');

// @desc    Submit permit application
// @route   POST /api/permits/apply
// @access  Public
const submitPermitApplication = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, organization, address, city, state, zipCode, country,
      permitType,
      commonName, scientificName, citesAppendix, quantity, purpose, sourceCode, description,
      acquisitionDate, sourceDetails,
      transportMethod, transportDate, originAddress, destinationAddress, expectedShipmentDate, portOfEntry
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !address || !city || !state || !zipCode || !country) {
      return res.status(400).json({
        success: false,
        message: 'Missing required applicant information'
      });
    }

    if (!permitType) {
      return res.status(400).json({
        success: false,
        message: 'Permit type is required'
      });
    }

    if (!commonName || !scientificName || !citesAppendix || !quantity || !purpose || !sourceCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required species information'
      });
    }

    if (!acquisitionDate) {
      return res.status(400).json({
        success: false,
        message: 'Acquisition date is required'
      });
    }

    // Handle multiple document uploads to Cloudinary
    let documentsInfo = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'cites-permits',
            resource_type: 'auto'
          });
          
          documentsInfo.push({
            url: result.secure_url,
            originalName: file.originalname,
            uploadedAt: new Date()
          });
        }
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload documents'
        });
      }
    }

    // Create permit application
    const permitData = {
      applicantInfo: {
        firstName,
        lastName,
        email,
        phone,
        organization,
        address,
        city,
        state,
        zipCode,
        country
      },
      permitInfo: {
        permitType
      },
      speciesInfo: {
        commonName,
        scientificName,
        citesAppendix,
        quantity: parseInt(quantity),
        purpose,
        sourceCode,
        description
      },
      sourceInfo: {
        acquisitionDate: new Date(acquisitionDate),
        sourceDetails
      },
      transportationInfo: {
        transportMethod,
        transportDate: transportDate ? new Date(transportDate) : null,
        originAddress,
        destinationAddress,
        expectedShipmentDate: expectedShipmentDate ? new Date(expectedShipmentDate) : null,
        portOfEntry
      }
    };

    if (documentsInfo.length > 0) {
      permitData.documents = documentsInfo;
    }

    const permit = new Permit(permitData);
    await permit.save();

    // Send email notifications
    try {
      // Send confirmation email to applicant
      const applicantEmailHtml = `
        <h2>CITES Permit Application Confirmation</h2>
        <p>Dear ${firstName} ${lastName},</p>
        <p>Thank you for submitting your CITES permit application. Your application has been received and is being processed.</p>
        
        <h3>Application Details:</h3>
        <ul>
          <li><strong>Application Number:</strong> ${permit.applicationNumber}</li>
          <li><strong>Permit Type:</strong> ${permitType}</li>
          <li><strong>Species:</strong> ${commonName} (${scientificName})</li>
          <li><strong>Quantity:</strong> ${quantity}</li>
          <li><strong>Status:</strong> Pending Review</li>
          <li><strong>Submitted:</strong> ${permit.submittedAt.toLocaleDateString()}</li>
        </ul>
        
        <p>You will receive updates on your application status via email. Processing typically takes 5-10 business days.</p>
        
        <p>If you have any questions, please contact us with your application number: ${permit.applicationNumber}</p>
        
        <p>Best regards,<br>CITES Permit Office</p>
      `;

      await sendEmail(
        email,
        'CITES Permit Application Confirmation',
        applicantEmailHtml
      );

      // Send notification email to admin
      const adminEmailHtml = `
        <h2>New CITES Permit Application Received</h2>
        
        <h3>Application Details:</h3>
        <ul>
          <li><strong>Application Number:</strong> ${permit.applicationNumber}</li>
          <li><strong>Applicant:</strong> ${firstName} ${lastName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Organization:</strong> ${organization || 'N/A'}</li>
          <li><strong>Permit Type:</strong> ${permitType}</li>
          <li><strong>Species:</strong> ${commonName} (${scientificName})</li>
          <li><strong>CITES Appendix:</strong> ${citesAppendix}</li>
          <li><strong>Quantity:</strong> ${quantity}</li>
          <li><strong>Purpose:</strong> ${purpose}</li>
          <li><strong>Source Code:</strong> ${sourceCode}</li>
          <li><strong>Submitted:</strong> ${permit.submittedAt.toLocaleString()}</li>
        </ul>
        
        <h3>Contact Information:</h3>
        <p>
          ${address}<br>
          ${city}, ${state} ${zipCode}<br>
          ${country}
        </p>
        
        ${documentsInfo.length > 0 ? 
          `<p><strong>Documents (${documentsInfo.length}):</strong></p>
           <ul>
             ${documentsInfo.map((doc, index) => 
               `<li><a href="${doc.url}">${doc.originalName}</a></li>`
             ).join('')}
           </ul>` : 
          '<p><strong>Documents:</strong> No documents uploaded</p>'
        }
        
        <p>Please review and process this application promptly.</p>
      `;

      await sendEmail(
        process.env.ADMIN_EMAIL,
        `New CITES Permit Application - ${permit.applicationNumber}`,
        adminEmailHtml
      );

    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the application if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Permit application submitted successfully',
      data: {
        applicationNumber: permit.applicationNumber,
        status: permit.status,
        submittedAt: permit.submittedAt
      }
    });

  } catch (error) {
    console.error('Permit submission error:', error);
    
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
      message: 'Internal server error while processing application'
    });
  }
};

// @desc    Get permit by ID
// @route   GET /api/permits/:id
// @access  Public (should be protected in production)
const getPermitById = async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id);
    
    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Permit application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: permit
    });
  } catch (error) {
    console.error('Get permit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving permit application'
    });
  }
};

// @desc    Get all permits
// @route   GET /api/permits
// @access  Public (should be admin only in production)
const getAllPermits = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, permitType } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (permitType) query['permitInfo.permitType'] = permitType;

    const permits = await Permit.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Permit.countDocuments(query);

    res.status(200).json({
      success: true,
      data: permits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get permits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving permit applications'
    });
  }
};

// @desc    Update permit status
// @route   PUT /api/permits/:id/status
// @access  Public (should be admin only in production)
const updatePermitStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const permit = await Permit.findByIdAndUpdate(
      req.params.id,
      { status, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!permit) {
      return res.status(404).json({
        success: false,
        message: 'Permit application not found'
      });
    }

    // Send status update email to applicant
    try {
      const statusEmailHtml = `
        <h2>CITES Permit Application Status Update</h2>
        <p>Dear ${permit.applicantInfo.firstName} ${permit.applicantInfo.lastName},</p>
        <p>Your CITES permit application status has been updated.</p>
        
        <h3>Application Details:</h3>
        <ul>
          <li><strong>Application Number:</strong> ${permit.applicationNumber}</li>
          <li><strong>New Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</li>
          <li><strong>Updated:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        
        ${status === 'approved' ? 
          '<p style="color: green;"><strong>Congratulations! Your permit has been approved.</strong></p>' :
          status === 'rejected' ?
          '<p style="color: red;"><strong>Unfortunately, your permit application has been rejected. Please contact us for more information.</strong></p>' :
          '<p>Your application is currently under review. We will notify you of any further updates.</p>'
        }
        
        <p>If you have any questions, please contact us with your application number: ${permit.applicationNumber}</p>
        
        <p>Best regards,<br>CITES Permit Office</p>
      `;

      await sendEmail(
        permit.applicantInfo.email,
        `CITES Permit Status Update - ${permit.applicationNumber}`,
        statusEmailHtml
      );
    } catch (emailError) {
      console.error('Status update email error:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Permit status updated successfully',
      data: permit
    });
  } catch (error) {
    console.error('Update permit status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permit status'
    });
  }
};

module.exports = {
  submitPermitApplication,
  getPermitById,
  getAllPermits,
  updatePermitStatus
};
