import {
  Utilisateur,
  CreateUtilisateurData,
  UpdateUtilisateurData,
  LoginCredentials,
  LoginResponse,
  ApiResponse,
} from "../types/api.types";

/**
 * Service pour la gestion des utilisateurs
 * Utilise l'API exposée par Electron via contextBridge
 */
export class UtilisateurService {
  /**
   * Créer un nouvel utilisateur
   */
  static async create(
    userData: CreateUtilisateurData
  ): Promise<ApiResponse<Utilisateur>> {
    try {
      const result = await window.electronAPI.user.create(userData);
      return result as ApiResponse<Utilisateur>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  static async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<LoginResponse>> {
    try {
      const result = await window.electronAPI.user.login(credentials);
      return result as ApiResponse<LoginResponse>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer tous les utilisateurs
   */
  static async getAll(): Promise<ApiResponse<Utilisateur[]>> {
    try {
      const result = await window.electronAPI.user.getAll();
      return result as ApiResponse<Utilisateur[]>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer un utilisateur par son ID
   */
  static async getById(id: number): Promise<ApiResponse<Utilisateur>> {
    try {
      const result = await window.electronAPI.user.getById(id);
      return result as ApiResponse<Utilisateur>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  static async update(
    id: number,
    userData: UpdateUtilisateurData
  ): Promise<ApiResponse<Utilisateur>> {
    try {
      const result = await window.electronAPI.user.update(id, userData);
      return result as ApiResponse<Utilisateur>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Supprimer un utilisateur
   */
  static async delete(id: number): Promise<ApiResponse<void>> {
    try {
      const result = await window.electronAPI.user.delete(id);
      return result as ApiResponse<void>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Changer le mot de passe d'un utilisateur
   */
  static async changePassword(
    id: number,
    oldPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>> {
    try {
      const result = await window.electronAPI.user.changePassword(
        id,
        oldPassword,
        newPassword
      );
      return result as ApiResponse<void>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Valider un utilisateur (admin)
   */
  static async validate(id: number): Promise<ApiResponse<void>> {
    try {
      const result = await window.electronAPI.user.validate(id);
      return result as ApiResponse<void>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupérer les utilisateurs en attente de validation
   */
  static async getPending(): Promise<ApiResponse<Utilisateur[]>> {
    try {
      const result = await window.electronAPI.user.getPending();
      return result as ApiResponse<Utilisateur[]>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }
}
