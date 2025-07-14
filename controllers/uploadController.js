
const cloudinaryService = require('../services/cloudinaryService');

class UploadController {
  async uploadDocuments(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }
      
      const uploadPromises = req.files.map(file => 
        cloudinaryService.uploadDocument(file)
      );
      
      const uploadResults = await Promise.allSettled(uploadPromises);
      
      const successful = [];
      const failed = [];
      
      uploadResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push({
            originalName: req.files[index].originalname,
            ...result.value
          });
        } else {
          failed.push({
            originalName: req.files[index].originalname,
            error: result.reason.message
          });
        }
      });
      
      res.json({
        success: true,
        message: `${successful.length} files uploaded successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
        data: {
          uploaded: successful,
          failed: failed
        }
      });
      
    } catch (error) {
      console.error('Error uploading documents:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload documents'
      });
    }
  }
  
  async deleteDocument(req, res) {
    try {
      const { publicId } = req.params;
      
      const result = await cloudinaryService.deleteDocument(publicId);
      
      if (result.result === 'ok') {
        res.json({
          success: true,
          message: 'Document deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }
      
    } catch (error) {
      console.error('Error deleting document:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete document'
      });
    }
  }
}

module.exports = new UploadController();
