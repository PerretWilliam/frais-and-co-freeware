import { UtilisateurService } from "../services/utilisateur.service";
import { CreateUtilisateurData, TypeEssence, Role } from "../types/api.types";
import { renderTemplate } from "./template-helper";

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

  // Show/hide buttons based on current step
  // Précédent: caché à l'étape 1
  prevBtn.classList.toggle("hidden", currentStep === 1);

  // Suivant: caché à l'étape 3 (dernière étape)
  nextBtn.classList.toggle("hidden", currentStep === totalSteps);

  // Submit: visible uniquement à l'étape 3
  submitBtn.classList.toggle("hidden", currentStep !== totalSteps);

  // Disable/enable buttons properly
  prevBtn.disabled = currentStep === 1;
  nextBtn.disabled = currentStep === totalSteps;

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
  void showErrorAsync(message);
}

async function showErrorAsync(message: string): Promise<void> {
  const errorDiv = document.createElement("div");
  errorDiv.className =
    "fixed top-4 right-4 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg z-50 max-w-md";

  const errorHtml = await renderTemplate(
    "/src/frontend/templates/error-notification.tpl.html",
    { message }
  );
  errorDiv.innerHTML = errorHtml;
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
  if (!summary) return;

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

  // Clear existing content
  summary.innerHTML = "";

  // Create container div
  const container = document.createElement("div");
  container.className = "space-y-1";

  // Helper to create a paragraph with safe text
  const createInfoLine = (
    label: string,
    value: string
  ): HTMLParagraphElement => {
    const p = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = label + ": ";
    p.appendChild(strong);
    p.appendChild(document.createTextNode(value));
    return p;
  };

  // Add all info lines
  container.appendChild(
    createInfoLine("Nom", `${formData.nom_utilisateur} ${formData.prenom}`)
  );
  container.appendChild(createInfoLine("Email", formData.email));
  container.appendChild(
    createInfoLine(
      "Adresse",
      `${formData.adresse_utilisateur}, ${formData.cp_utilisateur} ${formData.ville_utilisateur}`
    )
  );
  container.appendChild(
    createInfoLine(
      "Véhicule",
      `${formData.marque} ${formData.modele} (${formData.plaque})`
    )
  );
  container.appendChild(
    createInfoLine("Cylindrée", `${formData.cylindree} CV`)
  );
  container.appendChild(createInfoLine("Carburant", essenceLabel));

  summary.appendChild(container);
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
  const originalButtonText = submitBtn.textContent || "Créer mon compte";

  const loadingHtml = await renderTemplate(
    "/src/frontend/templates/loading-button.tpl.html",
    { text: "Création en cours..." }
  );
  submitBtn.innerHTML = loadingHtml;
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
      submitBtn.textContent = originalButtonText;
    }
  } catch (error) {
    console.error("Registration error:", error);
    showError("Une erreur est survenue lors de la création du compte");
    submitBtn.disabled = false;
    submitBtn.textContent = originalButtonText;
  }
});

// Initialize
updateProgress();
