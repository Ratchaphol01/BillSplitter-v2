require('dotenv').config();

const mongoose = require('mongoose');

const app = require('./app');

mongoose.set('strictQuery', false);

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/final';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;
