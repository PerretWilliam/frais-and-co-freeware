// ====================================================
// TESTS BASE DE DONNÉES
// ====================================================

import { DatabaseService } from "../../services/database.service";

declare global {
  interface Window {
    testDbConnection: () => Promise<void>;
  }
}

function showResult(elementId: string, message: string, isError = false): void {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove("hidden");
  el.className = `result-box ${isError ? "error" : "success"}`;
  el.textContent = message;
}

window.testDbConnection = async () => {
  try {
    const result = await DatabaseService.testConnection();

    if (result.success && result.data) {
      showResult(
        "result-db-connection",
        `✅ Connexion réussie!\nPostgreSQL ${result.data.version}`
      );
    } else {
      showResult("result-db-connection", `❌ ${result.error}`, true);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    showResult("result-db-connection", `❌ Erreur: ${message}`, true);
  }
};
