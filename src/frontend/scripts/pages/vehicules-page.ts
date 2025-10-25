import { AuthManager } from "../auth";
import { UtilisateurService } from "../../services/utilisateur.service";
import { TarifService } from "../../services/tarif.service";
import { Utilisateur, Role } from "../../types/api.types";
import { renderTemplate } from "../template-helper";

declare const lucide: {
  createIcons: () => void;
};

declare global {
  interface Window {
    vehiculesPage: VehiculesPage;
  }
}

interface UtilisateurWithTarif extends Utilisateur {
  tarifKm?: string;
}

/**
 * Vehicules Page - Gestion des véhicules
 */
export class VehiculesPage {
  private currentUser: Utilisateur | null = null;
  private allUtilisateurs: UtilisateurWithTarif[] = [];
  private isEmploye = false;

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const user = AuthManager.getUser();
    if (!user) return;

    this.isEmploye = user.role === Role.EMPLOYE;

    const html = await renderTemplate(
      "/src/frontend/templates/vehicules-page.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    window.vehiculesPage = this;

    // Update titles based on role
    const titleEl = document.getElementById("page-title");
    const subtitleEl = document.getElementById("page-subtitle");

    if (titleEl && subtitleEl) {
      if (this.isEmploye) {
        titleEl.textContent = "Mon véhicule personnel";
        subtitleEl.textContent =
          "Gérez votre véhicule personnel pour le calcul des frais kilométriques";
      } else {
        titleEl.textContent = "Véhicules";
        subtitleEl.textContent = "Consultez les véhicules des employés";
      }
    }

    await this.loadData();
    this.setupEventListeners();
    lucide.createIcons();
  }

  private async loadData(): Promise<void> {
    try {
      const user = AuthManager.getUser();
      if (!user) return;

      if (this.isEmploye) {
        // Load current user details with vehicle info
        const userId = user.id_utilisateur;
        if (!userId) return;

        const response = await UtilisateurService.getById(userId);
        if (response.success && response.data) {
          this.currentUser = response.data;
          // Get tarif from grille tarifaire
          const tarifResponse = await TarifService.getAll();
          if (tarifResponse.success && tarifResponse.data) {
            const tarifs = Array.isArray(tarifResponse.data)
              ? tarifResponse.data
              : [];
            const matchingTarif = tarifs.find(
              (t) => t.cylindree === this.currentUser?.cylindree
            );
            if (matchingTarif) {
              (this.currentUser as UtilisateurWithTarif).tarifKm = Number(
                matchingTarif.tarif_km
              ).toFixed(3);
            }
          }
        }
      } else {
        // Load all users for comptable/admin
        const response = await UtilisateurService.getAll();
        if (response.success && response.data) {
          this.allUtilisateurs = Array.isArray(response.data)
            ? response.data
            : [];

          // Get tarifs for all users
          const tarifResponse = await TarifService.getAll();
          if (tarifResponse.success && tarifResponse.data) {
            const tarifs = Array.isArray(tarifResponse.data)
              ? tarifResponse.data
              : [];
            this.allUtilisateurs = this.allUtilisateurs.map((u) => {
              const matchingTarif = tarifs.find(
                (t) => t.cylindree === u.cylindree
              );
              return {
                ...u,
                tarifKm: matchingTarif
                  ? Number(matchingTarif.tarif_km).toFixed(3)
                  : "0.000",
              };
            });
          }
        }
      }

      await this.renderContent();
    } catch (error) {
      console.error("Error loading vehicules:", error);
    }
  }

  private setupEventListeners(): void {
    // Will be set up after content render
  }

  private async renderContent(): Promise<void> {
    const alertContainer = document.getElementById("alert-container");
    const contentContainer = document.getElementById("vehicules-content");

    if (!contentContainer) return;

    if (this.isEmploye) {
      // Show alert for employe
      if (alertContainer) {
        alertContainer.innerHTML = await renderTemplate(
          "/src/frontend/templates/vehicule-alert.tpl.html",
          {}
        );
      }

      // Check if user has vehicle info
      const hasVehicule =
        this.currentUser &&
        this.currentUser.plaque &&
        this.currentUser.marque &&
        this.currentUser.modele;

      if (!hasVehicule) {
        // Empty state
        contentContainer.innerHTML = await renderTemplate(
          "/src/frontend/templates/vehicule-empty.tpl.html",
          {}
        );

        const btnAdd = document.getElementById("btn-add-vehicule");
        if (btnAdd) {
          btnAdd.addEventListener("click", () => this.showAddModal());
        }
      } else {
        // Show vehicle card
        const currentUser = this.currentUser;
        if (!currentUser) return;

        contentContainer.innerHTML = await renderTemplate(
          "/src/frontend/templates/vehicule-card-employe.tpl.html",
          {
            marque: currentUser.marque,
            modele: currentUser.modele,
            plaque: currentUser.plaque,
            type_essence: currentUser.type_essence,
            cylindree: currentUser.cylindree,
            tarifKm: (currentUser as UtilisateurWithTarif).tarifKm || "0.000",
          }
        );

        const btnEdit = document.getElementById("btn-edit-vehicule");
        if (btnEdit) {
          btnEdit.addEventListener("click", () => this.showEditModal());
        }
      }
    } else {
      // Admin/Comptable view - show all vehicles in grid
      if (alertContainer) {
        alertContainer.innerHTML = "";
      }

      const cardsHtml = await Promise.all(
        this.allUtilisateurs.map((user) =>
          renderTemplate(
            "/src/frontend/templates/vehicule-card-admin.tpl.html",
            {
              marque: user.marque,
              modele: user.modele,
              plaque: user.plaque,
              prenom: user.prenom,
              nom_utilisateur: user.nom_utilisateur,
              type_essence: user.type_essence,
              cylindree: user.cylindree,
              tarifKm: user.tarifKm || "0.000",
            }
          )
        )
      );

      contentContainer.innerHTML = `
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          ${cardsHtml.join("")}
        </div>
      `;
    }

    lucide.createIcons();
  }

  public showAddModal(): void {
    // TODO: Implement add modal
    alert("Modal d'ajout de véhicule - À implémenter");
  }

  public showEditModal(): void {
    // TODO: Implement edit modal
    alert("Modal de modification du véhicule - À implémenter");
  }
}
