import { Pool } from 'pg';

let pool: Pool | undefined;
const getPool = () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 5,
  });
  return pool;
};

async function ensureTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS eil_items (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'ידע',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await ensureTable();
    const db = getPool();

    if (req.method === 'GET') {
      const { rows } = await db.query(
        'SELECT id, title, kind FROM eil_items ORDER BY created_at DESC LIMIT 500'
      );
      return res.status(200).json({ items: rows });
    }

    if (req.method === 'POST') {
      const title = String(req.body?.title ?? '').trim();
      if (!title) return res.status(400).json({ error: 'title is required' });
      const { rows } = await db.query(
        'INSERT INTO eil_items (title, kind) VALUES ($1, $2) RETURNING id, title, kind',
        [title, 'ידע']
      );
      return res.status(201).json({ item: rows[0] });
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query?.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'valid id is required' });
      await db.query('DELETE FROM eil_items WHERE id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET,POST,DELETE,OPTIONS');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error(error);
    return res.status(503).json({ error: 'Database unavailable' });
  }
}
