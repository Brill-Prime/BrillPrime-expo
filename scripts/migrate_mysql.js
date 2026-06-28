const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '..', '.env');
let envConfig = {};
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([^=]+?)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      envConfig[key] = value;
    }
  });
}

async function run() {
  const host = envConfig.MYSQL_HOST || process.env.MYSQL_HOST || '127.0.0.1';
  const port = envConfig.MYSQL_PORT ? parseInt(envConfig.MYSQL_PORT, 10) : (process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306);
  const user = envConfig.MYSQL_USER || process.env.MYSQL_USER || 'bravo';
  const password = envConfig.MYSQL_PASSWORD || process.env.MYSQL_PASSWORD || 'bravo_pass';
  const database = envConfig.MYSQL_DATABASE || process.env.MYSQL_DATABASE || 'brillprime';

  console.log('Using MySQL connection settings:', {
    host,
    port,
    user,
    database,
    pwdSet: !!password,
  });

  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  try {
    console.log('Creating database if not exists...');
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await conn.query(`USE \`${database}\`;`);

    const sqlDir = path.resolve(__dirname, '..', 'local_mysql');
    const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();

    for (const f of files) {
      const fullPath = path.join(sqlDir, f);
      console.log('Executing SQL file:', fullPath);
      const sql = fs.readFileSync(fullPath, 'utf8');
      // Split on delimiter for safety if large; mysql2 supports multipleStatements
      await conn.query(sql);
    }

    console.log('Migrations and seed completed successfully.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

run();
