# 📦 Structure complète du projet EcoTroc

## Vue d'ensemble

```
EcoTroc/ (racine du projet)
├── 📄 README.md                    # Documentation principale
├── 📄 package.json                 # Dépendances npm (6 seulement)
├── 📄 .env.example                 # Template de configuration
├── 📄 .gitignore                   # Ignore .env et node_modules
│
├── 🌐 frontend/                    # Code client (HTML/CSS/JS natif)
│   ├── 📄 index.html               # Page d'accueil (7 KB)
│   ├── 📄 dashboard.html           # Espace utilisateur (8 KB)
│   ├── 📄 mentions-legales.html    # Mentions légales (2 KB)
│   ├── 📄 styles.css               # Styles unifiés (2 KB minifié)
│   └── 📄 app.js                   # JavaScript minimaliste (5 KB minifié)
│
├── ⚙️ backend/                     # Code serveur (Node.js + Express)
│   ├── 📄 app.js                   # Serveur Express + middlewares
│   │
│   ├── routes/                     # Routes API
│   │   ├── 📄 users.js             # CRUD utilisateurs (register, login, ...)
│   │   └── 📄 announcements.js     # CRUD annonces (create, list, update, delete)
│   │
│   ├── middleware/                 # Middlewares
│   │   └── 📄 auth.js              # Authentication + error handling
│   │
│   └── database/                   # Gestion base de données
│       ├── 📄 init.js              # Initialisation et connexion
│       └── 📄 schema.sql           # Schéma SQLite complet
│
└── 📚 docs/                        # Documentation complète
    ├── 📄 ARCHITECTURE.md          # Diagrammes & architecture
    ├── 📄 GREEN_IT.md              # Justifications éco-conception
    ├── 📄 TESTING.md               # Guide des tests complet
    └── 📄 ROADMAP.md               # Feuille de route et checklist
```

---

## 📊 Tailles des fichiers

```
Frontend (Production):
  - index.html      ~7 KB
  - dashboard.html  ~8 KB
  - styles.css      ~2 KB (minifié)
  - app.js          ~5 KB (minifié)
  ───────────────────────
  Total:            ~22 KB (gzippé: ~7 KB)

Backend:
  - package.json    ~1 KB
  - app.js          ~3 KB
  - routes/*        ~8 KB
  - middleware/*    ~1 KB
  - database/*      ~3 KB
  ───────────────────────
  Total:            ~16 KB

Dépendances npm:
  - node_modules/   ~50 MB (développement)
  - Production:     ~20 MB (sans devDeps)
```

---

## 🎯 Fonctionnalités par fichier

### Frontend

#### `index.html`
- Page d'accueil affichant les annonces
- Modal d'authentification (connexion/inscription)
- Affichage des annonces par page (20 max)
- Filtrage par catégorie
- Navigation responsive

