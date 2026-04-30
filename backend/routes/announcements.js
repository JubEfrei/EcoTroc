const express = require('express');
const router = express.Router();
const db = require('../database/init').getDatabase;
const { requireAuth } = require('../middleware/auth');

// POST - Créer une nouvelle annonce
router.post('/', requireAuth, (req, res) => {
  const { title, description, category, condition, exchange_type, desired_exchange, points_value } = req.body;

  if (!title || !description || !category || !exchange_type) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  const database = db();
  database.run(
    `INSERT INTO announcements 
    (user_id, title, description, category, condition, exchange_type, desired_exchange, points_value) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.session.userId, title, description, category, condition || 'bon_etat', exchange_type, desired_exchange || null, points_value || null],
    function(err) {
      if (err) {
        database.close();
        return res.status(500).json({ error: 'Erreur lors de la création' });
      }
      res.status(201).json({ message: 'Annonce créée', id: this.lastID });
      database.close();
    }
  );
});

// GET - Lister les annonces actives (pagination, max 20)
router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const category = req.query.category;

  let query = 'SELECT a.id, a.title, a.description, a.category, a.condition, a.exchange_type, a.desired_exchange, a.points_value, a.created_at, u.username FROM announcements a JOIN users u ON a.user_id = u.id WHERE a.is_active = 1';
  let params = [];

  if (category) {
    query += ' AND a.category = ?';
    params.push(category);
  }

  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const database = db();
  database.all(query, params, (err, announcements) => {
    if (err) {
      database.close();
      return res.status(500).json({ error: 'Erreur lors de la récupération' });
    }

    let countQuery = 'SELECT COUNT(*) as total FROM announcements WHERE is_active = 1';
    let countParams = [];
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    database.get(countQuery, countParams, (err, result) => {
      database.close();
      res.json({
        announcements,
        pagination: {
          page,
          total: result.total,
          pages: Math.ceil(result.total / limit)
        }
      });
    });
  });
});

// GET - Obtenir une annonce par ID
router.get('/:id', (req, res) => {
  const database = db();
  database.get(
    `SELECT a.*, u.username, u.email FROM announcements a 
     JOIN users u ON a.user_id = u.id 
     WHERE a.id = ? AND a.is_active = 1`,
    [req.params.id],
    (err, announcement) => {
      database.close();
      if (err || !announcement) {
        return res.status(404).json({ error: 'Annonce non trouvée' });
      }
      res.json(announcement);
    }
  );
});

// GET - Lister les annonces de l'utilisateur connecté
router.get('/user/my-announcements', requireAuth, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const database = db();
  database.all(
    'SELECT * FROM announcements WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [req.session.userId, limit, offset],
    (err, announcements) => {
      if (err) {
        database.close();
        return res.status(500).json({ error: 'Erreur lors de la récupération' });
      }

      database.get('SELECT COUNT(*) as total FROM announcements WHERE user_id = ?', [req.session.userId], (err, result) => {
        database.close();
        res.json({
          announcements,
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

// PUT - Modifier une annonce
router.put('/:id', requireAuth, (req, res) => {
  const { title, description, category, condition, exchange_type, desired_exchange, points_value } = req.body;

  const database = db();
  
  // Vérifier que l'annonce appartient à l'utilisateur
  database.get('SELECT user_id FROM announcements WHERE id = ?', [req.params.id], (err, announcement) => {
    if (err || !announcement) {
      database.close();
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    if (announcement.user_id !== req.session.userId) {
      database.close();
      return res.status(403).json({ error: 'Non autorisé' });
    }

    database.run(
      `UPDATE announcements SET 
       title = COALESCE(?, title),
       description = COALESCE(?, description),
       category = COALESCE(?, category),
       condition = COALESCE(?, condition),
       exchange_type = COALESCE(?, exchange_type),
       desired_exchange = COALESCE(?, desired_exchange),
       points_value = COALESCE(?, points_value),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title || null, description || null, category || null, condition || null, exchange_type || null, desired_exchange || null, points_value || null, req.params.id],
      function(err) {
        database.close();
        if (err) {
          return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
        }
        res.json({ message: 'Annonce mise à jour' });
      }
    );
  });
});

// DELETE - Supprimer une annonce
router.delete('/:id', requireAuth, (req, res) => {
  const database = db();

  database.get('SELECT user_id FROM announcements WHERE id = ?', [req.params.id], (err, announcement) => {
    if (err || !announcement) {
      database.close();
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    if (announcement.user_id !== req.session.userId) {
      database.close();
      return res.status(403).json({ error: 'Non autorisé' });
    }

    database.run(
      'DELETE FROM announcements WHERE id = ?',
      [req.params.id],
      function(err) {
        database.close();
        if (err) {
          return res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
        res.json({ message: 'Annonce supprimée' });
      }
    );
  });
});

module.exports = router;
