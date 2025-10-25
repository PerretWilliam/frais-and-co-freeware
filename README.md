# 💼 Freeware - Gestion des Frais Professionnels

Application Electron pour la gestion des notes de frais avec backend PostgreSQL complet.

## 🎯 Fonctionnalités

### ✅ Gestion des Utilisateurs

- Authentification sécurisée
- Création et validation de comptes
- Gestion des profils (Employé, Comptable, Administrateur)
- Changement de mot de passe

### ✅ Gestion des Frais

- Soumission de frais (Hébergement, Déplacement, Repas)
- Workflow de validation (Brouillon → En cours → Approuvé → Payé)
- Upload de justificatifs
- Calcul automatique des remboursements kilométriques

### ✅ Gestion des Chantiers

- Création et gestion de chantiers
- Recherche par nom ou localisation
- Association des frais aux chantiers

### ✅ Gestion des Véhicules

- Enregistrement des véhicules personnels
- Calcul de consommation et coût carburant
- Vérification de disponibilité des plaques

### ✅ Gestion de la Grille Tarifaire

- Tarifs kilométriques selon la cylindrée
- Calcul automatique des remboursements
- Mise à jour des tarifs

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Electron)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │            Frontend Models & Services            │   │
│  │  User | Employee | Accountant | Administrator   │   │
│  │  Vehicle | Phone | Expense | WorkSite           │   │
│  └──────────────────┬──────────────────────────────┘   │
└────────────────────┼────────────────────────────────────┘
                     │
                     │ Frontend Services Layer
                     │
┌────────────────────┼────────────────────────────────────┐
│                    │  Backend Services                   │
│  ┌─────────────────▼──────────────────────────────┐    │
│  │ UserService | ExpenseService | WorkSiteService │    │
│  │ VehicleService | PhoneService | PriceGridService│   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │                                    │
│  ┌─────────────────▼──────────────────────────────┐    │
│  │              Repositories                       │    │
│  │  Data Access Layer (SQL Queries)               │    │
│  └──────────────────┬──────────────────────────────┘   │
└────────────────────┼────────────────────────────────────┘
                     │
                     │ PostgreSQL Driver (pg)
                     │
┌────────────────────▼────────────────────────────────────┐
│                  PostgreSQL Database                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Utilisateur | Frais | Chantier | Telephone       │  │
│  │ FraisDeplacement | FraisRepas | FraisHebergement │  │
│  │ GrilleTarifaire                                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Installation

### Prérequis

- Node.js 16+
- Docker et Docker Compose
- npm ou yarn

### Installation

```bash
# Cloner le projet
git clone https://github.com/votre-repo/freeware.git
cd freeware

# Installer les dépendances
npm install

# Démarrer la base de données
npm run db:up

# Vérifier la connexion
npm run db:test
```

## 📦 Scripts npm

```bash
# Développement
npm start                  # Démarrer l'application Electron
npm run lint              # Vérifier le code

# Base de données
npm run db:up             # Démarrer PostgreSQL (Docker)
npm run db:down           # Arrêter PostgreSQL
npm run db:logs           # Voir les logs PostgreSQL
npm run db:test           # Tester les services principaux
npm run db:test-new       # Tester les nouveaux services

# Production
npm run package           # Créer un package
npm run make              # Créer un installeur
```

## 📚 Documentation

| Document                                         | Description                           |
| ------------------------------------------------ | ------------------------------------- |
| [QUICK_START.md](./QUICK_START.md)               | Guide de démarrage rapide             |
| [SERVICES_COMPLETS.md](./SERVICES_COMPLETS.md)   | Documentation complète des services   |
| [MODELS_INTEGRATION.md](./MODELS_INTEGRATION.md) | Intégration modèles + base de données |
| [SYNTHESE_FINALE.md](./SYNTHESE_FINALE.md)       | Récapitulatif du projet complet       |
| [BACKEND_SETUP.md](./BACKEND_SETUP.md)           | Configuration backend détaillée       |
| [src/backend/README.md](./src/backend/README.md) | Documentation technique backend       |

## 🧪 Tests

### Tester les services

```bash
# Services principaux (Users, Expenses, WorkSites)
npm run db:test

# Nouveaux services (Vehicles, Phones, PriceGrid)
npm run db:test-new
```

