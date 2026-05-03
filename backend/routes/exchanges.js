const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');

// POST - Créer un échange (points ou troc)
router.post('/', requireAuth, async (req, res) => {
  const { announcement_id, offer_item } = req.body;
  const requesterId = req.session.userId;

  if (!announcement_id) {
    return res.status(400).json({ error: 'announcement_id requis' });
  }

  try {
    const announcement = await db.get(
      'SELECT * FROM announcements WHERE id = ? AND is_active = 1',
      [announcement_id]
    );

    if (!announcement) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    if (Number(announcement.user_id) === Number(requesterId)) {
      return res.status(400).json({ error: 'Vous ne pouvez pas échanger avec vous-même' });
    }

    if (announcement.exchange_type === 'points') {
      const requester = await db.get('SELECT points FROM users WHERE id = ?', [requesterId]);

      if (!requester || Number(requester.points) < Number(announcement.points_value)) {
        return res.status(400).json({
          error: `Points insuffisants. Vous avez ${requester ? requester.points : 0} point(s), il en faut ${announcement.points_value}.`
        });
      }

      await db.run('UPDATE users SET points = points - ? WHERE id = ?', [announcement.points_value, requesterId]);
      await db.run('UPDATE users SET points = points + ? WHERE id = ?', [announcement.points_value, announcement.user_id]);
      await db.run(
        "INSERT INTO exchanges (announcement_id, requester_id, status, completed_at) VALUES (?, ?, 'completed', CURRENT_TIMESTAMP)",
        [announcement_id, requesterId]
      );
      await db.run('UPDATE announcements SET is_active = 0 WHERE id = ?', [announcement_id]);

      return res.json({ message: `Échange réalisé ! ${announcement.points_value} point(s) transféré(s).` });
    }

    // Troc
    if (!offer_item || !offer_item.trim()) {
      return res.status(400).json({ error: 'Veuillez décrire ce que vous proposez en échange' });
    }

    const existing = await db.get(
      "SELECT id FROM exchanges WHERE announcement_id = ? AND requester_id = ? AND status = 'pending'",
      [announcement_id, requesterId]
    );

    if (existing) {
      return res.status(400).json({ error: 'Vous avez déjà une demande en attente pour cette annonce' });
    }

    await db.run(
      "INSERT INTO exchanges (announcement_id, requester_id, offer_item, status) VALUES (?, ?, ?, 'pending')",
      [announcement_id, requesterId, offer_item.trim()]
    );

    return res.status(201).json({ message: "Proposition envoyée ! Le propriétaire de l'annonce la recevra." });
  } catch (err) {
    console.error('Erreur échange:', err);
    res.status(500).json({ error: "Erreur lors de l'échange" });
  }
});

// GET - Demandes d'échange reçues sur mes annonces
router.get('/incoming', requireAuth, async (req, res) => {
  try {
    const exchanges = await db.all(
      `SELECT e.id, e.offer_item, e.status, e.created_at,
              a.title as announcement_title, a.id as announcement_id,
              u.username as requester_username, u.email as requester_email
       FROM exchanges e
       JOIN announcements a ON e.announcement_id = a.id
       JOIN users u ON e.requester_id = u.id
       WHERE a.user_id = ? AND e.status = 'pending'
       ORDER BY e.created_at DESC`,
      [req.session.userId]
    );
    res.json({ exchanges });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// PUT - Accepter ou refuser une demande de troc
router.put('/:id', requireAuth, async (req, res) => {
  const { action } = req.body;
  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action invalide (accept ou reject)' });
  }

  try {
    const exchange = await db.get(
      `SELECT e.*, a.user_id as owner_id
       FROM exchanges e
       JOIN announcements a ON e.announcement_id = a.id
       WHERE e.id = ?`,
      [req.params.id]
    );

    if (!exchange) {
      return res.status(404).json({ error: 'Échange non trouvé' });
    }

    if (Number(exchange.owner_id) !== Number(req.session.userId)) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    if (action === 'reject') {
      await db.run('DELETE FROM exchanges WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Demande refusée' });
    }

    // Accept: complete this exchange, deactivate announcement, remove other pending requests
    await db.run(
      "UPDATE exchanges SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
      [req.params.id]
    );
    await db.run('UPDATE announcements SET is_active = 0 WHERE id = ?', [exchange.announcement_id]);
    await db.run(
      "DELETE FROM exchanges WHERE announcement_id = ? AND id != ? AND status = 'pending'",
      [exchange.announcement_id, req.params.id]
    );

    res.json({ message: 'Échange accepté !' });
  } catch (err) {
    console.error('Erreur réponse échange:', err);
    res.status(500).json({ error: "Erreur lors de la réponse" });
  }
});

module.exports = router;
