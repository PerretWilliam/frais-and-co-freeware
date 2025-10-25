import { renderTemplate } from "../../template-helper";
import { AuthManager } from "../../auth";
import { ChantierService } from "../../../services/chantier.service";
import { TarifService } from "../../../services/tarif.service";
import { UtilisateurService } from "../../../services/utilisateur.service";
import { FraisService } from "../../../services/frais.service";
import { router } from "../../router";
import { Chantier, Utilisateur } from "../../../types/api.types";
import { FileUploadHandler } from "./file-handler";
import { FormSubmitHandler } from "./form-handlers";

declare const lucide: {
  createIcons: () => void;
};

declare global {
  interface Window {
    nouveauFraisPage: NouveauFraisPage;
  }
}

type TabType = "DEPLACEMENT" | "REPAS" | "HEBERGEMENT";

interface RecentFrais {
  type: string;
  date: string;
  montant: number;
  libelle: string;
}

/**
 * Nouveau Frais Page - Page de création de frais (EMPLOYE uniquement)
 */
export class NouveauFraisPage {
  private currentTab: TabType = "DEPLACEMENT";
  private chantiers: Chantier[] = [];
  private utilisateur: Utilisateur | null = null;
  private recentFrais: RecentFrais[] = [];
  private userId: number;
  private fileHandler: FileUploadHandler;
  private formSubmitHandler!: FormSubmitHandler;
  private tarifKm = 0.523; // Tarif par défaut

  constructor() {
    const user = AuthManager.getUser();
    this.userId = user?.id_utilisateur || 0;
    this.fileHandler = new FileUploadHandler();
  }

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const html = await renderTemplate(
      "/src/frontend/templates/pages/new-expense-page.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    window.nouveauFraisPage = this;

    await this.loadData();
    await this.renderTabContent();
    this.setupEventListeners();
    this.updateProgress();
    lucide.createIcons();
  }

  private async loadData(): Promise<void> {
    try {
      // Charger les chantiers
      const chantiersResponse = await ChantierService.getAll();
      if (chantiersResponse.success && chantiersResponse.data) {
        this.chantiers = Array.isArray(chantiersResponse.data)
          ? chantiersResponse.data
          : [];
      } else {
        console.error("Erreur chargement chantiers:", chantiersResponse.error);
      }

      // Charger les infos de l'utilisateur (contient le véhicule)
      const userResponse = await UtilisateurService.getById(this.userId);
      if (userResponse.success && userResponse.data) {
        this.utilisateur = userResponse.data;

        // Charger le tarif correspondant à la cylindrée
        if (this.utilisateur.cylindree) {
          const tarifResponse = await TarifService.getByCylindree(
            this.utilisateur.cylindree
          );
          if (tarifResponse.success && tarifResponse.data) {
            this.tarifKm = tarifResponse.data.tarif_km;
          }
        }
      }

      // Créer le handler de soumission avec les données chargées
      this.formSubmitHandler = new FormSubmitHandler(
        this.userId,
        this.chantiers,
        this.utilisateur,
        this.fileHandler
      );

      // Charger les derniers frais depuis la BDD
      const fraisResponse = await FraisService.getByUser(this.userId);
      if (fraisResponse.success && fraisResponse.data) {
        const allFrais = Array.isArray(fraisResponse.data)
          ? fraisResponse.data
          : [];

        // Prendre les 3 derniers frais
        this.recentFrais = allFrais.slice(0, 3).map((f) => ({
          type: "FRAIS",
          date: new Date(f.date).toLocaleDateString("fr-FR"),
          montant: f.montant,
          libelle: f.lieu || "Frais sans description",
        }));
      } else {
        this.recentFrais = [];
      }

      // Render history
      await this.renderHistory();
    } catch (error) {
      console.error("Erreur chargement données:", error);
    }
  }

