import { AuthManager } from "./auth";
import { Utilisateur, Role } from "../types/api.types";

/**
 * Route configuration
 */
export interface Route {
  path: string;
  component: () => Promise<void>;
  title: string;
  roles?: Role[];
  requireAuth?: boolean;
}

/**
 * Router class for SPA navigation
 */
export class Router {
  private routes: Map<string, Route> = new Map();
  private currentPath = "";
  private onNavigationCallbacks: Array<(path: string) => void> = [];

  constructor() {
    // Listen to browser back/forward buttons
    window.addEventListener("popstate", () => {
      this.navigate(window.location.pathname, false);
    });
  }

  /**
   * Register a route
   */
  public register(route: Route): void {
    this.routes.set(route.path, route);
  }

  /**
   * Register multiple routes
   */
  public registerRoutes(routes: Route[]): void {
    routes.forEach((route) => this.register(route));
  }

  /**
   * Navigate to a path
   */
  public async navigate(path: string, pushState = true): Promise<void> {
    const route = this.routes.get(path);

    if (!route) {
      console.error(`Route not found: ${path}`);
      this.navigate("/dashboard", pushState);
      return;
    }

    // Check authentication
    if (route.requireAuth !== false && !AuthManager.isAuthenticated()) {
      window.location.href = "/src/frontend/pages/login.html";
      return;
    }

    // Check role authorization
    if (route.roles && route.roles.length > 0) {
      const user = AuthManager.getUser();
      if (!user || !route.roles.includes(user.role)) {
        console.error(`Access denied to ${path} for role ${user?.role}`);
        this.navigate("/dashboard", pushState);
        return;
      }
    }

    // Update browser history
    if (pushState && path !== this.currentPath) {
      window.history.pushState({ path }, route.title, path);
    }

    // Update document title
    document.title = `${route.title} - GestionFrais Pro`;

    // Store current path
    this.currentPath = path;

    // Notify navigation callbacks
    this.onNavigationCallbacks.forEach((callback) => callback(path));

    // Load component
    try {
      await route.component();
    } catch (error) {
      console.error(`Error loading component for ${path}:`, error);
    }
  }

  /**
   * Get current path
   */
  public getCurrentPath(): string {
    return this.currentPath;
  }

  /**
   * Subscribe to navigation changes
   */
  public onNavigation(callback: (path: string) => void): void {
    this.onNavigationCallbacks.push(callback);
  }

  /**
   * Navigate by page ID (used by sidebar/header)
   */
  public navigateById(pageId: string): void {
    const pathMap: Record<string, string> = {
      dashboard: "/dashboard",
      profil: "/profil",
      parametres: "/parametres",
      "mes-frais": "/mes-frais",
      "nouveau-frais": "/nouveau-frais",
      "frais-globaux": "/frais-globaux",
      chantiers: "/chantiers",
      vehicules: "/vehicules",
      utilisateurs: "/utilisateurs",
      tarifs: "/tarifs",
      emails: "/emails",
      administration: "/administration",
      aide: "/aide",
      notification: "/notifications",
    };

    const path = pathMap[pageId];
    if (path) {
      void this.navigate(path);
    } else {
      console.warn(`Unknown page ID: ${pageId}`);
    }
  }

  /**
   * Get dashboard path based on user role
   */
  public getDashboardPath(user: Utilisateur | null): string {
    if (!user) return "/dashboard";

    const dashboardPaths: Record<Role, string> = {
      [Role.EMPLOYE]: "/dashboard",
      [Role.COMPTABLE]: "/dashboard",
      [Role.ADMIN]: "/dashboard",
    };

    return dashboardPaths[user.role] || "/dashboard";
  }
}

// Global router instance
export const router = new Router();
