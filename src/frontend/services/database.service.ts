import { ApiResponse } from "../types/api.types";

/**
 * Service pour tester la connexion à la base de données
 */
export class DatabaseService {
  /**
   * Tester la connexion à la base de données
   */
  static async testConnection(): Promise<ApiResponse<{ version: string }>> {
    try {
      const result = await window.electronAPI.db.testConnection();
      if (result) {
        return {
          success: true,
          data: { version: "PostgreSQL (version inconnue)" },
        };
      }
      return {
        success: false,
        error: "Connexion échouée",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }
}
