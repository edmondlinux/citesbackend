
const express = require('express');
const router = express.Router();
const permitController = require('../controllers/permitController');
const { validatePermitApplication } = require('../middleware/validation');

// Submit permit application
router.post('/apply', validatePermitApplication, permitController.submitApplication);

// Get permit status
router.get('/:applicationId/status', permitController.getPermitStatus);

// Get all applications (admin)
router.get('/all', permitController.getAllApplications);

// Update permit status (admin)
router.patch('/:applicationId/status', permitController.updatePermitStatus);

module.exports = router;
