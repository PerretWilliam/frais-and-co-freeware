# Migrations de la Base de Données

Ce dossier contient les scripts de migration pour la base de données PostgreSQL.

## Liste des Migrations

### 001-update-user-passwords.ts

**Date**: 24 octobre 2025  
**Description**: Met à jour les mots de passe des 40 utilisateurs existants avec le nouveau système de hashage `AES(bcrypt(salt+password))`

**Format des mots de passe**: `password{id}`

- Utilisateur ID 1: `password1`
- Utilisateur ID 2: `password2`
- etc.

**Exécution**:

```bash
npm run db:migrate
```

## Système de Hashage des Mots de Passe

Le système utilise une double couche de sécurité :

1. **Génération du salt**: Un salt unique de 64 caractères hexadécimaux est généré pour chaque utilisateur
2. **Hashage bcrypt**: Le mot de passe est combiné avec le salt puis hashé avec bcrypt (10 rounds)
3. **Chiffrement AES**: Le hash bcrypt est ensuite chiffré avec AES-256 en utilisant la clé secrète définie dans `AES_SECRET_KEY`

### Formule

```
hash_final = AES(bcrypt(salt_utilisateur + mot_de_passe), AES_SECRET_KEY)
```

### Stockage

- `mot_de_passe`: Hash final chiffré (colonne dans la table Utilisateur)
- `salt`: Salt unique de l'utilisateur (colonne dans la table Utilisateur)
- `AES_SECRET_KEY`: Clé secrète stockée dans `.env` (ne jamais commiter!)

## Créer une Nouvelle Migration

1. Créer un nouveau fichier dans ce dossier avec le format : `00X-description.ts`
2. Importer les dépendances nécessaires
3. Créer une fonction async qui effectue la migration
4. Exporter la fonction par défaut
5. Ajouter un script dans `package.json` si nécessaire

### Exemple de structure

```typescript
import pool from "../config/database";

async function myMigration() {
  const client = await pool.connect();

  try {
    console.log("Début de la migration...");

    // Code de migration ici

    console.log("Migration terminée avec succès!");
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  myMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default myMigration;
```

## Notes Importantes

⚠️ **Avant d'exécuter une migration en production** :

1. Faire une sauvegarde complète de la base de données
2. Tester la migration sur un environnement de développement
3. Vérifier que la clé `AES_SECRET_KEY` est bien définie et sécurisée
4. Documenter les changements effectués

## Sécurité

- ✅ Les mots de passe sont hashés avec bcrypt (protection contre les rainbow tables)
- ✅ Chaque utilisateur a un salt unique (protection contre les attaques par dictionnaire)
- ✅ Les hashs sont chiffrés avec AES-256 (couche supplémentaire de sécurité)
- ✅ La clé AES est stockée dans les variables d'environnement (non versionnée)

## Dépannage

### Erreur: "AES_SECRET_KEY est manquante"

Assurez-vous que le fichier `.env` contient la variable `AES_SECRET_KEY` avec une clé de 32 caractères ou plus.

### Erreur: "Connexion à la base de données impossible"

Vérifiez que Docker est démarré et que PostgreSQL est accessible :

```bash
npm run db:up
docker ps
```

### Problème de séquences désynchronisées

Exécutez le script de correction :

```bash
docker exec -i local_pgdb psql -U freeware -d freeware -f /path/to/fix-sequences.sql
```
