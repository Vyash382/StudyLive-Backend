const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const client = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

client.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

async function connect() {
  try {
    const connection = await client.connect();
    console.log('✅ Connected to PostgreSQL');
    connection.release();
  } catch (err) {
    console.error('❌ Connection error:', err);
    process.exit(1);
  }
}

module.exports = { connect, client };
