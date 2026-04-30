# Guide des tests - EcoTroc

## 🧪 Tests fonctionnels

### Utilisateurs - CRUD complet

#### 1. Inscription ✓
```
Étapes:
1. Cliquer sur "Commencer" → Ouvrir modal
2. Cliquer sur onglet "Inscription"
3. Remplir: nom d'utilisateur, email, mot de passe (min 6 char)
4. Cliquer "S'inscrire"

Résultat attendu:
✓ Utilisateur enregistré en BDD
✓ Session créée
✓ Redirection vers page annonces
✓ Menu affiche "Mon compte" et "Déconnexion"
```

#### 2. Inscription - Email vide
```
Étapes:
1. Formulaire d'inscription
2. Laisser email vide
3. Cliquer "S'inscrire"

Résultat attendu:
✗ Message d'erreur: "Email, username et password requis"
✗ Pas de création d'utilisateur
```

#### 3. Inscription - Password < 6 caractères
```
Résultat attendu:
✗ Message d'erreur: "Le mot de passe doit avoir au moins 6 caractères"
```

#### 4. Inscription - Email déjà utilisé
```
Résultat attendu:
✗ Message d'erreur: "Email ou username déjà utilisé"
```

#### 5. Connexion - Identifiants valides
```
Étapes:
1. Cliquer "Connexion" dans modal
2. Entrer email et mot de passe valides
3. Cliquer "Connexion"

Résultat attendu:
✓ Session créée
✓ Redirection vers page annonces
✓ Menu affiche "Mon compte"
```

#### 6. Connexion - Mauvais mot de passe
```
Résultat attendu:
✗ Message d'erreur: "Identifiants invalides"
✗ Pas de session créée
```

#### 7. Lister les utilisateurs
```
Étapes:
1. GET /api/users?page=1

Résultat attendu:
✓ Max 20 utilisateurs par page
✓ Réponse contient: users[], pagination.page, pagination.total, pagination.pages
```

#### 8. Modifier le profil
```
Étapes:
1. Se connecter
2. Aller à "Mon compte"
3. Cliquer "Modifier le profil"
4. Changer username et/ou email
5. Cliquer "Mettre à jour"

Résultat attendu:
✓ Données mises à jour en BDD
✓ Message de confirmation
```

#### 9. Supprimer un compte
```
Étapes:
1. Se connecter
2. [Ajouter un bouton "Supprimer mon compte"]
3. Confirmer la suppression

Résultat attendu:
✓ Utilisateur supprimé de la BDD
✓ Session détruite
✓ Redirection vers accueil
```

---

### Annonces - CRUD complet

#### 10. Créer une annonce
```
Étapes:
1. Se connecter
2. Aller à "Mon compte" → "Nouvelle annonce"
3. Remplir:
   - Titre: "Livre Python avancé"
   - Description: "Excellent état, lu une fois"
   - Catégorie: "Livres"
   - État: "Bon état"
   - Type d'échange: "Troc"
   - Recherche: "Livre JavaScript"
4. Cliquer "Créer l'annonce"

Résultat attendu:
✓ Annonce enregistrée en BDD
✓ user_id correspond à l'utilisateur connecté
✓ is_active = 1
✓ Apparaît dans "Mes annonces"
```

#### 11. Lister les annonces (paginées)
```
Étapes:
1. GET /api/announcements?page=1

Résultat attendu:
✓ Max 20 annonces par page
✓ Contient: [id, title, description, category, username]
✓ Pagination: page, total, pages
```

#### 12. Lister les annonces par catégorie
```
Étapes:
1. GET /api/announcements?category=livres&page=1

Résultat attendu:
✓ Seules les annonces "livres" retournées
✓ Pagination corrigée
```

#### 13. Filtrer les annonces (page d'accueil)
```
Étapes:
1. Aller à l'accueil
2. Sélectionner catégorie "Électronique"
3. Observer

Résultat attendu:
✓ Grille mise à jour
✓ Seules annonces "Électronique" affichées
```

#### 14. Modifier une annonce
```
Étapes:
1. Se connecter
2. Aller à "Mon compte" → "Mes annonces"
3. Cliquer "Modifier" sur une annonce
4. Changer le titre ou description
5. Cliquer "Mettre à jour"

Résultat attendu:
✓ Annonce modifiée en BDD
✓ Changements visibles immédiatement
```

#### 15. Supprimer une annonce
```
Étapes:
1. Se connecter
2. Aller à "Mon compte" → "Mes annonces"
3. Cliquer "Supprimer" sur une annonce
4. Confirmer

Résultat attendu:
✓ Annonce supprimée de la BDD
✓ N'apparaît plus dans la liste
```

