import { renderTemplate } from "../../template-helper";
import { Utilisateur, Role } from "../../../types/api.types";
import { UserStats } from "./users.types";

/**
 * Gestion des statistiques utilisateurs
 */

export class UserStatsRenderer {
  /**
   * Calcule les statistiques des utilisateurs
   */
  static calculateStats(users: Utilisateur[]): UserStats {
    return {
      total: users.length,
      employes: users.filter((u) => u.role === Role.EMPLOYE).length,
      comptables: users.filter((u) => u.role === Role.COMPTABLE).length,
      actifs: users.filter((u) => u.valide).length,
    };
  }

  /**
   * Rend les cartes de statistiques
   */
  static async render(users: Utilisateur[]): Promise<void> {
    const statsContainer = document.getElementById("stats-cards");
    if (!statsContainer) return;

    const stats = this.calculateStats(users);

    const statsData = [
      {
        label: "Total utilisateurs",
        count: stats.total,
        icon: "users",
        bgClass: "bg-primary/10",
        iconClass: "text-primary",
      },
      {
        label: "Employés",
        count: stats.employes,
        icon: "user",
        bgClass: "bg-blue-500/10",
        iconClass: "text-blue-600",
      },
      {
        label: "Comptables",
        count: stats.comptables,
        icon: "calculator",
        bgClass: "bg-purple-500/10",
        iconClass: "text-purple-600",
      },
      {
        label: "Actifs",
        count: stats.actifs,
        icon: "check-circle",
        bgClass: "bg-success/10",
        iconClass: "text-success",
      },
    ];

    const statsHtml = await Promise.all(
      statsData.map((stat) =>
        renderTemplate("/src/frontend/templates/users/stat-card.tpl.html", stat)
      )
    );

    statsContainer.innerHTML = statsHtml.join("");
  }
}
