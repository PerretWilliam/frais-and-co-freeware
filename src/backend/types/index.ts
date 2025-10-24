// ==========================================================
// TYPES TYPESCRIPT POUR LA BASE DE DONNÉES
// ==========================================================

// Énumérations
export enum Role {
  ADMIN = "admin",
  COMPTABLE = "comptable",
  EMPLOYE = "employe",
}

export enum StatutFrais {
  BROUILLON = "Brouillon",
  EN_COURS = "EnCours",
  PAIEMENT_EN_COURS = "PaiementEnCours",
  PAYE = "Paye",
  REFUSE = "Refuse",
}

export enum TypeEssence {
  DIESEL = "Diesel",
  ETHANOL = "Éthanol",
  AUTRE = "Autre",
  GAZOLE = "Gazole",
  ELECTRIQUE = "Électrique",
  ESSENCE95 = "Essence95",
  ESSENCE98 = "Essence98",
}

// ==========================================================
// INTERFACES POUR LES ENTITÉS
// ==========================================================

export interface Utilisateur {
  id_utilisateur?: number;
  nom_utilisateur: string;
  prenom: string;
  email: string;
  mot_de_passe?: string; // Optionnel car ne doit pas être retourné
  salt?: string; // Optionnel car ne doit pas être retourné
  adresse_utilisateur: string;
  cp_utilisateur: string;
  ville_utilisateur: string;
  role: Role;
  valide: boolean;
  plaque: string;
  cylindree: number;
  marque: string;
  modele: string;
  type_essence: TypeEssence;
}

export interface Chantier {
  id_chantier?: number;
  nom_chantier: string;
  adresse_chantier: string;
  cp_chantier: string;
  ville_chantier: string;
}

export interface GrilleTarifaire {
  cylindree: number;
  tarif_km: number;
}

export interface Frais {
  id_frais?: number;
  lieu: string;
  date: Date;
  montant: number;
  justificatif: Buffer;
  statut: StatutFrais;
  id_utilisateur: number;
  id_chantier: number;
}

export interface FraisDeplacement {
  id_deplacement?: number;
  ville_depart: string;
  ville_arrivee: string;
  distance_km: number;
  id_voiture: number;
  // Propriétés héritées de Frais
  lieu: string;
  date: Date;
  montant: number;
  justificatif: Buffer;
  statut: StatutFrais;
  id_utilisateur: number;
  id_chantier: number;
}

export interface FraisRepas {
  id_repas?: number;
  type_repas: string;
  // Propriétés héritées de Frais
  lieu: string;
  date: Date;
  montant: number;
  justificatif: Buffer;
  statut: StatutFrais;
  id_utilisateur: number;
  id_chantier: number;
}

export interface FraisHebergement {
  id_hebergement?: number;
  nb_nuits: number;
  date_debut: Date;
  date_fin: Date;
  nom_etablissement: string;
  // Propriétés héritées de Frais
  lieu: string;
  date: Date;
  montant: number;
  justificatif: Buffer;
  statut: StatutFrais;
  id_utilisateur: number;
  id_chantier: number;
}

export interface Telephone {
  id_telephone?: number;
  indic_pays: string;
  indic_region: string;
  numero: string;
  id_utilisateur: number;
}

// ==========================================================
// TYPES POUR LES RÉPONSES API
// ==========================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  utilisateur: Utilisateur;
  token?: string;
}
