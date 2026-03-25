const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ── DB setup ──────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.log('[DB] No DATABASE_URL — waitlist stored in memory only');
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id          SERIAL PRIMARY KEY,
      url         TEXT NOT NULL,
      ip          TEXT,
      user_agent  TEXT,
      referrer    TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('[DB] waitlist table ready');
}

// In-memory fallback when no DB
const memoryList = [];

// ── Middleware ────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── API: submit waitlist ──────────────────────────────────
app.post('/api/waitlist', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || url.trim().length < 3) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const entry = {
    url: url.trim(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    user_agent: req.headers['user-agent'] || '',
    referrer: req.headers['referer'] || '',
  };

  if (process.env.DATABASE_URL) {
    await pool.query(
      'INSERT INTO waitlist (url, ip, user_agent, referrer) VALUES ($1, $2, $3, $4)',
      [entry.url, entry.ip, entry.user_agent, entry.referrer]
    );
    const { rows } = await pool.query('SELECT COUNT(*) FROM waitlist');
    return res.json({ ok: true, count: parseInt(rows[0].count) });
  } else {
    memoryList.push({ ...entry, created_at: new Date().toISOString() });
    return res.json({ ok: true, count: memoryList.length });
  }
});

// ── API: get count ────────────────────────────────────────
app.get('/api/waitlist/count', async (req, res) => {
  if (process.env.DATABASE_URL) {
    const { rows } = await pool.query('SELECT COUNT(*) FROM waitlist');
    return res.json({ count: parseInt(rows[0].count) });
  }
  res.json({ count: memoryList.length });
});

// ── Admin dashboard ───────────────────────────────────────
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'betax-admin-2026';

app.get('/admin', (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) {
    return res.status(401).send('Unauthorized. Add ?token=YOUR_ADMIN_TOKEN');
  }
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/admin/waitlist', async (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (process.env.DATABASE_URL) {
    const { rows } = await pool.query(
      'SELECT * FROM waitlist ORDER BY created_at DESC'
    );
    return res.json({ entries: rows, count: rows.length });
  }
  res.json({ entries: memoryList.slice().reverse(), count: memoryList.length });
});

// ── Catch-all ─────────────────────────────────────────────
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── Start ─────────────────────────────────────────────────
initDB()
  .then(() => app.listen(PORT, () => console.log(`Betax running on port ${PORT}`)))
  .catch(err => {
    console.error('[DB] init failed:', err.message);
    app.listen(PORT, () => console.log(`Betax running on port ${PORT} (no DB)`));
  });
