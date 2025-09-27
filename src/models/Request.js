const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Request:
 *       type: object
 *       required:
 *         - requester
 *         - book
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated request ID
 *         requester:
 *           type: string
 *           description: User ID of the person making the request
 *         book:
 *           type: string
 *           description: Book ID being requested
 *         owner:
 *           type: string
 *           description: User ID of the book owner
 *         type:
 *           type: string
 *           enum: [free, exchange]
 *           description: Type of request - free or exchange
 *         status:
 *           type: string
 *           enum: [pending, accepted, completed]
 *           default: pending
 *           description: Current status of the request
 *         offeredBooks:
 *           type: string
 *           description: Book ID offered in exchange (for exchange type only)
 *         rating:
 *           type: object
 *           properties:
 *             requesterRating:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               description: Rating given by the requester
 *             ownerRating:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               description: Rating given by the owner
 *             requesterReview:
 *               type: string
 *               maxLength: 500
 *               description: Review text from requester
 *             ownerReview:
 *               type: string
 *               maxLength: 500
 *               description: Review text from owner
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Date when request was completed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const requestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book is required']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Book owner is required']
  },
  type: {
    type: String,
    required: [true, 'Request type is required'],
    enum: ['free', 'exchange']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed'],
    default: 'pending'
  },
  offeredBooks: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  rating: {
    requesterRating: {
      type: Number,
      min: 1,
      max: 5
    },
    ownerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    requesterReview: {
      type: String,
      maxlength: 500
    },
    ownerReview: {
      type: String,
      maxlength: 500
    }
  },
  completedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
requestSchema.index({ requester: 1, status: 1 });
requestSchema.index({ owner: 1, status: 1 });
requestSchema.index({ book: 1, status: 1 });
requestSchema.index({ status: 1, createdAt: -1 });

// Prevent duplicate pending requests
requestSchema.index(
  { requester: 1, book: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

// Pre-save middleware to set owner from book
requestSchema.pre('save', async function(next) {
  if (this.isNew && !this.owner) {
    const Book = mongoose.model('Book');
    const book = await Book.findById(this.book);
    if (book) {
      this.owner = book.owner;
    }
  }
  next();
});

// Method to check if request can be cancelled
requestSchema.methods.canBeCancelled = function() {
  return ['pending', 'accepted'].includes(this.status);
};

// Method to check if request can be rated
requestSchema.methods.canBeRated = function() {
  return this.status === 'completed';
};

module.exports = mongoose.model('Request', requestSchema);