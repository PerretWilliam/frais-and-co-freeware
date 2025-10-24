# Tests Backend Freeware

Ce dossier contient tous les tests automatisés pour le backend de l'application Freeware.

## 📁 Structure des Tests

```
tests/
├── run-all-tests.ts         # Lance tous les tests
├── utilisateur.test.ts      # Tests du module Utilisateur
├── chantier.test.ts         # Tests du module Chantier
└── frais.test.ts            # Tests du module Frais
```

## 🚀 Exécuter les Tests

### Tous les tests

```bash
npm run db:test-all
```

### Tests individuels

Les tests peuvent être exécutés individuellement en important et appelant les fonctions de test :

```typescript
import { testUtilisateurs } from "./tests/utilisateur.test";
await testUtilisateurs();
```

## 📊 Couverture des Tests

### Module Utilisateur (13 tests)

- ✅ Création d'un utilisateur
- ✅ Tentative de connexion avec utilisateur non validé
- ✅ Validation d'un utilisateur
- ✅ Connexion avec utilisateur validé
- ✅ Connexion avec mauvais mot de passe
- ✅ Récupération d'un utilisateur par ID
- ✅ Mise à jour d'un utilisateur
- ✅ Changement de mot de passe
- ✅ Récupération de tous les utilisateurs
- ✅ Récupération des utilisateurs en attente
- ✅ Test de contrainte unique sur email
- ✅ Suppression d'un utilisateur

### Module Chantier (8 tests)

- ✅ Création d'un chantier
- ✅ Récupération d'un chantier par ID
- ✅ Récupération de tous les chantiers
- ✅ Mise à jour d'un chantier
- ✅ Recherche de chantiers par nom
- ✅ Recherche de chantiers par ville
- ✅ Suppression d'un chantier
- ✅ Vérification de la suppression

### Module Frais (10 tests)

- ✅ Création d'un frais de déplacement
- ✅ Création d'un frais de repas
- ✅ Création d'un frais d'hébergement
- ✅ Récupération des frais d'un utilisateur
- ✅ Récupération de tous les frais
- ✅ Récupération des détails d'un frais de déplacement
- ✅ Mise à jour du statut d'un frais
- ✅ Filtrage des frais par statut
- ✅ Récupération des statistiques des frais
- ✅ Suppression des frais

## 🎯 Objectifs des Tests

Les tests vérifient :

1. **Fonctionnalité** - Toutes les opérations CRUD fonctionnent correctement
2. **Validation** - Les contraintes de base de données sont respectées
3. **Sécurité** - Les mots de passe sont correctement hashés et vérifiés
4. **Intégrité** - Les relations entre entités sont maintenues
5. **Gestion des erreurs** - Les erreurs sont correctement gérées et retournées

## 📝 Convention de Nommage

- Fichiers de test : `*.test.ts`
- Fonction de test principale : `test<Module>()`
- Format de sortie : Indicateurs visuels (✓/✗)

## 🔧 Prérequis

Avant d'exécuter les tests :

1. **Base de données PostgreSQL** en cours d'exécution :

   ```bash
   npm run db:up
   ```

2. **Variables d'environnement** configurées dans `.env` :

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=freeware
   DB_USER=freeware
   DB_PASSWORD=9Ewg7R4CauFpa
   AES_SECRET_KEY=a32daf888c016874c95963de7be6445de165bb65fc6881710a9fd0928da97189
   ```

3. **Migration des utilisateurs** (optionnel) :
   ```bash
   npm run db:migrate
   ```

## 📈 Résultats Attendus

```
╔════════════════════════════════════════════════════════════════════╗
║                    RÉSUMÉ GLOBAL DES TESTS                         ║
╠════════════════════════════════════════════════════════════════════╣
║  Total de tests exécutés: 31                                       ║
║  ✓ Réussites: 31                                                  ║
║  ✗ Échecs: 0                                                      ║
║  Taux de réussite: 100.0%                                         ║
║  Durée: ~0.5s                                                     ║
╚════════════════════════════════════════════════════════════════════╝

🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS! 🎉
```

## 🐛 Dépannage

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est démarré
docker ps

# Redémarrer si nécessaire
npm run db:down
npm run db:up
```

### Erreur de contrainte unique

Les tests créent et suppriment leurs propres données. Si un test échoue, des données peuvent rester dans la base. Relancez simplement les tests.

### Problème de séquences

Si vous voyez des erreurs de clés dupliquées, synchronisez les séquences :

```bash
docker exec -i local_pgdb psql -U freeware -d freeware -c "
  SELECT setval('utilisateur_id_utilisateur_seq', (SELECT MAX(id_utilisateur) FROM utilisateur));
  SELECT setval('chantier_id_chantier_seq', (SELECT MAX(id_chantier) FROM chantier));
  SELECT setval('frais_id_frais_seq', (SELECT MAX(id_frais) FROM frais));
"
```

## 🔮 Tests Futurs

Modules à tester :

- [ ] Module Grille Tarifaire
- [ ] Module Téléphone
- [ ] Tests d'intégration IPC (Electron)
- [ ] Tests de performance
- [ ] Tests de sécurité (injection SQL, XSS, etc.)

## 📚 Ressources

- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
- [Guide Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
