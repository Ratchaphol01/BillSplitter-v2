const express = require('express');

const expressSession = require('express-session');

const MongoStore = require('connect-mongo');

const flash = require('connect-flash');

const path = require('path');

const authRoutes = require('./routes/auth');

const expenseRoutes = require('./routes/expense');

const apiRoutes = require('./routes/api');

const sessionSecret = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/final';

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionConfig = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoURI,
    ttl: 60 * 60 * 24
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: 'lax'
  }
};

app.use(expressSession(sessionConfig));
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

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).render('404', { message: 'หน้าที่ค้นหาไม่พบ' });
});

module.exports = app;
