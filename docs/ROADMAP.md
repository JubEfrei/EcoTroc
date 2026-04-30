# Feuille de route - EcoTroc

## ✅ État actuel (30 avril 2026)

- [x] Structure projet complète
- [x] Backend Node.js + Express configuré
- [x] Routes CRUD complètes (utilisateurs, annonces)
- [x] Base de données SQLite avec schéma
- [x] Frontend HTML5/CSS3 minimaliste
- [x] JavaScript vanilla sans dépendances
- [x] Authentification sécurisée (bcryptjs + sessions)
- [x] Pagination et filtres
- [x] Documentation complète

---

## 🚀 Prochaines étapes immédiates

### Étape 1: Initialisation locale (15 min)
```bash
# Terminal
cd c:\Users\jubos\OneDrive\Desktop\ProjetEfrei\EcoTroc

# Installer les dépendances
npm install

# Créer .env depuis le template
copy .env.example .env

# Lancer le serveur
npm start
```

**✓ Vérification:** Accéder à http://localhost:3000 → Page d'accueil chargée

---

### Étape 2: Tests fonctionnels (30 min)

Utiliser le guide [docs/TESTING.md](docs/TESTING.md):

1. **Inscription/Connexion**
   - [ ] Créer un compte utilisateur
   - [ ] Se connecter
   - [ ] Vérifier que "Mon compte" apparaît

2. **Créer une annonce**
   - [ ] Se connecter
   - [ ] Aller sur "Mon compte"
   - [ ] Cliquer "Nouvelle annonce"
   - [ ] Remplir les champs
   - [ ] Créer l'annonce

3. **Vérifier les annonces**
   - [ ] Retourner à l'accueil
   - [ ] Voir l'annonce en liste
   - [ ] Filtrer par catégorie
   - [ ] Tester la pagination

---

### Étape 3: Initialiser Git (10 min)

```bash
# Initialiser le repo
git init
git add .
git commit -m "feat: Initial commit - EcoTroc MVP"

# Créer des branches pour chaque équipe
git checkout -b develop
git checkout -b feat/ui-improvements
git checkout -b feat/exchange-system
```

---

### Étape 4: Mesurer les performances (20 min)

**Google Lighthouse:**
1. F12 → Lighthouse
2. Générer un rapport (Performance tab)
3. Documenter le score dans `/docs`

**EcoIndex:**
1. Aller à https://www.ecoindex.fr
2. Entrer http://localhost:3000
3. Noter le grade (A/B/C...)
4. Prendre une capture d'écran

**Poids de la page:**
```bash
# Terminal
# Calculer la taille des fichiers
python -c "import os; print('HTML:', os.path.getsize('frontend/index.html')/1024, 'KB')"
python -c "import os; print('CSS:', os.path.getsize('frontend/styles.css')/1024, 'KB')"
python -c "import os; print('JS:', os.path.getsize('frontend/app.js')/1024, 'KB')"
```

---

## 🔧 Améliorations à court terme (Phase 1)

### Fonctionnalités manquantes

- [ ] **Système d'échanges complet**
  - [ ] Bouton "Proposer un échange" sur chaque annonce
  - [ ] Table `exchanges` + routes
  - [ ] Notifications d'échange
  - [ ] Acceptation/Refus d'échanges

- [ ] **Système de points**
  - [ ] Crédit initial pour nouveaux utilisateurs (100 points?)
  - [ ] Gestion des points en base de données
  - [ ] Historique des transactions

- [ ] **Profil utilisateur avancé**
  - [ ] Photo de profil
  - [ ] Biographie
  - [ ] Note/évaluation (système de ratings)
  - [ ] Historique d'échanges

- [ ] **Recherche et filtres avancés**
  - [ ] Barre de recherche (titre + description)
  - [ ] Filtrer par condition
  - [ ] Filtrer par localisation (future)
  - [ ] Tri: Récent, Ancien, Points

### Corrections et polissage

