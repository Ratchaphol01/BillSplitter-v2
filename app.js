const express = require('express');
const mongoose = require('mongoose');
const expressSession = require('express-session');
const flash = require('connect-flash');
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expense');

mongoose.set('strictQuery', false);

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/final';
const sessionSecret = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

const mongooseState = global.mongooseState || (global.mongooseState = { conn: null, promise: null });

async function connectToDatabase() {
  if (mongooseState.conn) {
    return mongooseState.conn;
  }

  if (!mongooseState.promise) {
    mongooseState.promise = mongoose.connect(mongoURI).then((mongooseInstance) => {
      mongooseState.conn = mongooseInstance.connection;
      return mongooseState.conn;
    });
  }

  return mongooseState.promise;
}

connectToDatabase()
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSession({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login', { message: req.flash('message') });
});

app.get('/register', (req, res) => {
  res.render('register', { message: req.flash('message') });
});

app.use('/auth', authRoutes);
app.use('/expense', expenseRoutes);

app.use((req, res) => {
  res.status(404).render('404', { message: 'หน้าที่ค้นหาไม่พบ' });
});

module.exports = app;
