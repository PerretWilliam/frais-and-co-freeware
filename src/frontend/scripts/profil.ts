import { AuthManager } from "./auth";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Footer } from "./footer";
import { UtilisateurService } from "../services/utilisateur.service";
import { FraisService } from "../services/frais.service";
import { Utilisateur, Role } from "../types/api.types";
import { renderTemplate } from "./template-helper";

// Déclaration pour Lucide
declare const lucide: {
  createIcons: () => void;
};

// Vérifier l'authentification
if (!AuthManager.isAuthenticated()) {
  window.location.href = "/src/frontend/pages/login.html";
}

const currentUser = AuthManager.getUser();

// Role labels
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

class ProfilPage {
  private user: Utilisateur | null;
  private sidebar: Sidebar;
  private header: Header;
  private footer: Footer;

  constructor() {
    this.user = currentUser;

    // Initialize layout components
    this.sidebar = new Sidebar(
      "sidebar-container",
      this.user,
      "profil",
      this.handleNavigation.bind(this)
    );

    this.header = new Header(
      "header-container",
      this.user,
      () => this.sidebar.toggle(),
      this.handleNavigation.bind(this)
    );

    this.footer = new Footer("footer-container");

    // Initialize page
    void this.init();
  }

  private handleNavigation(page: string): void {
    const pageMap: Record<string, string> = {
      dashboard: `/src/frontend/pages/dashboard-${this.user?.role}.html`,
      "mes-frais": "/src/frontend/pages/mes-frais.html",
      "nouveau-frais": "/src/frontend/pages/nouveau-frais.html",
      "frais-globaux": "/src/frontend/pages/frais-globaux.html",
      chantiers: "/src/frontend/pages/chantiers.html",
      vehicules: "/src/frontend/pages/vehicules.html",
      utilisateurs: "/src/frontend/pages/utilisateurs.html",
      tarifs: "/src/frontend/pages/tarifs.html",
      emails: "/src/frontend/pages/emails.html",
      administration: "/src/frontend/pages/administration.html",
      profil: "/src/frontend/pages/profil.html",
      parametres: "/src/frontend/pages/parametres.html",
      notification: "/src/frontend/pages/notification.html",
      aide: "/src/frontend/pages/aide.html",
    };

    const url = pageMap[page];
    if (url) {
      window.location.href = url;
    }
  }

  private async init(): Promise<void> {
    try {
      await this.loadUserData();
      this.setupEventListeners();
      lucide.createIcons();
    } catch (error) {
      console.error("Error initializing profil page:", error);
      this.showToast("Erreur lors du chargement du profil", "error");
    }
  }

  private async loadUserData(): Promise<void> {
    if (!this.user) return;

    // Load user details
    const response = await UtilisateurService.getById(this.user.id_utilisateur);

    if (response.success && response.data) {
      this.user = response.data;
      this.updateUserDisplay();
      await this.loadUserStats();
    }
  }

  private updateUserDisplay(): void {
    if (!this.user) return;

    // Update avatar
    const avatar = document.getElementById("user-avatar");
    if (avatar) {
      avatar.textContent = `${this.user.prenom[0]}${this.user.nom_utilisateur[0]}`;
    }

    // Update fullname
    const fullname = document.getElementById("user-fullname");
    if (fullname) {
      fullname.textContent = `${this.user.prenom} ${this.user.nom_utilisateur}`;
    }

    // Update email display
    const emailDisplay = document.getElementById("user-email-display");
    if (emailDisplay) {
      emailDisplay.textContent = this.user.email;
    }

    // Update role badge
    const roleBadge = document.getElementById("user-role-badge");
    if (roleBadge && this.user.role) {
      roleBadge.textContent = ROLE_LABELS[this.user.role];
      roleBadge.className = `text-xs px-2 py-1 rounded-full ${ROLE_COLORS[this.user.role]}`;
    }

    // Fill form fields
    this.fillProfileForm();
    this.fillVehicleForm();

    // Show/hide sections based on role
    const vehicleSection = document.getElementById("vehicle-section");
    const statsSection = document.getElementById("stats-section");

    if (this.user.role === Role.EMPLOYE) {
      vehicleSection?.classList.remove("hidden");
      statsSection?.classList.remove("hidden");
    } else {
      vehicleSection?.classList.add("hidden");
      statsSection?.classList.add("hidden");
    }
  }

