const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendConfirmationEmail(application) {
    if (!process.env.SMTP_USER || !application.applicantInfo.email) {
      const error = new Error('Email not configured or recipient email missing');
      error.code = 'EMAIL_CONFIG_ERROR';
      throw error;
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: application.applicantInfo.email,
      subject: 'CITES Permit Application Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">CITES Permit Application Received</h2>

          <p>Dear ${application.applicantInfo.firstName} ${application.applicantInfo.lastName},</p>

          <p>We have successfully received your CITES permit application. Here are the details:</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong>Application Details:</strong><br>
            Application ID: <strong>${application.id}</strong><br>
            Permit Type: <strong>${application.permitType}</strong><br>
            Species: <strong>${application.species.commonName} (${application.species.scientificName})</strong><br>
            CITES Appendix: <strong>${application.species.citesAppendix}</strong><br>
            Quantity: <strong>${application.species.quantity}</strong><br>
            Purpose: <strong>${application.species.purpose}</strong><br>
            Origin: <strong>${application.shipmentDetails.originCountry}</strong><br>
            Destination: <strong>${application.shipmentDetails.destinationCountry}</strong><br>
            Expected Shipment Date: <strong>${new Date(application.shipmentDetails.expectedShipmentDate).toLocaleDateString()}</strong><br>
            Submission Date: <strong>${new Date(application.submissionDate).toLocaleString()}</strong>
          </div>

          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Your application will be reviewed by our specialists</li>
            <li>Processing typically takes 5-10 business days</li>
            <li>You will receive email updates on status changes</li>
            <li>Keep your Application ID for reference</li>
          </ul>

          <p>Your application is currently being reviewed. You will receive updates as the status changes.</p>

          <p>If you have any questions, please contact us with your application ID: <strong>${application.id}</strong></p>

          <p>Best regards,<br>CITES Permit Division</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Confirmation email sent successfully');
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      throw error;
    }
  }

  async sendAdminNotification(application) {
    if (!process.env.SMTP_USER || !process.env.ADMIN_EMAIL) {
      const error = new Error('Admin email not configured');
      error.code = 'ADMIN_EMAIL_CONFIG_ERROR';
      throw error;
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New CITES Permit Application Submitted',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">New CITES Permit Application</h2>

          <p>A new CITES permit application has been submitted and requires review:</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong>Application Details:</strong><br>
            Application ID: <strong>${application.id}</strong><br>
            Applicant: <strong>${application.applicantInfo.firstName} ${application.applicantInfo.lastName}</strong><br>
            Organization: <strong>${application.applicantInfo.organization || 'N/A'}</strong><br>
            Email: <strong>${application.applicantInfo.email}</strong><br>
            Phone: <strong>${application.applicantInfo.phone}</strong><br>
            Address: <strong>${application.applicantInfo.address.street}, ${application.applicantInfo.address.city}, ${application.applicantInfo.address.state} ${application.applicantInfo.address.zipCode}, ${application.applicantInfo.address.country}</strong><br><br>

            <strong>Permit Details:</strong><br>
            Permit Type: <strong>${application.permitType}</strong><br>
            Species: <strong>${application.species.commonName} (${application.species.scientificName})</strong><br>
            CITES Appendix: <strong>${application.species.citesAppendix}</strong><br>
            Quantity: <strong>${application.species.quantity}</strong><br>
            Purpose: <strong>${application.species.purpose}</strong><br>
            Source Code: <strong>${application.species.sourceCode}</strong><br><br>

            <strong>Shipment Details:</strong><br>
            Origin: <strong>${application.shipmentDetails.originCountry}</strong><br>
            Destination: <strong>${application.shipmentDetails.destinationCountry}</strong><br>
            Transport Method: <strong>${application.shipmentDetails.transportMethod}</strong><br>
            Expected Date: <strong>${new Date(application.shipmentDetails.expectedShipmentDate).toLocaleDateString()}</strong><br>
            Port of Entry: <strong>${application.shipmentDetails.portOfEntry}</strong><br><br>

            <strong>Emergency Contact:</strong><br>
            Name: <strong>${application.additionalInfo?.emergencyContact?.name || 'N/A'}</strong><br>
            Phone: <strong>${application.additionalInfo?.emergencyContact?.phone || 'N/A'}</strong><br>
            Email: <strong>${application.additionalInfo?.emergencyContact?.email || 'N/A'}</strong><br><br>

            Documents Submitted: <strong>${application.documents?.length || 0}</strong><br>
            Special Handling: <strong>${application.additionalInfo?.specialHandling || 'None'}</strong><br>
            Submission Date: <strong>${new Date(application.submissionDate).toLocaleString()}</strong>
          </div>

          <p>Please review and process this application in the admin portal.</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Admin notification sent successfully');
    } catch (error) {
      console.error('Failed to send admin notification:', error);
      throw error;
    }
  }

  async sendStatusUpdateEmail(application) {
    if (!process.env.SMTP_USER || !application.applicantInfo.email) {
      const error = new Error('Email not configured or recipient email missing');
      error.code = 'EMAIL_CONFIG_ERROR';
      throw error;
    }

    const statusMessages = {
      pending: 'Your application is being reviewed.',
      under_review: 'Your application is currently under detailed review.',
      approved: 'Congratulations! Your permit has been approved.',
      rejected: 'Unfortunately, your application has been rejected.',
      requires_info: 'Additional information is required for your application.'
    };

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: application.applicantInfo.email,
      subject: `CITES Permit Application Status Update - ${application.status.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Application Status Update</h2>

          <p>Dear ${application.applicantInfo.firstName} ${application.applicantInfo.lastName},</p>

          <p>There has been an update to your CITES permit application status.</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong>Application Details:</strong><br>
            Application ID: <strong>${application.id}</strong><br>
            Current Status: <strong style="color: #dc2626;">${application.status.toUpperCase()}</strong><br>
            Species: <strong>${application.species.commonName} (${application.species.scientificName})</strong><br>
            Last Updated: <strong>${new Date(application.lastUpdated).toLocaleString()}</strong>
          </div>

          <p><strong>Status Message:</strong> ${statusMessages[application.status]}</p>

          ${application.notes ? `<p><strong>Additional Notes:</strong> ${application.notes}</p>` : ''}

          ${application.status === 'approved' ? 
            '<p><strong>Next Steps:</strong> Your permit documents will be sent to you separately.</p>' : 
            ''
          }

          <p>If you have any questions about this update, please contact us with your application ID: <strong>${application.id}</strong></p>

          <p>Best regards,<br>CITES Permit Division</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Status update email sent successfully');
    } catch (error) {
      console.error('Failed to send status update email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();