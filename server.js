require('dotenv').config();
const app = require('./app');
const connectDB = require('./db/connection');

const port = process.env.PORT || 4000;

const start = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
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
2. Go to Network Access → Add IP Address
3. Choose "Allow Access from Anywhere" (0.0.0.0/0) for Vercel + local
4. Wait ~1 minute, then run: npm run dev
`);
    }

    process.exit(1);
  }
};

start();