#### `dashboard.html`
- Espace utilisateur après connexion
- Affichage du profil (email, points, nom d'utilisateur)
- Gestion des annonces (liste, créer, modifier, supprimer)
- Formulaire de création d'annonce
- Page protégée (redirection si pas connecté)

#### `styles.css`
- Design minimaliste et sobre
- Palette couleur: 3 couleurs seulement
- Responsive design (mobile-first)
- Support du mode sombre (prefers-color-scheme)
- Respect des préférences d'animation (prefers-reduced-motion)
- Grid CSS natif (zéro Tailwind/Bootstrap)

#### `app.js`
- Gestion de l'authentification
- Chargement et affichage des annonces
- Filtrage et pagination
- Communication API
- Gestion de session côté client
- Sécurité: échappement HTML (XSS prevention)

#### `mentions-legales.html`
- Mentions légales obligatoires
- Conditions d'utilisation
- Politique de confidentialité

### Backend

#### `backend/app.js`
- Initialisation du serveur Express
- Configuration des middlewares
- Routing principal
- Statique files (serve frontend)
- Gestion des erreurs globales

#### `backend/routes/users.js`
```
Endpoints:
  POST   /api/users/register      → Créer utilisateur
  POST   /api/users/login         → Se connecter
  POST   /api/users/logout        → Se déconnecter
  GET    /api/users/me            → Profil actuel
  GET    /api/users               → Lister utilisateurs (pagination)
  GET    /api/users/:id           → Profil public
  PUT    /api/users/:id           → Modifier profil
  DELETE /api/users/:id           → Supprimer compte
```

#### `backend/routes/announcements.js`
```
Endpoints:
  POST   /api/announcements       → Créer annonce
  GET    /api/announcements       → Lister (pagination + filtres)
  GET    /api/announcements/:id   → Détail annonce
  PUT    /api/announcements/:id   → Modifier annonce
  DELETE /api/announcements/:id   → Supprimer annonce
  GET    /api/announcements/user/my-announcements → Mes annonces
```

#### `backend/middleware/auth.js`
- `requireAuth()`: Vérifie l'authentification
- `errorHandler()`: Gestion globale des erreurs

#### `backend/database/schema.sql`
3 tables:
- `users`: Utilisateurs (email, password_hash, username, points)
- `announcements`: Annonces (title, description, category, etc.)
- `exchanges`: Historique des échanges (future feature)

#### `backend/database/init.js`
- Connexion SQLite
- Création automatique du schéma au démarrage
- Exports: `initDatabase()`, `getDatabase()`

---

## 📈 Flux de données

### Nouvelle annonce (exemple complet)

```
Frontend (app.js)
  └─ handleCreateAnnouncement()
     └─ POST /api/announcements
        Body: { title, description, category, ... }
        Headers: { Content-Type: application/json }
        
Backend (routes/announcements.js)
  └─ router.post('/', requireAuth, (req, res) => {
     ├─ Validation: titre et description requis
     ├─ INSERT INTO announcements (user_id, title, ...)
     │  Values: [req.session.userId, ...]
     └─ Response: { message, id }
        Status: 201
        
Frontend
  └─ Parse JSON response
     └─ Afficher message succès
     └─ Rafraîchir liste "Mes annonces"
```

---

## 🔐 Sécurité par couche

### Frontend
- ✅ Validation HTML5 (required, minlength)
- ✅ Échappement HTML (fonction escapeHtml)
- ✅ Pas de localStorage pour tokens (localStorage pirate-able)
- ✅ Sessions HTTP-only

### Backend
- ✅ Validation serveur systématique
- ✅ Requêtes paramétrées (pas de concaténation SQL)
- ✅ Hashage bcryptjs (10 rounds)
- ✅ Sessions sécurisées (httpOnly, secure, sameSite)
- ✅ Middleware d'authentification sur routes protégées

### Base de données
- ✅ Pas de SELECT * (colonnes spécifiques)
- ✅ Indices sur colonnes fréquemment interrogées
- ✅ Contraintes UNIQUE sur email et username
- ✅ Foreign keys avec CASCADE

---

## 🚀 Pour démarrer

### 1. Installation locale
```bash
cd c:\Users\jubos\OneDrive\Desktop\ProjetEfrei\EcoTroc
npm install
cp .env.example .env
npm start
```

### 2. Accéder à l'app
```
http://localhost:3000
```

### 3. Tester
- Inscription: Créer nouveau compte
- Créer annonce: Aller dans "Mon compte"
- Voir annonces: Revenir à l'accueil
- Filtrer: Sélectionner une catégorie

---

## 📚 Documentation à consulter

1. **README.md** → Vue d'ensemble du projet
2. **docs/ARCHITECTURE.md** → Diagrammes et schémas
3. **docs/GREEN_IT.md** → Justifications éco-conception
4. **docs/TESTING.md** → Guide des tests complet
5. **docs/ROADMAP.md** → Feuille de route et checklist

---

## 🎯 Prochaines étapes

### Court terme (cette semaine)
1. [ ] Tester l'app localement
2. [ ] Mesurer les performances (Lighthouse, EcoIndex)
3. [ ] Initialiser Git avec branches
4. [ ] Commencer les tests fonctionnels

### Moyen terme (2 semaines)
1. [ ] Déployer en production
2. [ ] Implémenter système d'échanges
3. [ ] Documenter dans rapport PDF
4. [ ] Préparer la présentation

### Long terme (optionnel)
1. [ ] Système de notifications
2. [ ] Messagerie privée
3. [ ] Géolocalisation
4. [ ] API mobile

---

## ✅ Checklist finale

Avant de commencer à développer:

- [ ] Lire README.md
- [ ] Comprendre l'architecture (ARCHITECTURE.md)
- [ ] Installer localement et tester
- [ ] Créer compte Git
- [ ] Cloner et faire un premier commit
- [ ] Consulter TESTING.md pour débuter les tests

---

**Créé le:** 30 avril 2026  
**Version:** 1.0.0  
**Statut:** Prêt pour développement
