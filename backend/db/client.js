import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.join(__dirname, 'global-bundle.pem')).toString(),
  },
});

pool.connect()
  .then(client => {
    console.log('PostgreSQL connected');
    client.release();
  })
  .catch(err => console.error('PostgreSQL connection error:', err.message));

export default pool;