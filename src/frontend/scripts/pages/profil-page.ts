import { AuthManager } from "../auth";
import { UtilisateurService } from "../../services/utilisateur.service";
import { FraisService } from "../../services/frais.service";
import { Utilisateur, Role, TypeEssence } from "../../types/api.types";
import { renderTemplate } from "../template-helper";

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

/**
 * Profil Page
 */
export class ProfilPage {
  private user: Utilisateur | null;

  constructor() {
    this.user = AuthManager.getUser();
  }

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    if (!this.user) return;

    // Prepare template data
    const roleLabel = ROLE_LABELS[this.user.role];
    const roleColor = ROLE_COLORS[this.user.role];

    const avatar = `${this.user.prenom[0]}${this.user.nom_utilisateur[0]}`;
    const fullname = `${this.user.prenom} ${this.user.nom_utilisateur}`;

    // Type essence options
    const typeEssences = ["Diesel", "Essence95", "Essence98", "Électrique"];
    const optionsHtml = typeEssences
      .map((type) => {
        const selected = this.user?.type_essence === type ? "selected" : "";
        return `<option value="${type}" ${selected}>${type}</option>`;
      })
      .join("");

    // Render page HTML using template
    const html = await renderTemplate(
      "/src/frontend/templates/profil-page.tpl.html",
      {
        avatar,
        fullname,
        email: this.user.email,
        roleLabel,
        roleClass: roleColor,
        totalFrais: "-",
        totalAmount: "-",
        memberSince: "-",
        nom: this.user.nom_utilisateur,
        prenom: this.user.prenom,
        adresse: this.user.adresse_utilisateur || "",
        cp: this.user.cp_utilisateur || "",
        ville: this.user.ville_utilisateur || "",
        plaque: this.user.plaque || "",
        marque: this.user.marque || "",
        modele: this.user.modele || "",
        cylindree: this.user.cylindree?.toString() || "",
        optionsHtml,
      }
    );

    outlet.innerHTML = html;

