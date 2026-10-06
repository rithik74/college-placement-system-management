const express = require('express');
const session = require('express-session');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'cpms_secret_2024',
  resave: false, saveUninitialized: false,
  cookie: { secure: false, maxAge: 8 * 60 * 60 * 1000 }
}));

// API routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/admin',   require('./routes/admin'));
app.use('/api/student', require('./routes/student'));
app.use('/api/company', require('./routes/company'));

// Frontend page routing
const fe = path.join(__dirname, '../frontend');
app.get('/',                       (req, res) => res.sendFile(path.join(fe, 'index.html')));
app.get('/admin/login',            (req, res) => res.sendFile(path.join(fe, 'admin/login.html')));
app.get('/admin/dashboard',        (req, res) => res.sendFile(path.join(fe, 'admin/dashboard.html')));
app.get('/student/login',          (req, res) => res.sendFile(path.join(fe, 'student/login.html')));
app.get('/student/register',       (req, res) => res.sendFile(path.join(fe, 'student/register.html')));
app.get('/student/dashboard',      (req, res) => res.sendFile(path.join(fe, 'student/dashboard.html')));
app.get('/company/login',          (req, res) => res.sendFile(path.join(fe, 'company/login.html')));
app.get('/company/register',       (req, res) => res.sendFile(path.join(fe, 'company/register.html')));
app.get('/company/dashboard',      (req, res) => res.sendFile(path.join(fe, 'company/dashboard.html')));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`\n🎓 College Placement Management System`);
  console.log(`   http://localhost:${PORT}\n`);
  console.log(`   Admin    → http://localhost:${PORT}/admin/login`);
  console.log(`   Student  → http://localhost:${PORT}/student/login`);
  console.log(`   Company  → http://localhost:${PORT}/company/login\n`);
});
