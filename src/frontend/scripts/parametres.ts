import { AuthManager } from "./auth";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { renderTemplate } from "./template-helper";

declare const lucide: {
  createIcons: () => void;
};

// Get current user
const user = AuthManager.getUser();
if (!user) {
  window.location.href = "/src/frontend/pages/login.html";
}

// Notification settings state
interface NotificationSettings {
  email: boolean;
  fraisValides: boolean;
  fraisRefuses: boolean;
  nouveauxFrais: boolean;
  rappels: boolean;
}

const STORAGE_KEY = "notification_settings";

// Load settings from localStorage
function loadSettings(): NotificationSettings {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing settings:", e);
    }
  }
  // Default settings
  return {
    email: true,
    fraisValides: true,
    fraisRefuses: true,
    nouveauxFrais: false,
    rappels: true,
  };
}

// Save settings to localStorage
function saveSettings(settings: NotificationSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Mutable notification settings
const notificationSettings: NotificationSettings = loadSettings();

/**
 * Initialize the page
 */
function init(): void {
  // Initialize layout components
  const sidebar = new Sidebar(
    "sidebar-container",
    user,
    "parametres",
    handleNavigation
  );
  new Header(
    "header-container",
    user,
    () => sidebar.toggle(),
    handleNavigation
  );
  new Footer("footer-container");

  // Populate account info
  populateAccountInfo();

  // Initialize theme toggle
  initThemeToggle();

  // Initialize notification toggles
  initNotificationToggles();

  // Setup button handlers
  setupButtonHandlers();

  // Refresh icons
  lucide.createIcons();
}

/**
 * Handle navigation
 */
function handleNavigation(page: string): void {
  const pageMap: Record<string, string> = {
    dashboard: getDashboardPath(),
    profil: "/src/frontend/pages/profil.html",
    parametres: "/src/frontend/pages/parametres.html",
    "mes-frais": "/src/frontend/pages/mes-frais.html",
    "nouveau-frais": "/src/frontend/pages/nouveau-frais.html",
    "frais-globaux": "/src/frontend/pages/frais-globaux.html",
    chantiers: "/src/frontend/pages/chantiers.html",
    vehicules: "/src/frontend/pages/vehicules.html",
    utilisateurs: "/src/frontend/pages/utilisateurs.html",
    tarifs: "/src/frontend/pages/tarifs.html",
    emails: "/src/frontend/pages/emails.html",
    administration: "/src/frontend/pages/administration.html",
    aide: "/src/frontend/pages/aide.html",
  };

  const url = pageMap[page];
  if (url) {
    window.location.href = url;
  }
}

/**
 * Get dashboard path based on user role
 */
function getDashboardPath(): string {
  if (!user) return "/src/frontend/pages/login.html";

  const dashboardMap: Record<string, string> = {
    employe: "/src/frontend/pages/dashboard-employe.html",
    comptable: "/src/frontend/pages/dashboard-comptable.html",
    admin: "/src/frontend/pages/dashboard-admin.html",
  };

  return (
    dashboardMap[user.role] || "/src/frontend/pages/dashboard-employe.html"
  );
}

/**
 * Populate account information
 */
function populateAccountInfo(): void {
  if (!user) return;

  const emailInput = document.getElementById(
    "account-email"
  ) as HTMLInputElement;
  const roleInput = document.getElementById("account-role") as HTMLInputElement;

  if (emailInput) emailInput.value = user.email;
  if (roleInput) {
    const roleLabels: Record<string, string> = {
      employe: "Employé",
      comptable: "Comptable",
      admin: "Administrateur",
    };
    roleInput.value = roleLabels[user.role] || user.role;
  }

  // Show nouveaux frais setting only for comptable
  if (user.role === "comptable") {
    const nouveauxFraisSetting = document.getElementById(
      "nouveaux-frais-setting"
    );
    if (nouveauxFraisSetting) {
      nouveauxFraisSetting.classList.remove("hidden");
    }
  }
}

/**
 * Initialize theme toggle
 */
function initThemeToggle(): void {
  const themeToggle = document.getElementById(
    "theme-toggle"
  ) as HTMLButtonElement;
  const themeToggleThumb = document.getElementById(
    "theme-toggle-thumb"
  ) as HTMLSpanElement;
  const html = document.documentElement;

  if (!themeToggle || !themeToggleThumb) return;

  const isDark = html.classList.contains("dark");
  updateThemeToggle(themeToggle, themeToggleThumb, isDark);

  themeToggle.addEventListener("click", () => {
    const isCurrentlyDark = html.classList.contains("dark");
    html.classList.toggle("dark");
    localStorage.setItem("theme", isCurrentlyDark ? "light" : "dark");
    updateThemeToggle(themeToggle, themeToggleThumb, !isCurrentlyDark);
  });
}

/**
 * Update theme toggle UI
 */
function updateThemeToggle(
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

/**
 * Initialize notification toggles
 */
function initNotificationToggles(): void {
  const toggles = document.querySelectorAll(".notification-toggle");

  toggles.forEach((toggle) => {
    const button = toggle as HTMLButtonElement;
    const setting = button.getAttribute(
      "data-setting"
    ) as keyof NotificationSettings;
    if (!setting) return;

    const isEnabled = notificationSettings[setting];
    updateToggleUI(button, isEnabled);

    button.addEventListener("click", () => {
      const currentState = notificationSettings[setting];
      notificationSettings[setting] = !currentState;
      updateToggleUI(button, !currentState);
    });
  });
}

/**
 * Update toggle UI
 */
function updateToggleUI(toggle: HTMLButtonElement, isEnabled: boolean): void {
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

/**
 * Setup button handlers
 */
function setupButtonHandlers(): void {
  // Edit profile button
  const editProfileBtn = document.getElementById("edit-profile-btn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      handleNavigation("profil");
    });
  }

  // Save notifications button
  const saveNotificationsBtn = document.getElementById(
    "save-notifications-btn"
  );
  if (saveNotificationsBtn) {
    saveNotificationsBtn.addEventListener("click", () => {
      saveSettings(notificationSettings);
      showToast("Préférences de notifications enregistrées", "success");
    });
  }

  // Change password button
  const changePasswordBtn = document.getElementById("change-password-btn");
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", () => {
      showToast("Fonctionnalité de changement de mot de passe à venir", "info");
    });
  }
}

/**
 * Show toast notification
 */
async function showToast(
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
    { bgClass, icon, message }
  );

  const toast = document.createElement("div");
  toast.innerHTML = toastHtml;
  toastContainer.appendChild(toast);

  lucide.createIcons();

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Initialize the page
init();
