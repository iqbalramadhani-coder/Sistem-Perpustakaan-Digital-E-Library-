const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'elibrary_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Setup res.locals for view engine
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.error = req.session.error || null;
  res.locals.success = req.session.success || null;
  delete req.session.error;
  delete req.session.success;
  next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const petugasRoutes = require('./routes/petugas');
const peminjamRoutes = require('./routes/peminjam');

// Route middlewares
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/petugas', petugasRoutes);
app.use('/peminjam', peminjamRoutes);

app.get('/', (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === 'ADMIN') return res.redirect('/admin');
    if (req.session.user.role === 'PETUGAS') return res.redirect('/petugas');
    if (req.session.user.role === 'PEMINJAM') return res.redirect('/peminjam');
  }
  res.redirect('/auth/login');
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
