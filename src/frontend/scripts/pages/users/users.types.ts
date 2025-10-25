import { Role } from "../../../types/api.types";

/**
 * Types et interfaces pour la page utilisateurs
 */

export interface UserStats {
  total: number;
  employes: number;
  comptables: number;
  actifs: number;
}

export const ROLE_LABELS: Record<string, string> = {
  [Role.EMPLOYE]: "Employé",
  [Role.COMPTABLE]: "Comptable",
  [Role.ADMIN]: "Administrateur",
};

export const ROLE_CLASSES: Record<string, string> = {
  [Role.EMPLOYE]: "bg-blue-500/20 text-blue-600",
  [Role.COMPTABLE]: "bg-purple-500/20 text-purple-600",
  [Role.ADMIN]: "bg-red-500/20 text-red-600",
};

export interface UserFilterState {
  searchTerm: string;
  roleFilter: string;
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}
