# EcoTroc 🌱

Plateforme de troc écoresponsable permettant d’échanger des objets ou des points, conçue selon les principes du Green IT.

👉 **URL du site :** https://eco-troc-cyan.vercel.app/
👉 **Rapport :** [/docs/Rapport-Ecotroc.pdf](docs/Rapport-Ecotroc.pdf)

---

## 👥 Équipe

| Nom         | Rôle     | GitHub    |
| ----------- | -------- | --------- |
| À compléter | Lead Dev | @JubEfrei |
| À compléter | Frontend | @Babouzi |
| À compléter | Backend  | @imrnbnsm |
| À compléter | DevOps   | @Doriped |

---

## ⚙️ Stack technique

* HTML5 / CSS3 natif → léger
* JavaScript vanilla → sans dépendances
* Node.js + Express → backend minimal
* Turso (LibSQL) → base serverless
* bcrypt + sessions → auth sécurisée

---

## 🚀 Installation

```bash
git clone <repo>
cd EcoTroc
npm install
cp .env.example .env
npm start
```

Variables d'envirnoment :

```
TURSO_DATABASE_URL
TURSO_API_KEY
SESSION_SECRET
```

---

## 🚀 Déploiement

```bash
vercel --prod
```

---

## 📁 Structure

```
frontend/   → UI
backend/    → API
database/   → SQL
docs/       → rapport
```

---

## 🔐 Fonctionnalités

### Utilisateurs

* Inscription / connexion
* Profil
* Modification
* Suppression

### Annonces

* CRUD complet
* Pagination (20 max)
* Filtrage

---

## 🔒 Sécurité

* bcrypt
* requêtes SQL paramétrées
* sessions sécurisées

---

## 🌿 Green IT

* < 500 Ko/page
* < 15 requêtes HTTP
* Lighthouse > 80

---

## 📡 API

### Users

```
POST /api/users/register
POST /api/users/login
GET  /api/users/me
PUT  /api/users/:id
DELETE /api/users/:id
```

### Announcements

```
GET  /api/announcements
POST /api/announcements
PUT  /api/announcements/:id
DELETE /api/announcements/:id
```

---

## 🧪 Tests

* CRUD utilisateurs
* CRUD annonces
* Auth
* Lighthouse / EcoIndex

---

## 🧾 Git

* main / develop
* feat/* fix/*
* commits clairs

---

## 📄 Docs

/docs → rapport + UML + captures

---

Projet académique EFREI 2026
