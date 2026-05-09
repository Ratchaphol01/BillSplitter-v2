require('dotenv').config();

const mongoose = require('mongoose');

const app = require('./app');

mongoose.set('strictQuery', false);

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/final';

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  await mongoose.connect(mongoURI);
  isConnected = true;
  console.log('MongoDB connected');
};

if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  connectToDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch((err) => console.error('MongoDB connection error:', err));
} else {
  connectToDatabase().catch((err) => console.error('MongoDB connection error:', err));
}

module.exports = app;
