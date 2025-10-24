/**
 * Index des modèles frontend
 * Exporte tous les modèles pour faciliter les imports
 */

// Modèles de base
export { Phone } from './Phone';
export { Car, FuelType } from './Car';
export { User } from './User';

// Modèles de frais
export { Expense, Status } from './Expense';
export { LodgingExpense } from './LodgingExpense';
export { TravelExpense, GoogleMapsAPI } from './TravelExpense';
export { MealExpense } from './MealExpense';

// Modèles métier
export { Site } from './Site';
export { PricingGrid } from './PricingGrid';

// Modèles utilisateur (hiérarchie)
export { Employee } from './Employee';
export { Accountant } from './Accountant';
export { Administrator } from './Administrator';

// Services
export { MailService } from './MailService';