### Résultats attendus

```
✅ Connexion à PostgreSQL
✅ Récupération des données
✅ Création d'entités
✅ Mise à jour
✅ Suppression
✅ Transactions
```

## 💻 Utilisation

### Exemple : Workflow complet

```typescript
import { User, Vehicle, TravelExpense } from './frontend/models';
import { ExpenseFrontendService, PriceGridFrontendService } from './frontend/services';

// 1. Connexion employé
const employee = await User.loginAsync("jean@email.com", "password");

// 2. Récupérer son véhicule
const vehicle = await Vehicle.getVehicleByUserIdAsync(employee.getId());

// 3. Calculer le remboursement
const distance = 150; // km
const reimbursement = await PriceGridFrontendService.calculateReimbursement(
  vehicle.getEngineSize(),
  distance
);

// 4. Créer et soumettre le frais
const expense = new TravelExpense(...);
const expenseId = await ExpenseFrontendService.submitTravel(
  expense,
  employee.getId(),
  workSiteId,
  vehicle.getId()
);

// 5. Comptable approuve
await ExpenseFrontendService.approveExpense(expenseId);

// 6. Comptable marque comme payé
await ExpenseFrontendService.markAsPaid(expenseId);
```

## 📊 Services Disponibles

### Backend Services (6)

- ✅ **UserService** : Gestion des utilisateurs (8 méthodes)
- ✅ **ExpenseService** : Gestion des frais (10 méthodes)
- ✅ **WorkSiteService** : Gestion des chantiers (6 méthodes)
- ✅ **VehicleService** : Gestion des véhicules (6 méthodes)
- ✅ **PhoneService** : Gestion des téléphones (5 méthodes)
- ✅ **PriceGridService** : Gestion des tarifs (5 méthodes)

### Frontend Services (6)

Chaque backend service a son équivalent frontend pour l'interface utilisateur.

### Repositories (6)

Couche d'accès aux données SQL pour chaque domaine.

**Total : 40+ méthodes disponibles** 🎉

## 🗄️ Base de Données

### Structure PostgreSQL

```sql
-- Tables principales
Utilisateur         -- Utilisateurs avec véhicules
Telephone           -- Numéros de téléphone
Chantier            -- Chantiers/Sites de travail
Frais               -- Frais génériques
FraisHebergement    -- Frais d'hébergement
FraisDeplacement    -- Frais de déplacement
FraisRepas          -- Frais de repas
GrilleTarifaire     -- Tarifs kilométriques
```

### Types ENUM

```sql
role_enum           -- admin | comptable | employe
statut_frais_enum   -- Brouillon | EnCours | PaiementEnCours | Paye | Refuse
type_essence_enum   -- Diesel | Éthanol | Électrique | Essence95 | Essence98 | etc.
```

## 🔐 Sécurité

- ✅ Mots de passe hashés
- ✅ Validation des comptes par administrateur
- ✅ Transactions SQL pour l'intégrité des données
- ✅ Paramètres SQL pour éviter les injections
- ✅ Gestion des erreurs avec rollback

## 🛠️ Technologies

### Frontend

- **Electron** 38.4.0 - Application desktop
- **TypeScript** 4.5.4 - Type safety
- **Vite** 5.4.21 - Build tool

### Backend

- **PostgreSQL** 15+ - Base de données relationnelle
- **pg** 8.16.3 - Client PostgreSQL
- **dotenv** 17.2.3 - Gestion des variables d'environnement
- **ts-node** 10.9.2 - Exécution TypeScript

### DevOps

- **Docker** - Containerisation PostgreSQL
- **Docker Compose** - Orchestration

## 👥 Équipe

- **Akono Josua**
- **Bekkaoui Othmane**
- **Benjabir Jawad**
- **Ercan Saban-Can**
- **Perret William**

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour plus d'informations.

## 📞 Support

- 📧 Email : support@freeware.com
- 📚 Documentation : [docs](./docs)
- 🐛 Issues : [GitHub Issues](https://github.com/votre-repo/freeware/issues)

---

**Version** : 1.0.0  
**Date** : 23 octobre 2025  
**Statut** : ✅ Backend Production Ready

---

<div align="center">
  <strong>Fait avec ❤️ par l'équipe Freeware</strong>
</div>
