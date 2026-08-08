import { Pool } from 'pg';

let pool: Pool | undefined;
export default async function handler(_req: any, res: any) {
  if (!process.env.DATABASE_URL) return res.status(503).json({ ok: false, database: false });
  try {
    pool ??= new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2 });
    await pool.query('SELECT 1');
    return res.status(200).json({ ok: true, database: true });
  } catch {
    return res.status(503).json({ ok: false, database: false });
  }
}
