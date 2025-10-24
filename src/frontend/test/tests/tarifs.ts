// ====================================================
// TESTS GRILLE TARIFAIRE
// ====================================================

import { TarifService } from "../../services/tarif.service";

declare global {
  interface Window {
    fillCreateTarifForm: () => void;
    testCreateTarif: () => Promise<void>;
    testGetAllTarifs: () => Promise<void>;
    testCalculateFrais: () => Promise<void>;
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

window.fillCreateTarifForm = () => {
  (document.getElementById("tarif-cylindree") as HTMLInputElement).value =
    "1600";
  (document.getElementById("tarif-prix") as HTMLInputElement).value = "0.45";
};

window.testCreateTarif = async () => {
  try {
    const tarifData = {
      cylindree: parseInt(getValue("tarif-cylindree")),
      tarif_km: parseFloat(getValue("tarif-prix")),
    };

    const result = await TarifService.upsert(tarifData);

    if (result.success && result.data) {
      showResult(
        "result-create-tarif",
        `✅ Tarif créé/modifié!\nCylindrée: ${result.data.cylindree}cc\nTarif: ${result.data.tarif_km}€/km`
      );
    } else {
      showResult("result-create-tarif", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-create-tarif", `❌ Erreur: ${message}`, true);
  }
};

window.testGetAllTarifs = async () => {
  try {
    const result = await TarifService.getAll();

    if (result.success && result.data) {
      const tarifList = result.data
        .map((t) => `${t.cylindree}cc - ${t.tarif_km}€/km`)
        .join("\n");
      showResult(
        "result-tarifs-list",
        `✅ ${result.data.length} tarif(s) trouvé(s)\n\n${tarifList}`
      );
    } else {
      showResult("result-tarifs-list", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-tarifs-list", `❌ Erreur: ${message}`, true);
  }
};

window.testCalculateFrais = async () => {
  try {
    const cylindree = prompt("Cylindrée (cc):");
    const distance = prompt("Distance (km):");

    if (!cylindree || !distance) {
      showResult("result-tarifs-list", "❌ Calcul annulé", true);
      return;
    }

    const result = await TarifService.calculateDeplacement(
      parseInt(cylindree),
      parseFloat(distance)
    );

    if (result.success && result.data) {
      showResult(
        "result-tarifs-list",
        `✅ Montant calculé: ${result.data}€\n${cylindree}cc × ${distance}km = ${result.data}€`
      );
    } else {
      showResult("result-tarifs-list", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-tarifs-list", `❌ Erreur: ${message}`, true);
  }
};
