import { Utilisateur } from "../types/api.types";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { renderTemplateList, renderTemplate } from "./template-helper";

declare const lucide: {
  createIcons: () => void;
};

declare const Chart: {
  new (
    ctx: CanvasRenderingContext2D | HTMLCanvasElement,
    config: ChartConfiguration
  ): ChartInstance;
};

interface ChartConfiguration {
  type: string;
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options?: Record<string, unknown>;
}

interface ChartDataset {
  label?: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string | string[];
  tension?: number;
  fill?: boolean;
}

interface ChartInstance {
  destroy(): void;
  update(): void;
}

interface StatusConfig {
  label: string;
  class: string;
}

interface RoleConfig {
  label: string;
  class: string;
}

export abstract class BaseDashboard {
  protected user: Utilisateur;
  protected sidebar: Sidebar;
  protected header: Header;
  protected footer: Footer;
  protected charts: Map<string, ChartInstance> = new Map();

  // Configurations communes
  protected readonly statusLabels: Record<string, string> = {
    Brouillon: "Brouillon",
    EnCours: "En cours",
    PaiementEnCours: "Paiement en cours",
    Paye: "Payé",
    Refuse: "Refusé",
  };

  protected readonly statusColors: Record<string, string> = {
    Brouillon: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    EnCours: "bg-chart-pending/20 text-chart-pending",
    PaiementEnCours: "bg-info/20 text-info",
    Paye: "bg-chart-validated/20 text-chart-validated",
    Refuse: "bg-chart-refused/20 text-chart-refused",
  };

  protected readonly roleLabels: Record<string, string> = {
    employe: "Employé",
    comptable: "Comptable",
    admin: "Administrateur",
  };

  protected readonly roleColors: Record<string, string> = {
    employe: "bg-role-employee/20 text-role-employee",
    comptable: "bg-role-accountant/20 text-role-accountant",
    admin: "bg-role-admin/20 text-role-admin",
  };

  constructor(
    user: Utilisateur,
    currentPage: string,
    navigate: (page: string) => void
  ) {
    this.user = user;
    this.sidebar = new Sidebar(
      "sidebar-container",
      user,
      currentPage,
      navigate
    );
    this.header = new Header(
      "header-container",
      user,
      () => this.sidebar.toggle(),
      navigate
    );
    this.footer = new Footer("footer-container");
  }

  /**
   * Méthode abstraite pour charger les données du dashboard
   */
  protected abstract loadData(): Promise<void>;

  /**
   * Initialise le dashboard
   */
  public async init(): Promise<void> {
    try {
      await this.loadData();
    } catch (error) {
      console.error("Error initializing dashboard:", error);
      this.showError("Une erreur est survenue lors du chargement des données");
    }
  }

  /**
   * Met à jour un élément de texte de manière sécurisée
   */
  protected updateTextContent(
    elementId: string,
    content: string | number
  ): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = String(content);
    }
  }

  /**
   * Met à jour une barre de progression
   */
  protected updateProgress(elementId: string, percentage: number): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.width = `${Math.min(Math.max(percentage, 0), 100)}%`;
    }
  }

  /**
   * Formate une date en français
   */
  protected formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("fr-FR");
  }

  /**
   * Formate une date et heure en français
   */
  protected formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString("fr-FR");
  }

  /**
   * Formate un montant en euros
   */
  protected formatCurrency(amount: number | string): string {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return "0.00 €";
    }
    return `${numAmount.toFixed(2)} €`;
  }

  /**
   * Obtient la configuration de statut
   */
  protected getStatusConfig(status: string): StatusConfig {
    return {
      label: this.statusLabels[status] || status,
      class: this.statusColors[status] || this.statusColors["Brouillon"],
    };
  }

  /**
   * Obtient la configuration de rôle
   */
  protected getRoleConfig(role: string): RoleConfig {
    return {
      label: this.roleLabels[role] || role,
      class: this.roleColors[role] || this.roleColors["employe"],
    };
  }

  /**
   * Rend une liste avec un template Handlebars
   */
  protected async renderList<T>(
    containerId: string,
    templatePath: string,
    items: T[],
    dataMapper: (item: T) => Record<string, unknown>,
    emptyMessage = "Aucune donnée disponible"
  ): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (items.length === 0) {
      const emptyHtml = await renderTemplate(
        "/src/frontend/templates/empty-state.tpl.html",
        { message: emptyMessage }
      );
      container.innerHTML = emptyHtml;
      return;
    }

    try {
      const html = await renderTemplateList(templatePath, items, dataMapper);
      container.innerHTML = html;
      lucide.createIcons();
    } catch (error) {
      console.error("Error rendering list:", error);
      const errorHtml = await renderTemplate(
        "/src/frontend/templates/error-state.tpl.html",
        { message: "Erreur lors du chargement des données" }
      );
      container.innerHTML = errorHtml;
    }
  }

  /**
   * Crée un graphique avec Chart.js
   */
  protected createChart(
    canvasId: string,
    type: string,
    labels: string[],
    datasets: ChartDataset[],
    options: Record<string, unknown> = {}
  ): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    // Détruire le graphique existant si présent
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId)?.destroy();
    }

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      ...options,
    };

    const chart = new Chart(canvas, {
      type,
      data: { labels, datasets },
      options: defaultOptions,
    });

    this.charts.set(canvasId, chart);
  }

  /**
   * Nettoie tous les graphiques
   */
  protected cleanupCharts(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts.clear();
  }

  /**
   * Échappe le HTML pour éviter les injections XSS
   */
  protected escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Affiche un message d'erreur
   */
  protected showError(message: string): void {
    console.error(message);
    // TODO: Implémenter un système de notification UI
  }

  /**
   * Filtre les frais du mois courant
   */
  protected filterCurrentMonth<T extends { date: Date | string }>(
    items: T[]
  ): T[] {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return items.filter((item) => {
      const date = new Date(item.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });
  }

  /**
   * Nettoie les ressources avant destruction
   */
  public destroy(): void {
    this.cleanupCharts();
  }
}
