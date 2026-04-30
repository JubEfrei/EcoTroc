# Architecture EcoTroc

## 📐 Diagramme d'architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT (Navigateur)                    │
├──────────────────┬──────────────────┬──────────────────────┤
│  index.html      │   dashboard.html │  mentions-legales.html│
│  (7 Ko)          │   (8 Ko)         │  (2 Ko)              │
├──────────────────┼──────────────────┼──────────────────────┤
│          styles.css (2 Ko)                                  │
│          app.js (5 Ko)                                      │
└─────────────────────────────────────────────────────────────┘
                           ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              SERVEUR (Node.js + Express)                    │
├─────────────────────────────────────────────────────────────┤
│ Middleware:                                                 │
│  - body-parser (JSON)                                       │
│  - express-session (authentification)                       │
│  - static files (frontend)                                  │
├─────────────────────────────────────────────────────────────┤
│ Routes API:                                                 │
│  - /api/users (register, login, logout, CRUD)              │
│  - /api/announcements (CRUD, filtres)                       │
├─────────────────────────────────────────────────────────────┤
│ Base de données:                                            │
│  - SQLite (ecotroc.db)                                      │
│  - Tables: users, announcements, exchanges                 │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ Modèle de données (MLD)

### Table `users`
```sql
users (
  id: INTEGER PRIMARY KEY,           -- ID unique
  email: TEXT UNIQUE,                -- Email unique (indexé)
  password_hash: TEXT,               -- Hash bcryptjs
  username: TEXT UNIQUE,             -- Nom d'utilisateur
  points: INTEGER DEFAULT 0,         -- Points accumulés
  created_at: DATETIME,              -- Date création
  updated_at: DATETIME               -- Dernière modif
)
```

### Table `announcements`
```sql
announcements (
  id: INTEGER PRIMARY KEY,           -- ID unique
  user_id: INTEGER FK → users.id,    -- Créateur (indexé)
  title: TEXT,                       -- Titre de l'annonce
  description: TEXT,                -- Description longue
  category: TEXT,                    -- Catégorie (indexée)
  condition: TEXT,                   -- État (bon/très bon/acceptable)
  exchange_type: TEXT,               -- 'troc' ou 'points'
  desired_exchange: TEXT,            -- Texte libre pour troc
  points_value: INTEGER,             -- Valeur en points (si exchange_type='points')
  image_url: TEXT,                   -- URL image (optionnel)
  is_active: BOOLEAN DEFAULT 1,      -- Annonce active? (indexée)
  created_at: DATETIME,              -- Date création
  updated_at: DATETIME               -- Dernière modif
)
```

### Table `exchanges`
```sql
exchanges (
  id: INTEGER PRIMARY KEY,           -- ID unique
  announcement_id: INTEGER FK → announcements.id,
  requester_id: INTEGER FK → users.id,
  status: TEXT,                      -- 'pending', 'accepted', 'completed'
  created_at: DATETIME,              -- Date de la requête
  completed_at: DATETIME             -- Date de complétion
)
```

### Indices pour optimisation
```sql
-- Requêtes fréquentes optimisées
CREATE INDEX idx_announcements_user_id ON announcements(user_id);
CREATE INDEX idx_announcements_is_active ON announcements(is_active);
CREATE INDEX idx_announcements_category ON announcements(category);
CREATE INDEX idx_exchanges_announcement_id ON exchanges(announcement_id);
CREATE INDEX idx_exchanges_requester_id ON exchanges(requester_id);
CREATE INDEX idx_users_email ON users(email);
```

## 🔄 Diagramme cas d'utilisation

```
                    ┌────────────────┐
                    │   Utilisateur  │
                    └────────┬───────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
      ┌──────────┐    ┌─────────────┐  ┌──────────────┐
      │Inscription│    │  Connexion  │  │Parcourir les │
      └──────────┘    └─────────────┘  │  annonces    │
            │                │          └──────────────┘
            │                │                │
            ▼                ▼                ▼
      ┌─────────────────────────────────────────────┐
      │        Espace utilisateur connecté          │
      └──────────────┬──────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
  ┌──────────┐ ┌─────────────┐ ┌───────────┐
  │Voir profil│ │  Gérer mes  │ │Voir mes   │
  │Modifier   │ │  annonces   │ │ Points    │
  │Déconnexion│ │(CRUD)       │ │ Échanges  │
  └──────────┘ └─────────────┘ └───────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │Créer une │ │ Modifier │ │Supprimer │
  │ annonce  │ │ annonce  │ │ annonce  │
  └──────────┘ └──────────┘ └──────────┘
```

## 🔀 Diagramme de flux - Création d'annonce

```
Utilisateur
     │
     ├─ Remplir formulaire (titre, description, catégorie, type d'échange)
     │
     └─► Frontend JavaScript
         └─► Validation HTML5 (required, minlength)
             └─ OK? → Envoyer POST /api/announcements
             └─ KO? → Afficher erreur (couleur rouge)

Frontend
     │
     └─► Fetch POST avec JSON
         └─► Backend Express.js
             └─► Route: POST /api/announcements
                 │
                 ├─ Middleware: requireAuth (vérifier session)
                 │  └─ Pas de session? → Erreur 401
                 │
                 ├─ Validation serveur:
                 │  └─ titre et description requis? → Non → Erreur 400
                 │
                 ├─ Insert en BDD:
                 │  INSERT INTO announcements (user_id, title, ...)
                 │  └─ Erreur INSERT? → Erreur 500
                 │
                 └─ Réponse: { message, id }
                    │
                    └─► Frontend
                        └─ Afficher message succès (vert)
                           └─ Vider formulaire
                           └─ Actualiser liste "Mes annonces"
```

