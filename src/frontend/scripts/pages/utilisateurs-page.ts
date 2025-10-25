import { renderTemplate } from "../template-helper";
import { AuthManager } from "../auth";
import { UtilisateurService } from "../../services/utilisateur.service";
import { router } from "../router";
import { Utilisateur, Role, TypeEssence } from "../../types/api.types";

declare const lucide: {
  createIcons: () => void;
};

declare global {
  interface Window {
    utilisateursPage: UtilisateursPage;
  }
}

interface UserStats {
  total: number;
  employes: number;
  comptables: number;
  actifs: number;
}

const ROLE_LABELS: Record<string, string> = {
  [Role.EMPLOYE]: "Employé",
  [Role.COMPTABLE]: "Comptable",
  [Role.ADMIN]: "Administrateur",
};

const ROLE_CLASSES: Record<string, string> = {
  [Role.EMPLOYE]: "bg-blue-500/20 text-blue-600",
  [Role.COMPTABLE]: "bg-purple-500/20 text-purple-600",
  [Role.ADMIN]: "bg-red-500/20 text-red-600",
};

/**
 * Page de gestion des utilisateurs (ADMIN uniquement)
 */
export class UtilisateursPage {
  private allUsers: Utilisateur[] = [];
  private filteredUsers: Utilisateur[] = [];
  private searchTerm = "";
  private roleFilter = "all";
  private userToDelete: number | null = null;
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
      "/src/frontend/templates/utilisateurs-page.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    window.utilisateursPage = this;

