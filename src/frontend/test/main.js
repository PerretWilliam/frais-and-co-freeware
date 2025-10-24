// ====================================================
// FICHIER PRINCIPAL - NAVIGATION ET CHARGEMENT
// ====================================================

// Chargement dynamique des pages
async function loadPage(pageName) {
  const content = document.getElementById("content");
  try {
    const response = await fetch(`pages/${pageName}.html`);
    const html = await response.text();
    content.innerHTML = html;

    // Charger le script de tests correspondant
    await loadScript(`tests/${pageName}.ts`);
  } catch (error) {
    content.innerHTML = `<div class="test-section"><p style="color: var(--error-color);">Erreur de chargement: ${error.message}</p></div>`;
  }
}

// Chargement dynamique des scripts
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Supprimer l'ancien script s'il existe
    const oldScript = document.querySelector(`script[src="${src}"]`);
    if (oldScript) oldScript.remove();

    const script = document.createElement("script");
    script.type = "module";
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// Gestion des onglets
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const pageName = button.getAttribute("data-page");

      // Mettre à jour l'onglet actif
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Charger la page
      loadPage(pageName);
    });
  });
}

// Test de connexion à la base de données
async function testConnection() {
  const statusElement = document.getElementById("status");
  if (!statusElement) return;

  try {
    const { DatabaseService } = await import("../services/database.service.ts");
    const result = await DatabaseService.testConnection();

    if (result.success) {
      statusElement.className = "status-indicator connected";
      statusElement.innerHTML =
        '<span class="status-dot"></span><span>Connecté</span>';
    } else {
      statusElement.innerHTML =
        '<span class="status-dot"></span><span>Déconnecté</span>';
    }
  } catch (error) {
    console.error("Erreur test connexion:", error);
    statusElement.innerHTML =
      '<span class="status-dot"></span><span>Erreur</span>';
  }
}

// Initialisation
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Interface de tests chargée");
  setupTabs();
  await testConnection();
  // Charger la première page par défaut
  loadPage("utilisateurs");
});