  private async renderTabContent(): Promise<void> {
    const chantiersOptionsHtml = this.chantiers
      .map(
        (c) =>
          `<option value="${c.id_chantier}">${c.nom_chantier} - ${c.ville_chantier || "Ville inconnue"}</option>`
      )
      .join("");

    if (this.currentTab === "DEPLACEMENT") {
      const container = document.getElementById("tab-deplacement");
      if (!container) return;

      const hasVehicule = !!(
        this.utilisateur?.plaque && this.utilisateur?.cylindree
      );
      const vehiculeDisplay = hasVehicule
        ? `${this.utilisateur?.marque} ${this.utilisateur?.modele} - ${this.utilisateur?.plaque} (${this.tarifKm} €/km)`
        : "Aucun véhicule enregistré";

      const vehiculeWarning = !hasVehicule
        ? '<p class="text-xs text-destructive mt-1">Vous devez d\'abord enregistrer votre véhicule personnel dans la section Profil</p>'
        : "";

      const html = await renderTemplate(
        "/src/frontend/templates/components/expenses/new-expense-travel.tpl.html",
        {
          chantiersOptions: chantiersOptionsHtml,
          vehiculeDisplay,
          vehiculeWarning: vehiculeWarning,
        }
      );
      container.innerHTML = html;

      // Set default date
      const dateInput = document.getElementById(
        "date-deplacement"
      ) as HTMLInputElement;
      if (dateInput) {
        dateInput.value = new Date().toISOString().split("T")[0];
      }

      // Setup distance calculator
      const btnCalculate = document.getElementById("btn-calculate-distance");
      btnCalculate?.addEventListener("click", () => this.calculateDistance());
    } else if (this.currentTab === "REPAS") {
      const container = document.getElementById("tab-repas");
      if (!container) return;

      const html = await renderTemplate(
        "/src/frontend/templates/components/expenses/new-expense-meal.tpl.html",
        { chantiersOptionsHtml }
      );
      container.innerHTML = html;

      // Set default date
      const dateInput = document.getElementById(
        "date-repas"
      ) as HTMLInputElement;
      if (dateInput) {
        dateInput.value = new Date().toISOString().split("T")[0];
      }

      // Setup file upload
      this.fileHandler.setupFileUpload("repas", () => this.updateProgress());

      // Update montant on input
      const montantInput = document.getElementById(
        "montant-repas"
      ) as HTMLInputElement;
      montantInput?.addEventListener("input", () =>
        this.updateMontantDisplay()
      );
    } else if (this.currentTab === "HEBERGEMENT") {
      const container = document.getElementById("tab-hebergement");
      if (!container) return;

      const html = await renderTemplate(
        "/src/frontend/templates/components/expenses/new-expense-lodging.tpl.html",
        { chantiersOptionsHtml }
      );
      container.innerHTML = html;

      // Setup file upload
      this.fileHandler.setupFileUpload("hebergement", () =>
        this.updateProgress()
      );

      // Update montant on input
      const montantInput = document.getElementById(
        "montant-hebergement"
      ) as HTMLInputElement;
      montantInput?.addEventListener("input", () =>
        this.updateMontantDisplay()
      );
    }

    lucide.createIcons();
  }

