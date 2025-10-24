import { UtilisateurService } from "../services/utilisateur.service";
import { CreateUtilisateurData, TypeEssence, Role } from "../types/api.types";

// Déclaration pour Lucide (CDN)
declare const lucide: {
  createIcons: () => void;
};

// DOM Elements
const form = document.getElementById("inscription-form") as HTMLFormElement;
const currentStepSpan = document.getElementById(
  "current-step"
) as HTMLSpanElement;
const progressBar = document.getElementById("progress-bar") as HTMLDivElement;
const prevBtn = document.getElementById("prev-btn") as HTMLButtonElement;
const nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const successModal = document.getElementById("success-modal") as HTMLDivElement;

// Steps
const step1 = document.getElementById("step-1") as HTMLDivElement;
const step2 = document.getElementById("step-2") as HTMLDivElement;
const step3 = document.getElementById("step-3") as HTMLDivElement;

let currentStep = 1;
const totalSteps = 3;

// Form data object
const formData: CreateUtilisateurData = {
  nom_utilisateur: "",
  prenom: "",
  email: "",
  mot_de_passe: "",
  adresse_utilisateur: "",
  cp_utilisateur: "",
  ville_utilisateur: "",
  role: Role.EMPLOYE,
  plaque: "",
  cylindree: 0,
  marque: "",
  modele: "",
  type_essence: TypeEssence.DIESEL,
};

/**
 * Toggle password visibility
 */
const passwordInput = document.getElementById("password") as HTMLInputElement;
const togglePasswordBtn = document.getElementById(
  "toggle-password"
) as HTMLButtonElement;
const toggleIcon = togglePasswordBtn.querySelector(
  "[data-lucide]"
) as HTMLElement;

togglePasswordBtn.addEventListener("click", () => {
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  toggleIcon.setAttribute(
    "data-lucide",
    type === "password" ? "eye" : "eye-off"
  );
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

/**
 * Update progress bar and step visibility
 */
function updateProgress(): void {
  const progress = (currentStep / totalSteps) * 100;
  progressBar.style.width = `${progress}%`;
  currentStepSpan.textContent = String(currentStep);

  // Show/hide steps
  step1.classList.toggle("hidden", currentStep !== 1);
  step2.classList.toggle("hidden", currentStep !== 2);
  step3.classList.toggle("hidden", currentStep !== 3);

  // Show/hide buttons
  prevBtn.classList.toggle("hidden", currentStep === 1);
  nextBtn.classList.toggle("hidden", currentStep === totalSteps);
  submitBtn.classList.toggle("hidden", currentStep !== totalSteps);

  // Update summary on step 3
  if (currentStep === 3) {
    updateSummary();
  }
}

/**
 * Validate current step
 */
function validateCurrentStep(): boolean {
  let isValid = true;
  let inputs: NodeListOf<HTMLInputElement | HTMLSelectElement>;

  switch (currentStep) {
    case 1: {
      inputs = step1.querySelectorAll("input[required]");
      break;
    }
    case 2: {
      inputs = step2.querySelectorAll("input[required]");
      // Check password match
      const password = (document.getElementById("password") as HTMLInputElement)
        .value;
      const confirmPassword = (
        document.getElementById("confirm-password") as HTMLInputElement
      ).value;
      if (password !== confirmPassword) {
        showError("Les mots de passe ne correspondent pas");
        return false;
      }
      // Check password strength
      if (password.length < 8) {
        showError("Le mot de passe doit contenir au moins 8 caractères");
        return false;
      }
      break;
    }
    case 3: {
      inputs = step3.querySelectorAll("input[required], select[required]");
      break;
    }
    default:
      return true;
  }

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      isValid = false;
      input.classList.add("border-destructive");
    } else {
      input.classList.remove("border-destructive");
    }
  });

  if (!isValid) {
    showError("Veuillez remplir tous les champs requis");
  }

  return isValid;
}

/**
 * Show error message
 */
