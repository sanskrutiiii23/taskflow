const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createCustomError } = require('../errors/custom-error');
const asyncWrapper = require('./async');

const authenticateUser = asyncWrapper(async (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(createCustomError('Authentication required. Please log in.', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    return next(createCustomError('User no longer exists. Please log in again.', 401));
  }

  req.user = { id: user._id, name: user.name, email: user.email };
  next();
});

module.exports = authenticateUser;