#### 16. Créer une annonce avec points
```
Étapes:
1. Nouvelle annonce
2. Type d'échange: "Points du site"
3. Entrer 50 points
4. Créer

Résultat attendu:
✓ exchange_type = "points"
✓ points_value = 50
```

---

## 🔒 Sécurité

### Vérifications obligatoires

#### 1. Pas de mot de passe en clair
```bash
sqlite3 backend/database/ecotroc.db
SELECT email, password_hash FROM users LIMIT 1;
```
✓ `password_hash` doit contenir un hash bcrypt (ex: $2a$10$...)

#### 2. Pas de données sensibles dans Git
```bash
git log --all | grep -i password
git log --all | grep -i secret
```
✓ Aucun résultat

#### 3. Vérifier .env n'est pas en ligne
```bash
cat .gitignore | grep .env
```
✓ `.env` listé

#### 4. Protection des requêtes - Injection SQL
```javascript
// Tester avec ' ; DROP TABLE users ; --
// dans un formulaire
```
✓ Message d'erreur serveur sans crash
✓ Requête échoue silencieusement

#### 5. Accès pages protégées sans authentification
```
Étapes:
1. Ouvrir navigator.clearSiteData() ou nouveau profil
2. Aller directement à /dashboard.html

Résultat attendu:
✓ Redirection vers /
✓ Pas d'accès aux annonces privées
```

---

## ⚡ Performance Green IT

### Outils à utiliser

#### 1. Google Lighthouse
```
Chrome DevTools → Lighthouse → Generate report

Cible: Performance > 80/100
```

Vérifier:
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- Total Blocking Time (TBT) < 200ms

#### 2. EcoIndex
```
https://www.ecoindex.fr
URL: http://localhost:3000

Cible: A ou B
```

Vérifier:
- Poids < 200 Ko
- Requêtes < 15
- Complexité DOM acceptable

#### 3. Website Carbon Calculator
```
https://www.websitecarbon.com
URL: déploiement public

Cible: < 0.5g CO2 par visite
```

#### 4. Network Throttling (DevTools)
```
Chrome DevTools → Network → 3G Fast
Charger la page

Cible: Page utilisable < 5s
```

---

## 📊 Tableau de test à remplir

| # | Scénario | Résultat | Notes |
|---|----------|----------|-------|
| 1 | Créer utilisateur valide | ✓/✗ | |
| 2 | Créer utilisateur (email vide) | ✓/✗ | |
| 3 | Modifier utilisateur | ✓/✗ | |
| 4 | Supprimer utilisateur | ✓/✗ | |
| 5 | Lister utilisateurs | ✓/✗ | |
| 6 | Créer annonce | ✓/✗ | |
| 7 | Connexion valide | ✓/✗ | |
| 8 | Connexion mauvais MDP | ✓/✗ | |
| 9 | Accès page protégée sans connexion | ✓/✗ | |
| 10 | Pas de MDP en clair | ✓/✗ | |
| 11 | Aucune variable sensible dans Git | ✓/✗ | |
| 12 | Formulaires rejettent entrées malformées | ✓/✗ | |
| 13 | Lighthouse Performance > 70 | ✓/✗ | Score: |
| 14 | EcoIndex A ou B | ✓/✗ | Note: |
| 15 | Poids page < 500 Ko | ✓/✗ | Poids: |
| 16 | Requêtes HTTP < 15 | ✓/✗ | Nombre: |

---

## 🔧 Commandes utiles

### Backend
```bash
# Démarrer en développement
npm start

# Vérifier la BD
sqlite3 backend/database/ecotroc.db ".schema"

# Réinitialiser la BD
rm backend/database/ecotroc.db
npm start
```

### Frontend
```bash
# Vérifier la taille des fichiers
wc -c frontend/*.css frontend/*.js

# Compresser les images (si ajoutées)
npx imagemin frontend/images/* --out-dir=frontend/images
```

### Git
```bash
# Vérifier l'historique
git log --oneline

# Vérifier les dépendances inutiles
npm list --depth=0
```

---

## ✅ Checklist finale

Avant présentation:

- [ ] Site accessible via URL publique
- [ ] Base de données initialisée (script SQL fonctionnel)
- [ ] Tous les membres ont contribué (commits visibles)
- [ ] Aucune variable sensible dans le repo
- [ ] README.md complet et à jour
- [ ] Historique Git propre (3+ branches, PR fusionnées)
- [ ] Lighthouse screenshots dans /docs
- [ ] Tableau avant/après empreinte carbone rempli
- [ ] Tous les tests fonctionnels passent
- [ ] Points de sécurité vérifiés

---

**Dernière mise à jour:** 30 avril 2026
