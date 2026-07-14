const express = require('express');
const path = require('path');
const tasks = require('./routes/tasks');
const connectDB = require('./db/connection');
const notFound = require('./middleware/notfound');
const errorHandlerMiddleware = require('./middleware/errorhandler');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure MongoDB is connected before API routes (needed for Vercel serverless)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    res.status(500).json({
      msg: 'Database connection failed. Check MANGO_URI and Atlas Network Access (allow 0.0.0.0/0).',
    });
  }
});

app.use('/api/v1/tasks', tasks);

app.use(notFound);
app.use(errorHandlerMiddleware);

module.exports = app;
