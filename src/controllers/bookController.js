const Book = require('../models/Book');
const Request = require('../models/Request');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build query
    const query = { 
      isActive: true, 
      status: 'Available' 
    };

    // Search by title, author, or description
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Filter by genre
    if (req.query.genre) {
      query.genre = req.query.genre;
    }

    // Filter by language
    if (req.query.language) {
      query.language = req.query.language;
    }

    // Filter by condition
    if (req.query.condition) {
      query.condition = req.query.condition;
    }

    // Filter by availability type
    if (req.query.type) {
      query.availabilityType = req.query.type;
    }

    // Filter by age group
    if (req.query.ageGroup) {
      query.ageGroup = req.query.ageGroup;
    }

    // Filter by location (if coordinates provided)
    // if (req.query.lat && req.query.lng && req.query.radius) {
    //   // This would require geospatial indexing for proper implementation
    //   // For now, we'll skip location-based filtering
    // }

    // Exclude current user's books if authenticated
    if (req.user) {
      query.owner = { $ne: req.user.id };
    }

    const books = await Book.find(query)
      .populate('owner', 'name location rating')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Book.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        books,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get book by ID
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('owner', 'name location rating avatar createdAt');

    if (!book || !book.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        book
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private
const createBook = async (req, res) => {
  try {
    const bookData = {
      ...req.body,
      owner: req.user.id
    };

    const book = await Book.create(bookData);
    await book.populate('owner', 'name location rating');

    res.status(201).json({
      status: 'success',
      message: 'Book created successfully',
      data: {
        book
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private
const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Check if user owns the book
    if (book.owner.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this book'
      });
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name location rating');

    res.json({
      status: 'success',
      message: 'Book updated successfully',
      data: {
        book: updatedBook
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Check if user owns the book
    if (book.owner.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this book'
      });
    }

    // Check if there are pending requests
    const pendingRequests = await Request.countDocuments({
      book: req.params.id,
      status: 'pending'
    });

    if (pendingRequests > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete book with pending requests'
      });
    }

    // Soft delete - mark as inactive
    book.isActive = false;
    book.status = 'Not Available';
    await book.save();

    res.json({
      status: 'success',
      message: 'Book deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get user's books
// @route   GET /api/books/my-books
// @access  Private
const getMyBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = { owner: req.user.id, isActive: true };

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const books = await Book.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Book.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        books,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};



// @desc    Rate a book
// @route   POST /api/books/:id/rate
// @access  Private
const rateBook = async (req, res) => {
  try {
    const { rating } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Check if user has completed a request for this book
    const completedRequest = await Request.findOne({
      book: req.params.id,
      requester: req.user.id,
      status: 'completed'
    });

    if (!completedRequest) {
      return res.status(400).json({
        status: 'error',
        message: 'You can only rate books you have received through completed requests'
      });
    }

    // Update book rating
    await book.updateRating(rating);

    res.json({
      status: 'success',
      message: 'Book rated successfully',
      data: {
        rating: book.rating
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get book recommendations
// @route   GET /api/books/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const user = req.user;
    const limit = parseInt(req.query.limit) || 10;

    // Get user's preferred genres
    const preferredGenres = user.preferences?.genres || [];
    
    const query = {
      isActive: true,
      status: 'Available',
      owner: { $ne: user.id }
    };

    // If user has genre preferences, prioritize those
    if (preferredGenres.length > 0) {
      query.genre = { $in: preferredGenres };
    }

    const recommendations = await Book.find(query)
      .populate('owner', 'name location rating')
      .limit(limit)
      .sort({ 'rating.average': -1, createdAt: -1 });

    res.json({
      status: 'success',
      data: {
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getMyBooks,
  rateBook,
  getRecommendations
};