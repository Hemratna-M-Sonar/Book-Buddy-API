const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - owner
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated book ID
 *         title:
 *           type: string
 *           description: Book title
 *         author:
 *           type: string
 *           description: Book author
 *         isbn:
 *           type: string
 *           description: ISBN number
 *         genre:
 *           type: string
 *           enum: [Fiction, Non-Fiction, Mystery, Romance, Sci-Fi, Fantasy, Biography, History, Self-Help, Technical, Other]
 *         language:
 *           type: string
 *           default: English
 *         condition:
 *           type: string
 *           enum: [New, Like New, Very Good, Good, Fair, Poor]
 *           default: Good
 *         ageGroup:
 *           type: string
 *           enum: [0-3, 4-6, 7-10, 11-14, 15-18, 18+]
 *           default: 18+
 *           description: Target age group for the book
 *         description:
 *           type: string
 *           description: Book description
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs
 *         owner:
 *           type: string
 *           description: User ID of the book owner
 *         availabilityType:
 *           type: string
 *           enum: [Free, Exchange]
 *           default: Exchange
 *           description: Type of availability - Free or Exchange
 *         status:
 *           type: string
 *           enum: [Available, Not Available]
 *           default: Available
 *           description: Current availability status
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         rating:
 *           type: object
 *           properties:
 *             average:
 *               type: number
 *               minimum: 0
 *               maximum: 5
 *             count:
 *               type: number
 *         isActive:
 *           type: boolean
 *           default: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  isbn: {
    type: String,
    trim: true,
    match: [/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Please enter a valid ISBN']
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    enum: ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Biography', 'History', 'Self-Help', 'Technical', 'Other']
  },
  language: {
    type: String,
    default: 'English'
  },
  condition: {
    type: String,
    required: [true, 'Book condition is required'],
    enum: ['New', 'Like New', 'Very Good', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  ageGroup: {
    type: String,
    enum: ['0-3', '4-6', '7-10', '11-14', '15-18', '18+'],
    default: '18+'
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  images: [{
    type: String
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Book owner is required']
  },
  availabilityType: {
    type: String,
    enum: ['Free', 'Exchange'],
    default: 'Exchange'
  },
  status: {
    type: String,
    enum: ['Available', 'Not Available'],
    default: 'Available'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ genre: 1, status: 1 });
bookSchema.index({ owner: 1 });
bookSchema.index({ status: 1, isActive: 1 });

// Virtual for requests
bookSchema.virtual('requests', {
  ref: 'Request',
  localField: '_id',
  foreignField: 'book'
});

// Update rating method
bookSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

module.exports = mongoose.model('Book', bookSchema);