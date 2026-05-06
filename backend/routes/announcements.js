const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { put, del } = require('@vercel/blob');

// Keep file in memory — no disk write needed before Blob upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

async function uploadAnnouncementImage(reqFile) {
  if (!reqFile) return null;

  const ext = path.extname(reqFile.originalname).toLowerCase() || '.jpg';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`announcements/${filename}`, reqFile.buffer, {
      access: 'public',
      contentType: reqFile.mimetype
    });
    return blob.url; // permanent CDN URL, e.g. https://xxx.public.blob.vercel-storage.com/...
  }

  // Local development fallback: write to disk
  const localDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(path.join(localDir, filename), reqFile.buffer);
  return `/uploads/${filename}`;
}

// POST - Créer une nouvelle annonce
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const { title, description, category, condition, exchange_type, desired_exchange, points_value } = req.body;

  if (!title || !description || !category || !exchange_type) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  let image_url = null;
  if (req.file) {
    image_url = await uploadAnnouncementImage(req.file);
  }

  const pointsValue = points_value ? parseInt(points_value, 10) : null;

  try {
    const result = await db.run(
      `INSERT INTO announcements
      (user_id, title, description, category, condition, exchange_type, desired_exchange, points_value, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.session.userId, title, description, category, condition || 'bon_etat', exchange_type, desired_exchange || null, pointsValue, image_url]
    );

    // Récupérer l'ID de l'annonce créée
    let insertId = result.lastInsertRowid;
    if (insertId === undefined || insertId === null) {
      insertId = result.insertId ?? result.lastID;
    }

    if (insertId === undefined || insertId === null) {
      const idResult = await db.get('SELECT last_insert_rowid() as id');
      insertId = idResult ? idResult.id : null;
    }

    if (typeof insertId === 'bigint') {
      insertId = Number(insertId);
    }
    if (typeof insertId === 'string' && !Number.isNaN(Number(insertId))) {
      insertId = Number(insertId);
    }

    res.status(201).json({ message: 'Annonce créée', id: insertId });
  } catch (err) {
    console.error('Erreur lors de la création de l\'annonce:', err);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// GET - Lister les annonces de l'utilisateur connecté (must be before /:id route)
router.get('/user/my-announcements', requireAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const announcements = await db.all(
      'SELECT id, title, description, category, condition, exchange_type, desired_exchange, points_value, image_url, created_at FROM announcements WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.session.userId, limit, offset]
    );
    const count = await db.get('SELECT COUNT(*) as total FROM announcements WHERE user_id = ? AND is_active = 1', [req.session.userId]);

    res.json({
      announcements,
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

// GET - Obtenir une annonce par ID
router.get('/:id', async (req, res) => {
  try {
    const announcement = await db.get(
      `SELECT a.*, u.username, u.email FROM announcements a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = ? AND a.is_active = 1`,
      [req.params.id]
    );

    if (!announcement) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// GET - Lister les annonces actives (pagination, 4 par page)
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 4;
  const offset = (page - 1) * limit;
  const category = req.query.category;

  let query = 'SELECT a.id, a.user_id, a.title, a.description, a.category, a.condition, a.exchange_type, a.desired_exchange, a.points_value, a.image_url, a.created_at, u.username FROM announcements a JOIN users u ON a.user_id = u.id WHERE a.is_active = 1';
  const params = [];

  if (category) {
    query += ' AND a.category = ?';
    params.push(category);
  }

  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  try {
    const announcements = await db.all(query, params);
    const countQuery = category
      ? 'SELECT COUNT(*) as total FROM announcements WHERE is_active = 1 AND category = ?'
      : 'SELECT COUNT(*) as total FROM announcements WHERE is_active = 1';
    const countParams = category ? [category] : [];
    const count = await db.get(countQuery, countParams);

    res.json({
      announcements,
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

// PUT - Modifier une annonce
router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
  const { title, description, category, condition, exchange_type, desired_exchange, points_value } = req.body;

  try {
    const announcement = await db.get('SELECT user_id FROM announcements WHERE id = ?', [req.params.id]);
    if (!announcement) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }
    if (Number(announcement.user_id) !== Number(req.session.userId)) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    let image_url = null;
    if (req.file) {
      image_url = await uploadAnnouncementImage(req.file);
    }

    const pointsValue = points_value ? parseInt(points_value, 10) : null;

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (condition !== undefined) {
      updates.push('condition = ?');
      params.push(condition);
    }
    if (exchange_type !== undefined) {
      updates.push('exchange_type = ?');
      params.push(exchange_type);
    }
    if (desired_exchange !== undefined) {
      updates.push('desired_exchange = ?');
      params.push(desired_exchange);
    }
    if (pointsValue !== undefined) {
      updates.push('points_value = ?');
      params.push(pointsValue);
    }
    if (image_url !== null) {
      updates.push('image_url = ?');
      params.push(image_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification fournie' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    await db.run(
      `UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Annonce mise à jour' });
  } catch (err) {
    console.error('Erreur lors de la mise à jour:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// DELETE - Supprimer une annonce
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const announcement = await db.get('SELECT user_id, image_url FROM announcements WHERE id = ?', [req.params.id]);
    if (!announcement) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }
    if (Number(announcement.user_id) !== Number(req.session.userId)) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    await db.run('DELETE FROM announcements WHERE id = ?', [req.params.id]);

    // Supprimer l'image Vercel Blob si elle existe
    if (announcement.image_url && announcement.image_url.includes('vercel-storage.com')) {
      try { await del(announcement.image_url); } catch (_) {}
    }

    res.json({ message: 'Annonce supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
