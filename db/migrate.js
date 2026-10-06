// Migration script: 
// 1. Updates admin credentials to srm_placement_ktr / srm@ktr
// 2. Adds 'username' column to Company table if not present
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path   = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'college_placement_db',
    });
    console.log('✅ Connected to MySQL →', process.env.DB_NAME || 'college_placement_db');

    // ── 1. Add 'username' column to Company if not exists ──────────────────────
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Company' AND COLUMN_NAME = 'username'`,
      [process.env.DB_NAME || 'college_placement_db']);
    if (!cols.length) {
      await conn.query('ALTER TABLE Company ADD COLUMN username VARCHAR(100) UNIQUE AFTER email');
      console.log('✅ Added username column to Company table');
    } else {
      console.log('ℹ️  username column already exists in Company table');
    }

    // ── 2. Update admin credentials ────────────────────────────────────────────
    // Delete old default admin if present
    await conn.query("DELETE FROM Admin WHERE username = 'admin'");

    // Insert new admin if not already present
    const [admins] = await conn.query('SELECT admin_id FROM Admin WHERE username = ?', ['srm_placement_ktr']);
    if (!admins.length) {
      const hash = await bcrypt.hash('srm@ktr', 10);
      await conn.query(
        'INSERT INTO Admin (username, password_hash, name, email) VALUES (?, ?, ?, ?)',
        ['srm_placement_ktr', hash, 'SRM Placement Coordinator', 'placement@srmktr.edu.in']
      );
      console.log('✅ Admin created  → username: srm_placement_ktr | password: srm@ktr');
    } else {
      // Update password in case it changed
      const hash = await bcrypt.hash('srm@ktr', 10);
      await conn.query('UPDATE Admin SET password_hash=?, name=?, email=? WHERE username=?',
        [hash, 'SRM Placement Coordinator', 'placement@srmktr.edu.in', 'srm_placement_ktr']);
      console.log('✅ Admin updated  → username: srm_placement_ktr | password: srm@ktr');
    }

    console.log('\n🎉 Migration complete!\n');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}
migrate();
