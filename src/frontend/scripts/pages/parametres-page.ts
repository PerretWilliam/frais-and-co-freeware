import { AuthManager } from "../auth";
import { Role } from "../../types/api.types";
import { renderTemplate } from "../template-helper";

declare const lucide: {
  createIcons: () => void;
};

interface NotificationSettings {
  email: boolean;
  fraisValides: boolean;
  fraisRefuses: boolean;
  nouveauxFrais: boolean;
  rappels: boolean;
}

const STORAGE_KEY = "notification_settings";

/**
 * Parametres Page
 */
export class ParametresPage {
  private notificationSettings: NotificationSettings;

  constructor() {
    this.notificationSettings = this.loadSettings();
  }

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const user = AuthManager.getUser();
    if (!user) return;

    // Prepare template data
    const roleLabels: Record<Role, string> = {
      [Role.EMPLOYE]: "Employé",
      [Role.COMPTABLE]: "Comptable",
      [Role.ADMIN]: "Administrateur",
    };

    const isDark = document.documentElement.classList.contains("dark");

    // Generate nouveaux frais HTML for comptables only
    const nouveauxFraisHtml =
      user.role === Role.COMPTABLE
        ? `
      <div id="nouveaux-frais-setting" class="flex items-center justify-between">
        <div class="space-y-0.5">
          <label class="text-sm font-medium">Nouveaux frais</label>
          <p class="text-sm text-muted-foreground">
            Être notifié des nouveaux frais à valider
          </p>
        </div>
        <button
          class="notification-toggle relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${this.notificationSettings.nouveauxFrais ? "bg-primary" : "bg-input"}"
          role="switch"
          aria-checked="${this.notificationSettings.nouveauxFrais}"
          data-setting="nouveauxFrais"
        >
          <span class="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${this.notificationSettings.nouveauxFrais ? "translate-x-5" : "translate-x-0"}"></span>
        </button>
      </div>
    `
        : "";

    const html = await renderTemplate(
      "/src/frontend/templates/parametres-page.tpl.html",
      {
        email: user.email,
        roleLabel: roleLabels[user.role] || user.role,
        isDark: isDark.toString(),
        themeToggleClass: isDark ? "bg-primary" : "bg-input",
        themeThumbClass: isDark ? "translate-x-5" : "translate-x-0",
        // Email toggle
        emailEnabled: this.notificationSettings.email.toString(),
        emailToggleClass: this.notificationSettings.email
          ? "bg-primary"
          : "bg-input",
        emailThumbClass: this.notificationSettings.email
          ? "translate-x-5"
          : "translate-x-0",
        // Frais valides toggle
        fraisValidesEnabled: this.notificationSettings.fraisValides.toString(),
        fraisValidesToggleClass: this.notificationSettings.fraisValides
          ? "bg-primary"
          : "bg-input",
        fraisValidesThumbClass: this.notificationSettings.fraisValides
          ? "translate-x-5"
          : "translate-x-0",
        // Frais refuses toggle
        fraisRefusesEnabled: this.notificationSettings.fraisRefuses.toString(),
        fraisRefusesToggleClass: this.notificationSettings.fraisRefuses
          ? "bg-primary"
          : "bg-input",
        fraisRefusesThumbClass: this.notificationSettings.fraisRefuses
          ? "translate-x-5"
          : "translate-x-0",
        // Rappels toggle
        rappelsEnabled: this.notificationSettings.rappels.toString(),
        rappelsToggleClass: this.notificationSettings.rappels
          ? "bg-primary"
          : "bg-input",
        rappelsThumbClass: this.notificationSettings.rappels
          ? "translate-x-5"
          : "translate-x-0",
        nouveauxFraisHtml,
      }
    );

    outlet.innerHTML = html;

    // Initialize
    this.initThemeToggle();
    this.initNotificationToggles();
    this.setupButtonHandlers();

