import { Utilisateur, Role } from "../types/api.types";
import { renderTemplate } from "./template-helper";

declare const lucide: {
  createIcons: () => void;
};

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  roles: Role[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: "home",
    roles: [Role.EMPLOYE, Role.COMPTABLE, Role.ADMIN],
  },
  {
    id: "mes-frais",
    label: "Mes frais",
    icon: "receipt",
    roles: [Role.EMPLOYE],
  },
  {
    id: "nouveau-frais",
    label: "Nouveau frais",
    icon: "file-text",
    roles: [Role.EMPLOYE],
  },
  {
    id: "frais-globaux",
    label: "Tous les frais",
    icon: "receipt",
    roles: [Role.COMPTABLE, Role.ADMIN],
  },
  {
    id: "chantiers",
    label: "Chantiers",
    icon: "building-2",
    roles: [Role.EMPLOYE, Role.COMPTABLE, Role.ADMIN],
  },
  {
    id: "vehicules",
    label: "Véhicules",
    icon: "car",
    roles: [Role.EMPLOYE, Role.COMPTABLE, Role.ADMIN],
  },
  {
    id: "utilisateurs",
    label: "Utilisateurs",
    icon: "users",
    roles: [Role.ADMIN],
  },
  {
    id: "tarifs",
    label: "Grille tarifaire",
    icon: "dollar-sign",
    roles: [Role.EMPLOYE, Role.COMPTABLE, Role.ADMIN],
  },
  {
    id: "emails",
    label: "Emails",
    icon: "mail",
    roles: [Role.COMPTABLE, Role.ADMIN],
  },
  {
    id: "administration",
    label: "Administration",
    icon: "shield",
    roles: [Role.ADMIN],
  },
  {
    id: "aide",
    label: "Aide",
    icon: "help-circle",
    roles: [Role.EMPLOYE, Role.COMPTABLE, Role.ADMIN],
  },
];

export class Sidebar {
  private container: HTMLElement;
  private currentPage: string;
  private user: Utilisateur | null;
  private isOpen = true;
  private onNavigate: (page: string) => void;

  constructor(
    containerId: string,
    user: Utilisateur | null,
    currentPage: string,
    onNavigate: (page: string) => void
  ) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Element with id "${containerId}" not found`);
    }
    this.container = element;
    this.currentPage = currentPage;
    this.user = user;
    this.onNavigate = onNavigate;
    this.render();
  }

  private getMenuLabel(item: MenuItem): string {
    if (item.id === "vehicules" && this.user?.role === Role.EMPLOYE) {
      return "Mon véhicule";
    }
    return item.label;
  }

  private getFilteredMenuItems(): MenuItem[] {
    if (!this.user) return [];
    return MENU_ITEMS.filter((item) => item.roles.includes(this.user?.role));
  }

  public toggle(): void {
    this.isOpen = !this.isOpen;
    this.updateSidebarState();
  }

  public setCurrentPage(page: string): void {
    this.currentPage = page;
    this.render();
  }

  private updateSidebarState(): void {
    const sidebar = this.container.querySelector("aside");
    if (sidebar) {
      if (this.isOpen) {
        sidebar.classList.remove("-translate-x-full");
        sidebar.classList.add("translate-x-0");
      } else {
        sidebar.classList.remove("translate-x-0");
        sidebar.classList.add("-translate-x-full", "lg:translate-x-0");
      }

      // Gérer l'overlay
      const existingOverlay = document.getElementById("sidebar-overlay");
      if (this.isOpen && !existingOverlay && window.innerWidth < 1024) {
        const overlay = document.createElement("div");
        overlay.id = "sidebar-overlay";
        overlay.className =
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300";
        overlay.addEventListener("click", () => this.toggle());
        document.body.appendChild(overlay);
        // Trigger animation
        setTimeout(() => (overlay.style.opacity = "1"), 10);
      } else if (!this.isOpen && existingOverlay) {
        existingOverlay.style.opacity = "0";
        setTimeout(() => existingOverlay.remove(), 300);
      }
    } else {
      void this.render();
    }
  }

  private async render(): Promise<void> {
    const menuItems = this.getFilteredMenuItems();

    // Generate menu items HTML
    const menuItemsHtml = await Promise.all(
      menuItems.map(async (item) => {
        const activeClass =
          this.currentPage === item.id
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50";

        return await renderTemplate(
          "/src/frontend/templates/sidebar-menu-item.tpl.html",
          {
            id: item.id,
            icon: item.icon,
            label: this.getMenuLabel(item),
            activeClass,
          }
        );
      })
    );

    const openClass = this.isOpen
      ? "translate-x-0"
      : "-translate-x-full lg:translate-x-0";

    const sidebarHtml = await renderTemplate(
      "/src/frontend/templates/sidebar.tpl.html",
      {
        openClass,
        menuItemsHtml: menuItemsHtml.join("\n"),
      }
    );

    this.container.innerHTML = sidebarHtml;

    // Add event listeners
    const links = this.container.querySelectorAll(".sidebar-link");
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        const page = (e.currentTarget as HTMLElement).getAttribute("data-page");
        if (page) {
          this.onNavigate(page);
          if (window.innerWidth < 1024) {
            this.toggle();
          }
        }
      });
    });

    // Initialiser l'overlay si la sidebar est ouverte sur mobile
    if (this.isOpen && window.innerWidth < 1024) {
      const existingOverlay = document.getElementById("sidebar-overlay");
      if (!existingOverlay) {
        const overlay = document.createElement("div");
        overlay.id = "sidebar-overlay";
        overlay.className = "fixed inset-0 bg-black/50 z-40 lg:hidden";
        overlay.style.opacity = "1";
        overlay.addEventListener("click", () => this.toggle());
        document.body.appendChild(overlay);
      }
    }

    // Refresh icons
    lucide.createIcons();
  }
}
