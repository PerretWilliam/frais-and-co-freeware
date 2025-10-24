// ====================================================
// TESTS UTILISATEURS
// ====================================================

import { UtilisateurService } from "../../services/utilisateur.service";
import { Role, TypeEssence } from "../../types/api.types";

// Déclarations TypeScript pour Window
declare global {
  interface Window {
    fillCreateUserForm: () => void;
    fillLoginForm: () => void;
    testCreateUser: () => Promise<void>;
    testLogin: () => Promise<void>;
    testGetAllUsers: () => Promise<void>;
    testGetPendingUsers: () => Promise<void>;
  }
}

// Utilitaires
function showResult(elementId: string, message: string, isError = false): void {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove("hidden");
  el.className = `result-box ${isError ? "error" : "success"}`;
  el.textContent = message;
}

function getValue(id: string): string {
  const el = document.getElementById(id) as HTMLInputElement;
  return el ? el.value : "";
}

// Auto-fill
window.fillCreateUserForm = () => {
  const timestamp = Date.now();
  (document.getElementById("user-nom") as HTMLInputElement).value = "Dupont";
  (document.getElementById("user-prenom") as HTMLInputElement).value = "Jean";
  (document.getElementById("user-email") as HTMLInputElement).value =
    `jean.dupont.${timestamp}@test.com`;
  (document.getElementById("user-password") as HTMLInputElement).value =
    "Test123!";
  (document.getElementById("user-role") as HTMLSelectElement).value = "Employe";
};

window.fillLoginForm = () => {
  (document.getElementById("login-email") as HTMLInputElement).value =
    "admin@frais.com";
  (document.getElementById("login-password") as HTMLInputElement).value =
    "Admin123!";
};

// Tests
window.testCreateUser = async () => {
  try {
    const userData = {
      nom_utilisateur: getValue("user-nom"),
      prenom: getValue("user-prenom"),
      email: getValue("user-email"),
      mot_de_passe: getValue("user-password"),
      role: getValue("user-role") as Role,
      adresse_utilisateur: "123 Rue Test",
      cp_utilisateur: "75001",
      ville_utilisateur: "Paris",
      plaque: "AB-123-CD",
      cylindree: 1600,
      marque: "Renault",
      modele: "Clio",
      type_essence: TypeEssence.ESSENCE95,
    };

    const result = await UtilisateurService.create(userData);

    if (result.success && result.data) {
      showResult(
        "result-create-user",
        `✅ Utilisateur créé!\nID: ${result.data.id_utilisateur}\nEmail: ${result.data.email}`
      );
    } else {
      showResult("result-create-user", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-create-user", `❌ Erreur: ${message}`, true);
  }
};

window.testLogin = async () => {
  try {
    const credentials = {
      email: getValue("login-email"),
      password: getValue("login-password"),
    };

    const result = await UtilisateurService.login(credentials);

    if (result.success && result.data) {
      showResult(
        "result-login",
        `✅ Connexion réussie!\nUtilisateur: ${result.data.utilisateur.nom_utilisateur} ${result.data.utilisateur.prenom}\nRôle: ${result.data.utilisateur.role}`
      );
    } else {
      showResult("result-login", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-login", `❌ Erreur: ${message}`, true);
  }
};

window.testGetAllUsers = async () => {
  try {
    const result = await UtilisateurService.getAll();

    if (result.success && result.data) {
      const userList = result.data
        .map(
          (u) =>
            `${u.nom_utilisateur} ${u.prenom} (${u.email}) - ${u.role} - ${u.valide ? "✓ Validé" : "✗ En attente"}`
        )
        .join("\n");
      showResult(
        "result-users-list",
        `✅ ${result.data.length} utilisateur(s) trouvé(s)\n\n${userList}`
      );
    } else {
      showResult("result-users-list", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-users-list", `❌ Erreur: ${message}`, true);
  }
};

window.testGetPendingUsers = async () => {
  try {
    const result = await UtilisateurService.getPending();

    if (result.success && result.data) {
      const userList = result.data
        .map((u) => `${u.nom_utilisateur} ${u.prenom} (${u.email})`)
        .join("\n");
      showResult(
        "result-users-list",
        `✅ ${result.data.length} utilisateur(s) en attente\n\n${userList}`
      );
    } else {
      showResult("result-users-list", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-users-list", `❌ Erreur: ${message}`, true);
  }
};
