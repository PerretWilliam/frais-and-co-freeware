import { Utilisateur } from "../types/api.types";

/**
 * Gestionnaire d'authentification
 * Gère l'état de connexion de l'utilisateur
 */
export class AuthManager {
  private static readonly STORAGE_KEY_USER = "user";
  private static readonly STORAGE_KEY_TOKEN = "token";

  /**
   * Récupère l'utilisateur connecté
   */
  static getUser(): Utilisateur | null {
    const userStr =
      sessionStorage.getItem(this.STORAGE_KEY_USER) ||
      localStorage.getItem(this.STORAGE_KEY_USER);

    if (userStr) {
      try {
        return JSON.parse(userStr) as Utilisateur;
      } catch (e) {
        console.error("Error parsing user data:", e);
        return null;
      }
    }
    return null;
  }

  /**
   * Récupère le token
   */
  static getToken(): string | null {
    return (
      sessionStorage.getItem(this.STORAGE_KEY_TOKEN) ||
      localStorage.getItem(this.STORAGE_KEY_TOKEN)
    );
  }

  /**
   * Sauvegarde l'utilisateur
   */
  static saveUser(user: Utilisateur, rememberMe = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.STORAGE_KEY_USER, JSON.stringify(user));
  }

  /**
   * Sauvegarde le token
   */
  static saveToken(token: string, rememberMe = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.STORAGE_KEY_TOKEN, token);
  }

  /**
   * Déconnexion
   */
  static logout(): void {
    sessionStorage.removeItem(this.STORAGE_KEY_USER);
    sessionStorage.removeItem(this.STORAGE_KEY_TOKEN);
    localStorage.removeItem(this.STORAGE_KEY_USER);
    localStorage.removeItem(this.STORAGE_KEY_TOKEN);
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  static isAuthenticated(): boolean {
    return this.getUser() !== null;
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  static hasRole(role: string): boolean {
    const user = this.getUser();
    return user !== null && user.role === role;
  }

  /**
   * Vérifie si l'utilisateur a un des rôles
   */
  static hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user !== null && roles.includes(user.role);
  }

  /**
   * Redirige vers le login si non connecté
   */
  static requireAuth(redirectUrl = "/src/frontend/pages/login.html"): boolean {
    if (!this.isAuthenticated()) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }

  /**
   * Redirige vers une page selon le rôle
   */
  static redirectByRole(): void {
    const user = this.getUser();
    if (!user) {
      window.location.href = "/src/frontend/pages/login.html";
      return;
    }

    switch (user.role) {
      case "employe":
        window.location.href = "/src/frontend/pages/dashboard-employe.html";
        break;
      case "comptable":
        window.location.href = "/src/frontend/pages/dashboard-comptable.html";
        break;
      case "admin":
        window.location.href = "/src/frontend/pages/dashboard-admin.html";
        break;
      default:
        window.location.href = "/src/frontend/pages/login.html";
    }
  }

  /**
   * Initialise le bouton de déconnexion
   */
  static initLogoutButton(buttonId = "logout-btn"): void {
    const logoutBtn = document.getElementById(buttonId);
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.logout();
        window.location.href = "/src/frontend/pages/login.html";
      });
    }
  }

  /**
   * Affiche les informations utilisateur dans un élément
   */
  static displayUserInfo(elementId = "user-info"): void {
    const user = this.getUser();
    const element = document.getElementById(elementId);

    if (element && user) {
      element.innerHTML = `
        <div class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
            ${user.prenom[0]}${user.nom_utilisateur[0]}
          </div>
          <div class="text-sm">
            <p class="font-medium">${user.prenom} ${user.nom_utilisateur}</p>
            <p class="text-muted-foreground">${user.role}</p>
          </div>
        </div>
      `;
    }
  }
}
