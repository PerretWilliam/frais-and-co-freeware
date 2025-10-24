import {
  FraisDeplacement,
  FraisRepas,
  FraisHebergement,
  Frais,
  FraisFilters,
  FraisStats,
  StatutFrais,
  ApiResponse,
} from "../types/api.types";

/**
 * Service pour la gestion des frais
 * Utilise l'API exposée par Electron via contextBridge
 */
export class FraisService {
  /**
   * Créer un frais de déplacement
   */
  static async createDeplacement(
    fraisData: Omit<FraisDeplacement, "id_deplacement">
  ): Promise<ApiResponse<FraisDeplacement>> {
    try {
      const result =
        await window.electronAPI.frais.createDeplacement(fraisData);
      return result as ApiResponse<FraisDeplacement>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Créer un frais de repas
   */
  static async createRepas(
    fraisData: Omit<FraisRepas, "id_repas">
  ): Promise<ApiResponse<FraisRepas>> {
    try {
      const result = await window.electronAPI.frais.createRepas(fraisData);
      return result as ApiResponse<FraisRepas>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Créer un frais d'hébergement
   */
  static async createHebergement(
    fraisData: Omit<FraisHebergement, "id_hebergement">
  ): Promise<ApiResponse<FraisHebergement>> {
    try {
      const result =
        await window.electronAPI.frais.createHebergement(fraisData);
      return result as ApiResponse<FraisHebergement>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer tous les frais d'un utilisateur
   */
  static async getByUser(idUtilisateur: number): Promise<ApiResponse<Frais[]>> {
    try {
      const result = await window.electronAPI.frais.getByUser(idUtilisateur);
      return result as ApiResponse<Frais[]>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer tous les frais avec filtres optionnels
   */
  static async getAll(filters?: FraisFilters): Promise<ApiResponse<Frais[]>> {
    try {
      const result = await window.electronAPI.frais.getAll(filters);
      return result as ApiResponse<Frais[]>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer un frais de déplacement par son ID
   */
  static async getDeplacementById(
    id: number
  ): Promise<ApiResponse<FraisDeplacement>> {
    try {
      const result = await window.electronAPI.frais.getDeplacementById(id);
      return result as ApiResponse<FraisDeplacement>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer un frais de repas par son ID
   */
  static async getRepasById(id: number): Promise<ApiResponse<FraisRepas>> {
    try {
      const result = await window.electronAPI.frais.getRepasById(id);
      return result as ApiResponse<FraisRepas>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer un frais d'hébergement par son ID
   */
  static async getHebergementById(
    id: number
  ): Promise<ApiResponse<FraisHebergement>> {
    try {
      const result = await window.electronAPI.frais.getHebergementById(id);
      return result as ApiResponse<FraisHebergement>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Mettre à jour le statut d'un frais
   */
  static async updateStatut(
    id: number,
    statut: StatutFrais
  ): Promise<ApiResponse<void>> {
    try {
      const result = await window.electronAPI.frais.updateStatut(id, statut);
      return result as ApiResponse<void>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Supprimer un frais
   */
  static async delete(id: number): Promise<ApiResponse<void>> {
    try {
      const result = await window.electronAPI.frais.delete(id);
      return result as ApiResponse<void>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer les statistiques des frais d'un utilisateur
   */
  static async getStatsByUser(
    idUtilisateur: number
  ): Promise<ApiResponse<FraisStats>> {
    try {
      const result =
        await window.electronAPI.frais.getStatsByUser(idUtilisateur);
      return result as ApiResponse<FraisStats>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }
}
