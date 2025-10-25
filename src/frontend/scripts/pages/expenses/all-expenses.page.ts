import { AuthManager } from "../../auth";
import { FraisService } from "../../../services/frais.service";
import { ChantierService } from "../../../services/chantier.service";
import { Frais, Role } from "../../../types/api.types";
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
    fraisGlobauxPage: FraisGlobauxPage;
  }
}

/**
 * Frais Globaux Page - Pour les admins et comptables
 */
export class FraisGlobauxPage {
  private charts: Map<string, { destroy: () => void }> = new Map();
  private allFrais: Frais[] = [];
  private filteredFrais: Frais[] = [];
  private selectedFrais: number[] = [];
  private currentPage = 1;
  private itemsPerPage = 10;
  private canValidate = false;
  private chantiers: any[] = [];

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const user = AuthManager.getUser();
    this.canValidate = user?.role === Role.COMPTABLE;

    const html = await renderTemplate(
      "/src/frontend/templates/pages/all-expenses-page.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    window.fraisGlobauxPage = this;

    await this.loadData();
    this.setupEventListeners();
    lucide.createIcons();
  }

  private async loadData(): Promise<void> {
    try {
      // Load all frais
      const fraisResponse = await FraisService.getAll();
      if (fraisResponse.success && fraisResponse.data) {
        this.allFrais = Array.isArray(fraisResponse.data)
          ? fraisResponse.data
          : [];

        // Filter out Brouillon for all users
        this.allFrais = this.allFrais.filter((f) => f.statut !== "Brouillon");

        this.filteredFrais = [...this.allFrais];
      }

      // Load chantiers for filter
      const chantiersResponse = await ChantierService.getAll();
      if (chantiersResponse.success && chantiersResponse.data) {
        this.chantiers = Array.isArray(chantiersResponse.data)
          ? chantiersResponse.data
          : [];
        this.populateChantiersFilter();
      }

      await this.renderTable();
      this.createCharts();
    } catch (error) {
      console.error("Error loading frais:", error);
    }
  }

