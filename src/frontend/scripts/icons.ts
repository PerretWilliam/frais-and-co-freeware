/**
 * Utilitaire pour initialiser les icônes Lucide
 * Charge depuis le CDN avec fallback
 */

declare global {
  interface Window {
    lucide?: {
      createIcons: () => void;
    };
  }
}

let lucideLoaded = false;

/**
 * Initialise les icônes Lucide
 */
export function initLucideIcons(): void {
  if (lucideLoaded) return;

  // Vérifier si Lucide est chargé
  if (window.lucide) {
    window.lucide.createIcons();
    lucideLoaded = true;
  } else {
    console.error("Lucide icons not loaded from CDN");
  }
}

/**
 * Rafraîchit les icônes après modification du DOM
 */
export function refreshIcons(): void {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Auto-initialisation au chargement
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLucideIcons);
} else {
  initLucideIcons();
}

// Export par défaut
export default {
  init: initLucideIcons,
  refresh: refreshIcons,
};
