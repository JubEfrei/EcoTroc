const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');

// POST - Initier un échange (points → réservation immédiate, troc → offre en attente)
router.post('/', requireAuth, async (req, res) => {
  const { announcement_id, offer_item } = req.body;
  const requesterId = req.session.userId;

  if (!announcement_id) {
    return res.status(400).json({ error: 'announcement_id requis' });
  }

  try {
    const announcement = await db.get(
      'SELECT * FROM announcements WHERE id = ? AND is_active = 1 AND is_reserved = 0',
      [announcement_id]
    );

    if (!announcement) {
      return res.status(404).json({ error: 'Annonce non trouvée ou déjà réservée' });
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

      const result = await db.run(
        "INSERT INTO exchanges (announcement_id, requester_id, status) VALUES (?, ?, 'reserved')",
        [announcement_id, requesterId]
      );
      let exchangeId = result.lastInsertRowid;
      if (typeof exchangeId === 'bigint') exchangeId = Number(exchangeId);

      await db.run('UPDATE announcements SET is_reserved = 1 WHERE id = ?', [announcement_id]);

      return res.status(201).json({
        message: 'Annonce réservée ! Un chat est maintenant ouvert pour finaliser l\'échange.',
        exchange_id: exchangeId
      });
    }

    // Troc — l'offre est en attente d'acceptation du propriétaire
    if (!offer_item || !offer_item.trim()) {
      return res.status(400).json({ error: 'Veuillez décrire ce que vous proposez en échange' });
    }

    const existing = await db.get(
      "SELECT id FROM exchanges WHERE announcement_id = ? AND requester_id = ? AND status IN ('pending', 'reserved')",
      [announcement_id, requesterId]
    );

    if (existing) {
      return res.status(400).json({ error: 'Vous avez déjà une demande en cours pour cette annonce' });
    }

    const result = await db.run(
      "INSERT INTO exchanges (announcement_id, requester_id, offer_item, status) VALUES (?, ?, ?, 'pending')",
      [announcement_id, requesterId, offer_item.trim()]
    );
    let exchangeId = result.lastInsertRowid;
    if (typeof exchangeId === 'bigint') exchangeId = Number(exchangeId);

    return res.status(201).json({
      message: "Proposition envoyée ! Le propriétaire de l'annonce la recevra.",
      exchange_id: exchangeId
    });
  } catch (err) {
    console.error('Erreur échange:', err);
    res.status(500).json({ error: "Erreur lors de l'échange" });
  }
});