  private setupEventListeners(): void {
    // Tab switching
    document.querySelectorAll(".tab-trigger").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const tab = (e.currentTarget as HTMLElement).dataset.tab as TabType;
        if (tab) {
          await this.switchTab(tab);
        }
      });
    });

    // Form submission
    const form = document.getElementById("frais-form") as HTMLFormElement;
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Cancel button
    const btnCancel = document.getElementById("btn-cancel");
    btnCancel?.addEventListener("click", () => {
      router.navigate("/mes-frais");
    });

    // Update progress on any input change
    form?.addEventListener("input", () => {
      this.updateProgress();
    });
  }

  private async switchTab(tab: TabType): Promise<void> {
    this.currentTab = tab;

    // Update button states
    document.querySelectorAll(".tab-trigger").forEach((button) => {
      const buttonTab = (button as HTMLElement).dataset.tab;
      if (buttonTab === tab) {
        button.classList.add("active", "border-primary");
        button.classList.remove("border-transparent", "text-muted-foreground");
      } else {
        button.classList.remove("active", "border-primary");
        button.classList.add("border-transparent", "text-muted-foreground");
      }
    });

    // Show/hide content
    document.querySelectorAll(".tab-content").forEach((content) => {
      const contentType = (content as HTMLElement).dataset.type;
      if (contentType === tab) {
        content.classList.remove("hidden");
        content.classList.add("active");
      } else {
        content.classList.add("hidden");
        content.classList.remove("active");
      }
    });

    // Render new content
    await this.renderTabContent();

    // Update progress
    this.updateProgress();
  }

  private calculateDistance(): void {
    if (!this.utilisateur?.cylindree) {
      alert(
        "Veuillez d'abord enregistrer votre véhicule personnel dans la section Profil"
      );
      return;
    }

    const villeDepart = (
      document.getElementById("ville-depart") as HTMLInputElement
    )?.value;
    const villeArrivee = (
      document.getElementById("ville-arrivee") as HTMLInputElement
    )?.value;

    if (!villeDepart || !villeArrivee) {
      alert("Veuillez renseigner les villes de départ et d'arrivée");
      return;
    }

    // TODO: Intégrer une vraie API de calcul de distance (Google Maps, etc.)
    // Pour l'instant, simulation
    const randomDistance = Math.floor(Math.random() * 500) + 50;
    const montant = randomDistance * this.tarifKm;

    const distanceDisplay = document.getElementById(
      "distance-display"
    ) as HTMLInputElement;
    const distanceValue = document.getElementById(
      "distance-value"
    ) as HTMLInputElement;

    if (distanceDisplay) distanceDisplay.value = `${randomDistance} km`;
    if (distanceValue) distanceValue.value = randomDistance.toString();

    this.updateMontantDisplay(montant);
    this.updateProgress();
  }

  private updateMontantDisplay(montant?: number): void {
    const display = document.getElementById("montant-display");
    const value = document.getElementById("montant-value");

    if (!display || !value) return;

    let calculatedMontant = montant;

    if (!calculatedMontant) {
      // Get montant from current tab
      if (this.currentTab === "DEPLACEMENT") {
        const distanceValue = (
          document.getElementById("distance-value") as HTMLInputElement
        )?.value;
        if (distanceValue) {
          calculatedMontant = parseFloat(distanceValue) * this.tarifKm;
        }
      } else if (this.currentTab === "REPAS") {
        const montantInput = (
          document.getElementById("montant-repas") as HTMLInputElement
        )?.value;
        if (montantInput) {
          calculatedMontant = parseFloat(montantInput);
        }
      } else if (this.currentTab === "HEBERGEMENT") {
        const montantInput = (
          document.getElementById("montant-hebergement") as HTMLInputElement
        )?.value;
        if (montantInput) {
          calculatedMontant = parseFloat(montantInput);
        }
      }
    }

    if (calculatedMontant && calculatedMontant > 0) {
      display.classList.remove("hidden");
      value.textContent = `${calculatedMontant.toFixed(2)} €`;
    } else {
      display.classList.add("hidden");
    }
  }

  private updateProgress(): void {
    // Récupérer uniquement le container du tab actif
    const activeTab = document.querySelector(
      `.tab-content[data-type="${this.currentTab}"]`
    ) as HTMLElement;
    if (!activeTab) return;

    // Ne compter que les inputs du tab actif
    const inputs = Array.from(
      activeTab.querySelectorAll("input:required, select:required")
    );

    const filled = inputs.filter((input) => {
      if (input instanceof HTMLInputElement) {
        if (input.type === "file") {
          return input.files && input.files.length > 0;
        }
        return input.value.trim() !== "";
      }
      if (input instanceof HTMLSelectElement) {
        return input.value !== "";
      }
      return false;
    });

    // Le textarea description est optionnel, ne pas le compter
    const progress =
      inputs.length > 0 ? (filled.length / inputs.length) * 100 : 0;

    const progressBar = document.getElementById("progress-bar");
    const progressPercent = document.getElementById("completion-percent");

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    if (progressPercent) {
      progressPercent.textContent = `${Math.round(progress)}%`;
    }
  }

  private async handleSubmit(): Promise<void> {
    const form = document.getElementById("frais-form") as HTMLFormElement;
    if (!form || !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try {
      const formData = new FormData(form);

      if (this.currentTab === "DEPLACEMENT") {
        await this.formSubmitHandler.submitDeplacement(formData);
      } else if (this.currentTab === "REPAS") {
        await this.formSubmitHandler.submitRepas(formData);
      } else if (this.currentTab === "HEBERGEMENT") {
        await this.formSubmitHandler.submitHebergement(formData);
      }
    } catch (error) {
      console.error("Erreur création frais:", error);
      // L'erreur est déjà affichée par le handler
    }
  }

  private async renderHistory(): Promise<void> {
    const container = document.getElementById("recent-history");
    if (!container) return;

    if (this.recentFrais.length === 0) {
      container.innerHTML =
        '<p class="text-sm text-muted-foreground">Aucun frais récent</p>';
      return;
    }

    const itemPromises = this.recentFrais.map((frais, index) =>
      this.renderHistoryItem(frais, index)
    );
    const items = await Promise.all(itemPromises);
    container.innerHTML = items.join("");
  }

  private async renderHistoryItem(
    frais: RecentFrais,
    index: number
  ): Promise<string> {
    const borderClass = index < this.recentFrais.length - 1 ? "border-b" : "";

    return await renderTemplate(
      "/src/frontend/templates/components/expenses/new-expense-history-item.tpl.html",
      {
        libelle: frais.libelle,
        date: frais.date,
        borderClass,
      }
    );
  }
}
