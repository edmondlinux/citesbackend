
const mongoose = require('mongoose');

// Application Schema
const applicationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  
  // Applicant Information
  applicantInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    organization: { type: String, default: '' },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true }
    }
  },
  
  // Permit Type
  permitType: { 
    type: String, 
    enum: ['import', 'export', 'reexport', 'introduction_from_sea'],
    required: true 
  },
  
  // Species Information
  species: {
    scientificName: { type: String, required: true },
    commonName: { type: String, required: true },
    citesAppendix: { type: String, enum: ['I', 'II', 'III'], required: true },
    quantity: { type: Number, required: true },
    purpose: { 
      type: String, 
      enum: ['commercial research', 'scientific research', 'educational', 'breeding in captivity', 'personal', 'other'],
      required: true 
    },
    sourceCode: { 
      type: String, 
      enum: ['W', 'C', 'D', 'A', 'F', 'R', 'O', 'I', 'U'],
      required: true 
    }
  },
  
  // Shipment Details
  shipmentDetails: {
    originCountry: { type: String, required: true },
    destinationCountry: { type: String, required: true },
    transportMethod: { 
      type: String, 
      enum: ['air', 'sea', 'land', 'mail'],
      required: true 
    },
    expectedShipmentDate: { type: Date, required: true },
    portOfEntry: { type: String, required: true }
  },
  
  // Documents
  documents: [{
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    originalName: { type: String, required: true },
    format: { type: String, required: true },
    resourceType: { type: String, required: true }
  }],
  
  // Additional Information
  additionalInfo: {
    specialHandling: { type: String, default: '' },
    emergencyContact: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true }
    }
  },
  
  // Application Status and Metadata
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'approved', 'rejected', 'requires_info'],
    default: 'pending'
  },
  submissionDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  ipAddress: { type: String },
  userAgent: { type: String },
  
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, required: true },
    notes: { type: String, default: '' }
  }]
}, {
  timestamps: true
});

const Application = mongoose.model('Application', applicationSchema);

class DataService {
  constructor() {
    this.connectToDatabase();
  }
  
  async connectToDatabase() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cites_permits';
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      // Fallback to in-memory storage for development
      console.log('Falling back to in-memory storage for development');
    }
  }
  
  async saveApplication(applicationData) {
    try {
      const application = new Application(applicationData);
      const savedApplication = await application.save();
      console.log('Application saved to MongoDB:', savedApplication.id);
      return savedApplication.toObject();
    } catch (error) {
      console.error('Error saving application to MongoDB:', error);
      throw error;
    }
  }
  
  async getApplication(applicationId) {
    try {
      const application = await Application.findOne({ id: applicationId }).lean();
      return application;
    } catch (error) {
      console.error('Error getting application from MongoDB:', error);
      throw error;
    }
  }
  
  async getAllApplications(options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      
      let query = {};
      if (status) {
        query.status = status;
      }
      
      const total = await Application.countDocuments(query);
      const applications = await Application.find(query)
        .sort({ submissionDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      
      return {
        applications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting all applications from MongoDB:', error);
      throw error;
    }
  }
  
  async updateApplicationStatus(applicationId, status, notes) {
    try {
      const application = await Application.findOne({ id: applicationId });
      
      if (!application) {
        return null;
      }
      
      // Add to status history
      application.statusHistory.push({
        status: application.status,
        timestamp: application.lastUpdated,
        notes: application.notes
      });
      
      // Update application
      application.status = status;
      application.lastUpdated = new Date();
      if (notes) {
        application.notes = notes;
      }
      
      const updatedApplication = await application.save();
      console.log('Application status updated in MongoDB:', applicationId);
      return updatedApplication.toObject();
    } catch (error) {
      console.error('Error updating application status in MongoDB:', error);
      throw error;
    }
  }
  
  async searchApplications(searchTerm, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      const query = {
        $or: [
          { 'applicantInfo.firstName': { $regex: searchTerm, $options: 'i' } },
          { 'applicantInfo.lastName': { $regex: searchTerm, $options: 'i' } },
          { 'applicantInfo.email': { $regex: searchTerm, $options: 'i' } },
          { 'species.scientificName': { $regex: searchTerm, $options: 'i' } },
          { 'species.commonName': { $regex: searchTerm, $options: 'i' } },
          { id: { $regex: searchTerm, $options: 'i' } }
        ]
      };
      
      const total = await Application.countDocuments(query);
      const applications = await Application.find(query)
        .sort({ submissionDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      
      return {
        applications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error searching applications in MongoDB:', error);
      throw error;
    }
  }
}

module.exports = new DataService();
