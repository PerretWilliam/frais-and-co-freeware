import { renderTemplate } from "../../template-helper";
import { AuthManager } from "../../auth";
import { UtilisateurService } from "../../../services/utilisateur.service";
import { router } from "../../router";
import { Utilisateur, Role } from "../../../types/api.types";
import { UserFilterState } from "./users.types";
import { UserStatsRenderer } from "./users.stats";
import { UserFilterUtils } from "./users.filters";
import { UserTableRenderer } from "./users.table";
import { UserPaginationRenderer } from "./users.pagination";
import { UserPendingRenderer } from "./users.pending";
import { UserModalsManager } from "./users.modals";

declare const lucide: {
  createIcons: () => void;
};

declare global {
  interface Window {
    utilisateursPage: UtilisateursPage;
  }
}

/**
 * Page de gestion des utilisateurs (ADMIN uniquement)
 */
export class UtilisateursPage {
  private allUsers: Utilisateur[] = [];
  private filteredUsers: Utilisateur[] = [];
  private filters: UserFilterState = {
    searchTerm: "",
    roleFilter: "all",
  };
  private currentPage = 1;
  private itemsPerPage = 10;

  constructor() {
    // Vérifier les autorisations
    const user = AuthManager.getUser();
    if (user?.role !== Role.ADMIN) {
      router.navigate("/dashboard");
      return;
    }
  }

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const html = await renderTemplate(
      "/src/frontend/templates/pages/users-page.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    window.utilisateursPage = this;

    await this.loadData();
    this.setupEventListeners();
    lucide.createIcons();
  }

