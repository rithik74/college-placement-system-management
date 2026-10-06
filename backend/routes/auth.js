const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../../db/connection');

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.session?.user) return res.json({ loggedIn: true, ...req.session.user });
  res.json({ loggedIn: false });
});

// Admin login
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'All fields required.' });
  try {
    const [rows] = await db.query('SELECT * FROM Admin WHERE username = ?', [username]);
    if (!rows.length || !await bcrypt.compare(password, rows[0].password_hash))
      return res.status(401).json({ error: 'Invalid username or password.' });
    req.session.user = { role: 'admin', id: rows[0].admin_id, name: rows[0].name, email: rows[0].email };
    res.json({ success: true, role: 'admin', name: rows[0].name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Student login
router.post('/student/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields required.' });
  try {
    const [rows] = await db.query('SELECT * FROM Student WHERE email = ?', [email]);
    if (!rows.length || !await bcrypt.compare(password, rows[0].password_hash))
      return res.status(401).json({ error: 'Invalid email or password.' });
    req.session.user = { role: 'student', id: rows[0].student_id, name: rows[0].name, email: rows[0].email };
    res.json({ success: true, role: 'student', name: rows[0].name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Student register
router.post('/student/register', async (req, res) => {
  const { name, email, password, department, year, cgpa, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      'INSERT INTO Student (name,email,password_hash,department,year,cgpa,phone) VALUES (?,?,?,?,?,?,?)',
      [name, email, hash, department || null, year || null, cgpa || null, phone || null]
    );
    req.session.user = { role: 'student', id: r.insertId, name, email };
    res.status(201).json({ success: true, role: 'student', name });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered.' });
    res.status(500).json({ error: err.message });
  }
});

// Company login (username set by admin)
router.post('/company/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'All fields required.' });
  try {
    const [rows] = await db.query('SELECT * FROM Company WHERE username = ?', [username]);
    if (!rows.length || !await bcrypt.compare(password, rows[0].password_hash))
      return res.status(401).json({ error: 'Invalid username or password.' });
    req.session.user = { role: 'company', id: rows[0].company_id, name: rows[0].name, email: rows[0].email };
    res.json({ success: true, role: 'company', name: rows[0].name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Company register
router.post('/company/register', async (req, res) => {
  const { name, email, password, location, phone, website, industry } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      'INSERT INTO Company (name,email,password_hash,location,phone,website,industry) VALUES (?,?,?,?,?,?,?)',
      [name, email, hash, location || null, phone || null, website || null, industry || null]
    );
    req.session.user = { role: 'company', id: r.insertId, name, email };
    res.status(201).json({ success: true, role: 'company', name });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered.' });
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

module.exports = router;
