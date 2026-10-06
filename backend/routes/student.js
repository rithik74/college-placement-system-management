const express = require('express');
const router  = express.Router();
const db      = require('../../db/connection');
const { requireStudent } = require('../middleware/auth');

// Profile
router.get('/profile', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT student_id,name,email,department,year,cgpa,phone,is_placed,created_at FROM Student WHERE student_id=?',
      [req.session.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Profile not found.' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/profile', requireStudent, async (req, res) => {
  const { name, department, year, cgpa, phone } = req.body;
  try {
    await db.query('UPDATE Student SET name=?,department=?,year=?,cgpa=?,phone=? WHERE student_id=?',
      [name, department, year, cgpa, phone, req.session.user.id]);
    req.session.user.name = name;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// All drives announced by college admin (visible to students regardless of openings)
router.get('/announcements', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pd.*,
        (SELECT COUNT(*) FROM CompanyJobOpening o WHERE o.drive_id=pd.drive_id AND o.status='Approved') AS approved_openings
      FROM PlacementDrive pd
      WHERE pd.status IN ('Open','Closed')
      ORDER BY pd.drive_date ASC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Browse open drives with approved openings the student is eligible for
router.get('/drives', requireStudent, async (req, res) => {
  try {
    const [profile] = await db.query('SELECT cgpa FROM Student WHERE student_id=?', [req.session.user.id]);
    const myCgpa = profile[0]?.cgpa || 0;
    const [rows] = await db.query(`
      SELECT pd.*, o.opening_id, o.role, o.package, o.min_cgpa, o.vacancies, o.description AS role_desc,
             c.name AS company_name, c.location, c.industry,
             (SELECT COUNT(*) FROM Application a WHERE a.opening_id=o.opening_id AND a.student_id=?) AS already_applied
      FROM PlacementDrive pd
      JOIN CompanyJobOpening o ON o.drive_id = pd.drive_id
      JOIN Company c ON c.company_id = o.company_id
      WHERE pd.status = 'Open' AND o.status = 'Approved' AND o.min_cgpa <= ?
      ORDER BY pd.drive_date ASC`, [req.session.user.id, myCgpa]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Apply to an opening
router.post('/apply/:openingId', requireStudent, async (req, res) => {
  try {
    const [openings] = await db.query(
      'SELECT o.min_cgpa, s.cgpa FROM CompanyJobOpening o, Student s WHERE o.opening_id=? AND s.student_id=?',
      [req.params.openingId, req.session.user.id]);
    if (!openings.length) return res.status(404).json({ error: 'Opening not found.' });
    if (openings[0].cgpa < openings[0].min_cgpa)
      return res.status(400).json({ error: `Your CGPA (${openings[0].cgpa}) is below the minimum required (${openings[0].min_cgpa}).` });
    await db.query('INSERT INTO Application (student_id,opening_id) VALUES (?,?)',
      [req.session.user.id, req.params.openingId]);
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Already applied.' });
    res.status(500).json({ error: err.message });
  }
});

// My applications
router.get('/applications', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, o.role, o.package, o.min_cgpa, c.name AS company_name, c.location,
             pd.drive_title, pd.drive_date
      FROM Application a
      JOIN CompanyJobOpening o ON o.opening_id = a.opening_id
      JOIN Company c ON c.company_id = o.company_id
      JOIN PlacementDrive pd ON pd.drive_id = o.drive_id
      WHERE a.student_id=?
      ORDER BY a.applied_at DESC`, [req.session.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
