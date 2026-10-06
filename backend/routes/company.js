const express = require('express');
const router  = express.Router();
const db      = require('../../db/connection');
const { requireCompany } = require('../middleware/auth');

// Profile
router.get('/profile', requireCompany, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT company_id,name,email,location,phone,website,industry,created_at FROM Company WHERE company_id=?',
      [req.session.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Profile not found.' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/profile', requireCompany, async (req, res) => {
  const { name, location, phone, website, industry } = req.body;
  try {
    await db.query('UPDATE Company SET name=?,location=?,phone=?,website=?,industry=? WHERE company_id=?',
      [name, location, phone, website, industry, req.session.user.id]);
    req.session.user.name = name;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// View open placement drives (to submit openings)
router.get('/drives', requireCompany, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM PlacementDrive WHERE status='Open' ORDER BY drive_date ASC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Submit a job opening for a drive
router.post('/openings', requireCompany, async (req, res) => {
  const { drive_id, role, package: pkg, min_cgpa, vacancies, description } = req.body;
  if (!drive_id || !role || !pkg || !min_cgpa) return res.status(400).json({ error: 'Drive, role, package and min CGPA required.' });
  try {
    const [r] = await db.query(
      'INSERT INTO CompanyJobOpening (company_id,drive_id,role,package,min_cgpa,vacancies,description) VALUES (?,?,?,?,?,?,?)',
      [req.session.user.id, drive_id, role, pkg, min_cgpa, vacancies||1, description||null]
    );
    res.status(201).json({ success: true, opening_id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// View own openings
router.get('/openings', requireCompany, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, pd.drive_title, pd.drive_date,
             (SELECT COUNT(*) FROM Application a WHERE a.opening_id=o.opening_id) AS applicant_count
      FROM CompanyJobOpening o
      JOIN PlacementDrive pd ON pd.drive_id = o.drive_id
      WHERE o.company_id=?
      ORDER BY o.created_at DESC`, [req.session.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Edit a pending opening
router.put('/openings/:id', requireCompany, async (req, res) => {
  const { role, package: pkg, min_cgpa, vacancies, description } = req.body;
  try {
    const [r] = await db.query(
      "UPDATE CompanyJobOpening SET role=?,package=?,min_cgpa=?,vacancies=?,description=? WHERE opening_id=? AND company_id=? AND status='Pending'",
      [role, pkg, min_cgpa, vacancies||1, description||null, req.params.id, req.session.user.id]);
    if (!r.affectedRows) return res.status(403).json({ error: 'Not found or already reviewed.' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete a pending opening
router.delete('/openings/:id', requireCompany, async (req, res) => {
  try {
    const [r] = await db.query(
      "DELETE FROM CompanyJobOpening WHERE opening_id=? AND company_id=? AND status='Pending'",
      [req.params.id, req.session.user.id]);
    if (!r.affectedRows) return res.status(403).json({ error: 'Not found or already reviewed.' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// View applicants to own openings
router.get('/applications', requireCompany, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, s.name AS student_name, s.email AS student_email, s.department, s.cgpa, s.phone,
             o.role, o.package, pd.drive_title
      FROM Application a
      JOIN Student s ON s.student_id = a.student_id
      JOIN CompanyJobOpening o ON o.opening_id = a.opening_id
      JOIN PlacementDrive pd ON pd.drive_id = o.drive_id
      WHERE o.company_id=?
      ORDER BY a.applied_at DESC`, [req.session.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update applicant status (company can shortlist / select / reject)
router.put('/applications/:id', requireCompany, async (req, res) => {
  const { status, remarks } = req.body;
  if (!['Shortlisted','Selected','Rejected'].includes(status))
    return res.status(400).json({ error: 'Company can only Shortlist, Select or Reject.' });
  try {
    await db.query('UPDATE Application SET status=?,remarks=? WHERE application_id=?', [status, remarks||null, req.params.id]);
    // If selected, mark student as placed
    if (status === 'Selected') {
      const [[app]] = await db.query('SELECT student_id FROM Application WHERE application_id=?', [req.params.id]);
      if (app) await db.query('UPDATE Student SET is_placed=true WHERE student_id=?', [app.student_id]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// View selected/rejected results for own openings
router.get('/results', requireCompany, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, s.name AS student_name, s.email AS student_email, s.department, s.cgpa, s.phone,
             o.role, o.package, pd.drive_title
      FROM Application a
      JOIN Student s ON s.student_id = a.student_id
      JOIN CompanyJobOpening o ON o.opening_id = a.opening_id
      JOIN PlacementDrive pd ON pd.drive_id = o.drive_id
      WHERE o.company_id=? AND a.status IN ('Selected','Rejected')
      ORDER BY a.applied_at DESC`, [req.session.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
