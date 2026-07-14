const { CustomAPIError } = require('../errors/custom-error');

const errorHandlerMiddleware = (err, req, res, next) => {
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ msg: err.message });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((item) => item.message);
    return res.status(400).json({ msg: messages.join(', ') });
  }

  if (err.name === 'CastError') {
    return res.status(404).json({ msg: `No task found with id: ${err.value}` });
  }

  return res
    .status(500)
    .json({ msg: 'Something went wrong, please try again later' });
};

module.exports = errorHandlerMiddleware;
