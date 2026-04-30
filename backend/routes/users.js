const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../database/init').getDatabase;
const { requireAuth } = require('../middleware/auth');

// POST - Créer un nouvel utilisateur (inscription)
router.post('/register', (req, res) => {
  const { email, username, password } = req.body;

  // Validation basique
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username et password requis' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit avoir au moins 6 caractères' });
  }

  const database = db();
  const passwordHash = bcrypt.hashSync(password, 10);

  database.run(
    'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
    [email, username, passwordHash],
    function(err) {
      if (err) {
        database.close();
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email ou username déjà utilisé' });
        }
        return res.status(500).json({ error: 'Erreur lors de l\'inscription' });
      }

      req.session.userId = this.lastID;
      res.status(201).json({ message: 'Utilisateur créé avec succès', userId: this.lastID });
      database.close();
    }
  );
});

// POST - Connexion
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et password requis' });
  }

  const database = db();
  database.get(
    'SELECT id, password_hash FROM users WHERE email = ?',
    [email],
    (err, user) => {
      if (err || !user) {
        database.close();
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      if (!bcrypt.compareSync(password, user.password_hash)) {
        database.close();
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      req.session.userId = user.id;
      res.json({ message: 'Connecté avec succès', userId: user.id });
      database.close();
    }
  );
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
router.get('/me', requireAuth, (req, res) => {
  const database = db();
  database.get(
    'SELECT id, email, username, points, created_at FROM users WHERE id = ?',
    [req.session.userId],
    (err, user) => {
      database.close();
      if (err || !user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      res.json(user);
    }
  );
});

// GET - Lister les utilisateurs (pagination, max 20)
router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const database = db();
  database.all(
    'SELECT id, username, points, created_at FROM users LIMIT ? OFFSET ?',
    [limit, offset],
    (err, users) => {
      if (err) {
        database.close();
        return res.status(500).json({ error: 'Erreur lors de la récupération' });
      }

      database.get('SELECT COUNT(*) as total FROM users', (err, result) => {
        database.close();
        res.json({
          users,
          pagination: {
            page,
            total: result.total,
            pages: Math.ceil(result.total / limit)
          }
        });
      });
    }
  );
});

// GET - Obtenir un utilisateur par ID
router.get('/:id', (req, res) => {
  const database = db();
  database.get(
    'SELECT id, username, points, created_at FROM users WHERE id = ?',
    [req.params.id],
    (err, user) => {
      database.close();
      if (err || !user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      res.json(user);
    }
  );
});

// PUT - Modifier le profil utilisateur
router.put('/:id', requireAuth, (req, res) => {
  if (req.session.userId !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const { username, email } = req.body;
  const database = db();

  database.run(
    'UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [username || null, email || null, req.params.id],
    function(err) {
      database.close();
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
      }
      res.json({ message: 'Utilisateur mis à jour' });
    }
  );
});

// DELETE - Supprimer un utilisateur (avec confirmation)
router.delete('/:id', requireAuth, (req, res) => {
  if (req.session.userId !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const database = db();
  database.run(
    'DELETE FROM users WHERE id = ?',
    [req.params.id],
    function(err) {
      database.close();
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la suppression' });
      }
      req.session.destroy();
      res.json({ message: 'Utilisateur supprimé' });
    }
  );
});

module.exports = router;
