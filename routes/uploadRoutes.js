
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { uploadMiddleware } = require('../middleware/upload');

// Upload documents
router.post('/documents', uploadMiddleware, uploadController.uploadDocuments);

// Delete uploaded document
router.delete('/documents/:publicId', uploadController.deleteDocument);

module.exports = router;
