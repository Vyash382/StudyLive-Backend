const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config();

const client = new Client({
  connectionString: process.env.CONNECTION_STRING, 
});

async function connect() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
  } catch (err) {
    console.error('❌ Connection error:', err);
  }
}

module.exports = { connect, client };

