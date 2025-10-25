import { AuthManager } from "../../auth";
import { FraisService } from "../../../services/frais.service";
import { Frais } from "../../../types/api.types";
import { renderTemplate } from "../../template-helper";

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

declare global {
  interface Window {
    mesFraisPage: MesFraisPage;
  }
}

/**
 * Mes Frais Page - Pour les employés
 */
export class MesFraisPage {
  private charts: Map<string, { destroy: () => void }> = new Map();
  private allFrais: Frais[] = [];
  private filteredFrais: Frais[] = [];
  private currentPage = 1;
  private itemsPerPage = 10;

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const html = await renderTemplate(
      "/src/frontend/templates/pages/my-expenses-page.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    window.mesFraisPage = this;

    await this.loadData();
    this.setupEventListeners();
    lucide.createIcons();
  }

  private async loadData(): Promise<void> {
    const user = AuthManager.getUser();
    if (!user?.id_utilisateur) return;

    try {
      const response = await FraisService.getByUser(user.id_utilisateur);

      if (response.success && response.data) {
        this.allFrais = Array.isArray(response.data) ? response.data : [];
        this.filteredFrais = [...this.allFrais];

        await this.renderTable();
        this.createCharts();
      }
    } catch (error) {
      console.error("Error loading frais:", error);
    }
  }

  private setupEventListeners(): void {
    // Search
    const searchInput = document.getElementById(
      "search-input"
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener("input", () => this.applyFilters());
    }

    // Filters
    const statusFilter = document.getElementById(
      "status-filter"
    ) as HTMLSelectElement;
    const typeFilter = document.getElementById(
      "type-filter"
    ) as HTMLSelectElement;

    if (statusFilter) {
      statusFilter.addEventListener("change", () => this.applyFilters());
    }
    if (typeFilter) {
      typeFilter.addEventListener("change", () => this.applyFilters());
    }

    // Nouveau frais button
    const btnNouveauFrais = document.getElementById("btn-nouveau-frais");
    if (btnNouveauFrais) {
      btnNouveauFrais.addEventListener("click", () => {
        // TODO: Navigate to nouveau frais page
        alert("Navigation vers Nouveau Frais");
      });
    }
  }

  private setupTableEventListeners(): void {
    // Items per page - needs to be reattached after each render
    const itemsPerPageSelect = document.getElementById(
      "items-per-page"
    ) as HTMLSelectElement;
    if (itemsPerPageSelect) {
      itemsPerPageSelect.value = this.itemsPerPage.toString();
      itemsPerPageSelect.addEventListener("change", (e) => {
        this.itemsPerPage = parseInt((e.target as HTMLSelectElement).value);
        this.currentPage = 1;
        void this.renderTable();
      });
    }
  }

  private applyFilters(): void {
    const searchInput = document.getElementById(
      "search-input"
    ) as HTMLInputElement;
    const statusFilter = document.getElementById(
      "status-filter"
    ) as HTMLSelectElement;

    const searchTerm = searchInput?.value.toLowerCase() || "";
    const statusValue = statusFilter?.value || "all";

    this.filteredFrais = this.allFrais.filter((frais) => {
      const matchesSearch = frais.lieu.toLowerCase().includes(searchTerm);
      const matchesStatus =
        statusValue === "all" || frais.statut === statusValue;
      return matchesSearch && matchesStatus;
    });

    this.currentPage = 1;
    void this.renderTable();
  }

