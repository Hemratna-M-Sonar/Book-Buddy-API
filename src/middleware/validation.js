const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user', 'admin').default('user'),
  location: Joi.object({
    address: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90),
      lng: Joi.number().min(-180).max(180)
    })
  }),
  preferences: Joi.object({
    genres: Joi.array().items(Joi.string().valid('Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Technical', 'Other')),
    languages: Joi.array().items(Joi.string()),
    exchangeRadius: Joi.number().min(1).max(100)
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  location: Joi.object({
    address: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90),
      lng: Joi.number().min(-180).max(180)
    })
  }),
  preferences: Joi.object({
    genres: Joi.array().items(Joi.string().valid('Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Technical', 'Other')),
    languages: Joi.array().items(Joi.string()),
    exchangeRadius: Joi.number().min(1).max(100)
  })
});

// Book validation schemas
const createBookSchema = Joi.object({
  title: Joi.string().max(200).required(),
  author: Joi.string().max(100).required(),
  isbn: Joi.string().pattern(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/),
  genre: Joi.string().valid('Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Technical', 'Other').required(),
  language: Joi.string().default('English'),
  condition: Joi.string().valid('New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor').required(),
  ageGroup: Joi.string().valid('0-3', '4-6', '7-10', '11-14', '15-18', '18+').default('18+'),
  description: Joi.string().max(1000),
  availabilityType: Joi.string().valid('Free', 'Exchange').default('Exchange'),
  status: Joi.string().valid('Available', 'Not Available').default('Available'),
  tags: Joi.array().items(Joi.string())
});

const updateBookSchema = Joi.object({
  title: Joi.string().max(200),
  author: Joi.string().max(100),
  isbn: Joi.string().pattern(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/),
  genre: Joi.string().valid('Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Technical', 'Other'),
  language: Joi.string(),
  condition: Joi.string().valid('New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor'),
  ageGroup: Joi.string().valid('0-3', '4-6', '7-10', '11-14', '15-18', '18+'),
  description: Joi.string().max(1000),
  availabilityType: Joi.string().valid('Free', 'Exchange'),
  status: Joi.string().valid('Available', 'Not Available'),
  tags: Joi.array().items(Joi.string())
});

// Request validation schemas
const createRequestSchema = Joi.object({
  book: Joi.string().required(),
  type: Joi.string().valid('free', 'exchange').required(),
  offeredBooks: Joi.string()
});

const updateRequestSchema = Joi.object({
  status: Joi.string().valid('accepted', 'completed')
});

const rateRequestSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  review: Joi.string().max(500)
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    next();
  };
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  createBookSchema,
  updateBookSchema,
  createRequestSchema,
  updateRequestSchema,
  rateRequestSchema
};