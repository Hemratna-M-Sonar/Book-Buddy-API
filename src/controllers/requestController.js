const Request = require('../models/Request');
const Book = require('../models/Book');
const User = require('../models/User');


// @desc    Create new request
// @route   POST /api/requests
// @access  Private
const createRequest = async (req, res) => {
  try {
    const { book: bookId, type, offeredBooks } = req.body;

    // Check if book exists and is available
    const book = await Book.findById(bookId);
    if (!book || !book.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    if (book.status !== 'Available') {
      return res.status(400).json({
        status: 'error',
        message: 'Book is not available for requests'
      });
    }

    // Check if user is trying to request their own book
    if (book.owner.toString() === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot request your own book'
      });
    }

    // Check if user already has a pending request for this book
    const existingRequest = await Request.findOne({
      requester: req.user.id,
      book: bookId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a pending request for this book'
      });
    }

    // Validate request based on type
    const requestData = {
      requester: req.user.id,
      book: bookId,
      owner: book.owner,
      type
    };

    if (type === 'exchange') {
      // Exchange requests must include offered book
      if (!offeredBooks) {
        return res.status(400).json({
          status: 'error',
          message: 'Exchange requests must include an offered book'
        });
      }

      // Validate offered book belongs to requester
      const userBook = await Book.findOne({
        _id: offeredBooks,
        owner: req.user.id,
        isActive: true,
        status: 'Available'
      });

      if (!userBook) {
        return res.status(400).json({
          status: 'error',
          message: 'Offered book is not valid or not available'
        });
      }

      requestData.offeredBooks = offeredBooks;
    }

    const request = await Request.create(requestData);
    await request.populate([
      { path: 'requester', select: 'name email location rating' },
      { path: 'book', select: 'title author genre condition images' },
      { path: 'owner', select: 'name email' },
      { path: 'offeredBooks', select: 'title author genre condition images' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Request created successfully',
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

// @desc    Get all requests (sent and received)
// @route   GET /api/requests
// @access  Private
const getRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { requester: req.user.id },
        { owner: req.user.id }
      ]
    };

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by type (sent or received)
    if (req.query.type === 'sent') {
      query.$or = [{ requester: req.user.id }];
    } else if (req.query.type === 'received') {
      query.$or = [{ owner: req.user.id }];
    }

    const requests = await Request.find(query)
      .populate('requester', 'name email location rating avatar')
      .populate('book', 'title author genre condition images')
      .populate('owner', 'name email location rating avatar')
      .populate('offeredBooks', 'title author genre condition images')
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

// @desc    Get request by ID
// @route   GET /api/requests/:id
// @access  Private
const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requester', 'name email location rating avatar')
      .populate('book', 'title author genre condition images')
      .populate('owner', 'name email location rating avatar')
      .populate('offeredBooks', 'title author genre condition images');

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Request not found'
      });
    }

    // Check if user is involved in this request
    if (request.requester._id.toString() !== req.user.id && 
        request.owner._id.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this request'
      });
    }

    res.json({
      status: 'success',
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

// @desc    Update request status
// @route   PUT /api/requests/:id
// @access  Private
const updateRequest = async (req, res) => {
  try {
    const { status, meetingDetails } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Request not found'
      });
    }

    // Check authorization based on status change
    if (status === 'accepted' || status === 'rejected') {
      // Only owner can accept/reject
      if (request.owner.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Only book owner can accept or reject requests'
        });
      }
    } else if (status === 'cancelled') {
      // Only requester can cancel
      if (request.requester.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Only requester can cancel the request'
        });
      }
    } else if (status === 'completed') {
      // Both parties can mark as completed
      if (request.requester.toString() !== req.user.id && 
          request.owner.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Not authorized to update this request'
        });
      }
    }

    // Validate status transitions
    const validTransitions = {
      pending: ['accepted', 'rejected', 'cancelled'],
      accepted: ['completed', 'cancelled'],
      rejected: [],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[request.status].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot change status from ${request.status} to ${status}`
      });
    }

    // Update request
    const updateData = { status };
    if (meetingDetails) {
      updateData.meetingDetails = meetingDetails;
    }
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'requester', select: 'name email location rating' },
      { path: 'book', select: 'title author genre condition images' },
      { path: 'owner', select: 'name email location rating' },
      { path: 'offeredBooks', select: 'title author genre condition images' }
    ]);

    // Update book status based on request status
    if (status === 'accepted') {
      await Book.findByIdAndUpdate(request.book, {
        status: 'Not Available'
      });
    } else if (status === 'completed') {
      if (request.type === 'free') {
        // Free: Book ownership transfers to requester, mark as not available
        await Book.findByIdAndUpdate(request.book, {
          status: 'Not Available',
          owner: request.requester
        });
      } else if (request.type === 'exchange') {
        // Exchange: Both books become not available and owners swap
        await Book.findByIdAndUpdate(request.book, {
          status: 'Not Available',
          owner: request.requester
        });
        
        // Update offered book ownership to original owner
        if (request.offeredBooks) {
          await Book.findByIdAndUpdate(request.offeredBooks, {
            status: 'Not Available',
            owner: request.owner
          });
        }
      }
    }

    res.json({
      status: 'success',
      message: `Request ${status} successfully`,
      data: {
        request: updatedRequest
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Rate a completed request
// @route   POST /api/requests/:id/rate
// @access  Private
const rateRequest = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Request not found'
      });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only rate completed requests'
      });
    }

    // Check if user is involved in this request
    const isRequester = request.requester.toString() === req.user.id;
    const isOwner = request.owner.toString() === req.user.id;

    if (!isRequester && !isOwner) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to rate this request'
      });
    }

    // Update rating based on user role
    if (isRequester) {
      if (request.rating.requesterRating) {
        return res.status(400).json({
          status: 'error',
          message: 'You have already rated this request'
        });
      }
      request.rating.requesterRating = rating;
      request.rating.requesterReview = review;
      
      // Update owner's rating
      const owner = await User.findById(request.owner);
      await owner.updateRating(rating);

     
    } else {
      if (request.rating.ownerRating) {
        return res.status(400).json({
          status: 'error',
          message: 'You have already rated this request'
        });
      }
      request.rating.ownerRating = rating;
      request.rating.ownerReview = review;
      
      // Update requester's rating
      const requester = await User.findById(request.requester);
      await requester.updateRating(rating);
    }

    await request.save();

    res.json({
      status: 'success',
      message: 'Rating submitted successfully',
      data: {
        rating: request.rating
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete request
// @route   DELETE /api/requests/:id
// @access  Private
const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Request not found'
      });
    }

    // Only requester can delete their own request
    if (request.requester.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this request'
      });
    }

    // Can only delete cancelled or rejected requests
    if (!['cancelled', 'rejected'].includes(request.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Can only delete cancelled or rejected requests'
      });
    }

    await Request.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};



module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  rateRequest,
  deleteRequest
};