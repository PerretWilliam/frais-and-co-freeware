import { Utilisateur, Role } from "../types/api.types";
import { AuthManager } from "./auth";
import { renderTemplate } from "./template-helper";

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
    void this.renderDropdown();
  }

  private async renderDropdown(): Promise<void> {
    const dropdownContainer = document.getElementById("dropdown-menu");
    if (!dropdownContainer) return;

    if (this.dropdownOpen) {
      const html = await renderTemplate(
        "/src/frontend/templates/header-dropdown.tpl.html",
        {}
      );
      dropdownContainer.innerHTML = html;
      dropdownContainer.classList.remove("hidden");

      // Add event listeners
      const logoutButton = document.getElementById("logout-button");
      if (logoutButton) {
        logoutButton.addEventListener("click", () => this.handleLogout());
      }

      const dropdownItems =
        dropdownContainer.querySelectorAll("[data-navigate]");
      dropdownItems.forEach((item) => {
        item.addEventListener("click", (e) => {
          const page = (e.currentTarget as HTMLElement).getAttribute(
            "data-navigate"
          );
          if (page) {
            this.onNavigate(page);
            this.dropdownOpen = false;
            dropdownContainer.innerHTML = "";
            dropdownContainer.classList.add("hidden");
          }
        });
      });

      // Close dropdown when clicking outside
      setTimeout(() => {
        document.addEventListener(
          "click",
          (e) => {
            const target = e.target as HTMLElement;
            if (
              !target.closest("#user-menu-button") &&
              !target.closest("#dropdown-menu")
            ) {
              this.dropdownOpen = false;
              dropdownContainer.innerHTML = "";
              dropdownContainer.classList.add("hidden");
            }
          },
          { once: true }
        );
      }, 0);

      lucide.createIcons();
    } else {
      dropdownContainer.innerHTML = "";
      dropdownContainer.classList.add("hidden");
    }
  }

  private handleLogout(): void {
    AuthManager.logout();
    window.location.href = "/src/frontend/pages/login.html";
  }

  private async render(): Promise<void> {
    const initials = this.user
      ? `${this.user.prenom[0]}${this.user.nom_utilisateur[0]}`
      : "U";

    const roleLabel = this.user?.role ? ROLE_LABELS[this.user.role] : "";
    const roleColor = this.user?.role ? ROLE_COLORS[this.user.role] : "";

    const html = await renderTemplate(
      "/src/frontend/templates/header.tpl.html",
      {
        initials,
        prenom: this.user?.prenom || "",
        nom: this.user?.nom_utilisateur || "",
        roleLabel,
        roleColor,
      }
    );

    this.container.innerHTML = html;

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

    // Refresh icons
    lucide.createIcons();
  }
}