## 📋 Scénario complet: Troc entre deux utilisateurs

```
┌─────────────────────────────────────────────────────────────┐
│ Jour 1: Alice crée une annonce                             │
├─────────────────────────────────────────────────────────────┤
│ Alice → S'inscrit (alice@ex.com, pwd123456)                │
│ Alice → Crée annonce "Livre Python" (Type: Troc)          │
│   INSERT INTO announcements (user_id=1, title="Python",    │
│   exchange_type="troc", desired_exchange="Livre JS")       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Jour 2: Bob voit l'annonce et demande un échange          │
├─────────────────────────────────────────────────────────────┤
│ Bob → S'inscrit (bob@ex.com, pwd123456)                    │
│ Bob → Voit l'annonce "Livre Python" sur l'accueil         │
│ Bob → Clique "Proposer un échange"                         │
│   [Future feature: crée une demande dans table exchanges]  │
│   INSERT INTO exchanges (announcement_id=1,                │
│   requester_id=2, status="pending")                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Jour 3: Alice accepte et l'échange se fait                │
├─────────────────────────────────────────────────────────────┤
│ Alice → Voit la demande de Bob                              │
│ Alice → Accepte (contact privé éventuel)                    │
│ UPDATE exchanges SET status="completed"                     │
│ → Échange effectué (hors plateforme)                        │
│                                                              │
│ [Future feature: système de ratings/points]                │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Fluxe d'authentification

```
1. INSCRIPTION
   ┌──────────────────────────────────────────┐
   │ POST /api/users/register                 │
   │ Body: { email, username, password }      │
   └──────────────────────────────────────────┘
   │
   ├─ Validation: email format, pwd length
   │
   ├─ Hash: bcryptjs.hashSync(password, 10)
   │  → $2a$10$...
   │
   ├─ INSERT INTO users (email, username, password_hash)
   │
   └─ req.session.userId = user.id
      ✓ Session créée dans Redis/mémoire

2. CONNEXION
   ┌──────────────────────────────────────────┐
   │ POST /api/users/login                    │
   │ Body: { email, password }                │
   └──────────────────────────────────────────┘
   │
   ├─ SELECT password_hash FROM users WHERE email=?
   │
   ├─ bcryptjs.compareSync(password, password_hash)
   │  ✓ Correspond? → Créer session
   │  ✗ Non? → Erreur 401
   │
   └─ req.session.userId = user.id

3. REQUÊTE AUTHENTIFIÉE
   ┌──────────────────────────────────────────┐
   │ GET /api/users/me (avec session)         │
   └──────────────────────────────────────────┘
   │
   ├─ Middleware requireAuth:
   │  if (!req.session.userId) → Erreur 401
   │
   └─ SELECT * FROM users WHERE id=?
      ✓ Retourner profil

4. DÉCONNEXION
   ┌──────────────────────────────────────────┐
   │ POST /api/users/logout                   │
   │ req.session.destroy()                    │
   └──────────────────────────────────────────┘
   │
   └─ Session supprimée
      ✓ Utilisateur déconnecté
```

## 🌐 Endpoints API complets

### Utilisateurs
```
POST   /api/users/register
       Body: { email, username, password }
       Response: { message, userId }
       Status: 201

POST   /api/users/login
       Body: { email, password }
       Response: { message, userId }
       Status: 200

POST   /api/users/logout
       Response: { message }
       Status: 200

GET    /api/users/me
       Required: Authenticated session
       Response: { id, email, username, points, created_at }
       Status: 200/401

GET    /api/users?page=1
       Response: { users: [], pagination: {} }
       Status: 200

GET    /api/users/:id
       Response: { id, username, points, created_at }
       Status: 200/404

PUT    /api/users/:id
       Required: Authenticated + owner
       Body: { username, email }
       Response: { message }
       Status: 200/403

DELETE /api/users/:id
       Required: Authenticated + owner
       Response: { message }
       Status: 200/403
```

### Annonces
```
GET    /api/announcements?page=1&category=livres
       Response: { announcements: [], pagination: {} }
       Status: 200

GET    /api/announcements/:id
       Response: { id, title, ..., username, email }
       Status: 200/404

POST   /api/announcements
       Required: Authenticated
       Body: { title, description, category, condition, exchange_type, desired_exchange, points_value }
       Response: { message, id }
       Status: 201/401

PUT    /api/announcements/:id
       Required: Authenticated + creator
       Body: { title, description, ... }
       Response: { message }
       Status: 200/403

DELETE /api/announcements/:id
       Required: Authenticated + creator
       Response: { message }
       Status: 200/403

GET    /api/announcements/user/my-announcements?page=1
       Required: Authenticated
       Response: { announcements: [], pagination: {} }
       Status: 200/401
```

## 🚀 Déploiement

```
Local Development:
  npm install
  npm start
  → http://localhost:3000

Production (Vercel):
  vercel deploy --prod
  → https://ecotroc.vercel.app

Production (Render):
  - Connecter GitHub repo
  - Build: npm install
  - Start: npm start
  - → https://ecotroc.onrender.com
```

---

**Dernière mise à jour:** 30 avril 2026
