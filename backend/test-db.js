const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:supersecretpassword123@odoo-cafe-aurora-cluster-prod.cluster-cmzqeiqyyajd.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=require',
});

async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Success:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}
test();