- [ ] Ajouter messages de confirmation plus clairs
- [ ] Ajouter loader pendant le chargement des annonces
- [ ] Améliorer responsiveness mobile
- [ ] Gestion des erreurs réseau
- [ ] Toast notifications (au lieu d'alerts)

### Sécurité supplémentaire

- [ ] Rate limiting sur les endpoints
- [ ] CSRF tokens sur les formulaires
- [ ] Changement de mot de passe
- [ ] Email de confirmation pour inscription
- [ ] 2FA optionnel

---

## 📈 Optimisations Green IT (Phase 2)

### Mesure complète
- [ ] Créer tableau avant/après pour chaque page
- [ ] Documenter les optimisations appliquées
- [ ] Comparer avec un site concurrent

### Code
- [ ] Minifier CSS et JS en production
- [ ] Minifier HTML
- [ ] Activer gzip compression
- [ ] Mettre en cache (Cache-Control headers)

### Images
- [ ] Ajouter des images optimisées si nécessaire
- [ ] Utiliser format WebP/AVIF
- [ ] Lazy loading pour images

### Serveur
- [ ] Vérifier compression gzip activée
- [ ] Vérifier cache headers correctes
- [ ] Mesurer temps de réponse API (< 200ms)

---

## 🌍 Déploiement (Phase 3)

### Préparation
- [ ] Configurer `.env` production
- [ ] Tester l'app en NODE_ENV=production
- [ ] Vérifier aucun secret en dur
- [ ] Créer compte sur Vercel/Render

### Sur Vercel
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Sur Render
1. Aller à https://render.com
2. Créer nouveau Web Service
3. Connecter GitHub repo
4. Builder: `npm install`
5. Start: `npm start`
6. Ajouter variables d'environnement

### Tests en production
- [ ] Vérifier l'inscription fonctionne
- [ ] Vérifier la création d'annonce fonctionne
- [ ] Mesurer les performances sur URL de prod
- [ ] Tester sur réseau 3G lent

---

## 📝 Documentation (Phase 4)

### Rapport PDF
À structurer selon le cahier des charges:

1. **Présentation du projet** (1 page)
   - Nom, objectif
   - Valeur proposée
   - MVP et utilisateurs cibles

2. **Architecture et conception** (2-3 pages)
   - Diagrammes UML (cas d'utilisation, classes, séquence)
   - Schéma de la base de données
   - Architecture générale

3. **Choix technologiques** (1 page)
   - Tableau comparatif
   - Justifications Green IT

4. **Implémentation** (2 pages)
   - Description des fonctionnalités
   - Extraits de code commentés

5. **Analyse empreinte carbone** (2 pages)
   - Mesures initiales
   - Optimisations appliquées
   - Tableau avant/après
   - Gains obtenus

6. **Tests et validation** (2 pages)
   - Tableau des tests fonctionnels
   - Screenshots Lighthouse
   - Vérifications de sécurité

7. **Organisation de l'équipe** (1 page)
   - Répartition des tâches
   - GitHub Projects screenshot
   - Contributions par membre

8. **Discussion et conclusion** (1-2 pages)
   - Défis rencontrés
   - Compromis acceptés
   - Pistes d'amélioration

9. **Annexes** (3-5 pages)
   - Screenshots complètes
   - Logs des tests
   - Commandes utiles

### Vidéo de présentation (20 min)
- [ ] Enregistrer présentation avec slides
- [ ] Démo live du site (5 min)
- [ ] Q&R préparées

---

## 🔄 Points de contrôle (Checklist)

### Avant le 3 mai à 23h

#### Code et déploiement
- [ ] Site accessible via URL publique
- [ ] URL dans README.md
- [ ] Tous les fichiers en Git
- [ ] .env dans .gitignore
- [ ] Aucune clé API exposée

#### Fonctionnalités
- [ ] CRUD utilisateurs complet et fonctionnel
- [ ] CRUD annonces complet et fonctionnel
- [ ] Authentification sécurisée
- [ ] Pagination sur listes

#### Performance & Green IT
- [ ] Lighthouse Performance > 70
- [ ] EcoIndex A ou B
- [ ] Poids page < 500 Ko
- [ ] Requêtes HTTP < 15
- [ ] Mesures avant/après documentées

#### Tests
- [ ] Tableau des tests fonctionnels rempli
- [ ] Screens Lighthouse captures
- [ ] Vérifications de sécurité faites
- [ ] Aucun mot de passe en clair

#### Documentation
- [ ] README.md complet
- [ ] Rapport PDF (< 25 pages)
- [ ] Diagrammes UML
- [ ] docs/TESTING.md
- [ ] docs/GREEN_IT.md
- [ ] docs/ARCHITECTURE.md

#### Git
- [ ] Minimum 3 branches actives
- [ ] Historique de commits propre
- [ ] Messages descriptifs
- [ ] Pull Requests fusionnées
- [ ] Issues utilisées
- [ ] Contributions visibles de chaque membre

#### Présentation
- [ ] Tous les membres peuvent présenter
- [ ] Slides sobres (pas d'animations inutiles)
- [ ] Plan de secours (screenshots) en cas de problème
- [ ] Timing respecté (20 min max)

---

## 📊 Roadmap visuelle

```
Aujourd'hui (30 avril)
    │
    ├─ Semaine du 1er mai
    │  └─ Tests & optimisations Green IT
    │  └─ Déploiement en production
    │
    ├─ Semaine du 4 mai
    │  └─ Finalisation documentation
    │  └─ Préparation présentation
    │
    └─ 3 mai 23h
       └─ ✅ Remise finale
```

---

## 🎯 Critères d'acceptation

| Critère | Minimum | Idéal |
|---------|---------|-------|
| Fonctionnalité | MVP complet | + Échanges avancés |
| Performance | Lighthouse > 70 | > 85 |
| EcoIndex | B | A |
| Poids page | < 500 Ko | < 200 Ko |
| Tests | 80% | 100% |
| Documentation | Complète | Exemplaire |
| Git | 3 branches | 5+ branches |

---

**Dernière mise à jour:** 30 avril 2026
**Délai:** 3 jours (3 mai 23h)
