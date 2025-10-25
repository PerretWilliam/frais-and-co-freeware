import { renderTemplate } from "../../template-helper";
import { Utilisateur, Role } from "../../../types/api.types";
import { ROLE_LABELS, ROLE_CLASSES } from "./users.types";

declare const lucide: {
  createIcons: () => void;
};

/**
 * Gestion du rendu de la table utilisateurs
 */

export class UserTableRenderer {
  /**
   * Rend la table complète avec pagination
   */
  static async render(
    users: Utilisateur[],
    currentPage: number,
    itemsPerPage: number,
    onEdit: (userId: number) => void,
    onDelete: (userId: number) => void
  ): Promise<void> {
    const container = document.getElementById("users-table-container");
    if (!container) return;

    // Update count
    const countElement = document.getElementById("user-count");
    if (countElement) {
      countElement.textContent = users.length.toString();
    }

    if (users.length === 0) {
      await this.renderEmpty(container);
      return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = users.slice(startIndex, endIndex);

    // Render table structure
    const tableHtml = await renderTemplate(
      "/src/frontend/templates/components/users/users-table.tpl.html",
      {}
    );
    container.innerHTML = tableHtml;

    // Render rows
    const tbody = document.getElementById("users-tbody");
    if (!tbody) return;

    const rowsHtml = await Promise.all(
      paginatedUsers.map((user) => this.renderRow(user))
    );
    tbody.innerHTML = rowsHtml.join("");

    // Setup action buttons
    this.setupActionButtons(onEdit, onDelete);

    lucide.createIcons();
  }

  /**
   * Rend un message d'absence de résultats
   */
  private static async renderEmpty(container: HTMLElement): Promise<void> {
    const emptyHtml = await renderTemplate(
      "/src/frontend/templates/components/users/users-empty.tpl.html",
      {}
    );
    container.innerHTML = emptyHtml;

    // Hide pagination
    const paginationContainer = document.getElementById("pagination-container");
    if (paginationContainer) {
      paginationContainer.innerHTML = "";
    }

    lucide.createIcons();
  }

  /**
   * Rend une ligne de la table
   */
  private static async renderRow(user: Utilisateur): Promise<string> {
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
      "/src/frontend/templates/components/users/users-table-row.tpl.html",
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

  /**
   * Configure les boutons d'action de la table
   */
  private static setupActionButtons(
    onEdit: (userId: number) => void,
    onDelete: (userId: number) => void
  ): void {
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userId = parseInt(
          (e.currentTarget as HTMLElement).dataset.userId || "0"
        );
        onEdit(userId);
      });
    });

    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userId = parseInt(
          (e.currentTarget as HTMLElement).dataset.userId || "0"
        );
        onDelete(userId);
      });
    });
  }
}
