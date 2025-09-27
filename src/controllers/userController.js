const User = require('../models/User');
const Book = require('../models/Book');
const Request = require('../models/Request');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { isActive: true };
    
    // Search by name or location
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { 'location.city': { $regex: req.query.search, $options: 'i' } },
        { 'location.state': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by genre preferences
    if (req.query.genre) {
      query['preferences.genres'] = req.query.genre;
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

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'books',
        match: { isActive: true },
        select: 'title author genre condition availability rating images'
      });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'User account is deactivated'
      });
    }

    res.json({
      status: 'success',
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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['name', 'location', 'preferences', 'avatar'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
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

// @desc    Get user dashboard
// @route   GET /api/users/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's books count
    const booksCount = await Book.countDocuments({ owner: userId, isActive: true });

    // Get user's requests (sent and received)
    const sentRequests = await Request.countDocuments({ requester: userId });
    const receivedRequests = await Request.countDocuments({ owner: userId });

    // Get pending requests
    const pendingSentRequests = await Request.countDocuments({ 
      requester: userId, 
      status: 'pending' 
    });
    const pendingReceivedRequests = await Request.countDocuments({ 
      owner: userId, 
      status: 'pending' 
    });

    // Get completed exchanges
    const completedExchanges = await Request.countDocuments({
      $or: [{ requester: userId }, { owner: userId }],
      status: 'completed'
    });

    // Get recent activity (last 10 requests)
    const recentActivity = await Request.find({
      $or: [{ requester: userId }, { owner: userId }]
    })
    .populate('book', 'title author')
    .populate('requester', 'name')
    .populate('owner', 'name')
    .sort({ updatedAt: -1 })
    .limit(10);

    res.json({
      status: 'success',
      data: {
        stats: {
          booksCount,
          sentRequests,
          receivedRequests,
          pendingSentRequests,
          pendingReceivedRequests,
          completedExchanges
        },
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Deactivate user account
// @route   DELETE /api/users/account
// @access  Private
const deactivateAccount = async (req, res) => {
  try {
    // Update user status
    await User.findByIdAndUpdate(req.user.id, { isActive: false });

    // Cancel all pending requests
    await Request.updateMany(
      {
        $or: [{ requester: req.user.id }, { owner: req.user.id }],
        status: 'pending'
      },
      { status: 'cancelled' }
    );

    // Mark all books as unavailable
    await Book.updateMany(
      { owner: req.user.id },
      { 'availability.status': 'unavailable', isActive: false }
    );

    res.json({
      status: 'success',
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateProfile,
  getDashboard,
  deactivateAccount
};