import { AuthManager } from "./auth";
import { Router, router, Route } from "./router";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { Role } from "../types/api.types";
import { renderTemplate } from "./template-helper";

// Import page components
import {
  DashboardEmployePage,
  DashboardComptablePage,
  DashboardAdminPage,
  ProfilPage,
  ParametresPage,
  MesFraisPage,
  FraisGlobauxPage,
  ChantiersPage,
} from "./pages";

declare const lucide: {
  createIcons: () => void;
};

/**
 * Main Application class
 */
class App {
  private sidebar: Sidebar | null = null;
  private header: Header | null = null;
  private footer: Footer | null = null;
  private router: Router;

  constructor() {
    this.router = router;

    // Check authentication
    if (!AuthManager.isAuthenticated()) {
      window.location.href = "/src/frontend/pages/login.html";
      return;
    }

    const user = AuthManager.getUser();
    if (!user) {
      window.location.href = "/src/frontend/pages/login.html";
      return;
    }

    // Initialize layout components
    this.initializeLayout(user);

    // Register routes
    this.registerRoutes(user);

    // Subscribe to navigation changes to update sidebar active state
    this.router.onNavigation((path) => {
      const pageId = this.getPageIdFromPath(path);
      if (this.sidebar && pageId) {
        this.sidebar.setCurrentPage(pageId);
      }
    });

    // Start routing
    const currentPath = window.location.pathname;
    const isAppRoot =
      currentPath === "/src/frontend/pages/app.html" ||
      currentPath === "/" ||
      currentPath.endsWith("/app.html");

    const initialPath = isAppRoot
      ? this.router.getDashboardPath(user)
      : currentPath;

    void this.router.navigate(initialPath, false);
  }

  /**
   * Initialize layout components (sidebar, header, footer)
   */
  private initializeLayout(
    user: NonNullable<ReturnType<typeof AuthManager.getUser>>
  ): void {
    const currentPageId = this.getPageIdFromPath(window.location.pathname);

    this.sidebar = new Sidebar(
      "sidebar-container",
      user,
      currentPageId || "dashboard",
      (pageId: string) => this.router.navigateById(pageId)
    );

    this.header = new Header(
      "header-container",
      user,
      () => this.sidebar?.toggle(),
      (pageId: string) => this.router.navigateById(pageId)
    );

    this.footer = new Footer("footer-container");
  }

  /**
   * Register all application routes
   */
  private registerRoutes(
    user: NonNullable<ReturnType<typeof AuthManager.getUser>>
  ): void {
    const routes: Route[] = [
      // Dashboard routes (role-specific)
      {
        path: "/dashboard",
        title: "Tableau de bord",
        component: async () => {
          if (user.role === Role.EMPLOYE) {
            await new DashboardEmployePage().render();
          } else if (user.role === Role.COMPTABLE) {
            await new DashboardComptablePage().render();
          } else if (user.role === Role.ADMIN) {
            await new DashboardAdminPage().render();
          }
        },
      },

      // Profil page
      {
        path: "/profil",
        title: "Mon profil",
        component: async () => {
          await new ProfilPage().render();
        },
      },

      // Parametres page
      {
        path: "/parametres",
        title: "Paramètres",
        component: async () => {
          await new ParametresPage().render();
        },
      },

      // Mes frais (employe only)
      {
        path: "/mes-frais",
        title: "Mes frais",
        roles: [Role.EMPLOYE],
        component: async () => {
          await new MesFraisPage().render();
        },
      },

      // Nouveau frais (employe only)
      {
        path: "/nouveau-frais",
        title: "Nouveau frais",
        roles: [Role.EMPLOYE],
        component: async () => {
          await this.renderPlaceholder(
            "Nouveau frais",
            "Créer un nouveau frais"
          );
        },
      },

      // Frais globaux (comptable, admin)
      {
        path: "/frais-globaux",
        title: "Tous les frais",
        roles: [Role.COMPTABLE, Role.ADMIN],
        component: async () => {
          await new FraisGlobauxPage().render();
        },
      },

      // Chantiers
      {
        path: "/chantiers",
        title: "Chantiers",
        component: async () => {
          await new ChantiersPage().render();
        },
      },

      // Vehicules
      {
        path: "/vehicules",
        title: user.role === Role.EMPLOYE ? "Mon véhicule" : "Véhicules",
        component: async () => {
          await this.renderPlaceholder(
            user.role === Role.EMPLOYE ? "Mon véhicule" : "Véhicules",
            "Gestion des véhicules"
          );
        },
      },

      // Utilisateurs (admin only)
      {
        path: "/utilisateurs",
        title: "Utilisateurs",
        roles: [Role.ADMIN],
        component: async () => {
          await this.renderPlaceholder(
            "Utilisateurs",
            "Gestion des utilisateurs"
          );
        },
      },

      // Tarifs
      {
        path: "/tarifs",
        title: "Grille tarifaire",
        component: async () => {
          await this.renderPlaceholder(
            "Grille tarifaire",
            "Gestion des tarifs"
          );
        },
      },

      // Emails (comptable, admin)
      {
        path: "/emails",
        title: "Emails",
        roles: [Role.COMPTABLE, Role.ADMIN],
        component: async () => {
          await this.renderPlaceholder("Emails", "Gestion des emails");
        },
      },

      // Administration (admin only)
      {
        path: "/administration",
        title: "Administration",
        roles: [Role.ADMIN],
        component: async () => {
          await this.renderPlaceholder(
            "Administration",
            "Paramètres d'administration"
          );
        },
      },

      // Aide
      {
        path: "/aide",
        title: "Aide",
        component: async () => {
          await this.renderPlaceholder(
            "Aide",
            "Centre d'aide et documentation"
          );
        },
      },

      // Notifications
      {
        path: "/notifications",
        title: "Notifications",
        component: async () => {
          await this.renderPlaceholder("Notifications", "Vos notifications");
        },
      },
    ];

    this.router.registerRoutes(routes);
  }

  /**
   * Get page ID from path
   */
  private getPageIdFromPath(path: string): string | null {
    const pathToPageId: Record<string, string> = {
      "/dashboard": "dashboard",
      "/profil": "profil",
      "/parametres": "parametres",
      "/mes-frais": "mes-frais",
      "/nouveau-frais": "nouveau-frais",
      "/frais-globaux": "frais-globaux",
      "/chantiers": "chantiers",
      "/vehicules": "vehicules",
      "/utilisateurs": "utilisateurs",
      "/tarifs": "tarifs",
      "/emails": "emails",
      "/administration": "administration",
      "/aide": "aide",
      "/notifications": "notification",
    };

    return pathToPageId[path] || null;
  }

  /**
   * Render placeholder for unimplemented pages
   */
  private async renderPlaceholder(
    title: string,
    description: string
  ): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const html = await renderTemplate(
      "/src/frontend/templates/dashboard-placeholder.tpl.html",
      {
        icon: "construction",
        title,
        description: `${description}\n\nCette page sera bientôt disponible`,
      }
    );

    outlet.innerHTML = html;

    lucide.createIcons();
  }
}

// Initialize app
new App();
