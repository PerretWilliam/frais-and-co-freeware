// ====================================================
// TESTS CHANTIERS
// ====================================================

import { ChantierService } from "../../services/chantier.service";

declare global {
  interface Window {
    fillCreateChantierForm: () => void;
    testCreateChantier: () => Promise<void>;
    testGetAllChantiers: () => Promise<void>;
    testSearchChantiers: () => Promise<void>;
  }
}

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

window.fillCreateChantierForm = () => {
  const timestamp = Date.now();
  (document.getElementById("chantier-nom") as HTMLInputElement).value =
    `Chantier Test ${timestamp}`;
  (document.getElementById("chantier-adresse") as HTMLInputElement).value =
    "123 Rue de la Paix";
  (document.getElementById("chantier-ville") as HTMLInputElement).value =
    "Paris";
  (document.getElementById("chantier-code-postal") as HTMLInputElement).value =
    "75001";
};

window.testCreateChantier = async () => {
  try {
    const chantierData = {
      nom_chantier: getValue("chantier-nom"),
      adresse_chantier: getValue("chantier-adresse"),
      ville_chantier: getValue("chantier-ville"),
      cp_chantier: getValue("chantier-code-postal"),
    };

    const result = await ChantierService.create(chantierData);

    if (result.success && result.data) {
      showResult(
        "result-create-chantier",
        `✅ Chantier créé!\nID: ${result.data.id_chantier}\nNom: ${result.data.nom_chantier}\nVille: ${result.data.ville_chantier}`
      );
    } else {
      showResult("result-create-chantier", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-create-chantier", `❌ Erreur: ${message}`, true);
  }
};

window.testGetAllChantiers = async () => {
  try {
    const result = await ChantierService.getAll();

    if (result.success && result.data) {
      const chantierList = result.data
        .map(
          (c) => `${c.nom_chantier} - ${c.ville_chantier} (${c.cp_chantier})`
        )
        .join("\n");
      showResult(
        "result-chantiers-list",
        `✅ ${result.data.length} chantier(s) trouvé(s)\n\n${chantierList}`
      );
    } else {
      showResult("result-chantiers-list", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-chantiers-list", `❌ Erreur: ${message}`, true);
  }
};

window.testSearchChantiers = async () => {
  try {
    const searchTerm = prompt("Rechercher par nom:");
    if (!searchTerm) {
      showResult("result-chantiers-list", "❌ Recherche annulée", true);
      return;
    }

    const result = await ChantierService.search(searchTerm);

    if (result.success && result.data) {
      const chantierList = result.data
        .map((c) => `${c.nom_chantier} - ${c.ville_chantier}`)
        .join("\n");
      showResult(
        "result-chantiers-list",
        `✅ ${result.data.length} chantier(s) trouvé(s)\n\n${chantierList}`
      );
    } else {
      showResult("result-chantiers-list", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-chantiers-list", `❌ Erreur: ${message}`, true);
  }
};
