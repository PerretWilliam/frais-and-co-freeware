import { AuthManager } from "../auth";
import { FraisService } from "../../services/frais.service";
import { Frais } from "../../types/api.types";
import { renderTemplate } from "../template-helper";

declare const lucide: {
  createIcons: () => void;
};

declare const Chart: {
  new (
    ctx: CanvasRenderingContext2D | HTMLCanvasElement,
    config: Record<string, unknown>
  ): {
    destroy: () => void;
  };
};

/**
 * Dashboard Employé Page
 */
export class DashboardEmployePage {
  private charts: Map<string, { destroy: () => void }> = new Map();

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const user = AuthManager.getUser();
    if (!user?.id_utilisateur) return;

    // Render page HTML using template
    const html = await renderTemplate(
      "/src/frontend/templates/dashboard-employe.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    // Load data
    await this.loadData(user.id_utilisateur);

    // Initialize icons
    lucide.createIcons();
  }

  private async loadData(userId: number): Promise<void> {
    try {
      const response = await FraisService.getByUser(userId);

      if (!response.success || !response.data) {
        throw new Error("Failed to load expenses data");
      }

      const frais = response.data as Frais[];

      // Calculate stats
      const fraisEnAttente = frais.filter((f) => f.statut === "EnCours").length;
      const montantTotal = frais.reduce((sum, f) => sum + (f.montant || 0), 0);
      const fraisValides = frais.filter((f) => f.statut === "Paye").length;
      const dernierFrais = frais.find((f) => f.statut === "Paye");

      // Update stats
      this.updateTextContent("stat-en-attente", fraisEnAttente.toString());
      this.updateTextContent(
        "stat-total-mois",
        this.formatCurrency(montantTotal)
      );
      this.updateTextContent("stat-valides", fraisValides.toString());

      if (dernierFrais) {
        this.updateTextContent(
          "stat-dernier",
          this.formatCurrency(dernierFrais.montant || 0)
        );
      }

      // Update progress bar
      const progress =
        frais.length > 0 ? (fraisEnAttente / frais.length) * 100 : 0;
      this.updateProgress("progress-en-attente", progress);

      // Render recent expenses list
      const sortedFrais = [...frais].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
      await this.renderRecentExpenses(sortedFrais.slice(0, 4));

      // Create charts
      this.createMonthlyChart(frais);
      this.createTypeChart(frais);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }

  private updateTextContent(elementId: string, content: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = content;
    }
  }

  private updateProgress(elementId: string, percentage: number): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.width = `${Math.min(Math.max(percentage, 0), 100)}%`;
    }
  }

  private formatCurrency(amount: number | string | null | undefined): string {
    const numAmount =
      typeof amount === "number" ? amount : parseFloat(String(amount || 0));
    return `${numAmount.toFixed(2)} €`;
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  private getStatusConfig(statut: string): { label: string; class: string } {
    const configs: Record<string, { label: string; class: string }> = {
      Brouillon: {
        label: "Brouillon",
        class: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
      EnCours: {
        label: "En cours",
        class: "bg-chart-pending/20 text-chart-pending",
      },
      PaiementEnCours: {
        label: "Paiement en cours",
        class: "bg-info/20 text-info",
      },
      Paye: {
        label: "Payé",
        class: "bg-chart-validated/20 text-chart-validated",
      },
      Refuse: {
        label: "Refusé",
        class: "bg-chart-refused/20 text-chart-refused",
      },
    };

    return configs[statut] || configs.Brouillon;
  }

  private async renderRecentExpenses(frais: Frais[]): Promise<void> {
    const container = document.getElementById("recent-expenses");
    if (!container) return;

    if (frais.length === 0) {
      const emptyHtml = await renderTemplate(
        "/src/frontend/templates/empty-state.tpl.html",
        {
          message: "Aucun frais récent",
        }
      );
      container.innerHTML = emptyHtml;
      return;
    }

    const expensesHtml = await Promise.all(
      frais.map(async (f) => {
        const statusConfig = this.getStatusConfig(f.statut);
        return await renderTemplate(
          "/src/frontend/templates/recent-expense-item.tpl.html",
          {
            lieu: f.lieu,
            date: this.formatDate(f.date),
            montant: this.formatCurrency(f.montant || 0),
            statusClass: statusConfig.class,
            statusLabel: statusConfig.label,
          }
        );
      })
    );

    container.innerHTML = expensesHtml.join("");
    lucide.createIcons();
  }

  private createMonthlyChart(frais: Frais[]): void {
    const canvas = document.getElementById(
      "monthly-chart"
    ) as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy existing chart
    if (this.charts.has("monthly-chart")) {
      this.charts.get("monthly-chart")?.destroy();
    }

    // Grouper les frais par mois
    const monthMontants: Record<string, number> = {};
    const now = new Date();

    // Initialiser les 5 derniers mois
    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });
      monthMontants[monthKey] = 0;
    }

    // Calculer les montants par mois
    frais.forEach((f) => {
      if (f.date) {
        const fraisDate = new Date(f.date);
        const monthKey = fraisDate.toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        });
        if (monthKey in monthMontants) {
          const montant = parseFloat(String(f.montant || 0));
          if (!isNaN(montant)) {
            monthMontants[monthKey] += montant;
          }
        }
      }
    });

    const monthlyData = Object.entries(monthMontants).map(
      ([month, montant]) => ({
        month,
        montant,
      })
    );

    const chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: monthlyData.map((d) => d.month),
        datasets: [
          {
            label: "Montant (€)",
            data: monthlyData.map((d) => d.montant),
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
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
      },
    });

    this.charts.set("monthly-chart", chart);
  }

  private createTypeChart(frais: Frais[]): void {
    const canvas = document.getElementById("type-chart") as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy existing chart
    if (this.charts.has("type-chart")) {
      this.charts.get("type-chart")?.destroy();
    }

    // Calculer les montants par statut
    const statusMontants: Record<string, number> = {
      Payé: 0,
      "En paiement": 0,
      "En attente": 0,
    };

    frais.forEach((f) => {
      const montant = parseFloat(String(f.montant || 0));
      if (isNaN(montant)) return;

      if (f.statut === "Paye") {
        statusMontants["Payé"] += montant;
      } else if (f.statut === "PaiementEnCours") {
        statusMontants["En paiement"] += montant;
      } else if (f.statut === "EnCours") {
        statusMontants["En attente"] += montant;
      }
    });

    const chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Payé (€)", "En paiement (€)", "En attente (€)"],
        datasets: [
          {
            data: [
              statusMontants["Payé"],
              statusMontants["En paiement"],
              statusMontants["En attente"],
            ],
            backgroundColor: [
              "rgb(34, 197, 94)", // Vert pour Payé
              "rgb(59, 130, 246)", // Bleu pour En paiement
              "rgb(251, 146, 60)", // Orange pour En attente
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });

    this.charts.set("type-chart", chart);
  }
}
