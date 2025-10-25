import { renderTemplate } from "../../template-helper";
import { Utilisateur, Role, TypeEssence } from "../../../types/api.types";

declare const lucide: {
  createIcons: () => void;
};

/**
 * Gestion des modales de création, édition et suppression
 */

export class UserModalsManager {
  /**
   * Affiche la modale de création
   */
  static async showCreate(
    onCreate: (formData: FormData) => Promise<void>
  ): Promise<void> {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    const modalHtml = await renderTemplate(
      "/src/frontend/templates/components/users/users-create-modal.tpl.html",
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
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await onCreate(new FormData(form));
    });

    lucide.createIcons();
  }

  /**
   * Affiche la modale d'édition
   */
  static async showEdit(
    user: Utilisateur,
    onEdit: (formData: FormData) => Promise<void>
  ): Promise<void> {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    const modalHtml = await renderTemplate(
      "/src/frontend/templates/components/users/users-edit-modal.tpl.html",
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
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await onEdit(new FormData(form));
    });

    lucide.createIcons();
  }

  /**
   * Affiche la modale de suppression
   */
  static async showDelete(
    userId: number,
    allUsers: Utilisateur[],
    onDelete: () => Promise<void>,
    onError: (message: string) => void
  ): Promise<void> {
    // Vérifier que l'utilisateur n'est pas un admin
    const user = allUsers.find((u) => u.id_utilisateur === userId);
    if (user?.role === Role.ADMIN) {
      onError("Impossible de supprimer un administrateur");
      return;
    }

    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    const modalHtml = await renderTemplate(
      "/src/frontend/templates/components/users/users-delete-modal.tpl.html",
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
      });

    // Confirm button
    document
      .getElementById("btn-confirm-delete")
      ?.addEventListener("click", async () => {
        await onDelete();
        modal.classList.add("hidden");
      });

    lucide.createIcons();
  }

  /**
   * Valide et prépare les données pour la création d'un utilisateur
   */
  static prepareCreateData(formData: FormData) {
    return {
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
  }

  /**
   * Valide et prépare les données pour la modification d'un utilisateur
   */
  static prepareEditData(formData: FormData) {
    return {
      id: parseInt(formData.get("id_utilisateur") as string),
      data: {
        nom_utilisateur: formData.get("nom_utilisateur") as string,
        prenom: formData.get("prenom") as string,
        email: formData.get("email") as string,
        role: formData.get("role") as string,
      },
    };
  }
}
