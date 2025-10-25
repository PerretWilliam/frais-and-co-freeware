import { UtilisateurService } from "../services/utilisateur.service";
import { AuthManager } from "./auth";
import { renderTemplate } from "./template-helper";

// Déclaration pour Lucide (CDN)
declare const lucide: {
  createIcons: () => void;
};

// DOM Elements
const loginForm = document.getElementById("login-form") as HTMLFormElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const rememberSwitch = document.getElementById(
  "remember-switch"
) as HTMLButtonElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const errorAlert = document.getElementById("error-alert") as HTMLDivElement;
const errorMessage = document.getElementById(
  "error-message"
) as HTMLParagraphElement;
const themeToggle = document.getElementById(
  "theme-toggle"
) as HTMLButtonElement;

// Remember Me Switch State
let rememberMe = false;
const switchThumb = rememberSwitch.querySelector("span") as HTMLSpanElement;

// Remember Me Switch Handler
rememberSwitch.addEventListener("click", () => {
  rememberMe = !rememberMe;
  rememberSwitch.setAttribute("aria-checked", String(rememberMe));

  if (rememberMe) {
    rememberSwitch.classList.add("bg-primary");
    rememberSwitch.classList.remove("bg-switch-background");
    switchThumb.classList.remove("translate-x-0");
    switchThumb.classList.add("translate-x-5");
  } else {
    rememberSwitch.classList.remove("bg-primary");
    rememberSwitch.classList.add("bg-switch-background");
    switchThumb.classList.add("translate-x-0");
    switchThumb.classList.remove("translate-x-5");
  }
});

/**
 * Affiche un message d'erreur
 */
function showError(message: string): void {
  errorMessage.textContent = message;
  errorAlert.classList.remove("hidden");

  // Auto-hide après 5 secondes
  setTimeout(() => {
    errorAlert.classList.add("hidden");
  }, 5000);
}

/**
 * Gestion de la soumission du formulaire
 */
loginForm.addEventListener("submit", async (e: Event) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Validation basique
  if (!email || !password) {
    showError("Veuillez remplir tous les champs");
    return;
  }

  // Désactiver le bouton submit
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent || "Se connecter";

  const loadingHtml = await renderTemplate(
    "/src/frontend/templates/common/loading-button.tpl.html",
    { text: "Connexion en cours..." }
  );
  submitBtn.innerHTML = loadingHtml;
  lucide.createIcons();

  try {
    // Appel au service de connexion
    const response = await UtilisateurService.login({
      email,
      password,
    });

    if (response.success && response.data) {
      // Sauvegarder l'utilisateur avec AuthManager
      AuthManager.saveUser(response.data.utilisateur, rememberMe);

      // Sauvegarder le token si présent
      if (response.data.token) {
        AuthManager.saveToken(response.data.token, rememberMe);
      }

      // Redirection selon le rôle
      AuthManager.redirectByRole();
    } else {
      showError(response.error || "Email ou mot de passe incorrect");
    }
  } catch (error) {
    console.error("Login error:", error);
    showError("Une erreur est survenue lors de la connexion");
  } finally {
    // Réactiver le bouton
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

/**
 * Gestion du thème (dark/light mode)
 */
let isDark = localStorage.getItem("theme") === "dark";
const html = document.documentElement;
const themeIcon = themeToggle.querySelector("[data-lucide]") as HTMLElement;

function updateTheme(): void {
  if (isDark) {
    html.classList.add("dark");
    themeIcon.setAttribute("data-lucide", "sun");
  } else {
    html.classList.remove("dark");
    themeIcon.setAttribute("data-lucide", "moon");
  }
  lucide.createIcons();
}

themeToggle.addEventListener("click", () => {
  isDark = !isDark;
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateTheme();
});

// Initialiser le thème
updateTheme();

/**
 * Vérifier si déjà connecté
 * Si oui, rediriger vers la page appropriée
 */
if (AuthManager.isAuthenticated()) {
  AuthManager.redirectByRole();
}
