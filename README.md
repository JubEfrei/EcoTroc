# EcoTroc 🌱

Plateforme de troc écoresponsable permettant d'échanger des objets ou des points, conçue selon les principes du Green IT.

👉 **URL du site :** https://eco-troc-cyan.vercel.app/
👉 **Rapport :** [/docs/Rapport-Ecotroc.pdf](docs/Rapport-Ecotroc.pdf)
👉 **Github :** https://github.com/JubEfrei/EcoTroc/

---

## 👥 Équipe

| Nom             | Rôle        | GitHub    |
| ----------------| ----------- | --------- |
| Julien Casamian | Lead Dev    | @JubEfrei |
| Eham Abouzi     | Frontend    | @Babouzi  |
| Imrân Benessam  | Backend     | @imrnbnsm |
| Dorian Anguille | DevOps      | @Doriped  |
| Pascal Chen     | UX / Design | @maitoto  |

---

## ⚙️ Stack technique

* HTML5 / CSS3 natif → léger, sans framework
* JavaScript vanilla → sans dépendances frontend
* Node.js + Express → backend minimal
* Turso (LibSQL) → base SQLite serverless
* Vercel Blob → stockage d'images CDN
* bcrypt + sessions → authentification sécurisée

---

## 🚀 Installation

```bash
git clone https://github.com/JubEfrei/EcoTroc.git
cd EcoTroc
npm install
cp .env.example .env
npm start
```

Variables d'environnement :

```
TURSO_CONNECTION_URL=
TURSO_AUTH_TOKEN=
BLOB_READ_WRITE_TOKEN=
SESSION_SECRET=
```

---

## 🚀 Déploiement

```bash
vercel --prod
```

---

## 📁 Structure

```
frontend/         → UI (HTML, CSS, JS)
backend/
  routes/         → API Express
  middleware/     → auth
  database/       → init, schema, migrations
docs/             → rapport + captures
```

---

## 🔐 Fonctionnalités

### Utilisateurs
* Inscription / connexion / déconnexion
* Modification du profil et du mot de passe
* Suppression du compte

### Annonces
* CRUD complet avec image
* Compression automatique en WebP (~20 Ko)
* Pagination (4 par page)
* Filtrage par catégorie

### Échanges
* Troc (offre → acceptation propriétaire)
* Points (réservation immédiate)
* Système de réservation : l'annonce disparaît de l'accueil pendant la négociation
* Chat en temps réel entre les deux utilisateurs
* Double confirmation requise pour finaliser
* Annulation possible — l'annonce redevient disponible

---

## 🔒 Sécurité

* Mots de passe hachés avec bcrypt
* Requêtes SQL paramétrées (pas d'injection)
* Sessions sécurisées côté serveur
* Échappement HTML côté client (XSS)

---

## 🌿 Green IT

* Images compressées en WebP (~20 Ko)
* Lazy loading sur toutes les images
* < 100 Ko/page (hors images)
* Pagination pour limiter les requêtes
* Aucune dépendance frontend (pas de framework JS)

---

## 📡 API

### Users
```
POST   /api/users/register
POST   /api/users/login
POST   /api/users/logout
GET    /api/users/me
GET    /api/users/:id
PUT    /api/users/:id
PUT    /api/users/:id/password
DELETE /api/users/:id
```

### Announcements
```
GET    /api/announcements
GET    /api/announcements/user/my-announcements
GET    /api/announcements/:id
POST   /api/announcements
PUT    /api/announcements/:id
DELETE /api/announcements/:id
```

### Exchanges
```
POST   /api/exchanges
GET    /api/exchanges/my-active
GET    /api/exchanges/incoming
GET    /api/exchanges/:id/messages
POST   /api/exchanges/:id/messages
PUT    /api/exchanges/:id/confirm
PUT    /api/exchanges/:id/cancel
PUT    /api/exchanges/:id
```

---

## 🧪 Tests

* CRUD utilisateurs
* CRUD annonces
* Flux d'échange complet (points + troc)
* Authentification
* Lighthouse / EcoIndex

---

## 🧾 Git

* Branche `main`
* Commits conventionnels : `feat/`, `fix/`, `docs/`

---

## 📄 Docs

`/docs` → rapport + UML + captures d'écran

---

Projet académique EFREI 2026
