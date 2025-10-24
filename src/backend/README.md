# Backend Freeware - Architecture

## 📁 Structure du Backend

```
src/backend/
├── config/
│   └── database.ts                  # Configuration de la connexion PostgreSQL
├── handlers/
│   ├── utilisateur.handler.ts       # Gestion des utilisateurs
│   ├── chantier.handler.ts          # Gestion des chantiers
│   ├── frais.handler.ts             # Gestion des frais (déplacement, repas, hébergement)
│   ├── grille-tarifaire.handler.ts  # Gestion de la grille tarifaire
│   └── telephone.handler.ts         # Gestion des numéros de téléphone
├── ipc/
│   └── ipc-handlers.ts              # Enregistrement des handlers IPC pour Electron
├── migrations/
│   ├── 001-update-user-passwords.ts # Migration des mots de passe utilisateurs
│   └── README.md                    # Documentation des migrations
├── tests/
│   ├── utilisateur.test.ts          # Tests du module Utilisateur
│   ├── chantier.test.ts             # Tests du module Chantier
│   ├── frais.test.ts                # Tests du module Frais
│   ├── run-all-tests.ts             # Exécution de tous les tests
│   └── README.md                    # Documentation des tests
├── types/
│   └── index.ts                     # Types TypeScript et interfaces
└── utils/
    └── crypto.ts                    # Fonctions de hashing/salting des mots de passe
```

## 🔐 Sécurité des Mots de Passe

Les mots de passe sont sécurisés avec **double hashing** :

1. **Salt unique** généré pour chaque utilisateur (64 caractères hex)
2. **bcrypt** pour hasher `salt + password`
3. **AES** pour chiffrer le hash bcrypt avec une clé secrète

Formule : `AES(bcrypt($perUserSalt, $pwd), $secretKey)`

## 📡 Communication IPC (Electron)

Le frontend communique avec le backend via **IPC (Inter-Process Communication)**.

### Utilisation dans le frontend :

```typescript
// Exemple : Connexion
const result = await window.electronAPI.user.login({
  email: "user@example.com",
  password: "motdepasse",
});

if (result.success) {
  console.log("Utilisateur connecté:", result.data.utilisateur);
}

// Exemple : Créer un frais de déplacement
const frais = await window.electronAPI.frais.createDeplacement({
  lieu: "Paris",
  date: new Date(),
  justificatif: buffer,
  statut: "Brouillon",
  id_utilisateur: 1,
  id_chantier: 1,
  ville_depart: "Lyon",
  ville_arrivee: "Paris",
  distance_km: 450,
  id_voiture: 1,
});
```

## 🗃️ Handlers Disponibles

### Utilisateurs

- `user:create` - Créer un utilisateur
- `user:login` - Connexion
- `user:getAll` - Liste de tous les utilisateurs
- `user:getById` - Récupérer un utilisateur par ID
- `user:update` - Mettre à jour un utilisateur
- `user:delete` - Supprimer un utilisateur
- `user:changePassword` - Changer le mot de passe
- `user:validate` - Valider un utilisateur (admin)
- `user:getPending` - Récupérer les utilisateurs en attente de validation

### Chantiers

- `chantier:create` - Créer un chantier
- `chantier:getAll` - Liste de tous les chantiers
- `chantier:getById` - Récupérer un chantier par ID
- `chantier:update` - Mettre à jour un chantier
- `chantier:delete` - Supprimer un chantier
- `chantier:search` - Rechercher des chantiers

### Frais

- `frais:createDeplacement` - Créer un frais de déplacement
- `frais:createRepas` - Créer un frais de repas
- `frais:createHebergement` - Créer un frais d'hébergement
- `frais:getByUser` - Récupérer les frais d'un utilisateur
- `frais:getAll` - Récupérer tous les frais (avec filtres)
- `frais:getDeplacementById` - Détail d'un frais de déplacement
- `frais:getRepasById` - Détail d'un frais de repas
- `frais:getHebergementById` - Détail d'un frais d'hébergement
- `frais:updateStatut` - Mettre à jour le statut d'un frais
- `frais:delete` - Supprimer un frais
- `frais:getStatsByUser` - Statistiques des frais par utilisateur

### Grille Tarifaire

- `tarif:upsert` - Créer/Mettre à jour un tarif
- `tarif:getAll` - Liste de tous les tarifs
- `tarif:getByCylindree` - Récupérer un tarif par cylindrée
- `tarif:delete` - Supprimer un tarif
- `tarif:calculateDeplacement` - Calculer le montant d'un déplacement

## 🚀 Configuration

1. Créer un fichier `.env` à la racine :

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freeware
DB_USER=postgres
DB_PASSWORD=postgres
AES_SECRET_KEY=votre-cle-secrete-tres-longue-et-aleatoire
NODE_ENV=development
```

2. Lancer la base de données PostgreSQL (avec Docker) :

```bash
npm run db:up
```

3. Exécuter le script SQL :

```bash
psql -U postgres -d freeware -f script.sql
```

4. Migrer les mots de passe des utilisateurs existants :

```bash
npm run db:migrate
```

5. (Optionnel) Tester le backend :

```bash
npm run db:test-all
```

## 🧪 Tests

Le backend dispose d'une suite complète de tests automatisés couvrant tous les modules.

### Exécuter tous les tests

```bash
npm run db:test-all
```

### Scripts de test disponibles

- `npm run db:test` - Tests d'exemple et démonstration
- `npm run db:test-login` - Tests de connexion multi-utilisateurs
- `npm run db:test-all` - Suite complète de tests (31 tests)

### Couverture

- ✅ Module Utilisateur (13 tests)
- ✅ Module Chantier (8 tests)
- ✅ Module Frais (10 tests)

Voir [tests/README.md](./tests/README.md) pour plus de détails.

## 🔄 Migrations

Les migrations permettent de mettre à jour la structure ou les données de la base.

### Exécuter les migrations

```bash
npm run db:migrate
```

Voir [migrations/README.md](./migrations/README.md) pour plus de détails.

## 📦 Dépendances

- `pg` - Driver PostgreSQL
- `bcryptjs` - Hashing des mots de passe
- `crypto-js` - Chiffrement AES
- `dotenv` - Variables d'environnement
- `electron` - Framework Electron

## 🔒 Bonnes Pratiques

1. **Jamais** exposer les mots de passe ou salts dans les réponses API
2. **Toujours** valider les données avant insertion en BDD
3. **Utiliser** des transactions pour les opérations critiques
4. **Libérer** les clients du pool après usage
5. **Gérer** les erreurs spécifiques (contraintes uniques, etc.)
