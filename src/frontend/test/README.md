# 🧪 Interface de Test Frontend

Cette interface de test permet de tester toutes les fonctionnalités de l'application Frais & Co directement depuis le frontend via les IPC handlers Electron.

## 🚀 Démarrage

Pour lancer l'interface de test :

```bash
npm run test:front
```

Cette commande démarre l'application Electron en mode test, qui charge automatiquement l'interface de test au lieu de l'interface principale.

## 📋 Fonctionnalités Testables

### 🗄️ Base de Données

- Test de connexion à PostgreSQL
- Affichage du statut de connexion en temps réel

### 👥 Utilisateurs

- ✅ Créer un utilisateur
- 🔐 Connexion (login)
- 📋 Lister tous les utilisateurs
- 🔍 Rechercher par ID
- ✅ Valider un utilisateur
- 📋 Lister les utilisateurs en attente
- 🗑️ Supprimer un utilisateur
- 🔑 Changer le mot de passe

### 🏗️ Chantiers

- ➕ Créer un chantier
- 📋 Lister tous les chantiers
- 🔍 Rechercher par ID ou terme
- 🗑️ Supprimer un chantier

### 💰 Frais

- 🚗 Créer un frais de déplacement
- 🍽️ Créer un frais de repas
- 🏨 Créer un frais d'hébergement
- 📋 Lister tous les frais
- 📊 Statistiques par utilisateur
- ✏️ Modifier le statut d'un frais
- 🗑️ Supprimer un frais

### 📊 Grille Tarifaire

- ➕ Créer/Mettre à jour un tarif
- 📋 Lister tous les tarifs
- 🔍 Rechercher par cylindrée
- 🧮 Calculer le montant d'un déplacement
- 🗑️ Supprimer un tarif

### 📞 Téléphones

- ➕ Créer un téléphone
- 🔍 Rechercher par utilisateur
- ✏️ Mettre à jour un téléphone
- 🗑️ Supprimer un téléphone

## 🎨 Interface

L'interface est divisée en onglets thématiques pour faciliter la navigation. Chaque section contient :

- Des formulaires pré-remplis avec des valeurs d'exemple
- Des boutons d'action clairement identifiés
- Une zone de résultats qui affiche les réponses JSON
- Des indicateurs visuels de succès/erreur

## 🔧 Architecture

### Services Frontend

Les services se trouvent dans `src/frontend/services/` :

- `utilisateur.service.ts` - Gestion des utilisateurs
- `chantier.service.ts` - Gestion des chantiers
- `frais.service.ts` - Gestion des frais
- `tarif.service.ts` - Gestion de la grille tarifaire
- `telephone.service.ts` - Gestion des téléphones
- `database.service.ts` - Test de connexion DB

### Communication IPC

La communication entre le frontend et le backend se fait via :

1. **Preload Script** (`src/electron/preload.ts`) - Expose l'API via `contextBridge`
2. **IPC Handlers** (`src/backend/ipc/ipc-handlers.ts`) - Traite les requêtes côté main process
3. **Handlers Backend** (`src/backend/handlers/*.handler.ts`) - Logique métier et accès BDD

## 📝 Exemple d'Utilisation

1. **Démarrer la base de données** :

   ```bash
   npm run db:up
   ```

2. **Lancer l'interface de test** :

   ```bash
   npm run test:front
   ```

3. **Tester la connexion** :
   - Cliquer sur "Tester la Connexion" dans l'onglet "Base de données"
   - Vérifier que le statut passe à "Connecté"

4. **Créer un utilisateur** :
   - Aller dans l'onglet "Utilisateurs"
   - Remplir le formulaire de création
   - Cliquer sur "Créer Utilisateur"
   - Vérifier la réponse dans la zone de résultats

5. **Tester les autres fonctionnalités** :
   - Naviguer entre les onglets
   - Utiliser les formulaires pré-remplis
   - Observer les réponses JSON

## 🐛 Débogage

- Les DevTools sont automatiquement ouverts en mode test
- Les logs du backend apparaissent dans le terminal
- Les erreurs IPC sont affichées dans la console du navigateur
- Les réponses API sont affichées formatées en JSON

## 🔒 Sécurité

L'interface de test :

- N'est accessible qu'en mode développement
- Utilise la même sécurité qu'Electron (contextIsolation, pas de nodeIntegration)
- Ne doit pas être incluse dans la build de production

## 📚 Types TypeScript

Tous les types sont définis dans `src/frontend/types/api.types.ts` pour assurer la cohérence entre le frontend et le backend.

## 🎯 Prochaines Étapes

- Implémenter l'interface utilisateur principale
- Ajouter l'authentification persistante
- Créer les vues pour chaque rôle (Employé, Comptable, Admin)
- Ajouter la gestion des fichiers justificatifs
- Implémenter les notifications