    lucide.createIcons();
  }

  private loadSettings(): NotificationSettings {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing settings:", e);
      }
    }
    return {
      email: true,
      fraisValides: true,
      fraisRefuses: true,
      nouveauxFrais: false,
      rappels: true,
    };
  }

  private saveSettings(settings: NotificationSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  private initThemeToggle(): void {
    const themeToggle = document.getElementById(
      "theme-toggle"
    ) as HTMLButtonElement;
    const themeToggleThumb = document.getElementById(
      "theme-toggle-thumb"
    ) as HTMLSpanElement;
    const html = document.documentElement;

    if (!themeToggle || !themeToggleThumb) return;

    const isDark = html.classList.contains("dark");
    this.updateThemeToggle(themeToggle, themeToggleThumb, isDark);

    themeToggle.addEventListener("click", () => {
      const isCurrentlyDark = html.classList.contains("dark");
      html.classList.toggle("dark");
      localStorage.setItem("theme", isCurrentlyDark ? "light" : "dark");
      this.updateThemeToggle(themeToggle, themeToggleThumb, !isCurrentlyDark);
    });
  }

  private updateThemeToggle(
    toggle: HTMLButtonElement,
    thumb: HTMLSpanElement,
    isDark: boolean
  ): void {
    toggle.setAttribute("aria-checked", String(isDark));
    if (isDark) {
      toggle.classList.add("bg-primary");
      toggle.classList.remove("bg-input");
      thumb.classList.add("translate-x-5");
      thumb.classList.remove("translate-x-0");
    } else {
      toggle.classList.remove("bg-primary");
      toggle.classList.add("bg-input");
      thumb.classList.remove("translate-x-5");
      thumb.classList.add("translate-x-0");
    }
  }

  private initNotificationToggles(): void {
    const toggles = document.querySelectorAll(".notification-toggle");

    toggles.forEach((toggle) => {
      const button = toggle as HTMLButtonElement;
      const setting = button.getAttribute(
        "data-setting"
      ) as keyof NotificationSettings;
      if (!setting) return;

      const isEnabled = this.notificationSettings[setting];
      this.updateToggleUI(button, isEnabled);

      button.addEventListener("click", () => {
        const currentState = this.notificationSettings[setting];
        this.notificationSettings[setting] = !currentState;
        this.updateToggleUI(button, !currentState);
      });
    });
  }

  private updateToggleUI(toggle: HTMLButtonElement, isEnabled: boolean): void {
    const thumb = toggle.querySelector("span");
    if (!thumb) return;

    toggle.setAttribute("aria-checked", String(isEnabled));
    if (isEnabled) {
      toggle.classList.add("bg-primary");
      toggle.classList.remove("bg-input");
      thumb.classList.add("translate-x-5");
      thumb.classList.remove("translate-x-0");
    } else {
      toggle.classList.remove("bg-primary");
      toggle.classList.add("bg-input");
      thumb.classList.remove("translate-x-5");
      thumb.classList.add("translate-x-0");
    }
  }

  private setupButtonHandlers(): void {
    // Edit profile button
    const editProfileBtn = document.getElementById("edit-profile-btn");
    if (editProfileBtn) {
      editProfileBtn.addEventListener("click", () => {
        // Navigate to profil via router
        window.dispatchEvent(
          new CustomEvent("navigate", { detail: { path: "/profil" } })
        );
      });
    }

    // Save notifications button
    const saveNotificationsBtn = document.getElementById(
      "save-notifications-btn"
    );
    if (saveNotificationsBtn) {
      saveNotificationsBtn.addEventListener("click", () => {
        this.saveSettings(this.notificationSettings);
        void this.showToast(
          "Préférences de notifications enregistrées",
          "success"
        );
      });
    }

    // Change password button
    const changePasswordBtn = document.getElementById("change-password-btn");
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener("click", () => {
        void this.showToast(
          "Fonctionnalité de changement de mot de passe à venir",
          "info"
        );
      });
    }
  }

  private async showToast(
    message: string,
    type: "success" | "info" | "error" = "success"
  ): Promise<void> {
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) return;

    const bgClass =
      type === "success"
        ? "bg-green-500"
        : type === "error"
          ? "bg-destructive"
          : "bg-blue-500";
    const icon =
      type === "success"
        ? "check-circle"
        : type === "error"
          ? "alert-circle"
          : "info";

    const toastHtml = await renderTemplate(
      "/src/frontend/templates/toast.tpl.html",
      {
        bgClass,
        icon,
        message,
      }
    );

    const toast = document.createElement("div");
    toast.innerHTML = toastHtml;
    toastContainer.appendChild(toast);

    lucide.createIcons();

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}
