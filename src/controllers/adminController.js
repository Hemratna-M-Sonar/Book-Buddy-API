const User = require('../models/User');
const Book = require('../models/Book');
const Request = require('../models/Request');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalBooks = await Book.countDocuments();
    const availableBooks = await Book.countDocuments({ 
      'availability.status': 'available', 
      isActive: true 
    });
    const totalRequests = await Request.countDocuments();
    const pendingRequests = await Request.countDocuments({ status: 'pending' });
    const completedRequests = await Request.countDocuments({ status: 'completed' });

    // Get recent activity
    const recentUsers = await User.find({ isActive: true })
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentBooks = await Book.find({ isActive: true })
      .populate('owner', 'name email')
      .select('title author owner createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentRequests = await Request.find()
      .populate('requester', 'name email')
      .populate('owner', 'name email')
      .populate('book', 'title author')
      .select('requester owner book type status createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get monthly statistics
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

    const thisMonthUsers = await User.countDocuments({
      createdAt: { $gte: currentMonth }
    });

    const thisMonthBooks = await Book.countDocuments({
      createdAt: { $gte: currentMonth }
    });

    const thisMonthRequests = await Request.countDocuments({
      createdAt: { $gte: currentMonth }
    });

    res.json({
      status: 'success',
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalBooks,
          availableBooks,
          totalRequests,
          pendingRequests,
          completedRequests
        },
        monthlyStats: {
          thisMonthUsers,
          thisMonthBooks,
          thisMonthRequests
        },
        recentActivity: {
          users: recentUsers,
          books: recentBooks,
          requests: recentRequests
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

// @desc    Get all users (admin view)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    
    // Search by name or email
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Filter by status
    if (req.query.status) {
      query.isActive = req.query.status === 'active';
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        users,
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

// @desc    Update user status or role
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const userId = req.params.id;

    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Soft delete - deactivate user and cancel their requests
    await User.findByIdAndUpdate(userId, { isActive: false });
    
    // Cancel all pending requests
    await Request.updateMany(
      {
        $or: [{ requester: userId }, { owner: userId }],
        status: 'pending'
      },
      { status: 'cancelled' }
    );

    // Mark all books as unavailable
    await Book.updateMany(
      { owner: userId },
      { 'availability.status': 'unavailable', isActive: false }
    );

    res.json({
      status: 'success',
      message: 'User deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all books (admin view)
// @route   GET /api/admin/books
// @access  Private/Admin
const getAllBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    
    // Search by title or author
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { author: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (req.query.status) {
      if (req.query.status === 'Available') {
        query.status = 'Available';
      } else if (req.query.status === 'Not Available') {
        query.status = 'Not Available';
      }
    }

    // Filter by availability
    if (req.query.availabilityType) {
      query.availabilityType = req.query.availabilityType;
    }

    const books = await Book.find(query)
      .populate('owner', 'name email')
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

// @desc    Update book status (admin)
// @route   PUT /api/admin/books/:id
// @access  Private/Admin
const updateBook = async (req, res) => {
  try {
    const { isActive, availability } = req.body;
    const bookId = req.params.id;

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (availability !== undefined) updateData.availability = availability;

    const book = await Book.findByIdAndUpdate(
      bookId,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Book updated successfully',
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

// @desc    Delete book (admin)
// @route   DELETE /api/admin/books/:id
// @access  Private/Admin
const deleteBook = async (req, res) => {
  try {
    const bookId = req.params.id;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Cancel all pending requests for this book
    await Request.updateMany(
      { book: bookId, status: 'pending' },
      { status: 'cancelled' }
    );

    // Soft delete - mark as inactive
    book.isActive = false;
    book.availability.status = 'unavailable';
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

// @desc    Get all requests (admin view)
// @route   GET /api/admin/requests
// @access  Private/Admin
const getAllRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    const requests = await Request.find(query)
      .populate('requester', 'name email')
      .populate('owner', 'name email')
      .populate('book', 'title author')
      .populate('offeredBooks', 'title author')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Request.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        requests,
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

// @desc    Update request status (admin)
// @route   PUT /api/admin/requests/:id
// @access  Private/Admin
const updateRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = req.params.id;

    const request = await Request.findByIdAndUpdate(
      requestId,
      { status },
      { new: true, runValidators: true }
    ).populate([
      { path: 'requester', select: 'name email' },
      { path: 'owner', select: 'name email' },
      { path: 'book', select: 'title author' }
    ]);

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Request not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Request updated successfully',
      data: {
        request
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create admin user
// @route   POST /api/admin/create-admin
// @access  Private/Admin
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    res.status(201).json({
      status: 'success',
      message: 'Admin user created successfully',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt
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

module.exports = {
  getAdminDashboard,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllBooks,
  updateBook,
  deleteBook,
  getAllRequests,
  updateRequest,
  createAdmin
};