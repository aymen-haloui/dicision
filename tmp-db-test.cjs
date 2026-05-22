const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

sql`SELECT email, password_hash FROM users WHERE email IN ('admin@hexa.local', 'medecin@hexa.local')`
  .then((users) => {
    console.log('user rows:', users);
    console.log(`found ${users.length} seeded user(s)`);
  })
  .catch((err) => {
    console.error('DB query failed:', err.message || err);
    process.exit(1);
  })
  .finally(() => sql.end());
