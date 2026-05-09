require('dotenv').config();

const mongoose = require('mongoose');

const app = require('./app');

mongoose.set('strictQuery', false);

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/final';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB connected');
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
      console.log(`Visit http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
