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

      // Sort by date (most recent first) and render recent validations
      const sortedFrais = [...frais].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
      await this.renderRecentValidations(sortedFrais.slice(0, 5));

      // Create charts
      this.createValidationChart(frais);
      this.createTypeChart(frais);
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

    container.innerHTML = await renderTemplate(
      "/src/frontend/templates/alert-pending-frais.tpl.html",
      {
        count: count,
      }
    );
    lucide.createIcons();
  }

  private async renderRecentValidations(frais: Frais[]): Promise<void> {
    const container = document.getElementById("recent-validations");
    if (!container) return;

    if (frais.length === 0) {
      container.innerHTML = await renderTemplate(
        "/src/frontend/templates/empty-message.tpl.html",
        {
          message: "Aucune validation récente",
        }
      );
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

        return await renderTemplate(
          "/src/frontend/templates/validation-item.tpl.html",
          {
            dotClass: statusConfig.dotClass,
            lieu: f.lieu,
            montant: this.formatCurrency(f.montant),
            statusClass: statusConfig.class,
            statusLabel: actionLabel,
            date: this.formatDate(f.date),
          }
        );
      })
    );

    container.innerHTML = items.join("");
    lucide.createIcons();
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

  private createValidationChart(frais: Frais[]): void {
    const canvas = document.getElementById(
      "validation-chart"
    ) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts.has("validation-chart")) {
      this.charts.get("validation-chart")?.destroy();
    }

    // Grouper les frais par mois et statut
    const monthData: Record<string, { valides: number; refuses: number }> = {};
    const now = new Date();

    // Initialiser les 5 derniers mois
    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });
      monthData[monthKey] = { valides: 0, refuses: 0 };
    }

    // Compter les frais validés et refusés par mois
    frais.forEach((f) => {
      if (f.date) {
        const fraisDate = new Date(f.date);
        const monthKey = fraisDate.toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        });
        if (monthKey in monthData) {
          if (f.statut === "Paye") {
            monthData[monthKey].valides++;
          } else if (f.statut === "Refuse") {
            monthData[monthKey].refuses++;
          }
        }
      }
    });

    const validationData = Object.entries(monthData).map(([month, counts]) => ({
      month,
      valides: counts.valides,
      refuses: counts.refuses,
    }));

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

  private createTypeChart(frais: Frais[]): void {
    const canvas = document.getElementById("type-chart") as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts.has("type-chart")) {
      this.charts.get("type-chart")?.destroy();
    }

    // Calculer les montants par statut
    const statusMontants: Record<string, number> = {
      Payés: 0,
      "En paiement": 0,
      "En attente": 0,
    };

    frais.forEach((f) => {
      const montant = parseFloat(String(f.montant || 0));
      if (isNaN(montant)) return;

      if (f.statut === "Paye") {
        statusMontants["Payés"] += montant;
      } else if (f.statut === "PaiementEnCours") {
        statusMontants["En paiement"] += montant;
      } else if (f.statut === "EnCours") {
        statusMontants["En attente"] += montant;
      }
    });

    const typeData = [
      { type: "Payés", montant: statusMontants["Payés"] },
      { type: "En paiement", montant: statusMontants["En paiement"] },
      { type: "En attente", montant: statusMontants["En attente"] },
    ];

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: typeData.map((d) => d.type),
        datasets: [
          {
            label: "Montant (€)",
            data: typeData.map((d) => d.montant),
            backgroundColor: [
              "rgb(34, 197, 94)", // Vert pour Payés
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