  /**
   * Charge les données depuis l'API
   */
  private async loadData(): Promise<void> {
    try {
      const response = await UtilisateurService.getAll();

      if (response.success && response.data) {
        this.allUsers = Array.isArray(response.data) ? response.data : [];
        this.filteredUsers = [...this.allUsers];

        await this.renderAll();
      } else {
        this.showError("Erreur lors du chargement des utilisateurs");
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
      this.showError("Erreur lors du chargement des utilisateurs");
    }
  }

  /**
   * Rend tous les composants de la page
   */
  private async renderAll(): Promise<void> {
    await UserStatsRenderer.render(this.allUsers);
    await UserPendingRenderer.render(
      this.allUsers,
      (userId) => this.handleApproveUser(userId),
      (userId) => this.handleRejectUser(userId)
    );
    await this.renderTableWithPagination();
  }

  /**
   * Rend la table et la pagination
   */
  private async renderTableWithPagination(): Promise<void> {
    await UserTableRenderer.render(
      this.filteredUsers,
      this.currentPage,
      this.itemsPerPage,
      (userId) => this.handleEditUser(userId),
      (userId) => this.handleDeleteUser(userId)
    );

    await UserPaginationRenderer.render(
      this.filteredUsers.length,
      this.currentPage,
      this.itemsPerPage,
      (page) => this.goToPage(page)
    );
  }

  /**
   * Configure les event listeners
   */
  private setupEventListeners(): void {
    // Create button
    const btnCreate = document.getElementById("btn-create-user");
    btnCreate?.addEventListener("click", () => this.showCreateModal());

    // Search input
    const searchInput = document.getElementById(
      "search-input"
    ) as HTMLInputElement;
    searchInput?.addEventListener("input", (e) => {
      this.filters.searchTerm = (e.target as HTMLInputElement).value;
      this.applyFilters();
    });

    // Role filter
    const roleFilter = document.getElementById(
      "role-filter"
    ) as HTMLSelectElement;
    roleFilter?.addEventListener("change", (e) => {
      this.filters.roleFilter = (e.target as HTMLSelectElement).value;
      this.applyFilters();
    });

    // Items per page
    const itemsPerPageSelect = document.getElementById(
      "items-per-page"
    ) as HTMLSelectElement;
    itemsPerPageSelect?.addEventListener("change", (e) => {
      this.itemsPerPage = parseInt((e.target as HTMLSelectElement).value, 10);
      this.currentPage = 1;
      this.renderTableWithPagination();
    });
  }

  /**
   * Applique les filtres et met à jour la table
   */
  private applyFilters(): void {
    this.filteredUsers = UserFilterUtils.filter(this.allUsers, this.filters);
    this.currentPage = 1; // Reset to first page
    this.renderTableWithPagination();
  }

  /**
   * Change de page
   */
  public goToPage(page: number): void {
    const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);

    if (page < 1 || page > totalPages) return;

    this.currentPage = page;
    this.renderTableWithPagination();

    // Scroll to top of table
    const tableContainer = document.getElementById("users-table-container");
    tableContainer?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /**
   * Affiche la modale de création
   */
  private async showCreateModal(): Promise<void> {
    await UserModalsManager.showCreate(async (formData) => {
      await this.handleCreateUser(formData);
    });
  }

  /**
   * Gère l'édition d'un utilisateur
   */
  private async handleEditUser(userId: number): Promise<void> {
    const user = this.allUsers.find((u) => u.id_utilisateur === userId);
    if (!user) return;

    await UserModalsManager.showEdit(user, async (formData) => {
      await this.handleUpdateUser(formData);
    });
  }

  /**
   * Gère la suppression d'un utilisateur
   */
  private async handleDeleteUser(userId: number): Promise<void> {
    await UserModalsManager.showDelete(
      userId,
      this.allUsers,
      async () => {
        await this.handleConfirmDelete(userId);
      },
      (message) => this.showError(message)
    );
  }

  /**
   * Crée un nouvel utilisateur
   */
  private async handleCreateUser(formData: FormData): Promise<void> {
    try {
      const userData = UserModalsManager.prepareCreateData(formData);
      const response = await UtilisateurService.create(userData);

      if (response.success) {
        this.showSuccess("Utilisateur créé avec succès");
        const modal = document.getElementById("create-user-modal");
        modal?.classList.add("hidden");
        await this.loadData();
      } else {
        this.showError(response.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur création utilisateur:", error);
      this.showError("Erreur lors de la création de l'utilisateur");
    }
  }

  /**
   * Met à jour un utilisateur
   */
  private async handleUpdateUser(formData: FormData): Promise<void> {
    try {
      const { id, data } = UserModalsManager.prepareEditData(formData);
      const response = await UtilisateurService.update(id, data);

      if (response.success) {
        this.showSuccess("Utilisateur modifié avec succès");
        const modal = document.getElementById("edit-user-modal");
        modal?.classList.add("hidden");
        await this.loadData();
      } else {
        this.showError(response.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Erreur modification utilisateur:", error);
      this.showError("Erreur lors de la modification de l'utilisateur");
    }
  }

  /**
   * Confirme et exécute la suppression
   */
  private async handleConfirmDelete(userId: number): Promise<void> {
    try {
      // Vérifier que l'utilisateur n'est pas un admin
      const user = this.allUsers.find((u) => u.id_utilisateur === userId);
      if (user?.role === Role.ADMIN) {
        this.showError("Impossible de supprimer un administrateur");
        return;
      }

      const response = await UtilisateurService.delete(userId);

      if (response.success) {
        this.showSuccess("Utilisateur supprimé avec succès");
        await this.loadData();
      } else {
        this.showError(response.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression utilisateur:", error);
      this.showError("Erreur lors de la suppression de l'utilisateur");
    }
  }

  /**
   * Approuve un utilisateur en attente
   */
  private async handleApproveUser(userId: number): Promise<void> {
    try {
      const response = await UtilisateurService.validate(userId);

      if (response.success) {
        this.showSuccess("Compte utilisateur approuvé avec succès");
        await this.loadData();
      } else {
        this.showError(response.error || "Erreur lors de l'approbation");
      }
    } catch (error) {
      console.error("Erreur approbation utilisateur:", error);
      this.showError("Erreur lors de l'approbation de l'utilisateur");
    }
  }

  /**
   * Refuse un utilisateur en attente
   */
  private async handleRejectUser(userId: number): Promise<void> {
    try {
      const response = await UtilisateurService.delete(userId);

      if (response.success) {
        this.showSuccess("Compte utilisateur refusé et supprimé");
        await this.loadData();
      } else {
        this.showError(response.error || "Erreur lors du refus");
      }
    } catch (error) {
      console.error("Erreur refus utilisateur:", error);
      this.showError("Erreur lors du refus de l'utilisateur");
    }
  }

  /**
   * Affiche un message de succès
   */
  private showSuccess(message: string): void {
    // TODO: Implement toast notification
    alert(message);
  }

  /**
   * Affiche un message d'erreur
   */
  private showError(message: string): void {
    // TODO: Implement toast notification
    alert(message);
  }
}
