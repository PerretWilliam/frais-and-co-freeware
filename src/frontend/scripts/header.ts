import { Utilisateur, Role } from "../types/api.types";
import { AuthManager } from "./auth";

declare const lucide: {
  createIcons: () => void;
};

const ROLE_LABELS: Record<Role, string> = {
  [Role.EMPLOYE]: "Employé",
  [Role.COMPTABLE]: "Comptable",
  [Role.ADMIN]: "Administrateur",
};

const ROLE_COLORS: Record<Role, string> = {
  [Role.EMPLOYE]: "bg-[var(--role-employee)]/20 text-[var(--role-employee)]",
  [Role.COMPTABLE]:
    "bg-[var(--role-accountant)]/20 text-[var(--role-accountant)]",
  [Role.ADMIN]: "bg-[var(--role-admin)]/20 text-[var(--role-admin)]",
};

export class Header {
  private container: HTMLElement;
  private user: Utilisateur | null;
  private onMenuClick: () => void;
  private onNavigate: (page: string) => void;
  private dropdownOpen = false;

  constructor(
    containerId: string,
    user: Utilisateur | null,
    onMenuClick: () => void,
    onNavigate: (page: string) => void
  ) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Element with id "${containerId}" not found`);
    }
    this.container = element;
    this.user = user;
    this.onMenuClick = onMenuClick;
    this.onNavigate = onNavigate;
    this.render();
  }

  private toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    this.render();
  }

  private handleLogout(): void {
    AuthManager.logout();
    window.location.href = "/src/frontend/pages/login.html";
  }

  private render(): void {
    const initials = this.user
      ? `${this.user.prenom[0]}${this.user.nom_utilisateur[0]}`
      : "U";

    const roleLabel = this.user?.role ? ROLE_LABELS[this.user.role] : "";
    const roleColor = this.user?.role ? ROLE_COLORS[this.user.role] : "";

    this.container.innerHTML = `
      <header class="h-16 border-b bg-card flex items-center px-4 gap-4 sticky top-0 z-30">
        <button 
          id="menu-button"
          class="lg:hidden inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9"
        >
          <i data-lucide="menu" class="h-5 w-5"></i>
        </button>

        <div class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span class="text-primary-foreground font-medium">GF</span>
          </div>
          <h1 class="hidden sm:block text-lg font-medium">GestionFrais Pro</h1>
        </div>

        <div class="ml-auto flex items-center gap-3">
          <button 
            id="notification-button"
            class="relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9"
          >
            <i data-lucide="bell" class="h-5 w-5"></i>
            <span class="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
          </button>

          <div class="relative">
            <button 
              id="user-menu-button"
              class="flex items-center gap-2 h-auto py-2 px-3 rounded-md hover:bg-accent transition-colors"
            >
              <div class="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                ${initials}
              </div>
              <div class="hidden sm:flex flex-col items-start">
                <span class="text-sm font-medium">${this.user?.prenom} ${this.user?.nom_utilisateur}</span>
                <span class="text-xs px-2 py-0.5 rounded-full ${roleColor}">
                  ${roleLabel}
                </span>
              </div>
              <i data-lucide="chevron-down" class="h-4 w-4 hidden sm:block"></i>
            </button>

            <!-- Dropdown Menu -->
            ${
              this.dropdownOpen
                ? `
              <div class="absolute right-0 mt-2 w-56 bg-popover border rounded-md shadow-lg z-50">
                <div class="p-2 border-b">
                  <p class="text-sm font-medium">Mon compte</p>
                </div>
                <div class="py-1">
                  <button 
                    data-navigate="profil"
                    class="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    Profil
                  </button>
                  <button 
                    data-navigate="parametres"
                    class="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    Paramètres
                  </button>
                </div>
                <div class="border-t py-1">
                  <button 
                    id="logout-button"
                    class="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>
      </header>
    `;

    // Add event listeners
    const menuButton = document.getElementById("menu-button");
    if (menuButton) {
      menuButton.addEventListener("click", this.onMenuClick);
    }

    const notificationButton = document.getElementById("notification-button");
    if (notificationButton) {
      notificationButton.addEventListener("click", () =>
        this.onNavigate("notification")
      );
    }

    const userMenuButton = document.getElementById("user-menu-button");
    if (userMenuButton) {
      userMenuButton.addEventListener("click", () => this.toggleDropdown());
    }

    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", () => this.handleLogout());
    }

    const dropdownItems = this.container.querySelectorAll("[data-navigate]");
    dropdownItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const page = (e.currentTarget as HTMLElement).getAttribute(
          "data-navigate"
        );
        if (page) {
          this.onNavigate(page);
          this.dropdownOpen = false;
          this.render();
        }
      });
    });

    // Close dropdown when clicking outside
    if (this.dropdownOpen) {
      setTimeout(() => {
        document.addEventListener(
          "click",
          (e) => {
            const target = e.target as HTMLElement;
            if (
              !target.closest("#user-menu-button") &&
              !target.closest(".dropdown-item")
            ) {
              this.dropdownOpen = false;
              this.render();
            }
          },
          { once: true }
        );
      }, 0);
    }

    // Refresh icons
    lucide.createIcons();
  }
}
