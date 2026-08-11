import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';

const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is required');

const ssl = process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false };
const client = new Client({ connectionString: DATABASE_URL, ssl });
const root = process.cwd();
const migrations = [
  'database/migrations/001_knowledge_foundation.sql',
  'database/migrations/002_legacy_source_backfill.sql',
];

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

async function ensureLedger() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function main() {
  await client.connect();
  try {
    await client.query("SELECT pg_advisory_lock(hashtext('eil_live_migrations'))");
    await ensureLedger();

    for (const relative of migrations) {
      const sql = await fs.readFile(path.join(root, relative), 'utf8');
      const checksum = sha256(sql);
      const existing = await client.query('SELECT checksum FROM schema_migrations WHERE name=$1', [relative]);

      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(`Migration drift detected for ${relative}: checksum changed after apply.`);
        }
        console.log(`SKIP ${relative} (already applied)`);
        continue;
      }

      console.log(`APPLY ${relative}`);
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)',
        [relative, checksum],
      );
      console.log(`OK    ${relative}`);
    }
  } finally {
    try { await client.query("SELECT pg_advisory_unlock(hashtext('eil_live_migrations'))"); } catch {}
    await client.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