    await this.loadData();
    this.setupEventListeners();
    lucide.createIcons();
  }

  private async loadData(): Promise<void> {
    try {
      const response = await UtilisateurService.getAll();

      if (response.success && response.data) {
        this.allUsers = Array.isArray(response.data) ? response.data : [];
        this.filteredUsers = [...this.allUsers];

        await this.renderStats();
        await this.renderPendingUsers();
        await this.renderTable();
      } else {
        this.showError("Erreur lors du chargement des utilisateurs");
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
      this.showError("Erreur lors du chargement des utilisateurs");
    }
  }

  private async renderStats(): Promise<void> {
    const statsContainer = document.getElementById("stats-cards");
    if (!statsContainer) return;

    const stats: UserStats = {
      total: this.allUsers.length,
      employes: this.allUsers.filter((u) => u.role === Role.EMPLOYE).length,
      comptables: this.allUsers.filter((u) => u.role === Role.COMPTABLE).length,
      actifs: this.allUsers.filter((u) => u.valide).length,
    };

    const statsData = [
      { label: "Total utilisateurs", count: stats.total },
      { label: "Employés", count: stats.employes },
      { label: "Comptables", count: stats.comptables },
      { label: "Actifs", count: stats.actifs },
    ];

    const statsHtml = await Promise.all(
      statsData.map((stat) =>
        renderTemplate(
          "/src/frontend/templates/utilisateurs-stats.tpl.html",
          stat
        )
      )
    );

    statsContainer.innerHTML = statsHtml.join("");
  }

  private async renderPendingUsers(): Promise<void> {
    const container = document.getElementById("pending-users-section");
    if (!container) return;

    const pendingUsers = this.allUsers.filter((u) => !u.valide);

    if (pendingUsers.length === 0) {
      container.innerHTML = "";
      return;
    }

    // Render card container
    const cardHtml = await renderTemplate(
      "/src/frontend/templates/utilisateurs-pending-card.tpl.html",
      { count: pendingUsers.length }
    );
    container.innerHTML = cardHtml;

    // Render each pending user
    const listContainer = document.getElementById("pending-users-list");
    if (!listContainer) return;

    const itemsHtml = await Promise.all(
      pendingUsers.map((user) => this.renderPendingUserItem(user))
    );
    listContainer.innerHTML = itemsHtml.join("");

    // Setup approve/reject buttons
    this.setupPendingButtons();
    lucide.createIcons();
  }

  private async renderPendingUserItem(user: Utilisateur): Promise<string> {
    const initials =
      `${user.prenom[0]}${user.nom_utilisateur[0]}`.toUpperCase();
    const roleClass = ROLE_CLASSES[user.role] || "";
    const roleLabel = ROLE_LABELS[user.role] || user.role;

    return await renderTemplate(
      "/src/frontend/templates/utilisateurs-pending-item.tpl.html",
      {
        id_utilisateur: user.id_utilisateur,
        initials,
        prenom: user.prenom,
        nom_utilisateur: user.nom_utilisateur,
        email: user.email,
        roleClass,
        roleLabel,
      }
    );
  }

  private async renderTable(): Promise<void> {
    const container = document.getElementById("users-table-container");
    if (!container) return;

    // Update count
    const countElement = document.getElementById("user-count");
    if (countElement) {
      countElement.textContent = this.filteredUsers.length.toString();
    }

    if (this.filteredUsers.length === 0) {
      const emptyHtml = await renderTemplate(
        "/src/frontend/templates/utilisateurs-empty.tpl.html",
        {}
      );
      container.innerHTML = emptyHtml;

      // Hide pagination
      const paginationContainer = document.getElementById(
        "pagination-container"
      );
      if (paginationContainer) {
        paginationContainer.innerHTML = "";
      }

      lucide.createIcons();
      return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);

    // Render table structure
    const tableHtml = await renderTemplate(
      "/src/frontend/templates/utilisateurs-table.tpl.html",
      {}
    );
    container.innerHTML = tableHtml;

    // Render rows
    const tbody = document.getElementById("users-tbody");
    if (!tbody) return;

    const rowsHtml = await Promise.all(
      paginatedUsers.map((user) => this.renderTableRow(user))
    );
    tbody.innerHTML = rowsHtml.join("");

    // Setup action buttons
    this.setupTableButtons();

    // Render pagination
    await this.renderPaginationButtons(totalPages, startIndex, endIndex);

    lucide.createIcons();
  }

  private async renderTableRow(user: Utilisateur): Promise<string> {
    const initials =
      `${user.prenom[0]}${user.nom_utilisateur[0]}`.toUpperCase();
    const roleClass = ROLE_CLASSES[user.role] || "";
    const roleLabel = ROLE_LABELS[user.role] || user.role;

    const statusClass = user.valide
      ? "bg-success/20 text-success"
      : "bg-muted text-muted-foreground";
    const statusLabel = user.valide ? "Actif" : "Inactif";
    const statusIconHtml = user.valide
      ? '<i data-lucide="check-circle" class="h-3 w-3"></i>'
      : "";

    // Ne pas permettre la suppression d'un admin
    const canDelete = user.role !== Role.ADMIN;
    const deleteButtonHtml = canDelete
      ? `<button
          class="btn-delete p-2 hover:bg-muted rounded-md transition-colors text-destructive"
          data-user-id="${user.id_utilisateur}"
          title="Supprimer"
        >
          <i data-lucide="trash-2" class="h-4 w-4"></i>
        </button>`
      : `<button
          class="p-2 rounded-md opacity-50 cursor-not-allowed"
          title="Impossible de supprimer un administrateur"
          disabled
        >
          <i data-lucide="shield-ban" class="h-4 w-4 text-muted-foreground"></i>
        </button>`;

    return await renderTemplate(
      "/src/frontend/templates/utilisateurs-table-row.tpl.html",
      {
        id_utilisateur: user.id_utilisateur,
        initials,
        prenom: user.prenom,
        nom_utilisateur: user.nom_utilisateur,
        email: user.email,
        roleClass,
        roleLabel,
        statusClass,
        statusLabel,
        statusIconHtml,
        deleteButtonHtml,
      }
    );
  }

  private async renderPaginationButtons(
    totalPages: number,
    startIndex: number,
    endIndex: number
  ): Promise<void> {
    const container = document.getElementById("pagination-container");
    if (!container || totalPages <= 1) {
      if (container) container.innerHTML = "";
      return;
    }

    // Info text
    const showing = `Affichage de ${startIndex + 1} à ${Math.min(endIndex, this.filteredUsers.length)} sur ${this.filteredUsers.length} utilisateurs`;

    // Generate page number buttons with smart pagination (max 7 buttons)
    let pageButtons = "";
    const maxButtons = 7;
    let startPage = 1;
    let endPage = totalPages;

    if (totalPages > maxButtons) {
      const halfButtons = Math.floor(maxButtons / 2);
      if (this.currentPage <= halfButtons + 1) {
        endPage = maxButtons - 1;
      } else if (this.currentPage >= totalPages - halfButtons) {
        startPage = totalPages - maxButtons + 2;
      } else {
        startPage = this.currentPage - halfButtons;
        endPage = this.currentPage + halfButtons;
      }
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      const activeClass =
        this.currentPage === 1 ? "bg-primary text-primary-foreground" : "";
      pageButtons += `
        <button
          onclick="window.utilisateursPage.goToPage(1)"
          class="px-3 py-1 text-sm border rounded-md hover:bg-accent ${activeClass}"
        >
          1
        </button>
      `;
      if (startPage > 2) {
        pageButtons += '<span class="px-2">...</span>';
      }
    }

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      const activeClass =
        this.currentPage === i ? "bg-primary text-primary-foreground" : "";
      pageButtons += `
        <button
          onclick="window.utilisateursPage.goToPage(${i})"
          class="px-3 py-1 text-sm border rounded-md hover:bg-accent ${activeClass}"
        >
          ${i}
        </button>
      `;
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageButtons += '<span class="px-2">...</span>';
      }
      const activeClass =
        this.currentPage === totalPages
          ? "bg-primary text-primary-foreground"
          : "";
      pageButtons += `
        <button
          onclick="window.utilisateursPage.goToPage(${totalPages})"
          class="px-3 py-1 text-sm border rounded-md hover:bg-accent ${activeClass}"
        >
          ${totalPages}
        </button>
      `;
    }

    // Render pagination container
    const disablePrevious = this.currentPage === 1;
    const disableNext = this.currentPage === totalPages;

    container.innerHTML = `
      <div class="text-sm text-muted-foreground">
        ${showing}
      </div>
      <div class="flex items-center gap-1">
        <button
          onclick="window.utilisateursPage.goToPage(${this.currentPage - 1})"
          class="px-3 py-1 text-sm border rounded-md hover:bg-accent ${disablePrevious ? "opacity-50 cursor-not-allowed" : ""}"
          ${disablePrevious ? "disabled" : ""}
        >
          <i data-lucide="chevron-left" class="w-4 h-4"></i>
        </button>

        ${pageButtons}

        <button
          onclick="window.utilisateursPage.goToPage(${this.currentPage + 1})"
          class="px-3 py-1 text-sm border rounded-md hover:bg-accent ${disableNext ? "opacity-50 cursor-not-allowed" : ""}"
          ${disableNext ? "disabled" : ""}
        >
          <i data-lucide="chevron-right" class="w-4 h-4"></i>
        </button>
      </div>
    `;

    lucide.createIcons();
  }

  public goToPage(page: number): void {
    const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);

    if (page < 1 || page > totalPages) return;

    this.currentPage = page;
    this.renderTable();

    // Scroll to top of table
    const tableContainer = document.getElementById("users-table-container");
    tableContainer?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  private setupEventListeners(): void {
    // Create button
    const btnCreate = document.getElementById("btn-create-user");
    btnCreate?.addEventListener("click", () => this.showCreateModal());

    // Search input
    const searchInput = document.getElementById(
      "search-input"
    ) as HTMLInputElement;
    searchInput?.addEventListener("input", (e) => {
      this.searchTerm = (e.target as HTMLInputElement).value;
      this.applyFilters();
    });

    // Role filter
    const roleFilter = document.getElementById(
      "role-filter"
    ) as HTMLSelectElement;
    roleFilter?.addEventListener("change", (e) => {
      this.roleFilter = (e.target as HTMLSelectElement).value;
      this.applyFilters();
    });

    // Items per page
    const itemsPerPageSelect = document.getElementById(
      "items-per-page"
    ) as HTMLSelectElement;
    itemsPerPageSelect?.addEventListener("change", (e) => {
      this.itemsPerPage = parseInt((e.target as HTMLSelectElement).value, 10);
      this.currentPage = 1;
      this.renderTable();
    });
  }

  private setupPendingButtons(): void {
    document.querySelectorAll(".btn-approve").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userId = parseInt(
          (e.currentTarget as HTMLElement).dataset.userId || "0"
        );
        this.handleApproveUser(userId);
      });
    });

    document.querySelectorAll(".btn-reject").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userId = parseInt(
          (e.currentTarget as HTMLElement).dataset.userId || "0"
        );
        this.handleRejectUser(userId);
      });
    });
  }

  private setupTableButtons(): void {
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userId = parseInt(
          (e.currentTarget as HTMLElement).dataset.userId || "0"
        );
        const user = this.allUsers.find((u) => u.id_utilisateur === userId);
        if (user) this.showEditModal(user);
      });
    });

    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userId = parseInt(
          (e.currentTarget as HTMLElement).dataset.userId || "0"
        );
        this.showDeleteModal(userId);
      });
    });
  }

  private applyFilters(): void {
    this.filteredUsers = this.allUsers.filter((user) => {
      const matchesSearch =
        user.nom_utilisateur
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        user.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole =
        this.roleFilter === "all" || user.role === this.roleFilter;

      return matchesSearch && matchesRole;
    });

    this.renderTable();
  }

  private async showCreateModal(): Promise<void> {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    const modalHtml = await renderTemplate(
      "/src/frontend/templates/utilisateurs-create-modal.tpl.html",
      {}
    );
    modalContainer.innerHTML = modalHtml;

    const modal = document.getElementById("create-user-modal");
    if (!modal) return;

    modal.classList.remove("hidden");

    // Cancel button
    document
      .getElementById("btn-cancel-create")
      ?.addEventListener("click", () => {
        modal.classList.add("hidden");
      });

    // Form submission
    const form = document.getElementById("create-user-form") as HTMLFormElement;
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleCreateUser(new FormData(form));
    });

    lucide.createIcons();
  }

  private async showEditModal(user: Utilisateur): Promise<void> {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    const modalHtml = await renderTemplate(
      "/src/frontend/templates/utilisateurs-edit-modal.tpl.html",
      {}
    );
    modalContainer.innerHTML = modalHtml;

    const modal = document.getElementById("edit-user-modal");
    if (!modal) return;

    // Fill form
    (document.getElementById("edit-user-id") as HTMLInputElement).value =
      user.id_utilisateur.toString();
    (document.getElementById("edit-nom") as HTMLInputElement).value =
      user.nom_utilisateur;
    (document.getElementById("edit-prenom") as HTMLInputElement).value =
      user.prenom;
    (document.getElementById("edit-email") as HTMLInputElement).value =
      user.email;
    (document.getElementById("edit-role") as HTMLSelectElement).value =
      user.role;

    modal.classList.remove("hidden");

    // Cancel button
    document
      .getElementById("btn-cancel-edit")
      ?.addEventListener("click", () => {
        modal.classList.add("hidden");
      });

    // Form submission
    const form = document.getElementById("edit-user-form") as HTMLFormElement;
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleEditUser(new FormData(form));
    });

    lucide.createIcons();
  }

  private async showDeleteModal(userId: number): Promise<void> {
    // Vérifier que l'utilisateur n'est pas un admin
    const user = this.allUsers.find((u) => u.id_utilisateur === userId);
    if (user?.role === Role.ADMIN) {
      this.showError("Impossible de supprimer un administrateur");
      return;
    }

    this.userToDelete = userId;

    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    const modalHtml = await renderTemplate(
      "/src/frontend/templates/utilisateurs-delete-modal.tpl.html",
      {}
    );
    modalContainer.innerHTML = modalHtml;

    const modal = document.getElementById("delete-user-modal");
    if (!modal) return;

    modal.classList.remove("hidden");

    // Cancel button
    document
      .getElementById("btn-cancel-delete")
      ?.addEventListener("click", () => {
        modal.classList.add("hidden");
        this.userToDelete = null;
      });

    // Confirm button
    document
      .getElementById("btn-confirm-delete")
      ?.addEventListener("click", () => {
        this.handleDeleteUser();
      });

    lucide.createIcons();
  }

  private async handleCreateUser(formData: FormData): Promise<void> {
    try {
      const userData = {
        nom_utilisateur: formData.get("nom_utilisateur") as string,
        prenom: formData.get("prenom") as string,
        email: formData.get("email") as string,
        mot_de_passe: formData.get("password") as string,
        role: formData.get("role") as Role,
        valide: true, // Admin creates validated users
        adresse_utilisateur: "",
        cp_utilisateur: "",
        ville_utilisateur: "",
        plaque: "",
        cylindree: 0,
        marque: "",
        modele: "",
        type_essence: TypeEssence.ESSENCE95,
      };

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

  private async handleEditUser(formData: FormData): Promise<void> {
    try {
      const userId = parseInt(formData.get("id_utilisateur") as string);
      const userData = {
        nom_utilisateur: formData.get("nom_utilisateur") as string,
        prenom: formData.get("prenom") as string,
        email: formData.get("email") as string,
        role: formData.get("role") as string,
      };

      const response = await UtilisateurService.update(userId, userData);

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

  private async handleDeleteUser(): Promise<void> {
    if (!this.userToDelete) return;

    try {
      // Vérifier que l'utilisateur n'est pas un admin
      const user = this.allUsers.find(
        (u) => u.id_utilisateur === this.userToDelete
      );
      if (user?.role === Role.ADMIN) {
        this.showError("Impossible de supprimer un administrateur");
        const modal = document.getElementById("delete-user-modal");
        modal?.classList.add("hidden");
        this.userToDelete = null;
        return;
      }

      const response = await UtilisateurService.delete(this.userToDelete);

      if (response.success) {
        this.showSuccess("Utilisateur supprimé avec succès");
        const modal = document.getElementById("delete-user-modal");
        modal?.classList.add("hidden");
        this.userToDelete = null;
        await this.loadData();
      } else {
        this.showError(response.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression utilisateur:", error);
      this.showError("Erreur lors de la suppression de l'utilisateur");
    }
  }

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

  private showSuccess(message: string): void {
    // TODO: Implement toast notification
    alert(message);
  }

  private showError(message: string): void {
    // TODO: Implement toast notification
    alert(message);
  }
}
