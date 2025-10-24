import { GrilleTarifaire, ApiResponse } from "../types/api.types";

/**
 * Service pour la gestion de la grille tarifaire
 * Utilise l'API exposée par Electron via contextBridge
 */
export class TarifService {
  /**
   * Créer ou mettre à jour un tarif
   */
  static async upsert(
    tarifData: GrilleTarifaire
  ): Promise<ApiResponse<GrilleTarifaire>> {
    try {
      const result = await window.electronAPI.tarif.upsert(tarifData);
      return result as ApiResponse<GrilleTarifaire>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer tous les tarifs
   */
  static async getAll(): Promise<ApiResponse<GrilleTarifaire[]>> {
    try {
      const result = await window.electronAPI.tarif.getAll();
      return result as ApiResponse<GrilleTarifaire[]>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer un tarif par cylindrée
   */
  static async getByCylindree(
    cylindree: number
  ): Promise<ApiResponse<GrilleTarifaire>> {
    try {
      const result = await window.electronAPI.tarif.getByCylindree(cylindree);
      return result as ApiResponse<GrilleTarifaire>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Supprimer un tarif
   */
  static async delete(cylindree: number): Promise<ApiResponse<void>> {
    try {
      const result = await window.electronAPI.tarif.delete(cylindree);
      return result as ApiResponse<void>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Calculer le montant d'un déplacement
   */
  static async calculateDeplacement(
    cylindree: number,
    distanceKm: number
  ): Promise<ApiResponse<number>> {
    try {
      const result = await window.electronAPI.tarif.calculateDeplacement(
        cylindree,
        distanceKm
      );
      return result as ApiResponse<number>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }
}
