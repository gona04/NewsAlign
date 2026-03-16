import pg from 'pg';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certPath = path.join(__dirname, 'global-bundle.pem');
const certUrl = 'https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem';

async function downloadCert() {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(certPath);
    https.get(certUrl, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('SSL certificate downloaded');
        resolve();
      });
    }).on('error', err => {
      fs.unlink(certPath, () => {});
      reject(err);
    });
  });
}

if (!fs.existsSync(certPath)) {
  await downloadCert();
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(certPath).toString(),
  },
});

pool.connect()
  .then(client => {
    console.log('PostgreSQL connected');
    client.release();
  })
  .catch(err => console.error('PostgreSQL connection error:', err.message));

export default pool;