// Role-based authorization middleware

/**
 * Middleware to check if user has required role(s)
 * @param {string|Array} roles - Required role(s) 
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. Please authenticate first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. Please authenticate first.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

/**
 * Middleware to check if user is regular user
 */
const userOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. Please authenticate first.'
    });
  }

  if (req.user.role !== 'user') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. User privileges required.'
    });
  }

  next();
};

/**
 * Middleware to check if user owns the resource or is admin
 */
const ownerOrAdmin = (resourceOwnerField = 'owner') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. Please authenticate first.'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceOwnerId = req.resource ? req.resource[resourceOwnerField] : req.params.userId;
    
    if (resourceOwnerId && resourceOwnerId.toString() === req.user.id) {
      return next();
    }

    return res.status(403).json({
      status: 'error',
      message: 'Access denied. You can only access your own resources.'
    });
  };
};

module.exports = {
  authorize,
  adminOnly,
  userOnly,
  ownerOrAdmin
};