import { Pool } from 'pg';

let pool: Pool | undefined;
function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Missing POSTGRES_URL or DATABASE_URL');
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

async function ensureTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS eil_items (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'ידע',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export default async function handler(req: any, res: any) {
  try {
    await ensureTable();
    if (req.method === 'GET') {
      const { rows } = await getPool().query('SELECT id, title, kind, created_at FROM eil_items ORDER BY created_at DESC');
      return res.status(200).json({ items: rows });
    }
    if (req.method === 'POST') {
      const title = String(req.body?.title || '').trim();
      if (!title) return res.status(400).json({ error: 'title is required' });
      const { rows } = await getPool().query(
        'INSERT INTO eil_items (title) VALUES ($1) RETURNING id, title, kind, created_at',
        [title]
      );
      return res.status(201).json({ item: rows[0] });
    }
    if (req.method === 'DELETE') {
      const id = Number(req.query?.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'valid id is required' });
      await getPool().query('DELETE FROM eil_items WHERE id = $1', [id]);
      return res.status(204).end();
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database unavailable' });
  }
}
