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
 * Dashboard Comptable Page
 */
export class DashboardComptablePage {
  private charts: Map<string, { destroy: () => void }> = new Map();

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const html = await renderTemplate(
      "/src/frontend/templates/dashboard-comptable.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    await this.loadData();
    lucide.createIcons();
  }

  private async loadData(): Promise<void> {
    try {
      // Récupérer tous les frais
      const response = await FraisService.getAll();

      if (!response.success || !response.data) {
        throw new Error("Failed to load expenses data");
      }

      const frais = response.data as Frais[];

      // Calculate stats
      const fraisEnAttente = frais.filter((f) => f.statut === "EnCours").length;
      const fraisEnCours = frais.filter(
        (f) => f.statut === "PaiementEnCours"
      ).length;
      const fraisPayes = frais.filter((f) => f.statut === "Paye").length;

      // Calculer le montant total avec vérification
      const montantTotal = frais.reduce((sum, f) => {
        const montant = parseFloat(String(f.montant || 0));
        return sum + (isNaN(montant) ? 0 : montant);
      }, 0);

      // Nombre d'employés uniques
      const employesUniques = new Set(
        frais.map((f) => f.id_utilisateur).filter((id) => id)
      ).size;
      const montantMoyen =
        employesUniques > 0 ? montantTotal / employesUniques : 0;

      const tauxValidation =
        frais.length > 0 ? (fraisPayes / frais.length) * 100 : 0;

      // Update stats
      this.updateTextContent("stat-en-attente", fraisEnAttente.toString());
      this.updateTextContent("stat-en-cours", fraisEnCours.toString());
      this.updateTextContent("stat-moyen", `${montantMoyen.toFixed(2)} €`);
      this.updateTextContent("stat-taux", `${tauxValidation.toFixed(0)}%`);

      // Quick actions
      this.updateTextContent("quick-en-attente", fraisEnAttente.toString());
      this.updateTextContent("quick-en-cours", fraisEnCours.toString());
      this.updateTextContent("quick-payes", fraisPayes.toString());

      // Show alert if pending expenses
      if (fraisEnAttente > 0) {
        await this.showAlert(fraisEnAttente);
      }

      // Render recent validations
      await this.renderRecentValidations(frais.slice(0, 5));

      // Create charts
      this.createValidationChart();
      this.createTypeChart();
    } catch (error) {
      console.error("Error loading comptable dashboard:", error);
    }
  }

  private updateTextContent(elementId: string, content: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = content;
    }
  }

  private async showAlert(count: number): Promise<void> {
    const container = document.getElementById("alert-container");
    if (!container) return;

    container.innerHTML = await renderTemplate("alert-pending-frais", {
      count: count,
    });
    lucide.createIcons();
  }

  private async renderRecentValidations(frais: Frais[]): Promise<void> {
    const container = document.getElementById("recent-validations");
    if (!container) return;

    if (frais.length === 0) {
      container.innerHTML = await renderTemplate("empty-message", {
        message: "Aucune validation récente",
      });
      return;
    }

    const items = await Promise.all(
      frais.map(async (f) => {
        const statusConfig = this.getStatusConfig(f.statut);
        const actionLabel =
          f.statut === "Paye"
            ? "Validation"
            : f.statut === "Refuse"
              ? "Refus"
              : "En cours";

        return await renderTemplate("validation-item", {
          dotClass: statusConfig.dotClass,
          lieu: f.lieu,
          montant: this.formatCurrency(f.montant),
          statusClass: statusConfig.class,
          statusLabel: actionLabel,
          date: this.formatDate(f.date),
        });
      })
    );

    container.innerHTML = items.join("");
  }

  private getStatusConfig(statut: string): {
    label: string;
    class: string;
    dotClass: string;
  } {
    const configs: Record<
      string,
      { label: string; class: string; dotClass: string }
    > = {
      Brouillon: {
        label: "Brouillon",
        class: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        dotClass: "bg-gray-400",
      },
      EnCours: {
        label: "En cours",
        class: "bg-chart-pending/20 text-chart-pending",
        dotClass: "bg-chart-pending",
      },
      PaiementEnCours: {
        label: "Paiement en cours",
        class: "bg-info/20 text-info",
        dotClass: "bg-info",
      },
      Paye: {
        label: "Payé",
        class: "bg-chart-validated/20 text-chart-validated",
        dotClass: "bg-chart-validated",
      },
      Refuse: {
        label: "Refusé",
        class: "bg-chart-refused/20 text-chart-refused",
        dotClass: "bg-chart-refused",
      },
    };

    return configs[statut] || configs.Brouillon;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  private formatCurrency(amount: number | string | null | undefined): string {
    const numAmount =
      typeof amount === "number" ? amount : parseFloat(String(amount || 0));
    return `${numAmount.toFixed(2)} €`;
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffTime = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    }
  }

  private createValidationChart(): void {
    const canvas = document.getElementById(
      "validation-chart"
    ) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts.has("validation-chart")) {
      this.charts.get("validation-chart")?.destroy();
    }

    const validationData = [
      { month: "Juin", valides: 45, refuses: 2 },
      { month: "Juillet", valides: 52, refuses: 1 },
      { month: "Août", valides: 38, refuses: 3 },
      { month: "Sept", valides: 61, refuses: 2 },
      { month: "Oct", valides: 28, refuses: 1 },
    ];

    const chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: validationData.map((d) => d.month),
        datasets: [
          {
            label: "Validés",
            data: validationData.map((d) => d.valides),
            borderColor: "rgb(34, 197, 94)",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            tension: 0.4,
          },
          {
            label: "Refusés",
            data: validationData.map((d) => d.refuses),
            borderColor: "rgb(239, 68, 68)",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: "bottom",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    this.charts.set("validation-chart", chart);
  }

  private createTypeChart(): void {
    const canvas = document.getElementById("type-chart") as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts.has("type-chart")) {
      this.charts.get("type-chart")?.destroy();
    }

    const typeData = [
      { type: "Déplacement", montant: 15420 },
      { type: "Repas", montant: 4250 },
      { type: "Hébergement", montant: 8900 },
    ];

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: typeData.map((d) => d.type),
        datasets: [
          {
            label: "Montant (€)",
            data: typeData.map((d) => d.montant),
            backgroundColor: "rgb(59, 130, 246)",
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

    this.charts.set("type-chart", chart);
  }
}
