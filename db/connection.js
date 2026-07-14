const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async (url = process.env.MANGO_URI) => {
  if (!url) {
    throw new Error('MANGO_URI is missing. Add it in Vercel → Project → Settings → Environment Variables');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(url, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
