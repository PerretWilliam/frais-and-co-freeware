import { UtilisateurService } from "../../services/utilisateur.service";
import { FraisService } from "../../services/frais.service";
import { Utilisateur, Frais } from "../../types/api.types";
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
 * Dashboard Admin Page
 */
export class DashboardAdminPage {
  private charts: Map<string, { destroy: () => void }> = new Map();

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const html = await renderTemplate(
      "/src/frontend/templates/dashboard-admin.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    await this.loadData();
    lucide.createIcons();
  }

  private async loadData(): Promise<void> {
    try {
      // Charger les utilisateurs
      const usersResponse = await UtilisateurService.getAll();
      const pendingResponse = await UtilisateurService.getPending();

      // Charger les frais
      const fraisResponse = await FraisService.getAll();

      if (!usersResponse.success || !fraisResponse.success) {
        throw new Error("Failed to load data");
      }

      const users = usersResponse.data as Utilisateur[];
      const pendingUsers = pendingResponse.success
        ? (pendingResponse.data as Utilisateur[])
        : [];
      const frais = fraisResponse.data as Frais[];

      // Calculate stats
      const totalUsers = users.length;
      const totalPending = pendingUsers.length;
      const totalFrais = frais.length;
      const montantTotal = frais.reduce((sum, f) => sum + (f.montant || 0), 0);

      // Update stats
      this.updateTextContent("stat-total-users", totalUsers.toString());
      this.updateTextContent("stat-pending-users", totalPending.toString());
      this.updateTextContent("stat-total-frais", totalFrais.toString());
      this.updateTextContent(
        "stat-total-montant",
        this.formatCurrency(montantTotal)
      );

      // Show alert if pending users
      if (totalPending > 0) {
        await this.showAlert(totalPending);
      }

      // Render recent users
      await this.renderRecentUsers(users.slice(0, 5));

      // Create charts
      this.createRoleChart(users);
      this.createActivityChart();
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
    }
  }

  private updateTextContent(elementId: string, content: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = content;
    }
  }

  private formatCurrency(amount: number | string | null | undefined): string {
    const numAmount =
      typeof amount === "number" ? amount : parseFloat(String(amount || 0));
    return `${numAmount.toFixed(2)} €`;
  }

  private async showAlert(count: number): Promise<void> {
    const container = document.getElementById("alert-container");
    if (!container) return;

    container.innerHTML = await renderTemplate("alert-pending-users", {
      count: count,
    });
    lucide.createIcons();
  }

  private async renderRecentUsers(users: Utilisateur[]): Promise<void> {
    const container = document.getElementById("recent-users");
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = await renderTemplate("empty-message", {
        message: "Aucun utilisateur",
      });
      return;
    }

    const roleLabels: Record<string, string> = {
      employe: "Employé",
      comptable: "Comptable",
      admin: "Administrateur",
    };

    const roleColors: Record<string, string> = {
      employe: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      comptable:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      admin:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };

    const items = await Promise.all(
      users.map(async (u) => {
        const roleLabel = roleLabels[u.role] || u.role;
        const roleColor = roleColors[u.role] || roleColors.employe;
        const statusClass = u.valide
          ? "bg-chart-validated/20 text-chart-validated"
          : "bg-chart-pending/20 text-chart-pending";
        const statusLabel = u.valide ? "Validé" : "En attente";

        return await renderTemplate("user-list-item", {
          initials: `${u.prenom[0]}${u.nom_utilisateur[0]}`,
          fullname: `${u.prenom} ${u.nom_utilisateur}`,
          email: u.email,
          roleClass: roleColor,
          roleLabel: roleLabel,
          statusClass: statusClass,
          statusLabel: statusLabel,
        });
      })
    );

    container.innerHTML = items.join("");
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  private createRoleChart(users: Utilisateur[]): void {
    const canvas = document.getElementById("role-chart") as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts.has("role-chart")) {
      this.charts.get("role-chart")?.destroy();
    }

    const roleCounts = {
      employe: users.filter((u) => u.role === "employe").length,
      comptable: users.filter((u) => u.role === "comptable").length,
      admin: users.filter((u) => u.role === "admin").length,
    };

    const chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Employés", "Comptables", "Administrateurs"],
        datasets: [
          {
            data: [roleCounts.employe, roleCounts.comptable, roleCounts.admin],
            backgroundColor: [
              "rgb(59, 130, 246)",
              "rgb(16, 185, 129)",
              "rgb(168, 85, 247)",
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

    this.charts.set("role-chart", chart);
  }

  private createActivityChart(): void {
    const canvas = document.getElementById(
      "activity-chart"
    ) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts.has("activity-chart")) {
      this.charts.get("activity-chart")?.destroy();
    }

    const activityData = [
      { month: "Juin", count: 89 },
      { month: "Juillet", count: 112 },
      { month: "Août", count: 95 },
      { month: "Sept", count: 134 },
      { month: "Oct", count: 67 },
    ];

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: activityData.map((d) => d.month),
        datasets: [
          {
            label: "Nombre de frais",
            data: activityData.map((d) => d.count),
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

    this.charts.set("activity-chart", chart);
  }
}
