# EcoTroc 🌱

**Plateforme de troc écoresponsable - Numérique Durable (TI616)**

EcoTroc est un site web de troc minimaliste, rapide et écologique permettant aux utilisateurs d'échanger des objets ou des points de manière responsable.

## 🌍 Objectif Green IT

Ce projet met en application les principes d'éco-conception web :
- **HTML5/CSS3 natif** : Zéro framework CSS lourd
- **JavaScript minimaliste** : Uniquement pour l'interactivité essentielle
- **SQLite local** : Base de données légère
- **Poids optimisé** : Cible < 200 Ko par page
- **API REST sobre** : Requêtes minimales et optimisées

## 📋 Stack technique

| Composant | Technologie | Justification Green IT |
|-----------|-------------|----------------------|
| Frontend | HTML5, CSS3 natif | Aucun framework inutile, performances optimales |
| JS Frontend | JavaScript vanilla | Minimal, ~5 Ko, zero dépendances |
| Backend | Node.js + Express | Léger, performant, pas de framework lourd |
| Base de données | SQLite | Déploiement simple, zero serveur nécessaire |
| Authentification | bcryptjs + sessions | Sécurité sans dépendances externes |
| Dépendances | 6 uniquement | Minimalisme assumé |

## 🚀 Installation locale

### Prérequis
- Node.js >= 14
- npm

### Étapes

```bash
# 1. Cloner le projet
git clone <url-repo>
cd EcoTroc

# 2. Installer les dépendances
npm install

# 3. Copier et configurer .env
cp .env.example .env
# Éditer .env si nécessaire (port, secrets)

# 4. Démarrer le serveur
npm start
```


## 📁 Structure du projet

```
EcoTroc/
├── frontend/
│   ├── index.html              # Page d'accueil
│   ├── dashboard.html          # Espace utilisateur
│   ├── mentions-legales.html   # Mentions légales
│   ├── styles.css              # Styles unifiés (~2 Ko)
│   └── app.js                  # JavaScript (~5 Ko)
├── backend/
│   ├── app.js                  # Serveur Express
│   ├── routes/
│   │   ├── users.js            # CRUD utilisateurs
│   │   └── announcements.js    # CRUD annonces
│   ├── middleware/
│   │   └── auth.js             # Authentification
│   └── database/
│       ├── init.js             # Initialisation BD
│       └── schema.sql          # Schéma SQLite
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🔐 Fonctionnalités

### Utilisateurs
- ✅ Inscription avec validation email et mot de passe
- ✅ Connexion/déconnexion sécurisée
- ✅ Profil utilisateur modifiable
- ✅ Système de points pour les échanges
- ✅ Suppression de compte avec confirmation

### Annonces
- ✅ Créer/Modifier/Supprimer une annonce
- ✅ Catégorisation (Livres, Électronique, Mobilier, Vêtements, Sports, Autre)
- ✅ États du produit (Bon état, Très bon, Acceptable)
- ✅ Deux types d'échange : Troc ou Points
- ✅ Paginée (20 résultats par page)
- ✅ Filtrage par catégorie

### Sécurité
- ✅ Hashage des mots de passe (bcryptjs)
- ✅ Protection contre injections SQL (requêtes paramétrées)
- ✅ Sessions sécurisées avec HttpOnly cookies
- ✅ Validation côté serveur
- ✅ Aucune donnée sensible dans le repo Git

## 🌿 Indicateurs Green IT

| Métrique | Objectif | État |
|----------|----------|------|
| Poids page accueil | < 200 Ko | À mesurer |
| Requêtes HTTP | < 15 par page | À mesurer |
| Score EcoIndex | A ou B | À mesurer |
| Score Lighthouse Perf | > 80 | À mesurer |
| FCP | < 1.8s | À mesurer |
| LCP | < 2.5s | À mesurer |

## 📡 API REST

### Utilisateurs
```
POST   /api/users/register     → Inscription
POST   /api/users/login        → Connexion
POST   /api/users/logout       → Déconnexion
GET    /api/users/me           → Profil actuel
GET    /api/users/:id          → Profil public
PUT    /api/users/:id          → Modifier profil
DELETE /api/users/:id          → Supprimer compte
```

### Annonces
```
GET    /api/announcements              → Lister (pagination, filtres)
GET    /api/announcements/:id          → Détail
POST   /api/announcements              → Créer
PUT    /api/announcements/:id          → Modifier
DELETE /api/announcements/:id          → Supprimer
GET    /api/announcements/user/my-annonces → Mes annonces
```

## 🧪 Tests

### Scénarios fonctionnels

```
✓ Créer un utilisateur valide
✓ Créer un utilisateur (email vide) → Erreur
✓ Modifier un utilisateur existant
✓ Supprimer un utilisateur
✓ Lister les utilisateurs (paginé)
✓ Créer une annonce
✓ Connexion identifiants valides
✓ Connexion mauvais MDP → Erreur
✓ Accès page protégée sans connexion → Redirect
```

### Performance

À tester avec :
- **Google Lighthouse** (DevTools Chrome)
- **EcoIndex** (https://www.ecoindex.fr)
- **Website Carbon Calculator** (https://www.websitecarbon.com)
- **PageSpeed Insights** (https://pagespeed.web.dev)

## 🚀 Déploiement

### Sur Vercel (recommandé)
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### Sur Render
1. Créer un compte sur https://render.com
2. Créer un nouveau "Web Service"
3. Connecter le repo GitHub
4. Configuration :
   - Build: `npm install`
   - Start: `npm start`
   - Ajouter env var: `DATABASE_PATH`

## 📝 Conventions

### Git
- `main` : branche de production
- `develop` : branche de développement
- `feat/xxx` : nouvelles fonctionnalités
- `fix/xxx` : corrections
- Messages courts et explicites

### Code
- Noms descriptifs en français/anglais
- Fonctions courtes et réutilisables
- Commentaires sur la logique complexe
- Pas de `console.log` en production

## 👥 Équipe

| Rôle | Nom | GitHub |
|------|-----|--------|
| Lead Dev | [À compléter] | [@username] |
| Frontend | [À compléter] | [@username] |
| Backend | [À compléter] | [@username] |
| DevOps | [À compléter] | [@username] |

## 📚 Ressources

- [GR491 Green IT](https://gr491.isit-europe.org)
- [Éco-conception web](https://www.eco-conception-web.com)
- [Collectif Green IT](https://www.greenit.fr)

## 📞 Support

Pour toute question ou problème : créer une GitHub Issue

## 📄 Licence

MIT - Projet académique EFREI Paris 2026

---

**Dernière mise à jour:** 30 avril 2026  
**Version:** 1.0.0 (Bêta)