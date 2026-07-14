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
    const msg =
      error.code === 'MISSING_URI'
        ? error.message
        : 'Database connection failed. Check that MANGO_URI on Vercel is correct, then Redeploy. Atlas Network Access should allow 0.0.0.0/0.';
    res.status(500).json({ msg });
  }
});

app.use('/api/v1/tasks', tasks);

app.use(notFound);
app.use(errorHandlerMiddleware);

module.exports = app;
