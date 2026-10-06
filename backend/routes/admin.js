const express = require('express');
const router  = express.Router();
const db      = require('../../db/connection');
const { requireAdmin } = require('../middleware/auth');

// ── Dashboard Stats ──────────────────────────────────────────────────────────
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [[s]] = await db.query('SELECT COUNT(*) c FROM Student');
    const [[p]] = await db.query('SELECT COUNT(*) c FROM Student WHERE is_placed=true');
    const [[co]]= await db.query('SELECT COUNT(*) c FROM Company');
    const [[d]] = await db.query('SELECT COUNT(*) c FROM PlacementDrive');
    const [[o]] = await db.query("SELECT COUNT(*) c FROM CompanyJobOpening WHERE status='Pending'");
    const [[a]] = await db.query('SELECT COUNT(*) c FROM Application');
    res.json({ students:s.c, placed:p.c, companies:co.c, drives:d.c, pendingOpenings:o.c, applications:a.c });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Students ─────────────────────────────────────────────────────────────────
router.get('/students', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT student_id,name,email,department,year,cgpa,phone,is_placed,created_at FROM Student ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/students', requireAdmin, async (req, res) => {
  const { name, email, department, year, cgpa, phone } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required.' });
  try {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Student@123', 10); // default password
    const [r] = await db.query(
      'INSERT INTO Student (name,email,password_hash,department,year,cgpa,phone) VALUES (?,?,?,?,?,?,?)',
      [name, email, hash, department||null, year||null, cgpa||null, phone||null]
    );
    res.status(201).json({ success: true, student_id: r.insertId, defaultPassword: 'Student@123' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists.' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/students/:id', requireAdmin, async (req, res) => {
  const { name, department, year, cgpa, phone } = req.body;
  try {
    await db.query('UPDATE Student SET name=?,department=?,year=?,cgpa=?,phone=? WHERE student_id=?',
      [name, department, year, cgpa, phone, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/students/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM Student WHERE student_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Drives ───────────────────────────────────────────────────────────────────
router.get('/drives', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM PlacementDrive ORDER BY drive_date ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/drives', requireAdmin, async (req, res) => {
  const { drive_title, drive_date, last_date, venue, description, status } = req.body;
  if (!drive_title || !drive_date) return res.status(400).json({ error: 'Title and date required.' });
  try {
    const [r] = await db.query(
      'INSERT INTO PlacementDrive (drive_title,drive_date,last_date,venue,description,status) VALUES (?,?,?,?,?,?)',
      [drive_title, drive_date, last_date||null, venue||null, description||null, status||'Open']
    );
    res.status(201).json({ success: true, drive_id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/drives/:id', requireAdmin, async (req, res) => {
  const { drive_title, drive_date, last_date, venue, description, status } = req.body;
  try {
    await db.query('UPDATE PlacementDrive SET drive_title=?,drive_date=?,last_date=?,venue=?,description=?,status=? WHERE drive_id=?',
      [drive_title, drive_date, last_date||null, venue||null, description||null, status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/drives/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM PlacementDrive WHERE drive_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Company Openings (Approve / Reject) ──────────────────────────────────────
router.get('/openings', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, c.name AS company_name, c.location, pd.drive_title, pd.drive_date
      FROM CompanyJobOpening o
      JOIN Company c ON c.company_id = o.company_id
      JOIN PlacementDrive pd ON pd.drive_id = o.drive_id
      ORDER BY o.created_at DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/openings/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['Approved','Rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  try {
    await db.query('UPDATE CompanyJobOpening SET status=? WHERE opening_id=?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin can view applications but company controls the status
router.get('/applications', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, s.name AS student_name, s.department, s.cgpa,
             o.role, o.package, c.name AS company_name, pd.drive_title
      FROM Application a
      JOIN Student s ON s.student_id = a.student_id
      JOIN CompanyJobOpening o ON o.opening_id = a.opening_id
      JOIN Company c ON c.company_id = o.company_id
      JOIN PlacementDrive pd ON pd.drive_id = o.drive_id
      ORDER BY a.applied_at DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ── Results (read-only — driven by company decisions) ────────────────────────
router.get('/results', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.application_id, a.student_id, a.status, a.remarks, a.applied_at,
             s.name AS student_name, s.department, s.email,
             o.role, o.package, c.name AS company_name, pd.drive_title
      FROM Application a
      JOIN Student s ON s.student_id = a.student_id
      JOIN CompanyJobOpening o ON o.opening_id = a.opening_id
      JOIN Company c ON c.company_id = o.company_id
      JOIN PlacementDrive pd ON pd.drive_id = o.drive_id
      WHERE a.status IN ('Selected','Rejected')
      ORDER BY a.applied_at DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ── Company Credentials (Admin-assigned login) ────────────────────────────────
// List all companies with credential status
router.get('/company-credentials', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT company_id, name, email, username, industry, location, created_at FROM Company ORDER BY name'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create a new company and assign credentials
router.post('/company-credentials', requireAdmin, async (req, res) => {
  const { name, email, username, password, location, phone, website, industry } = req.body;
  if (!name || !email || !username || !password)
    return res.status(400).json({ error: 'Company name, email, username and password are required.' });
  try {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      'INSERT INTO Company (name,email,username,password_hash,location,phone,website,industry) VALUES (?,?,?,?,?,?,?,?)',
      [name, email, username, hash, location||null, phone||null, website||null, industry||null]
    );
    res.status(201).json({ success: true, company_id: r.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email or username already exists.' });
    res.status(500).json({ error: err.message });
  }
});

// Update company credentials (username / password)
router.put('/company-credentials/:id', requireAdmin, async (req, res) => {
  const { username, password, name, email, location, phone, website, industry } = req.body;
  try {
    const bcrypt = require('bcryptjs');
    let query, params;
    if (password && password.trim()) {
      const hash = await bcrypt.hash(password, 10);
      query = 'UPDATE Company SET name=?,email=?,username=?,password_hash=?,location=?,phone=?,website=?,industry=? WHERE company_id=?';
      params = [name, email, username, hash, location||null, phone||null, website||null, industry||null, req.params.id];
    } else {
      query = 'UPDATE Company SET name=?,email=?,username=?,location=?,phone=?,website=?,industry=? WHERE company_id=?';
      params = [name, email, username, location||null, phone||null, website||null, industry||null, req.params.id];
    }
    await db.query(query, params);
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email or username already exists.' });
    res.status(500).json({ error: err.message });
  }
});

// Delete company
router.delete('/company-credentials/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM Company WHERE company_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
