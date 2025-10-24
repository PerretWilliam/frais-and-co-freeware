// ====================================================
// TESTS TELEPHONE
// ====================================================

import { TelephoneService } from "../../services/telephone.service";

declare global {
  interface Window {
    fillAddPhoneForm: () => void;
    testAddPhone: () => Promise<void>;
    testGetUserPhones: () => Promise<void>;
    testDeletePhone: () => Promise<void>;
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

window.fillAddPhoneForm = () => {
  const timestamp = Date.now();
  (document.getElementById("phone-user-id") as HTMLInputElement).value = "1";
  (document.getElementById("phone-numero") as HTMLInputElement).value =
    `06${String(timestamp).slice(-8)}`;
};

window.testAddPhone = async () => {
  try {
    const phoneData = {
      id_utilisateur: parseInt(getValue("phone-user-id")),
      indic_pays: "33",
      indic_region: "",
      numero: getValue("phone-numero"),
    };

    const result = await TelephoneService.create(phoneData);

    if (result.success && result.data) {
      showResult(
        "result-add-phone",
        `✅ Téléphone ajouté!\nID: ${result.data.id_telephone}\nNuméro: ${result.data.numero}`
      );
    } else {
      showResult("result-add-phone", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-add-phone", `❌ Erreur: ${message}`, true);
  }
};

window.testGetUserPhones = async () => {
  try {
    const userId = getValue("search-phone-user-id");
    if (!userId) {
      showResult(
        "result-phones-list",
        "❌ Veuillez saisir un ID utilisateur",
        true
      );
      return;
    }

    const result = await TelephoneService.getByUser(parseInt(userId));

    if (result.success && result.data) {
      const phoneList = result.data
        .map((p) => `${p.indic_pays}${p.indic_region}${p.numero}`)
        .join("\n");
      showResult(
        "result-phones-list",
        `✅ ${result.data.length} téléphone(s) trouvé(s)\n\n${phoneList}`
      );
    } else {
      showResult("result-phones-list", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-phones-list", `❌ Erreur: ${message}`, true);
  }
};

window.testDeletePhone = async () => {
  try {
    const phoneId = prompt("ID du téléphone à supprimer:");

    if (!phoneId) return;

    const result = await TelephoneService.delete(parseInt(phoneId));

    if (result.success) {
      showResult(
        "result-phones-list",
        `✅ Téléphone supprimé (ID: ${phoneId})`
      );
    } else {
      showResult("result-phones-list", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-phones-list", `❌ Erreur: ${message}`, true);
  }
};
