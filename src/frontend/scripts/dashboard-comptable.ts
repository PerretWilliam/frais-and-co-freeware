import { AuthManager } from "./auth";
import { BaseDashboard } from "./base-dashboard";
import { FraisService } from "../services/frais.service";

// Vérifier l'authentification
if (!AuthManager.requireAuth()) {
  throw new Error("User not authenticated");
}

const user = AuthManager.getUser();
if (!user || user.role !== "comptable") {
  window.location.href = "/src/frontend/pages/login.html";
  throw new Error("Access denied");
}

interface Frais {
  id_frais?: number;
  lieu: string;
  date: Date | string;
  statut: string;
  montant: number;
}

// Navigation handler
function navigate(page: string): void {
  console.log("Navigating to:", page);
  switch (page) {
    case "validation-queue":
      window.location.href = "/src/frontend/pages/validation.html";
      break;
    case "all-expenses":
      window.location.href = "/src/frontend/pages/tous-frais.html";
      break;
    case "rapport":
      window.location.href = "/src/frontend/pages/rapports.html";
      break;
    case "aide":
      window.location.href = "/src/frontend/pages/aide.html";
      break;
    default:
      console.log("Page not implemented yet:", page);
  }
}

class AccountantDashboard extends BaseDashboard {
  protected async loadData(): Promise<void> {
    // Get all expenses
    const response = await FraisService.getAll();

    if (!response.success || !response.data) {
      throw new Error("Failed to load expenses data");
    }

    const allFrais = response.data as Frais[];

    // Calculate stats
    const fraisEnAttente = allFrais.filter((f) => f.statut === "EnCours");
    const montantEnAttente = fraisEnAttente.reduce(
      (sum, f) =>
        sum +
        (typeof f.montant === "string" ? parseFloat(f.montant) : f.montant),
      0
    );

    const fraisCeMois = this.filterCurrentMonth(allFrais);
    const fraisValides = fraisCeMois.filter((f) => f.statut === "Paye").length;
    const fraisRefuses = fraisCeMois.filter(
      (f) => f.statut === "Refuse"
    ).length;

    // Update stats
    this.updateTextContent("stat-en-attente", fraisEnAttente.length);
    this.updateTextContent(
      "stat-montant-attente",
      this.formatCurrency(montantEnAttente)
    );
    this.updateTextContent("stat-valides", fraisValides);
    this.updateTextContent("stat-refuses", fraisRefuses);

    const progressEnAttente =
      allFrais.length > 0 ? (fraisEnAttente.length / allFrais.length) * 100 : 0;
    this.updateProgress("progress-en-attente", progressEnAttente);

    const progressValides =
      fraisCeMois.length > 0 ? (fraisValides / fraisCeMois.length) * 100 : 0;
    this.updateProgress("progress-valides", progressValides);

    // Update pending expenses list with Handlebars template
    await this.renderList(
      "pending-expenses",
      "/src/frontend/templates/pending-expense.tpl.html",
      fraisEnAttente.slice(0, 5),
      (f: Frais) => {
        const statusConfig = this.getStatusConfig(f.statut);
        return {
          id: f.id_frais,
          lieu: f.lieu,
          dateFormatted: this.formatDate(f.date),
          statusLabel: statusConfig.label,
          statusClass: statusConfig.class,
          montantFormatted: this.formatCurrency(f.montant),
        };
      },
      "Aucun frais en attente de validation"
    );

    // Add event listeners for validate/reject buttons
    this.attachValidationButtons();

    // Create charts
    this.createValidationChart();
    this.createStatusChart(allFrais);
  }

  private attachValidationButtons(): void {
    const container = document.getElementById("pending-expenses");
    if (!container) return;

    // Validate buttons
    container.querySelectorAll(".validate-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = (e.target as HTMLElement).getAttribute("data-id");
        if (id) {
          this.handleValidate(parseInt(id));
        }
      });
    });

    // Reject buttons
    container.querySelectorAll(".reject-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = (e.target as HTMLElement).getAttribute("data-id");
        if (id) {
          this.handleReject(parseInt(id));
        }
      });
    });
  }

  private async handleValidate(id: number): Promise<void> {
    console.log("Validating expense:", id);
    // TODO: Implement validation logic with FraisService
    await this.loadData();
  }

  private async handleReject(id: number): Promise<void> {
    console.log("Rejecting expense:", id);
    // TODO: Implement rejection logic with FraisService
    await this.loadData();
  }

  private createValidationChart(): void {
    const validationData = [
      { month: "Juin", valides: 45, refuses: 3 },
      { month: "Juillet", valides: 52, refuses: 5 },
      { month: "Août", valides: 38, refuses: 2 },
      { month: "Sept", valides: 61, refuses: 4 },
      { month: "Oct", valides: 48, refuses: 3 },
    ];

    this.createChart(
      "validation-chart",
      "bar",
      validationData.map((d) => d.month),
      [
        {
          label: "Validés",
          data: validationData.map((d) => d.valides),
          backgroundColor: "rgba(16, 185, 129, 0.8)",
        },
        {
          label: "Refusés",
          data: validationData.map((d) => d.refuses),
          backgroundColor: "rgba(239, 68, 68, 0.8)",
        },
      ],
      {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      }
    );
  }

  private createStatusChart(frais: Frais[]): void {
    const statusCounts = {
      EnCours: frais.filter((f) => f.statut === "EnCours").length,
      Paye: frais.filter((f) => f.statut === "Paye").length,
      Refuse: frais.filter((f) => f.statut === "Refuse").length,
      PaiementEnCours: frais.filter((f) => f.statut === "PaiementEnCours")
        .length,
    };

    this.createChart(
      "status-chart",
      "doughnut",
      ["En cours", "Payé", "Refusé", "Paiement en cours"],
      [
        {
          data: [
            statusCounts["EnCours"],
            statusCounts["Paye"],
            statusCounts["Refuse"],
            statusCounts["PaiementEnCours"],
          ],
          backgroundColor: [
            "rgb(245, 158, 11)",
            "rgb(16, 185, 129)",
            "rgb(239, 68, 68)",
            "rgb(59, 130, 246)",
          ],
        },
      ],
      {
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      }
    );
  }
}

// Initialize dashboard
const dashboard = new AccountantDashboard(user, "dashboard", navigate);
void dashboard.init();

// Add event listeners for quick actions
const validationQueueBtn = document.getElementById("validation-queue-btn");
if (validationQueueBtn) {
  validationQueueBtn.addEventListener("click", () =>
    navigate("validation-queue")
  );
}

const allExpensesBtn = document.getElementById("all-expenses-btn");
if (allExpensesBtn) {
  allExpensesBtn.addEventListener("click", () => navigate("all-expenses"));
}

const rapportBtn = document.getElementById("rapport-btn");
if (rapportBtn) {
  rapportBtn.addEventListener("click", () => navigate("rapport"));
}

const aideComptableBtn = document.getElementById("aide-comptable-btn");
if (aideComptableBtn) {
  aideComptableBtn.addEventListener("click", () => navigate("aide"));
}

const voirTousValidationBtn = document.getElementById(
  "voir-tous-validation-btn"
);
if (voirTousValidationBtn) {
  voirTousValidationBtn.addEventListener("click", () =>
    navigate("validation-queue")
  );
}
