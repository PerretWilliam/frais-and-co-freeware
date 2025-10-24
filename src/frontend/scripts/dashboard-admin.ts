import { AuthManager } from "./auth";
import { BaseDashboard } from "./base-dashboard";
import { UtilisateurService } from "../services/utilisateur.service";
import { FraisService } from "../services/frais.service";
import { ChantierService } from "../services/chantier.service";

// Vérifier l'authentification
if (!AuthManager.requireAuth()) {
  throw new Error("User not authenticated");
}

const user = AuthManager.getUser();
if (!user || user.role !== "admin") {
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
    case "profil":
      window.location.href = "/src/frontend/pages/profil.html";
      break;
    case "users-admin":
    case "utilisateurs":
      window.location.href = "/src/frontend/pages/utilisateurs.html";
      break;
    case "chantiers-admin":
    case "chantiers":
      window.location.href = "/src/frontend/pages/chantiers.html";
      break;
    case "tarifs-admin":
    case "tarifs":
      window.location.href = "/src/frontend/pages/tarifs.html";
      break;
    case "parametres-admin":
    case "parametres":
      window.location.href = "/src/frontend/pages/parametres.html";
      break;
    case "logs":
      window.location.href = "/src/frontend/pages/logs.html";
      break;
    case "aide":
      window.location.href = "/src/frontend/pages/aide.html";
      break;
    default:
      console.log("Page not implemented yet:", page);
  }
}

class AdminDashboard extends BaseDashboard {
  protected async loadData(): Promise<void> {
    // Get all data
    const [usersResponse, fraisResponse, chantiersResponse] = await Promise.all(
      [
        UtilisateurService.getAll(),
        FraisService.getAll(),
        ChantierService.getAll(),
      ]
    );

    if (usersResponse.success && usersResponse.data) {
      const users = usersResponse.data;
      this.updateTextContent("stat-users", users.length);

      // Count new users this month - filtrer les utilisateurs sans date
      const usersWithDate = users.filter(
        (u): u is typeof u & { date_creation: Date | string } =>
          "date_creation" in u && u.date_creation !== undefined
      );
      const newUsersThisMonth = this.filterCurrentMonth(
        usersWithDate.map((u) => ({ ...u, date: u.date_creation }))
      ).length;

      this.updateTextContent("stat-users-new", newUsersThisMonth);

      // Update new users list
      await this.updateNewUsersList(users);

      // Create role chart
      this.createRoleChart(users);
    }

    if (fraisResponse.success && fraisResponse.data) {
      const frais = fraisResponse.data as Frais[];

      // Calculate frais stats
      const fraisCeMois = this.filterCurrentMonth(frais);
      const montantTotal = fraisCeMois.reduce((sum, f) => sum + f.montant, 0);

      this.updateTextContent("stat-expenses", fraisCeMois.length);
      this.updateTextContent("stat-amount", this.formatCurrency(montantTotal));

      const budget = 50000;
      const progress = (montantTotal / budget) * 100;
      this.updateProgress("progress-amount", progress);

      // Create monthly chart
      this.createMonthlyChart();

      // Update recent activity
      await this.updateRecentActivity(frais);
    }

    if (chantiersResponse.success && chantiersResponse.data) {
      const chantiers = chantiersResponse.data;
      // Compter les chantiers actifs - adaptation selon la structure réelle
      const chantiersActifs = chantiers.length; // Tous les chantiers pour le moment

      this.updateTextContent("stat-chantiers", chantiersActifs);
    }
  }

  private async updateNewUsersList(users: any[]): Promise<void> {
    const usersWithDate = users.filter(
      (u): u is typeof u & { date_creation: Date | string } =>
        "date_creation" in u && u.date_creation !== undefined
    );
    const newUsers = this.filterCurrentMonth(
      usersWithDate.map((u) => ({ ...u, date: u.date_creation }))
    ).slice(0, 5);

    await this.renderList(
      "new-users",
      "/src/frontend/templates/user-item.tpl.html",
      newUsers,
      (u: any) => {
        const roleConfig = this.getRoleConfig(u.role);
        return {
          prenom: u.prenom,
          nom: u.nom_utilisateur || u.nom || "",
          roleLabel: roleConfig.label,
          roleClass: roleConfig.class,
          dateFormatted: this.formatDate(u.date),
        };
      },
      "Aucun nouvel utilisateur ce mois"
    );
  }

  private async updateRecentActivity(frais: Frais[]): Promise<void> {
    const recentFrais = frais
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const actionLabels: Record<string, string> = {
      Brouillon: "créé un brouillon",
      EnCours: "soumis un frais",
      PaiementEnCours: "approuvé pour paiement",
      Paye: "payé un frais",
      Refuse: "refusé un frais",
    };

    await this.renderList(
      "recent-activity",
      "/src/frontend/templates/activity-item.tpl.html",
      recentFrais,
      (f: Frais) => ({
        actionLabel: actionLabels[f.statut] || "modifié",
        lieu: f.lieu,
        dateTimeFormatted: this.formatDateTime(f.date),
      }),
      "Aucune activité récente"
    );
  }

  private createMonthlyChart(): void {
    const monthlyData = [
      { month: "Juin", expenses: 145, amount: 8500 },
      { month: "Juillet", expenses: 168, amount: 12000 },
      { month: "Août", expenses: 132, amount: 9500 },
      { month: "Sept", expenses: 189, amount: 14500 },
      { month: "Oct", expenses: 156, amount: 11800 },
    ];

    this.createChart(
      "monthly-chart",
      "line",
      monthlyData.map((d) => d.month),
      [
        {
          label: "Nombre de frais",
          data: monthlyData.map((d) => d.expenses),
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

  private createRoleChart(users: any[]): void {
    const roleCounts = {
      employe: users.filter((u) => u.role === "employe").length,
      comptable: users.filter((u) => u.role === "comptable").length,
      admin: users.filter((u) => u.role === "admin").length,
    };

    this.createChart(
      "role-chart",
      "doughnut",
      ["Employés", "Comptables", "Administrateurs"],
      [
        {
          data: [
            roleCounts["employe"],
            roleCounts["comptable"],
            roleCounts["admin"],
          ],
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
const dashboard = new AdminDashboard(user, "dashboard", navigate);
void dashboard.init();

// Add event listeners
const usersAdminBtn = document.getElementById("users-admin-btn");
if (usersAdminBtn) {
  usersAdminBtn.addEventListener("click", () => navigate("users-admin"));
}

const chantiersAdminBtn = document.getElementById("chantiers-admin-btn");
if (chantiersAdminBtn) {
  chantiersAdminBtn.addEventListener("click", () =>
    navigate("chantiers-admin")
  );
}

const tarifsAdminBtn = document.getElementById("tarifs-admin-btn");
if (tarifsAdminBtn) {
  tarifsAdminBtn.addEventListener("click", () => navigate("tarifs-admin"));
}

const parametresAdminBtn = document.getElementById("parametres-admin-btn");
if (parametresAdminBtn) {
  parametresAdminBtn.addEventListener("click", () =>
    navigate("parametres-admin")
  );
}

const voirLogsBtn = document.getElementById("voir-logs-btn");
if (voirLogsBtn) {
  voirLogsBtn.addEventListener("click", () => navigate("logs"));
}

const voirUsersBtn = document.getElementById("voir-users-btn");
if (voirUsersBtn) {
  voirUsersBtn.addEventListener("click", () => navigate("users-admin"));
}
