const express = require('express');
const app = express();
const tasks = require('./routes/tasks');
const connectDB = require('./db/connection');
require('dotenv').config();
const notFound = require('./middleware/notfound');
const errorHandlerMiddleware = require('./middleware/errorhandler');

app.use(express.static('./public'));
app.use(express.json());

app.use('/api/v1/tasks', tasks);

app.use(notFound);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 4000;

const start = async () => {
  try {
    if (!process.env.MANGO_URI) {
      throw new Error('MANGO_URI is missing in .env');
    }

    console.log('Connecting to MongoDB...');
    await connectDB(process.env.MANGO_URI);
    console.log('MongoDB connected');

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('\n❌ Server failed to start.\n');
    console.error(error.message);

    if (
      error.message.includes('whitelist') ||
      error.name === 'MongooseServerSelectionError'
    ) {
      console.error(`
Fix (MongoDB Atlas IP whitelist):
1. Open https://cloud.mongodb.com
2. Go to your cluster → Network Access
3. Click "Add IP Address"
4. Choose "Add Current IP Address" (or "Allow Access from Anywhere" for learning)
5. Wait ~1 minute, then run: npm run dev
`);
    }

    process.exit(1);
  }
};

start();