function showError(message: string): void {
  const errorDiv = document.createElement("div");
  errorDiv.className =
    "fixed top-4 right-4 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg z-50 max-w-md";
  errorDiv.innerHTML = `
    <div class="flex items-center gap-2">
      <i data-lucide="alert-circle" class="h-5 w-5"></i>
      <p class="text-sm font-medium">${escapeHtml(message)}</p>
    </div>
  `;
  document.body.appendChild(errorDiv);
  lucide.createIcons();

  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

/**
 * Save current step data to formData object
 */
function saveCurrentStepData(): void {
  const currentStepElement = document.getElementById(
    `step-${currentStep}`
  ) as HTMLDivElement;
  const inputs = currentStepElement.querySelectorAll(
    "input, select"
  ) as NodeListOf<HTMLInputElement | HTMLSelectElement>;

  inputs.forEach((input) => {
    const name = input.name || input.id;
    if (name && name in formData) {
      const value = input.value;

      // Type conversion
      if (name === "cylindree") {
        formData.cylindree = parseInt(value) || 0;
      } else if (name === "type_essence") {
        formData.type_essence = value as TypeEssence;
      } else if (name === "role") {
        formData.role = value as Role;
      } else {
        // Generic string property
        formData[name as keyof CreateUtilisateurData] = value as never;
      }
    }
  });
}

/**
 * Update summary in step 3
 */
function updateSummary(): void {
  const summary = document.getElementById("summary") as HTMLDivElement;

  const essenceLabels: Record<string, string> = {
    Diesel: "Diesel",
    Essence95: "Essence 95",
    Essence98: "Essence 98",
    Électrique: "Électrique",
    Éthanol: "Éthanol",
    Gazole: "Gazole",
    Autre: "Autre",
  };

  const essenceLabel =
    essenceLabels[formData.type_essence] || formData.type_essence;

  summary.innerHTML = `
    <div class="space-y-1">
      <p><strong>Nom:</strong> ${escapeHtml(formData.nom_utilisateur)} ${escapeHtml(formData.prenom)}</p>
      <p><strong>Email:</strong> ${escapeHtml(formData.email)}</p>
      <p><strong>Adresse:</strong> ${escapeHtml(formData.adresse_utilisateur)}, ${escapeHtml(formData.cp_utilisateur)} ${escapeHtml(formData.ville_utilisateur)}</p>
      <p><strong>Véhicule:</strong> ${escapeHtml(formData.marque)} ${escapeHtml(formData.modele)} (${escapeHtml(formData.plaque)})</p>
      <p><strong>Cylindrée:</strong> ${formData.cylindree} CV</p>
      <p><strong>Carburant:</strong> ${escapeHtml(essenceLabel)}</p>
    </div>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Next button handler
 */
nextBtn.addEventListener("click", () => {
  if (validateCurrentStep()) {
    saveCurrentStepData();
    currentStep++;
    updateProgress();
    lucide.createIcons();
  }
});

/**
 * Previous button handler
 */
prevBtn.addEventListener("click", () => {
  saveCurrentStepData();
  currentStep--;
  updateProgress();
});

/**
 * Form submission
 */
form.addEventListener("submit", async (e: Event) => {
  e.preventDefault();

  if (!validateCurrentStep()) {
    return;
  }

  // Save last step data
  saveCurrentStepData();

  // Disable submit button
  submitBtn.disabled = true;
  const originalButtonText = submitBtn.innerHTML;
  submitBtn.innerHTML = `
    <i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i>
    <span>Création en cours...</span>
  `;
  lucide.createIcons();

  try {
    // Call the UtilisateurService
    const response = await UtilisateurService.create(formData);

    if (response.success) {
      // Show success modal
      successModal.classList.remove("hidden");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = "/src/frontend/pages/login.html";
      }, 3000);

      lucide.createIcons();
    } else {
      showError(
        response.error ||
          "Une erreur est survenue lors de la création du compte"
      );
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalButtonText;
    }
  } catch (error) {
    console.error("Registration error:", error);
    showError("Une erreur est survenue lors de la création du compte");
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalButtonText;
  }
});

// Initialize
updateProgress();
