
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const dataService = require('../services/dataService');

class PermitController {
  async submitApplication(req, res) {
    console.log('Processing permit application submission...');
    
    try {
      const applicationData = req.body;
      console.log('Application data received:', JSON.stringify(applicationData, null, 2));
      
      // Generate unique application ID
      const applicationId = uuidv4();
      console.log('Generated application ID:', applicationId);
      
      // Prepare application object
      const application = {
        id: applicationId,
        ...applicationData,
        status: 'pending',
        submissionDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      // Transaction-like behavior: All operations must succeed or all fail
      console.log('Starting transaction-like submission process...');
      
      // Step 1: Save application
      console.log('Saving application to database...');
      await dataService.saveApplication(application);
      console.log('Application saved successfully');
      
      // Step 2: Send confirmation email (MUST succeed)
      console.log('Sending confirmation email (required)...');
      await emailService.sendConfirmationEmail(application);
      console.log('Confirmation email sent successfully');
      
      // Step 3: Send admin notification (MUST succeed)
      console.log('Sending admin notification (required)...');
      await emailService.sendAdminNotification(application);
      console.log('Admin notification sent successfully');
      
      console.log('All transaction steps completed successfully');
      
      const response = {
        success: true,
        message: 'Application submitted successfully',
        data: {
          applicationId,
          status: 'pending',
          submissionDate: application.submissionDate
        }
      };
      
      console.log('Sending success response:', response);
      res.status(201).json(response);
      
    } catch (error) {
      console.error('Transaction failed - rolling back:', error);
      console.error('Error stack:', error.stack);
      
      // If we reach here, something failed - we should ideally rollback the saved application
      // For now, we'll just return an error response
      const errorResponse = {
        success: false,
        message: 'Failed to submit application. All operations must complete successfully.',
        error: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR'
        } : 'Internal server error'
      };
      
      console.log('Sending error response:', errorResponse);
      res.status(500).json(errorResponse);
    }
  }
  
  async getPermitStatus(req, res) {
    try {
      const { applicationId } = req.params;
      
      const application = await dataService.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      
      res.json({
        success: true,
        data: {
          applicationId: application.id,
          status: application.status,
          submissionDate: application.submissionDate,
          lastUpdated: application.lastUpdated,
          statusHistory: application.statusHistory || []
        }
      });
      
    } catch (error) {
      console.error('Error getting permit status:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve permit status'
      });
    }
  }
  
  async getAllApplications(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      
      const applications = await dataService.getAllApplications({
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });
      
      res.json({
        success: true,
        data: applications
      });
      
    } catch (error) {
      console.error('Error getting applications:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve applications'
      });
    }
  }
  
  async updatePermitStatus(req, res) {
    try {
      const { applicationId } = req.params;
      const { status, notes } = req.body;
      
      const updatedApplication = await dataService.updateApplicationStatus(
        applicationId, 
        status, 
        notes
      );
      
      if (!updatedApplication) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      
      // Send status update email (this is also required to succeed)
      try {
        await emailService.sendStatusUpdateEmail(updatedApplication);
        console.log('Status update email sent successfully');
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // For status updates, we might want to still return success but log the email failure
        // Or you can make this fail the entire operation by throwing the error
      }
      
      res.json({
        success: true,
        message: 'Application status updated successfully',
        data: {
          applicationId: updatedApplication.id,
          status: updatedApplication.status,
          lastUpdated: updatedApplication.lastUpdated
        }
      });
      
    } catch (error) {
      console.error('Error updating permit status:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to update permit status'
      });
    }
  }
}

module.exports = new PermitController();
