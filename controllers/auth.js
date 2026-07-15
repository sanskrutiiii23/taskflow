const User = require('../models/User');
const asyncWrapper = require('../middleware/async');
const { createCustomError } = require('../errors/custom-error');
const { validateEmail, validatePassword, validateName } = require('../utils/validate');
const { generateToken, sendTokenCookie, clearTokenCookie } = require('../utils/generateToken');

const register = asyncWrapper(async (req, res, next) => {
  const { name, email, password } = req.body;

  const nameError = validateName(name);
  if (nameError) {
    return next(createCustomError(nameError, 400));
  }

  const emailError = validateEmail(email);
  if (emailError) {
    return next(createCustomError(emailError, 400));
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return next(createCustomError(passwordError, 400));
  }

  const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingUser) {
    return next(createCustomError('An account with this email already exists', 400));
  }

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  });

  const token = generateToken(user._id);
  sendTokenCookie(res, token);

  res.status(201).json({
    status: 'success',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  const emailError = validateEmail(email);
  if (emailError) {
    return next(createCustomError(emailError, 400));
  }

  if (!password) {
    return next(createCustomError('Password is required', 400));
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

  if (!user) {
    return next(createCustomError('Incorrect email or password', 401));
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return next(createCustomError('Incorrect email or password', 401));
  }

  const token = generateToken(user._id);
  sendTokenCookie(res, token);

  res.status(200).json({
    status: 'success',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

const logout = (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({ status: 'success', msg: 'Logged out successfully' });
};

const getMe = asyncWrapper(async (req, res) => {
  res.status(200).json({
    status: 'success',
    user: req.user,
  });
});

module.exports = { register, login, logout, getMe };
