require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const { initDatabase, client } = require('./database/init');
const { errorHandler } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3002;
// Only create the local uploads directory in development (Vercel filesystem is read-only)
const uploadDir = path.join(__dirname, '../uploads');
if (!process.env.VERCEL && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Custom session store for Turso
class TursoSessionStore extends session.Store {
  constructor(client) {
    super();
    this.client = client;
  }

  async get(sid, callback) {
    try {
      const result = await this.client.execute({
        sql: 'SELECT sess FROM sessions WHERE sid = ? AND expire > ?',
        args: [sid, Math.floor(Date.now() / 1000)]
      });
      if (result.rows.length > 0) {
        const row = Array.isArray(result.columns)
          ? result.columns.reduce((acc, column, index) => {
              acc[column] = result.rows[0][index];
              return acc;
            }, {})
          : result.rows[0];

        callback(null, JSON.parse(row.sess));
      } else {
        callback(null, null);
      }
    } catch (err) {
      callback(err);
    }
  }

  async set(sid, session, callback) {
    try {
      const expire = Math.floor((Date.now() + (session.cookie.maxAge || 86400000)) / 1000); // default 24h
      await this.client.execute({
        sql: 'INSERT OR REPLACE INTO sessions (sid, sess, expire) VALUES (?, ?, ?)',
        args: [sid, JSON.stringify(session), expire]
      });
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  async destroy(sid, callback) {
    try {
      await this.client.execute({
        sql: 'DELETE FROM sessions WHERE sid = ?',
        args: [sid]
      });
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  async touch(sid, session, callback) {
    try {
      const expire = Math.floor((Date.now() + (session.cookie.maxAge || 86400000)) / 1000);
      await this.client.execute({
        sql: 'UPDATE sessions SET sess = ?, expire = ? WHERE sid = ?',
        args: [JSON.stringify(session), expire, sid]
      });
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}

// Supporter Vercel / proxy HTTPS
app.set('trust proxy', 1);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(uploadDir));

// Ensure the DB (and the sessions table) is ready before every request.
// The promise is cached so initDatabase() only runs once per process instance.
let dbReady = null;
app.use(async (req, res, next) => {
  if (!dbReady) dbReady = initDatabase();
  try {
    await dbReady;
    next();
  } catch (err) {
    console.error('DB init failed:', err);
    res.status(503).json({ error: 'Service temporairement indisponible' });
  }
});

// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_key',
  store: new TursoSessionStore(client),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Routes API
app.use('/api/users', require('./routes/users'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/exchanges', require('./routes/exchanges'));

// Endpoint de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Servir l'application frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Gestionnaire d'erreurs
app.use(errorHandler);

// 404 - Fichier non trouvé
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrer le serveur localement seulement
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✓ EcoTroc est lancé sur http://localhost:${PORT}`);
    console.log(`✓ Environnement: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
