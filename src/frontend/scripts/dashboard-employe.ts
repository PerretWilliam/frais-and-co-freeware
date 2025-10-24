import { AuthManager } from "./auth";
import { BaseDashboard } from "./base-dashboard";
import { FraisService } from "../services/frais.service";

// Vérifier l'authentification
if (!AuthManager.requireAuth()) {
  throw new Error("User not authenticated");
}

const user = AuthManager.getUser();
if (!user) {
  window.location.href = "/src/frontend/pages/login.html";
  throw new Error("No user found");
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
    case "nouveau-frais":
      window.location.href = "/src/frontend/pages/nouveau-frais.html";
      break;
    case "mes-frais":
      window.location.href = "/src/frontend/pages/mes-frais.html";
      break;
    case "aide":
      window.location.href = "/src/frontend/pages/aide.html";
      break;
    default:
      console.log("Page not implemented yet:", page);
  }
}

class EmployeeDashboard extends BaseDashboard {
  protected async loadData(): Promise<void> {
    if (!this.user.id_utilisateur) {
      throw new Error("User ID not found");
    }

    // Get user expenses
    const response = await FraisService.getByUser(this.user.id_utilisateur);

    if (!response.success || !response.data) {
      throw new Error("Failed to load expenses data");
    }

    const frais = response.data as Frais[];

    // Calculate stats
    const fraisEnAttente = frais.filter((f) => f.statut === "EnCours").length;
    const montantTotal = frais.reduce((sum, f) => sum + f.montant, 0);
    const fraisValides = frais.filter((f) => f.statut === "Paye").length;
    const dernierFrais = frais.find((f) => f.statut === "Paye");

    // Update stats
    this.updateTextContent("stat-en-attente", fraisEnAttente);
    this.updateTextContent(
      "stat-total-mois",
      this.formatCurrency(montantTotal)
    );
    this.updateTextContent("stat-valides", fraisValides);

    if (dernierFrais) {
      this.updateTextContent(
        "stat-dernier",
        this.formatCurrency(dernierFrais.montant)
      );
      this.updateTextContent(
        "stat-dernier-date",
        this.formatDate(dernierFrais.date)
      );
    }

    const progress =
      frais.length > 0 ? (fraisEnAttente / frais.length) * 100 : 0;
    this.updateProgress("progress-en-attente", progress);

    // Update recent expenses with Handlebars template
    await this.renderList(
      "recent-expenses",
      "/src/frontend/templates/expense-item.tpl.html",
      frais.slice(0, 4),
      (f: Frais) => {
        const statusConfig = this.getStatusConfig(f.statut);
        return {
          lieu: f.lieu,
          dateFormatted: this.formatDate(f.date),
          statusLabel: statusConfig.label,
          statusClass: statusConfig.class,
          montantFormatted: this.formatCurrency(f.montant),
        };
      },
      "Aucun frais récent"
    );

    // Create charts
    this.createMonthlyChart();
    this.createTypeChart();
  }

  private createMonthlyChart(): void {
    const monthlyData = [
      { month: "Juin", montant: 850 },
      { month: "Juillet", montant: 1200 },
      { month: "Août", montant: 950 },
      { month: "Sept", montant: 1450 },
      { month: "Oct", montant: 886 },
    ];

    this.createChart(
      "monthly-chart",
      "line",
      monthlyData.map((d) => d.month),
      [
        {
          label: "Montant (€)",
          data: monthlyData.map((d) => d.montant),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
      {
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      }
    );
  }

  private createTypeChart(): void {
    const typeData = [
      { name: "Déplacement", value: 618 },
      { name: "Repas", value: 28.5 },
      { name: "Hébergement", value: 240 },
    ];

    this.createChart(
      "type-chart",
      "doughnut",
      typeData.map((d) => d.name),
      [
        {
          data: typeData.map((d) => d.value),
          backgroundColor: [
            "rgb(59, 130, 246)",
            "rgb(16, 185, 129)",
            "rgb(245, 158, 11)",
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
const dashboard = new EmployeeDashboard(user, "dashboard", navigate);
void dashboard.init();

// Add event listeners
const nouveauFraisBtn = document.getElementById("nouveau-frais-btn");
if (nouveauFraisBtn) {
  nouveauFraisBtn.addEventListener("click", () => navigate("nouveau-frais"));
}

const voirTousBtn = document.getElementById("voir-tous-btn");
if (voirTousBtn) {
  voirTousBtn.addEventListener("click", () => navigate("mes-frais"));
}
