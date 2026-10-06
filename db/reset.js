// Full database reset + rebuild with correct schema + new admin credentials
const mysql  = require('mysql2/promise');
const fs     = require('fs');
const path   = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function reset() {
  let conn;
  try {
    const dbName = process.env.DB_NAME || 'college_placement_db';

    // Connect WITHOUT selecting a database first (to allow DROP/CREATE)
    conn = await mysql.createConnection({
      host:               process.env.DB_HOST     || 'localhost',
      user:               process.env.DB_USER     || 'root',
      password:           process.env.DB_PASSWORD || '',
      port:               process.env.DB_PORT     || 3306,
      multipleStatements: true,
    });
    console.log('✅ Connected to MySQL');

    // Drop and recreate the database
    await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`✅ Dropped database: ${dbName}`);

    // Run the full schema (creates DB + all tables)
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await conn.query(sql);
    console.log('✅ Fresh schema applied');

    // Switch to the new database
    await conn.query(`USE \`${dbName}\``);

    // Insert the new admin
    const hash = await bcrypt.hash('srm@ktr', 10);
    await conn.query(
      'INSERT INTO Admin (username, password_hash, name, email) VALUES (?, ?, ?, ?)',
      ['srm_placement_ktr', hash, 'SRM Placement Coordinator', 'placement@srmktr.edu.in']
    );
    console.log('✅ Admin created  → username: srm_placement_ktr | password: srm@ktr');

    console.log('\n🎉 Database reset complete! Run: npm start\n');
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}
reset();