    // Load data and setup
    await this.init();
  }

  private async init(): Promise<void> {
    try {
      await this.loadUserData();
      this.setupEventListeners();
      lucide.createIcons();
    } catch (error) {
      console.error("Error initializing profil page:", error);
      await this.showToast("Erreur lors du chargement du profil", "error");
    }
  }

  private async loadUserData(): Promise<void> {
    if (!this.user) return;

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

    // Update email
    const emailDisplay = document.getElementById("user-email-display");
    if (emailDisplay) {
      emailDisplay.textContent = this.user.email;
    }

    // Update role badge
    const roleBadge = document.getElementById("user-role-badge");
    if (roleBadge && this.user.role) {
      const roleLabel = ROLE_LABELS[this.user.role];
      const roleColor = ROLE_COLORS[this.user.role];
      roleBadge.textContent = roleLabel;
      roleBadge.className = `inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${roleColor}`;
    }

    // Fill form fields
    this.fillFormFields();
  }

  private fillFormFields(): void {
    if (!this.user) return;

    const fields = [
      { id: "nom", value: this.user.nom_utilisateur },
      { id: "prenom", value: this.user.prenom },
      { id: "email", value: this.user.email },
      { id: "adresse", value: this.user.adresse_utilisateur || "" },
      { id: "cp", value: this.user.cp_utilisateur || "" },
      { id: "ville", value: this.user.ville_utilisateur || "" },
      { id: "plaque", value: this.user.plaque || "" },
      { id: "marque", value: this.user.marque || "" },
      { id: "modele", value: this.user.modele || "" },
      { id: "cylindree", value: this.user.cylindree?.toString() || "" },
      { id: "type-essence", value: this.user.type_essence || "" },
    ];

    fields.forEach(({ id, value }) => {
      const element = document.getElementById(id) as
        | HTMLInputElement
        | HTMLSelectElement;
      if (element) {
        element.value = value;
      }
    });
  }

  private async loadUserStats(): Promise<void> {
    if (!this.user?.id_utilisateur) return;

    try {
      // Masquer les stats de frais pour les admins et comptables
      const statsCardsContainer = document.getElementById("stats-cards");
      if (
        statsCardsContainer &&
        (this.user.role === Role.ADMIN || this.user.role === Role.COMPTABLE)
      ) {
        statsCardsContainer.style.display = "none";
      } else if (statsCardsContainer) {
        statsCardsContainer.style.display = "grid";

        // Charger les vrais frais depuis la BDD
        const fraisResponse = await FraisService.getByUser(
          this.user.id_utilisateur
        );

        if (fraisResponse.success && fraisResponse.data) {
          const frais = fraisResponse.data;

          // Calculer le nombre total de frais
          const totalFrais = Array.isArray(frais) ? frais.length : 0;

          // Calculer le montant total
          const totalAmount = Array.isArray(frais)
            ? frais.reduce((sum, f) => {
                const montant = parseFloat(String(f.montant || 0));
                return sum + (isNaN(montant) ? 0 : montant);
              }, 0)
            : 0;

          const totalFraisEl = document.getElementById("stat-total-frais");
          const totalAmountEl = document.getElementById("stat-total-amount");

          if (totalFraisEl) {
            totalFraisEl.textContent = totalFrais.toString();
          }
          if (totalAmountEl) {
            totalAmountEl.textContent = `${totalAmount.toFixed(2)} €`;
          }
        }
      }

      // Format member since date avec date_creation
      const memberSinceEl = document.getElementById("stat-member-since");
      if (memberSinceEl && this.user.date_creation) {
        const date = new Date(this.user.date_creation);
        memberSinceEl.textContent = date.toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        });
      } else if (memberSinceEl) {
        memberSinceEl.textContent = "-";
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  private setupEventListeners(): void {
    // Profile form submit
    const profileForm = document.getElementById("profile-form");
    if (profileForm) {
      profileForm.addEventListener("submit", (e) => {
        e.preventDefault();
        void this.handleProfileSubmit();
      });
    }

    // Vehicle form submit
    const vehicleForm = document.getElementById("vehicle-form");
    if (vehicleForm) {
      vehicleForm.addEventListener("submit", (e) => {
        e.preventDefault();
        void this.handleVehicleSubmit();
      });
    }

    // Password form submit
    const passwordForm = document.getElementById("password-form");
    if (passwordForm) {
      passwordForm.addEventListener("submit", (e) => {
        e.preventDefault();
        void this.handlePasswordSubmit();
      });
    }
  }

  private async handleProfileSubmit(): Promise<void> {
    if (!this.user) return;

    const nom = (document.getElementById("nom") as HTMLInputElement).value;
    const prenom = (document.getElementById("prenom") as HTMLInputElement)
      .value;
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const adresse = (document.getElementById("adresse") as HTMLInputElement)
      .value;
    const cp = (document.getElementById("cp") as HTMLInputElement).value;
    const ville = (document.getElementById("ville") as HTMLInputElement).value;

    try {
      const response = await UtilisateurService.update(
        this.user.id_utilisateur,
        {
          nom_utilisateur: nom,
          prenom,
          email,
          adresse_utilisateur: adresse,
          cp_utilisateur: cp,
          ville_utilisateur: ville,
        }
      );

      if (response.success) {
        await this.showToast("Profil mis à jour avec succès", "success");
        await this.loadUserData();
      } else {
        await this.showToast(
          response.error || "Erreur lors de la mise à jour",
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      await this.showToast("Erreur lors de la mise à jour du profil", "error");
    }
  }

  private async handleVehicleSubmit(): Promise<void> {
    if (!this.user) return;

    const plaque = (document.getElementById("plaque") as HTMLInputElement)
      .value;
    const marque = (document.getElementById("marque") as HTMLInputElement)
      .value;
    const modele = (document.getElementById("modele") as HTMLInputElement)
      .value;
    const cylindree = parseInt(
      (document.getElementById("cylindree") as HTMLInputElement).value
    );
    const typeEssence = (
      document.getElementById("type-essence") as HTMLSelectElement
    ).value;

    try {
      const response = await UtilisateurService.update(
        this.user.id_utilisateur,
        {
          plaque,
          marque,
          modele,
          cylindree,
          type_essence: typeEssence as TypeEssence,
        }
      );

      if (response.success) {
        await this.showToast("Véhicule mis à jour avec succès", "success");
      } else {
        await this.showToast(
          response.error || "Erreur lors de la mise à jour",
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating vehicle:", error);
      await this.showToast(
        "Erreur lors de la mise à jour du véhicule",
        "error"
      );
    }
  }

  private async handlePasswordSubmit(): Promise<void> {
    if (!this.user) return;

    const currentPassword = (
      document.getElementById("current-password") as HTMLInputElement
    ).value;
    const newPassword = (
      document.getElementById("new-password") as HTMLInputElement
    ).value;
    const confirmPassword = (
      document.getElementById("confirm-new-password") as HTMLInputElement
    ).value;

    if (newPassword !== confirmPassword) {
      await this.showToast("Les mots de passe ne correspondent pas", "error");
      return;
    }

    if (newPassword.length < 8) {
      await this.showToast(
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
        await this.showToast("Mot de passe modifié avec succès", "success");
        (document.getElementById("password-form") as HTMLFormElement).reset();
      } else {
        await this.showToast(
          response.error || "Erreur lors du changement de mot de passe",
          "error"
        );
      }
    } catch (error) {
      console.error("Error changing password:", error);
      await this.showToast(
        "Erreur lors du changement de mot de passe",
        "error"
      );
    }
  }

  private async showToast(
    message: string,
    type: "success" | "error" | "info" = "success"
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
