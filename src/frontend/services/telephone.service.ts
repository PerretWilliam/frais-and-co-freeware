import {
  Telephone,
  CreateTelephoneData,
  UpdateTelephoneData,
  ApiResponse,
} from "../types/api.types";

/**
 * Service pour la gestion des téléphones
 * Utilise l'API exposée par Electron via contextBridge
 */
export class TelephoneService {
  /**
   * Créer un nouveau téléphone
   */
  static async create(
    telephoneData: CreateTelephoneData
  ): Promise<ApiResponse<Telephone>> {
    try {
      const result = await window.electronAPI.telephone.create(telephoneData);
      return result as ApiResponse<Telephone>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer les téléphones d'un utilisateur
   */
  static async getByUser(
    idUtilisateur: number
  ): Promise<ApiResponse<Telephone[]>> {
    try {
      const result =
        await window.electronAPI.telephone.getByUser(idUtilisateur);
      return result as ApiResponse<Telephone[]>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Mettre à jour un téléphone
   */
  static async update(
    id: number,
    telephoneData: UpdateTelephoneData
  ): Promise<ApiResponse<Telephone>> {
    try {
      const result = await window.electronAPI.telephone.update(
        id,
        telephoneData
      );
      return result as ApiResponse<Telephone>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Supprimer un téléphone
   */
  static async delete(id: number): Promise<ApiResponse<void>> {
    try {
      const result = await window.electronAPI.telephone.delete(id);
      return result as ApiResponse<void>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }
}