// GET - Mes échanges actifs (reserved) — comme requester OU propriétaire
router.get('/my-active', requireAuth, async (req, res) => {
  try {
    const exchanges = await db.all(
      `SELECT e.id, e.announcement_id, e.offer_item, e.status,
              e.confirmed_by_requester, e.confirmed_by_owner, e.created_at,
              e.requester_id,
              a.title as announcement_title, a.exchange_type, a.points_value,
              a.user_id as owner_id,
              u_owner.username as owner_username,
              u_req.username as requester_username
       FROM exchanges e
       JOIN announcements a ON e.announcement_id = a.id
       JOIN users u_owner ON a.user_id = u_owner.id
       JOIN users u_req ON e.requester_id = u_req.id
       WHERE e.status = 'reserved'
         AND (a.user_id = ? OR e.requester_id = ?)
       ORDER BY e.created_at DESC`,
      [req.session.userId, req.session.userId]
    );
    res.json({ exchanges });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// GET - Demandes de troc en attente sur mes annonces
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

// GET - Messages d'un échange
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const exchange = await db.get(
      `SELECT e.*, a.user_id as owner_id FROM exchanges e
       JOIN announcements a ON e.announcement_id = a.id
       WHERE e.id = ?`,
      [req.params.id]
    );

    if (!exchange) return res.status(404).json({ error: 'Échange non trouvé' });

    const userId = Number(req.session.userId);
    if (Number(exchange.owner_id) !== userId && Number(exchange.requester_id) !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const messages = await db.all(
      `SELECT m.id, m.content, m.created_at, m.sender_id, u.username as sender_username
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.exchange_id = ?
       ORDER BY m.created_at ASC`,
      [req.params.id]
    );

    res.json({ messages, exchange });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
});

// POST - Envoyer un message
router.post('/:id/messages', requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message vide' });
  }

  try {
    const exchange = await db.get(
      `SELECT e.*, a.user_id as owner_id FROM exchanges e
       JOIN announcements a ON e.announcement_id = a.id
       WHERE e.id = ? AND e.status = 'reserved'`,
      [req.params.id]
    );

    if (!exchange) return res.status(404).json({ error: 'Échange non trouvé ou inactif' });

    const userId = Number(req.session.userId);
    if (Number(exchange.owner_id) !== userId && Number(exchange.requester_id) !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    await db.run(
      'INSERT INTO messages (exchange_id, sender_id, content) VALUES (?, ?, ?)',
      [req.params.id, userId, content.trim()]
    );

    res.status(201).json({ message: 'Message envoyé' });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'envoi du message" });
  }
});

// PUT - Confirmer un échange (les deux utilisateurs doivent confirmer)
router.put('/:id/confirm', requireAuth, async (req, res) => {
  try {
    const exchange = await db.get(
      `SELECT e.*, a.user_id as owner_id, a.exchange_type, a.points_value, a.id as ann_id
       FROM exchanges e
       JOIN announcements a ON e.announcement_id = a.id
       WHERE e.id = ? AND e.status = 'reserved'`,
      [req.params.id]
    );

    if (!exchange) return res.status(404).json({ error: 'Échange non trouvé ou inactif' });

    const userId = Number(req.session.userId);
    const isOwner = Number(exchange.owner_id) === userId;
    const isRequester = Number(exchange.requester_id) === userId;

    if (!isOwner && !isRequester) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    if (isRequester) {
      await db.run('UPDATE exchanges SET confirmed_by_requester = 1 WHERE id = ?', [req.params.id]);
    }
    if (isOwner) {
      await db.run('UPDATE exchanges SET confirmed_by_owner = 1 WHERE id = ?', [req.params.id]);
    }

    const updated = await db.get(
      'SELECT confirmed_by_requester, confirmed_by_owner FROM exchanges WHERE id = ?',
      [req.params.id]
    );

    if (Number(updated.confirmed_by_requester) === 1 && Number(updated.confirmed_by_owner) === 1) {
      // Les deux ont confirmé — compléter l'échange
      if (exchange.exchange_type === 'points') {
        await db.run('UPDATE users SET points = points - ? WHERE id = ?', [exchange.points_value, exchange.requester_id]);
        await db.run('UPDATE users SET points = points + ? WHERE id = ?', [exchange.points_value, exchange.owner_id]);
      }
      await db.run(
        "UPDATE exchanges SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
        [req.params.id]
      );
      await db.run(
        'UPDATE announcements SET is_active = 0, is_reserved = 0 WHERE id = ?',
        [exchange.announcement_id]
      );
      return res.json({ message: 'Échange complété avec succès !', completed: true });
    }

    res.json({ message: "Confirmation enregistrée. En attente de la confirmation de l'autre utilisateur.", completed: false });
  } catch (err) {
    console.error('Erreur confirmation:', err);
    res.status(500).json({ error: 'Erreur lors de la confirmation' });
  }
});

// PUT - Annuler un échange (l'annonce redevient disponible)
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const exchange = await db.get(
      `SELECT e.*, a.user_id as owner_id FROM exchanges e
       JOIN announcements a ON e.announcement_id = a.id
       WHERE e.id = ? AND e.status = 'reserved'`,
      [req.params.id]
    );

    if (!exchange) return res.status(404).json({ error: 'Échange non trouvé ou inactif' });

    const userId = Number(req.session.userId);
    if (Number(exchange.owner_id) !== userId && Number(exchange.requester_id) !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    await db.run("UPDATE exchanges SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    await db.run('UPDATE announcements SET is_reserved = 0 WHERE id = ?', [exchange.announcement_id]);

    res.json({ message: "Échange annulé. L'annonce est à nouveau disponible." });
  } catch (err) {
    console.error('Erreur annulation:', err);
    res.status(500).json({ error: "Erreur lors de l'annulation" });
  }
});

// PUT - Accepter ou refuser une offre de troc (pending → reserved ou supprimé)
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
       WHERE e.id = ? AND e.status = 'pending'`,
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

    // Accepter → passer en état réservé, supprimer les autres offres en attente
    await db.run("UPDATE exchanges SET status = 'reserved' WHERE id = ?", [req.params.id]);
    await db.run('UPDATE announcements SET is_reserved = 1 WHERE id = ?', [exchange.announcement_id]);
    await db.run(
      "DELETE FROM exchanges WHERE announcement_id = ? AND id != ? AND status = 'pending'",
      [exchange.announcement_id, req.params.id]
    );

    res.json({ message: "Échange accepté ! Un chat est maintenant ouvert.", exchange_id: Number(req.params.id) });
  } catch (err) {
    console.error('Erreur réponse échange:', err);
    res.status(500).json({ error: "Erreur lors de la réponse" });
  }
});

module.exports = router;
