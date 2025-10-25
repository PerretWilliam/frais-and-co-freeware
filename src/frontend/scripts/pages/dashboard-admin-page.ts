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

// Déclaration globale pour accès depuis les boutons
declare global {
  interface Window {
    dashboardAdminPage: DashboardAdminPage;
  }
}

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

    // Rendre l'instance accessible globalement
    window.dashboardAdminPage = this;

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

      // Sort users by date_creation (most recent first) and take top 5
      const sortedUsers = [...users].sort((a, b) => {
        const dateA = a.date_creation ? new Date(a.date_creation).getTime() : 0;
        const dateB = b.date_creation ? new Date(b.date_creation).getTime() : 0;
        return dateB - dateA; // Descending order
      });

      // Render recent users
      await this.renderRecentUsers(sortedUsers.slice(0, 5));

      // Create charts
      this.createRoleChart(users);
      this.createActivityChart(frais);
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

    container.innerHTML = await renderTemplate(
      "/src/frontend/templates/alert-pending-users.tpl.html",
      {
        count: count,
      }
    );
    lucide.createIcons();
  }

  private async renderRecentUsers(users: Utilisateur[]): Promise<void> {
    const container = document.getElementById("recent-users");
    if (!container) {
      console.error("Container 'recent-users' not found!");
      return;
    }

    if (users.length === 0) {
      container.innerHTML = await renderTemplate(
        "/src/frontend/templates/empty-message.tpl.html",
        {
          message: "Aucun utilisateur",
        }
      );
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

        // Format date creation
        const dateCreation = this.formatDateCreation(u.date_creation);

        // Generate action buttons using templates
        let actionButtons = "";
        if (u.valide) {
          actionButtons = await renderTemplate(
            "/src/frontend/templates/user-validated-badge.tpl.html",
            {}
          );
        } else {
          actionButtons = await renderTemplate(
            "/src/frontend/templates/user-action-buttons.tpl.html",
            {
              userId: u.id_utilisateur,
            }
          );
        }

        const renderedItem = await renderTemplate(
          "/src/frontend/templates/user-list-item.tpl.html",
          {
            initials: `${u.prenom[0]}${u.nom_utilisateur[0]}`,
            fullname: `${u.prenom} ${u.nom_utilisateur}`,
            email: u.email,
            roleClass: roleColor,
            roleLabel: roleLabel,
            dateCreation: dateCreation,
            actionButtonsHtml: actionButtons,
          }
        );

        return renderedItem;
      })
    );

    const finalHTML = items.join("");

    container.innerHTML = finalHTML;

    lucide.createIcons();
  }

  private formatDateCreation(dateCreation: string | Date | undefined): string {
    if (!dateCreation) return "Date inconnue";

    const date = new Date(dateCreation);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return "aujourd'hui";
    } else if (diffDays === 1) {
      return "il y a 1 jour";
    } else if (diffDays < 7) {
      return `il y a ${diffDays} jours`;
    } else if (diffDays < 14) {
      return "il y a 1 semaine";
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `il y a ${weeks} semaines`;
    } else if (diffDays < 60) {
      return "il y a 1 mois";
    } else {
      const months = Math.floor(diffDays / 30);
      return `il y a ${months} mois`;
    }
  }

  public async validateUser(userId: number): Promise<void> {
    try {
      const response = await UtilisateurService.validate(userId);
      if (response.success) {
        await this.loadData();
      } else {
        console.error("Failed to validate user:", response.error);
        alert("Erreur lors de la validation de l'utilisateur");
      }
    } catch (error) {
      console.error("Error validating user:", error);
      alert("Erreur lors de la validation de l'utilisateur");
    }
  }

  public async rejectUser(userId: number): Promise<void> {
    if (!confirm("Êtes-vous sûr de vouloir refuser cet utilisateur ?")) {
      return;
    }

    try {
      const response = await UtilisateurService.delete(userId);
      if (response.success) {
        await this.loadData();
      } else {
        console.error("Failed to reject user:", response.error);
        alert("Erreur lors du refus de l'utilisateur");
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert("Erreur lors du refus de l'utilisateur");
    }
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

  private createActivityChart(frais: Frais[]): void {
    const canvas = document.getElementById(
      "activity-chart"
    ) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts.has("activity-chart")) {
      this.charts.get("activity-chart")?.destroy();
    }

    // Grouper les frais par mois
    const monthCounts: Record<string, number> = {};
    const now = new Date();

    // Initialiser les 5 derniers mois
    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });
      monthCounts[monthKey] = 0;
    }

    // Compter les frais par mois
    frais.forEach((f) => {
      if (f.date) {
        const fraisDate = new Date(f.date);
        const monthKey = fraisDate.toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        });
        if (monthKey in monthCounts) {
          monthCounts[monthKey]++;
        }
      }
    });

    const activityData = Object.entries(monthCounts).map(([month, count]) => ({
      month,
      count,
    }));

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
