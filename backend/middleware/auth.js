function requireAdmin(req, res, next) {
  if (req.session?.user?.role === 'admin')   return next();
  res.status(401).json({ error: 'Admin access required.' });
}
function requireStudent(req, res, next) {
  if (req.session?.user?.role === 'student') return next();
  res.status(401).json({ error: 'Student access required.' });
}
function requireCompany(req, res, next) {
  if (req.session?.user?.role === 'company') return next();
  res.status(401).json({ error: 'Company access required.' });
}
module.exports = { requireAdmin, requireStudent, requireCompany };
