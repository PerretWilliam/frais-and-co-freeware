import {
  Chantier,
  CreateChantierData,
  UpdateChantierData,
  ApiResponse,
} from "../types/api.types";

/**
 * Service pour la gestion des chantiers
 * Utilise l'API exposée par Electron via contextBridge
 */
export class ChantierService {
  /**
   * Créer un nouveau chantier
   */
  static async create(
    chantierData: CreateChantierData
  ): Promise<ApiResponse<Chantier>> {
    try {
      const result = await window.electronAPI.chantier.create(chantierData);
      return result as ApiResponse<Chantier>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer tous les chantiers
   */
  static async getAll(): Promise<ApiResponse<Chantier[]>> {
    try {
      const result = await window.electronAPI.chantier.getAll();
      return result as ApiResponse<Chantier[]>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer un chantier par son ID
   */
  static async getById(id: number): Promise<ApiResponse<Chantier>> {
    try {
      const result = await window.electronAPI.chantier.getById(id);
      return result as ApiResponse<Chantier>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Mettre à jour un chantier
   */
  static async update(
    id: number,
    chantierData: UpdateChantierData
  ): Promise<ApiResponse<Chantier>> {
    try {
      const result = await window.electronAPI.chantier.update(id, chantierData);
      return result as ApiResponse<Chantier>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Supprimer un chantier
   */
  static async delete(id: number): Promise<ApiResponse<void>> {
    try {
      const result = await window.electronAPI.chantier.delete(id);
      return result as ApiResponse<void>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Rechercher des chantiers par terme
   */
  static async search(searchTerm: string): Promise<ApiResponse<Chantier[]>> {
    try {
      const result = await window.electronAPI.chantier.search(searchTerm);
      return result as ApiResponse<Chantier[]>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }
}
