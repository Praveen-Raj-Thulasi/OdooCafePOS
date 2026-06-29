const { Pool } = require('pg');
const { Signer } = require('@aws-sdk/rds-signer');

const host = 'odoo-cafe-aurora-cluster-prod.cluster-cmzqeiqyyajd.us-east-1.rds.amazonaws.com';
const port = 5432;
const user = 'postgres';
const region = 'us-east-1';

const signer = new Signer({
  hostname: host,
  port: port,
  username: user,
  region: region
});

const pool = new Pool({
  host: host,
  port: port,
  user: user,
  password: async () => {
    return await signer.getAuthToken();
  },
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const res = await pool.query('CREATE DATABASE odoocafe');
    console.log('Success:', res);
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database already exists.');
    } else {
      console.error('Error:', err);
    }
  } finally {
    pool.end();
  }
}
test();