  private async renderTable(): Promise<void> {
    const container = document.getElementById("frais-table-container");
    const countEl = document.getElementById("frais-count");

    if (!container) return;

    if (countEl) {
      countEl.textContent = this.filteredFrais.length.toString();
    }

    // Empty state
    if (this.filteredFrais.length === 0) {
      const buttonHtml = await renderTemplate(
        "/src/frontend/templates/components/expenses/new-expense-button.tpl.html",
        {}
      );

      container.innerHTML = await renderTemplate(
        "/src/frontend/templates/components/expenses/expenses-empty.tpl.html",
        {
          message: "Essayez de modifier vos filtres ou créez un nouveau frais",
          buttonHtml,
        }
      );
      lucide.createIcons();
      return;
    }

    // Render table
    const tableHtml = await renderTemplate(
      "/src/frontend/templates/components/expenses/expenses-table.tpl.html",
      {}
    );
    container.innerHTML = tableHtml;

    // Pagination
    const totalPages = Math.ceil(this.filteredFrais.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(
      startIndex + this.itemsPerPage,
      this.filteredFrais.length
    );
    const paginatedFrais = this.filteredFrais.slice(startIndex, endIndex);

    // Update pagination info
    const rangeStart = document.getElementById("range-start");
    const rangeEnd = document.getElementById("range-end");
    const totalCount = document.getElementById("total-count");

    if (rangeStart) rangeStart.textContent = (startIndex + 1).toString();
    if (rangeEnd) rangeEnd.textContent = endIndex.toString();
    if (totalCount)
      totalCount.textContent = this.filteredFrais.length.toString();

    // Render rows
    const tbody = document.getElementById("frais-table-body");
    if (tbody) {
      const rows = await Promise.all(
        paginatedFrais.map((frais) => this.renderFraisRow(frais))
      );
      tbody.innerHTML = rows.join("");
    }

    // Render pagination buttons
    await this.renderPaginationButtons(totalPages);

    // Setup event listeners for table controls
    this.setupTableEventListeners();

    lucide.createIcons();
  }

  private async renderFraisRow(frais: Frais): Promise<string> {
    const statusConfig = this.getStatusConfig(frais.statut);
    const date = new Date(frais.date).toLocaleDateString("fr-FR");

    // Actions - use templates
    let actionsHtml = await renderTemplate(
      "/src/frontend/templates/components/expenses/expense-action-view.tpl.html",
      { id: frais.id_frais }
    );

    if (frais.statut === "Brouillon") {
      const editDeleteHtml = await renderTemplate(
        "/src/frontend/templates/components/expenses/expense-action-edit-delete.tpl.html",
        { id: frais.id_frais }
      );
      actionsHtml += editDeleteHtml;
    }

    return await renderTemplate(
      "/src/frontend/templates/components/expenses/expense-row.tpl.html",
      {
        date,
        type: "Frais", // TODO: Determine type
        description: frais.lieu,
        statusClass: statusConfig.class,
        statusLabel: statusConfig.label,
        montant: `${Number(frais.montant || 0).toFixed(2)} €`,
        actionsHtml,
      }
    );
  }

  private async renderPaginationButtons(totalPages: number): Promise<void> {
    const container = document.getElementById("pagination-buttons");
    if (!container) return;

    // Generate page number buttons with smart pagination (max 7 buttons)
    let pageButtons = "";
    const maxButtons = 7;
    let startPage = 1;
    let endPage = totalPages;

    if (totalPages > maxButtons) {
      const halfMax = Math.floor(maxButtons / 2);
      if (this.currentPage <= halfMax) {
        // Near the start
        endPage = maxButtons;
      } else if (this.currentPage >= totalPages - halfMax) {
        // Near the end
        startPage = totalPages - maxButtons + 1;
      } else {
        // In the middle
        startPage = this.currentPage - halfMax;
        endPage = this.currentPage + halfMax;
      }
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pageButtons += `
        <button
          onclick="window.mesFraisPage.goToPage(1)"
          class="w-10 px-3 py-1 text-sm border rounded-md hover:bg-accent"
        >
          1
        </button>
      `;
      if (startPage > 2) {
        pageButtons += `<span class="px-2 py-1 text-sm text-muted-foreground">...</span>`;
      }
    }

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === this.currentPage;
      pageButtons += `
        <button
          onclick="window.mesFraisPage.goToPage(${i})"
          class="w-10 px-3 py-1 text-sm border rounded-md hover:bg-accent ${isActive ? "bg-primary text-primary-foreground" : ""}"
        >
          ${i}
        </button>
      `;
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageButtons += `<span class="px-2 py-1 text-sm text-muted-foreground">...</span>`;
      }
      pageButtons += `
        <button
          onclick="window.mesFraisPage.goToPage(${totalPages})"
          class="w-10 px-3 py-1 text-sm border rounded-md hover:bg-accent"
        >
          ${totalPages}
        </button>
      `;
    }

    // Render pagination container with template
    const html = await renderTemplate(
      "/src/frontend/templates/common/pagination-buttons.tpl.html",
      {
        pageName: "mesFraisPage",
        prevPage: this.currentPage - 1,
        nextPage: this.currentPage + 1,
        disablePreviousAttr:
          this.currentPage === 1
            ? 'disabled class="px-3 py-1 text-sm border rounded-md opacity-50 cursor-not-allowed"'
            : "",
        disableNextAttr:
          this.currentPage === totalPages
            ? 'disabled class="px-3 py-1 text-sm border rounded-md opacity-50 cursor-not-allowed"'
            : "",
        pageButtons: pageButtons,
      }
    );

    container.innerHTML = html;
    lucide.createIcons();
  }

  public goToPage(page: number): void {
    const totalPages = Math.ceil(this.filteredFrais.length / this.itemsPerPage);
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    void this.renderTable();
  }

  public handleNouveauFrais(): void {
    // TODO: Navigate to nouveau frais page
    alert("Navigation vers Nouveau Frais");
  }

  public viewFrais(id: number): void {
    // TODO: Navigate to detail frais page
    alert(`Voir détails frais #${id}`);
  }

  public editFrais(id: number): void {
    // TODO: Navigate to edit frais page
    alert(`Éditer frais #${id}`);
  }

  public async deleteFrais(id: number): Promise<void> {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce frais ?")) return;

    try {
      const response = await FraisService.delete(id);
      if (response.success) {
        await this.loadData();
        alert("Frais supprimé avec succès");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting frais:", error);
      alert("Erreur lors de la suppression");
    }
  }

  private getStatusConfig(statut: string): { label: string; class: string } {
    const configs: Record<string, { label: string; class: string }> = {
      Brouillon: {
        label: "Brouillon",
        class: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
      EnCours: {
        label: "En attente",
        class: "bg-chart-pending/20 text-chart-pending",
      },
      PaiementEnCours: {
        label: "En cours",
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

  private createCharts(): void {
    this.createStatusChart();
  }

  private createStatusChart(): void {
    const canvas = document.getElementById("status-chart") as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts.has("status")) {
      this.charts.get("status")?.destroy();
    }

    const statusCounts: Record<string, number> = {
      Paye: 0,
      EnCours: 0,
      PaiementEnCours: 0,
      Brouillon: 0,
    };

    this.allFrais.forEach((f) => {
      if (f.statut in statusCounts) {
        statusCounts[f.statut]++;
      }
    });

    const chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Payé", "En attente", "En cours", "Brouillon"],
        datasets: [
          {
            data: [
              statusCounts.Paye,
              statusCounts.EnCours,
              statusCounts.PaiementEnCours,
              statusCounts.Brouillon,
            ],
            backgroundColor: [
              "rgb(34, 197, 94)",
              "rgb(251, 146, 60)",
              "rgb(59, 130, 246)",
              "rgb(156, 163, 175)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });

    this.charts.set("status", chart);
  }
}
