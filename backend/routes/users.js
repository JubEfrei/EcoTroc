const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');

// POST - Créer un nouvel utilisateur (inscription)
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username et password requis' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit avoir au moins 6 caractères' });
  }

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await db.run(
      'INSERT INTO users (email, username, password_hash, points) VALUES (?, ?, ?, 10)',
      [email, username, passwordHash]
    );

    let userId = result.lastInsertRowid ?? result.insertId ?? result.lastID;
    if (userId === undefined || userId === null) {
      const idResult = await db.get('SELECT last_insert_rowid() as id');
      userId = idResult ? idResult.id : null;
    }

    if (typeof userId === 'bigint') {
      userId = Number(userId);
    }
    if (typeof userId === 'string' && !Number.isNaN(Number(userId))) {
      userId = Number(userId);
    }

    req.session.userId = userId;
    res.status(201).json({ message: 'Utilisateur créé avec succès', userId });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email ou username déjà utilisé' });
    }
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// POST - Connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et password requis' });
  }

  try {
    const user = await db.get('SELECT id, password_hash FROM users WHERE email = ?', [email]);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const userId = typeof user.id === 'bigint' ? Number(user.id) : user.id;
    req.session.userId = userId;
    res.json({ message: 'Connecté avec succès', userId });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// POST - Déconnexion
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
    res.json({ message: 'Déconnecté avec succès' });
  });
});

// GET - Obtenir le profil utilisateur actuel
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await db.get('SELECT id, email, username, points, created_at FROM users WHERE id = ?', [req.session.userId]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// GET - Lister les utilisateurs (pagination, max 20)
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const users = await db.all('SELECT id, username, points, created_at FROM users LIMIT ? OFFSET ?', [limit, offset]);
    const count = await db.get('SELECT COUNT(*) as total FROM users');

    res.json({
      users,
      pagination: {
        page,
        total: count.total,
        pages: Math.ceil(count.total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// GET - Obtenir un utilisateur par ID
router.get('/:id', async (req, res) => {
  try {
    const user = await db.get('SELECT id, username, points, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

// PUT - Modifier le profil utilisateur
router.put('/:id', requireAuth, async (req, res) => {
  if (Number(req.session.userId) !== Number(req.params.id)) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const { username, email } = req.body;

  try {
    await db.run(
      'UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [username || null, email || null, req.params.id]
    );
    res.json({ message: 'Utilisateur mis à jour' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// DELETE - Supprimer un utilisateur (avec confirmation)
router.delete('/:id', requireAuth, async (req, res) => {
  if (Number(req.session.userId) !== Number(req.params.id)) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  try {
    await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    req.session.destroy();
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