  private fillProfileForm(): void {
    if (!this.user) return;

    const prenomInput = document.getElementById("prenom") as HTMLInputElement;
    const nomInput = document.getElementById("nom") as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const adresseInput = document.getElementById("adresse") as HTMLInputElement;
    const villeInput = document.getElementById("ville") as HTMLInputElement;

    if (prenomInput) prenomInput.value = this.user.prenom || "";
    if (nomInput) nomInput.value = this.user.nom_utilisateur || "";
    if (emailInput) emailInput.value = this.user.email || "";
    if (adresseInput) adresseInput.value = this.user.adresse_utilisateur || "";
    if (villeInput) villeInput.value = this.user.ville_utilisateur || "";
  }

  private fillVehicleForm(): void {
    if (!this.user) return;

    const plaqueInput = document.getElementById("plaque") as HTMLInputElement;
    const marqueInput = document.getElementById("marque") as HTMLInputElement;
    const modeleInput = document.getElementById("modele") as HTMLInputElement;
    const cylindreeInput = document.getElementById(
      "cylindree"
    ) as HTMLInputElement;
    const essenceSelect = document.getElementById(
      "type-essence"
    ) as HTMLSelectElement;

    if (plaqueInput) plaqueInput.value = this.user.plaque || "";
    if (marqueInput) marqueInput.value = this.user.marque || "";
    if (modeleInput) modeleInput.value = this.user.modele || "";
    if (cylindreeInput)
      cylindreeInput.value = this.user.cylindree?.toString() || "";
    if (essenceSelect) essenceSelect.value = this.user.type_essence || "Diesel";
  }

