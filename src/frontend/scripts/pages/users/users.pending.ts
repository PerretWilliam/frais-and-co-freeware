import { renderTemplate } from "../../template-helper";
import { Utilisateur } from "../../../types/api.types";
import { ROLE_LABELS, ROLE_CLASSES } from "./users.types";

declare const lucide: {
  createIcons: () => void;
};

/**
 * Gestion de l'affichage des utilisateurs en attente de validation
 */

export class UserPendingRenderer {
  /**
   * Rend la section des utilisateurs en attente
   */
  static async render(
    allUsers: Utilisateur[],
    onApprove: (userId: number) => void,
    onReject: (userId: number) => void
  ): Promise<void> {
    const container = document.getElementById("pending-users-section");
    if (!container) return;

    const pendingUsers = allUsers.filter((u) => !u.valide);

    if (pendingUsers.length === 0) {
      container.innerHTML = "";
      return;
    }

    // Render card container
    const cardHtml = await renderTemplate(
      "/src/frontend/templates/components/users/users-pending-card.tpl.html",
      { count: pendingUsers.length }
    );
    container.innerHTML = cardHtml;

    // Render each pending user
    const listContainer = document.getElementById("pending-users-list");
    if (!listContainer) return;

    const itemsHtml = await Promise.all(
      pendingUsers.map((user) => this.renderItem(user))
    );
    listContainer.innerHTML = itemsHtml.join("");

    // Setup approve/reject buttons
    this.setupButtons(onApprove, onReject);
    lucide.createIcons();
  }

  /**
   * Rend un item de la liste des utilisateurs en attente
   */
  private static async renderItem(user: Utilisateur): Promise<string> {
    const initials =
      `${user.prenom[0]}${user.nom_utilisateur[0]}`.toUpperCase();
    const roleClass = ROLE_CLASSES[user.role] || "";
    const roleLabel = ROLE_LABELS[user.role] || user.role;

    return await renderTemplate(
      "/src/frontend/templates/components/users/users-pending-item.tpl.html",
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

  /**
   * Configure les boutons d'approbation/refus
   */
  private static setupButtons(
    onApprove: (userId: number) => void,
    onReject: (userId: number) => void
  ): void {
    document.querySelectorAll(".btn-approve").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userId = parseInt(
          (e.currentTarget as HTMLElement).dataset.userId || "0"
        );
        onApprove(userId);
      });
    });

    document.querySelectorAll(".btn-reject").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const userId = parseInt(
          (e.currentTarget as HTMLElement).dataset.userId || "0"
        );
        onReject(userId);
      });
    });
  }
}