  private populateChantiersFilter(): void {
    const select = document.getElementById(
      "chantier-filter"
    ) as HTMLSelectElement;
    if (!select) return;

    this.chantiers.forEach((chantier) => {
      const option = document.createElement("option");
      option.value = chantier.id_chantier.toString();
      option.textContent = chantier.nom_chantier;
      select.appendChild(option);
    });
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
    const chantierFilter = document.getElementById(
      "chantier-filter"
    ) as HTMLSelectElement;

    if (statusFilter) {
      statusFilter.addEventListener("change", () => this.applyFilters());
    }
    if (chantierFilter) {
      chantierFilter.addEventListener("change", () => this.applyFilters());
    }

    // Export buttons
    const btnExportPdf = document.getElementById("btn-export-pdf");
    const btnExportCsv = document.getElementById("btn-export-csv");

    if (btnExportPdf) {
      btnExportPdf.addEventListener("click", () => this.exportPDF());
    }
    if (btnExportCsv) {
      btnExportCsv.addEventListener("click", () => this.exportCSV());
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
    const chantierFilter = document.getElementById(
      "chantier-filter"
    ) as HTMLSelectElement;

    const searchTerm = searchInput?.value.toLowerCase() || "";
    const statusValue = statusFilter?.value || "all";
    const chantierValue = chantierFilter?.value || "all";

    this.filteredFrais = this.allFrais.filter((frais) => {
      const matchesSearch = frais.lieu.toLowerCase().includes(searchTerm);
      const matchesStatus =
        statusValue === "all" || frais.statut === statusValue;
      const matchesChantier =
        chantierValue === "all" ||
        frais.id_chantier?.toString() === chantierValue;
      return matchesSearch && matchesStatus && matchesChantier;
    });

    this.currentPage = 1;
    this.selectedFrais = [];
    void this.renderTable();
  }

  private async renderTable(): Promise<void> {
    const container = document.getElementById("frais-table-container");
    const countEl = document.getElementById("frais-count");

    if (!container) return;

    if (countEl) {
      countEl.textContent = this.filteredFrais.length.toString();
    }

    // Update bulk actions
    await this.updateBulkActions();

    // Empty state
    if (this.filteredFrais.length === 0) {
      container.innerHTML = await renderTemplate(
        "/src/frontend/templates/components/expenses/expenses-empty.tpl.html",
        {
          message: "Essayez de modifier vos filtres de recherche",
          button: "",
        }
      );
      lucide.createIcons();
      return;
    }

    // Checkbox header for comptable
    let checkboxHeaderHtml = "";
    if (this.canValidate) {
      // Only count frais with "EnCours" status for the "select all" checkbox
      const enCoursFrais = this.filteredFrais.filter(
        (f) => f.statut === "EnCours"
      );
      const isAllChecked =
        enCoursFrais.length > 0 &&
        this.selectedFrais.length === enCoursFrais.length;
      checkboxHeaderHtml = await renderTemplate(
        "/src/frontend/templates/common/checkbox-header.tpl.html",
        {
          checkedAttr: isAllChecked ? "checked" : "",
        }
      );
    }

    // Render table
    const tableHtml = await renderTemplate(
      "/src/frontend/templates/components/expenses/all-expenses-table.tpl.html",
      { checkboxHeaderHtml }
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

    // Checkbox cell for comptable - only for "EnCours" (En attente) status
    let checkboxCellHtml = "";
    if (this.canValidate && frais.statut === "EnCours") {
      const isChecked = this.selectedFrais.includes(frais.id_frais || 0);
      checkboxCellHtml = await renderTemplate(
        "/src/frontend/templates/common/checkbox-cell.tpl.html",
        {
          id: frais.id_frais,
          checkedAttr: isChecked ? "checked" : "",
        }
      );
    } else if (this.canValidate) {
      // Empty cell for non-EnCours statuses
      checkboxCellHtml = '<td class="px-4 py-3 w-12"></td>';
    }

    // Actions - use template
    const actionsHtml = await renderTemplate(
      "/src/frontend/templates/components/expenses/all-expenses-action-view.tpl.html",
      { id: frais.id_frais }
    );

    return await renderTemplate(
      "/src/frontend/templates/components/expenses/all-expenses-row.tpl.html",
      {
        checkboxCellHtml,
        date,
        employe: `${(frais as unknown as Record<string, string>).prenom || ""} ${(frais as unknown as Record<string, string>).nom_utilisateur || ""}`,
        type: "Frais", // TODO: Determine type
        description: frais.lieu,
        statusClass: statusConfig.class,
        statusLabel: statusConfig.label,
        montant: `${Number(frais.montant || 0).toFixed(2)} €`,
        actionsHtml,
      }
    );
  }

  private async updateBulkActions(): Promise<void> {
    const container = document.getElementById("bulk-actions-container");
    if (!container) return;

    if (!this.canValidate || this.selectedFrais.length === 0) {
      container.innerHTML = "";
      return;
    }

    const html = await renderTemplate(
      "/src/frontend/templates/common/bulk-actions.tpl.html",
      {}
    );
    container.innerHTML = html;

    const selectedCount = document.getElementById("selected-count");
    if (selectedCount) {
      selectedCount.textContent = this.selectedFrais.length.toString();
    }

    // Setup event listeners
    const btnValidate = document.getElementById("btn-validate-selection");
    const btnReject = document.getElementById("btn-reject-selection");

    if (btnValidate) {
      btnValidate.addEventListener("click", () => this.validateSelection());
    }
    if (btnReject) {
      btnReject.addEventListener("click", () => this.rejectSelection());
    }

    lucide.createIcons();
  }

  public toggleSelectAll(): void {
    const checkbox = document.getElementById(
      "select-all-checkbox"
    ) as HTMLInputElement;
    if (checkbox?.checked) {
      // Only select frais with status "EnCours" (En attente)
      this.selectedFrais = this.filteredFrais
        .filter((f) => f.statut === "EnCours")
        .map((f) => f.id_frais || 0)
        .filter((id) => id > 0);
    } else {
      this.selectedFrais = [];
    }
    void this.renderTable();
  }

  public toggleSelect(id: number): void {
    const index = this.selectedFrais.indexOf(id);
    if (index === -1) {
      this.selectedFrais.push(id);
    } else {
      this.selectedFrais.splice(index, 1);
    }
    void this.updateBulkActions();
  }

  private async validateSelection(): Promise<void> {
    if (!confirm(`Valider ${this.selectedFrais.length} frais sélectionné(s) ?`))
      return;

    try {
      await Promise.all(
        this.selectedFrais.map((id) =>
          FraisService.updateStatut(id, "Paye" as any)
        )
      );
      alert("Frais validés avec succès");
      this.selectedFrais = [];
      await this.loadData();
    } catch (error) {
      console.error("Error validating frais:", error);
      alert("Erreur lors de la validation");
    }
  }

  private async rejectSelection(): Promise<void> {
    if (!confirm(`Refuser ${this.selectedFrais.length} frais sélectionné(s) ?`))
      return;

    try {
      await Promise.all(
        this.selectedFrais.map((id) =>
          FraisService.updateStatut(id, "Refuse" as any)
        )
      );
      alert("Frais refusés avec succès");
      this.selectedFrais = [];
      await this.loadData();
    } catch (error) {
      console.error("Error rejecting frais:", error);
      alert("Erreur lors du refus");
    }
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
          onclick="window.fraisGlobauxPage.goToPage(1)"
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
          onclick="window.fraisGlobauxPage.goToPage(${i})"
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
          onclick="window.fraisGlobauxPage.goToPage(${totalPages})"
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
        pageName: "fraisGlobauxPage",
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

  public viewFrais(id: number): void {
    // TODO: Navigate to detail frais page
    alert(`Voir détails frais #${id}`);
  }

  private exportPDF(): void {
    alert("Export PDF - À implémenter");
  }

  private exportCSV(): void {
    // Simple CSV export
    const headers = [
      "Date",
      "Employé",
      "Type",
      "Description",
      "Statut",
      "Montant",
    ];
    const rows = this.filteredFrais.map((f) => [
      new Date(f.date).toLocaleDateString("fr-FR"),
      `${(f as any).prenom || ""} ${(f as any).nom_utilisateur || ""}`,
      "Frais",
      f.lieu,
      this.getStatusConfig(f.statut).label,
      Number(f.montant || 0).toFixed(2),
    ]);

    const csvContent =
      headers.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frais_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    this.createValidationChart();
  }

  private createValidationChart(): void {
    const canvas = document.getElementById(
      "validation-chart"
    ) as HTMLCanvasElement;
    if (!canvas) return;

    if (this.charts.has("validation")) {
      this.charts.get("validation")?.destroy();
    }

    // Group by month
    const monthData: Record<string, { valides: number; refuses: number }> = {};
    const now = new Date();

    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });
      monthData[key] = { valides: 0, refuses: 0 };
    }

    this.allFrais.forEach((f) => {
      if (f.date) {
        const date = new Date(f.date);
        const key = date.toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        });
        if (key in monthData) {
          if (f.statut === "Paye") {
            monthData[key].valides++;
          } else if (f.statut === "Refuse") {
            monthData[key].refuses++;
          }
        }
      }
    });

    const data = Object.entries(monthData).map(([month, counts]) => ({
      month,
      valides: counts.valides,
      refuses: counts.refuses,
    }));

    const chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.map((d) => d.month),
        datasets: [
          {
            label: "Validés",
            data: data.map((d) => d.valides),
            borderColor: "rgb(34, 197, 94)",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            tension: 0.4,
          },
          {
            label: "Refusés",
            data: data.map((d) => d.refuses),
            borderColor: "rgb(239, 68, 68)",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "bottom" },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });

    this.charts.set("validation", chart);
  }
}
