const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const getMongoUri = () =>
  process.env.MANGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  '';

const connectDB = async (url = getMongoUri()) => {
  if (!url) {
    const err = new Error(
      'MongoDB URI is missing. In Vercel → Settings → Environment Variables, add MANGO_URI with your Atlas connection string, then Redeploy.'
    );
    err.code = 'MISSING_URI';
    throw err;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(url, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
