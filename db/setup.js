const mysql  = require('mysql2/promise');
const fs     = require('fs');
const path   = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setup() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',  port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });
    console.log('✅ Connected to MySQL');
    await conn.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
    console.log('✅ Tables created/verified');

    await conn.query(`USE \`${process.env.DB_NAME || 'college_placement_db'}\``);

    // Create default admin
    const [admins] = await conn.query('SELECT admin_id FROM Admin WHERE username = ?', ['srm_placement_ktr']);
    if (!admins.length) {
      const hash = await bcrypt.hash('srm@ktr', 10);
      await conn.query('INSERT INTO Admin (username,password_hash,name,email) VALUES (?,?,?,?)',
        ['srm_placement_ktr', hash, 'SRM Placement Coordinator', 'placement@srmktr.edu.in']);
      console.log('✅ Default admin → username: srm_placement_ktr | password: srm@ktr');
    }

    console.log('\n🎉 Setup complete! Run: npm start\n');
  } catch (err) { console.error('❌ Setup failed:', err.message); process.exit(1); }
  finally { if (conn) await conn.end(); }
}
setup();
