// ====================================================
// TESTS FRAIS
// ====================================================

import { FraisService } from "../../services/frais.service";

declare global {
  interface Window {
    fillCreateFraisForm: () => void;
    testCreateFrais: () => Promise<void>;
    testGetFraisByUser: () => Promise<void>;
    testGetAllFrais: () => Promise<void>;
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

window.fillCreateFraisForm = () => {
  (document.getElementById("frais-user-id") as HTMLInputElement).value = "1";
  (document.getElementById("frais-chantier-id") as HTMLInputElement).value =
    "1";
  (document.getElementById("frais-date") as HTMLInputElement).value = new Date()
    .toISOString()
    .split("T")[0];
  (document.getElementById("frais-depart") as HTMLInputElement).value = "Paris";
  (document.getElementById("frais-arrivee") as HTMLInputElement).value = "Lyon";
  (document.getElementById("frais-distance") as HTMLInputElement).value = "450";
  (document.getElementById("frais-immatriculation") as HTMLInputElement).value =
    "AB-123-CD";
};

window.testCreateFrais = async () => {
  try {
    const fraisData: any = {
      id_utilisateur: parseInt(getValue("frais-user-id")),
      id_chantier: parseInt(getValue("frais-chantier-id")),
      date_frais: getValue("frais-date"),
      lieu_depart: getValue("frais-depart"),
      lieu_arrivee: getValue("frais-arrivee"),
      distance_km: parseFloat(getValue("frais-distance")),
      immatriculation: getValue("frais-immatriculation"),
    };

    const result = await FraisService.createDeplacement(fraisData);

    if (result.success && result.data) {
      const depl: any = result.data;
      showResult(
        "result-create-frais",
        `✅ Frais de déplacement créé!\nID: ${depl.id_deplacement || depl.id_frais}\nMontant: ${result.data.montant}€\nTrajet: ${fraisData.lieu_depart} → ${fraisData.lieu_arrivee}`
      );
    } else {
      showResult("result-create-frais", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-create-frais", `❌ Erreur: ${message}`, true);
  }
};

window.testGetFraisByUser = async () => {
  try {
    const userId = getValue("search-frais-user-id");
    if (!userId) {
      showResult(
        "result-frais-list",
        "❌ Veuillez saisir un ID utilisateur",
        true
      );
      return;
    }

    const result = await FraisService.getByUser(parseInt(userId));

    if (result.success && result.data) {
      const fraisList = result.data
        .map((f) => `${f.date} - ${f.montant}€ - ${f.statut}`)
        .join("\n");
      showResult(
        "result-frais-list",
        `✅ ${result.data.length} frais trouvé(s)\n\n${fraisList}`
      );
    } else {
      showResult("result-frais-list", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-frais-list", `❌ Erreur: ${message}`, true);
  }
};

window.testGetAllFrais = async () => {
  try {
    const result = await FraisService.getAll();

    if (result.success && result.data) {
      showResult(
        "result-frais-list",
        `✅ ${result.data.length} frais trouvé(s) au total`
      );
    } else {
      showResult("result-frais-list", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-frais-list", `❌ Erreur: ${message}`, true);
  }
};
