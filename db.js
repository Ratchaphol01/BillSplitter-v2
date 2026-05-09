require('dotenv').config();

const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/final';

const clientPromise = mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected');
    return mongoose.connection.getClient();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    throw err;
  });

module.exports = { clientPromise };