  private async loadUserStats(): Promise<void> {
    if (!this.user || this.user.role !== Role.EMPLOYE) return;

    try {
      // Load user expenses stats
      const statsResponse = await FraisService.getStatsByUser(
        this.user.id_utilisateur
      );

      if (statsResponse.success && statsResponse.data) {
        const stats = statsResponse.data as unknown as {
          totalFrais: number;
          totalAmount: number;
        };

        const totalFraisEl = document.getElementById("stat-total-frais");
        const totalAmountEl = document.getElementById("stat-total-amount");

        if (totalFraisEl) {
          const totalFrais = stats.totalFrais ?? 0;
          totalFraisEl.textContent = totalFrais.toString();
        }
        if (totalAmountEl) {
          const totalAmount = stats.totalAmount ?? 0;
          totalAmountEl.textContent = `${totalAmount.toFixed(2)} €`;
        }
      }

      // Format member since date (using current date as fallback)
      const memberSinceEl = document.getElementById("stat-member-since");
      if (memberSinceEl) {
        // Use a default date or current date since date_creation doesn't exist
        const date = new Date();
        memberSinceEl.textContent = date.toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  private setupEventListeners(): void {
    // Profile form
    const profileForm = document.getElementById(
      "profile-form"
    ) as HTMLFormElement;
    if (profileForm) {
      profileForm.addEventListener("submit", (e) =>
        this.handleProfileSubmit(e)
      );
    }

    // Vehicle form
    const vehicleForm = document.getElementById(
      "vehicle-form"
    ) as HTMLFormElement;
    if (vehicleForm) {
      vehicleForm.addEventListener("submit", (e) =>
        this.handleVehicleSubmit(e)
      );
    }

    // Password form
    const passwordForm = document.getElementById(
      "password-form"
    ) as HTMLFormElement;
    if (passwordForm) {
      passwordForm.addEventListener("submit", (e) =>
        this.handlePasswordSubmit(e)
      );
    }
  }

  private async handleProfileSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.user) return;

    const prenomInput = document.getElementById("prenom") as HTMLInputElement;
    const nomInput = document.getElementById("nom") as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const adresseInput = document.getElementById("adresse") as HTMLInputElement;
    const villeInput = document.getElementById("ville") as HTMLInputElement;

    const updateData = {
      prenom: prenomInput.value,
      nom_utilisateur: nomInput.value,
      email: emailInput.value,
      adresse_utilisateur: adresseInput.value,
      ville_utilisateur: villeInput.value,
    };

    try {
      const response = await UtilisateurService.update(
        this.user.id_utilisateur,
        updateData
      );

      if (response.success) {
        this.showToast("Profil mis à jour avec succès", "success");
        // Update current user in AuthManager
        Object.assign(this.user, updateData);
        AuthManager.saveUser(this.user);
        this.updateUserDisplay();
      } else {
        this.showToast(
          response.error || "Erreur lors de la mise à jour",
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      this.showToast("Erreur lors de la mise à jour", "error");
    }
  }

  private async handleVehicleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.user) return;

    const plaqueInput = document.getElementById("plaque") as HTMLInputElement;
    const marqueInput = document.getElementById("marque") as HTMLInputElement;
    const modeleInput = document.getElementById("modele") as HTMLInputElement;
    const cylindreeInput = document.getElementById(
      "cylindree"
    ) as HTMLInputElement;
    const essenceSelect = document.getElementById(
      "type-essence"
    ) as HTMLSelectElement;

    const updateData = {
      plaque: plaqueInput.value,
      marque: marqueInput.value,
      modele: modeleInput.value,
      cylindree: parseInt(cylindreeInput.value) || 0,
      type_essence:
        essenceSelect.value as import("../types/api.types").TypeEssence,
    };

    try {
      const response = await UtilisateurService.update(
        this.user.id_utilisateur,
        updateData
      );

      if (response.success) {
        this.showToast("Véhicule mis à jour avec succès", "success");
        Object.assign(this.user, updateData);
        AuthManager.saveUser(this.user);
      } else {
        this.showToast(
          response.error || "Erreur lors de la mise à jour",
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating vehicle:", error);
      this.showToast("Erreur lors de la mise à jour", "error");
    }
  }

  private async handlePasswordSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.user) return;

    const currentPasswordInput = document.getElementById(
      "current-password"
    ) as HTMLInputElement;
    const newPasswordInput = document.getElementById(
      "new-password"
    ) as HTMLInputElement;
    const confirmPasswordInput = document.getElementById(
      "confirm-password"
    ) as HTMLInputElement;

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validation
    if (newPassword !== confirmPassword) {
      this.showToast("Les mots de passe ne correspondent pas", "error");
      return;
    }

    if (newPassword.length < 8) {
      this.showToast(
        "Le mot de passe doit contenir au moins 8 caractères",
        "error"
      );
      return;
    }

    try {
      const response = await UtilisateurService.changePassword(
        this.user.id_utilisateur,
        currentPassword,
        newPassword
      );

      if (response.success) {
        this.showToast("Mot de passe modifié avec succès", "success");
        // Clear form
        currentPasswordInput.value = "";
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";
      } else {
        this.showToast(
          response.error || "Erreur lors du changement de mot de passe",
          "error"
        );
      }
    } catch (error) {
      console.error("Error changing password:", error);
      this.showToast("Erreur lors du changement de mot de passe", "error");
    }
  }

  private showToast(message: string, type: "success" | "error"): void {
    const container = document.getElementById("toast-container");
    if (!container) return;

    void this.renderToast(container, message, type);
  }

  private async renderToast(
    container: HTMLElement,
    message: string,
    type: "success" | "error"
  ): Promise<void> {
    const toast = document.createElement("div");

    const html = await renderTemplate(
      "/src/frontend/templates/toast.tpl.html",
      {
        bgClass: type === "success" ? "bg-success" : "bg-destructive",
        icon: type === "success" ? "check-circle" : "alert-circle",
        message,
      }
    );

    toast.innerHTML = html;
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.classList.add("animate-out", "slide-out-to-right");
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
}

// Initialize page
new ProfilPage();
