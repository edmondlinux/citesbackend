
const Joi = require('joi');

const permitApplicationSchema = Joi.object({
  applicantInfo: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[\+\-\s\(\)\d]+$/).min(10).max(20).required(),
    organization: Joi.string().trim().min(2).max(100).allow(''),
    address: Joi.object({
      street: Joi.string().trim().min(5).max(200).required(),
      city: Joi.string().trim().min(2).max(50).required(),
      state: Joi.string().trim().min(2).max(50).required(),
      zipCode: Joi.string().trim().min(3).max(10).required(),
      country: Joi.string().trim().min(2).max(50).required()
    }).required()
  }).required(),

  permitType: Joi.string().valid(
    'import', 
    'export', 
    'reexport', 
    'introduction_from_sea'
  ).required(),

  species: Joi.object({
    scientificName: Joi.string().trim().min(2).max(100).required(),
    commonName: Joi.string().trim().min(2).max(100).required(),
    citesAppendix: Joi.string().valid('I', 'II', 'III').required(),
    quantity: Joi.number().integer().min(1).max(1000).required(),
    purpose: Joi.string().valid(
      'commercial research', 
      'scientific research', 
      'educational', 
      'breeding in captivity', 
      'personal', 
      'other'
    ).required(),
    sourceCode: Joi.string().valid('W', 'C', 'D', 'A', 'F', 'R', 'O', 'I', 'U').required()
  }).required(),

  shipmentDetails: Joi.object({
    originCountry: Joi.string().trim().min(2).max(50).required(),
    destinationCountry: Joi.string().trim().min(2).max(50).required(),
    transportMethod: Joi.string().valid('air', 'sea', 'land', 'mail').required(),
    expectedShipmentDate: Joi.date().min('now').required(),
    portOfEntry: Joi.string().trim().min(2).max(100).required()
  }).required(),

  documents: Joi.array().items(
    Joi.object({
      publicId: Joi.string().required(),
      secureUrl: Joi.string().uri().required(),
      originalName: Joi.string().required(),
      format: Joi.string().required(),
      resourceType: Joi.string().required()
    })
  ).min(1).required(),

  additionalInfo: Joi.object({
    specialHandling: Joi.string().trim().max(500).allow(''),
    emergencyContact: Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      phone: Joi.string().pattern(/^[\+\-\s\(\)\d]+$/).min(10).max(20).required(),
      email: Joi.string().email().required()
    }).required()
  }).allow(null)
});

const validatePermitApplication = (req, res, next) => {
  const { error, value } = permitApplicationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body = value;
  next();
};

module.exports = {
  validatePermitApplication
};
