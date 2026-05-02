require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { initDatabase } = require('./database/init');
const { errorHandler } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialiser la base de données au démarrage
initDatabase().catch(err => {
  console.error('Erreur fatale lors de l\'initialisation:', err);
  process.exit(1);
});

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Routes API
app.use('/api/users', require('./routes/users'));
app.use('/api/announcements', require('./routes/announcements'));

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

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✓ EcoTroc est lancé sur http://localhost:${PORT}`);
  console.log(`✓ Environnement: ${process.env.NODE_ENV || 'development'}`);
});
