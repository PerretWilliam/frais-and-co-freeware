import { AuthManager } from "../../auth";
import { ChantierService } from "../../../services/chantier.service";
import { FraisService } from "../../../services/frais.service";
import { Chantier, Role } from "../../../types/api.types";
import { renderTemplate } from "../../template-helper";

declare const lucide: {
  createIcons: () => void;
};

declare global {
  interface Window {
    chantiersPage: ChantiersPage;
  }
}

interface ChantierWithStats extends Chantier {
  nbFrais?: number;
  montantTotal?: number;
}

/**
 * Format a number as French currency (e.g., "1 234,56")
 */
function formatCurrency(amount: number): string {
  const parts = amount.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${integerPart},${parts[1]}`;
}

/**
 * Chantiers Page - Gestion des chantiers
 */
export class ChantiersPage {
  private allChantiers: ChantierWithStats[] = [];
  private filteredChantiers: ChantierWithStats[] = [];
  private currentPage = 1;
  private itemsPerPage = 10;
  private canEdit = false;
  private canDelete = false;

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const user = AuthManager.getUser();
    // Admin et Employé peuvent éditer, seul Admin peut supprimer
    this.canEdit = user?.role === Role.ADMIN || user?.role === Role.EMPLOYE;
    this.canDelete = user?.role === Role.ADMIN;

    const html = await renderTemplate(
      "/src/frontend/templates/pages/sites-page.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    // Attach to window AFTER setting innerHTML
    window.chantiersPage = this;
    console.log("ChantiersPage attached to window:", window.chantiersPage);

    await this.loadData();
    this.setupEventListeners();
    lucide.createIcons();
  }

  private async loadData(): Promise<void> {
    try {
      // Load chantiers
      const chantiersResponse = await ChantierService.getAll();
      if (chantiersResponse.success && chantiersResponse.data) {
        this.allChantiers = Array.isArray(chantiersResponse.data)
          ? chantiersResponse.data
          : [];

        // Load frais data for each chantier
        const fraisResponse = await FraisService.getAll();
        if (fraisResponse.success && fraisResponse.data) {
          const allFrais = Array.isArray(fraisResponse.data)
            ? fraisResponse.data
            : [];

          // Calculate stats for each chantier
          this.allChantiers = this.allChantiers.map((chantier) => {
            const chantierFrais = allFrais.filter(
              (f) => f.id_chantier === chantier.id_chantier
            );
            return {
              ...chantier,
              nbFrais: chantierFrais.length,
              montantTotal: chantierFrais.reduce(
                (sum, f) => sum + (f.montant || 0),
                0
              ),
            };
          });
        }

        this.filteredChantiers = [...this.allChantiers];
      }

      this.updateStats();
      await this.renderTable();
    } catch (error) {
      console.error("Error loading chantiers:", error);
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

    // Export button
    const btnExport = document.getElementById("btn-export");
    if (btnExport) {
      btnExport.addEventListener("click", () => this.exportCSV());
    }

    // Add button - show only if user can edit
    const btnAdd = document.getElementById("btn-add-chantier");
    if (btnAdd && this.canEdit) {
      btnAdd.style.display = "inline-flex";
      btnAdd.addEventListener("click", () => this.showAddModal());
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
        this.itemsPerPage = parseInt((e.target as HTMLSelectElement).value, 10);
        this.currentPage = 1;
        void this.renderTable();
      });
    }
  }

  private applyFilters(): void {
    const searchInput = document.getElementById(
      "search-input"
    ) as HTMLInputElement;
    const searchTerm = searchInput?.value.toLowerCase() || "";

    this.filteredChantiers = this.allChantiers.filter((chantier) => {
      const matchesSearch =
        chantier.nom_chantier.toLowerCase().includes(searchTerm) ||
        chantier.ville_chantier.toLowerCase().includes(searchTerm);
      return matchesSearch;
    });

    this.currentPage = 1;
    void this.renderTable();
  }

  private updateStats(): void {
    const totalChantiers = document.getElementById("stat-total-chantiers");
    const totalFrais = document.getElementById("stat-total-frais");
    const montantTotal = document.getElementById("stat-montant-total");
    const mostActive = document.getElementById("stat-most-active");

    if (totalChantiers) {
      totalChantiers.textContent = this.allChantiers.length.toString();
    }

    const sumFrais = this.allChantiers.reduce(
      (sum, c) => sum + (c.nbFrais || 0),
      0
    );
    if (totalFrais) {
      totalFrais.textContent = sumFrais.toString();
    }

    const sumMontant = this.allChantiers.reduce(
      (sum, c) => sum + (Number(c.montantTotal) || 0),
      0
    );
    if (montantTotal) {
      montantTotal.textContent = `${formatCurrency(sumMontant)} €`;
    }

    if (mostActive && this.allChantiers.length > 0) {
      const sorted = [...this.allChantiers].sort(
        (a, b) => (b.nbFrais || 0) - (a.nbFrais || 0)
      );
      mostActive.textContent = sorted[0]?.ville_chantier || "-";
    }
  }

  private async renderTable(): Promise<void> {
    const container = document.getElementById("chantiers-table-container");
    const countEl = document.getElementById("chantiers-count");

    if (!container) return;

    if (countEl) {
      countEl.textContent = this.filteredChantiers.length.toString();
    }

    // Empty state
    if (this.filteredChantiers.length === 0) {
      const buttonHtml = this.canEdit
        ? await renderTemplate(
            "/src/frontend/templates/components/sites/add-site-button.tpl.html",
            {}
          )
        : "";

      container.innerHTML = await renderTemplate(
        "/src/frontend/templates/components/sites/sites-empty.tpl.html",
        {
          message:
            this.allChantiers.length === 0
              ? "Créez votre premier chantier pour commencer"
              : "Aucun résultat ne correspond à votre recherche",
          buttonHtml,
        }
      );
      lucide.createIcons();
      return;
    }

    // Render table
    const tableHtml = await renderTemplate(
      "/src/frontend/templates/components/sites/sites-table.tpl.html",
      {}
    );
    container.innerHTML = tableHtml;

    // Pagination
    const totalPages = Math.ceil(
      this.filteredChantiers.length / this.itemsPerPage
    );
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(
      startIndex + this.itemsPerPage,
      this.filteredChantiers.length
    );
    const paginatedChantiers = this.filteredChantiers.slice(
      startIndex,
      endIndex
    );

    // Update pagination info
    const rangeStart = document.getElementById("range-start");
    const rangeEnd = document.getElementById("range-end");
    const totalCount = document.getElementById("total-count");

    if (rangeStart) rangeStart.textContent = (startIndex + 1).toString();
    if (rangeEnd) rangeEnd.textContent = endIndex.toString();
    if (totalCount)
      totalCount.textContent = this.filteredChantiers.length.toString();

    // Render rows
    const tbody = document.getElementById("chantiers-table-body");
    if (tbody) {
      const rows = await Promise.all(
        paginatedChantiers.map((chantier) => this.renderChantierRow(chantier))
      );
      tbody.innerHTML = rows.join("");
    }

    // Render pagination buttons
    await this.renderPaginationButtons(totalPages);

    // Setup event listeners for table controls
    this.setupTableEventListeners();

    lucide.createIcons();
  }

  private async renderChantierRow(
    chantier: ChantierWithStats
  ): Promise<string> {
    // Build actions HTML
    let editDeleteHtml = "";
    if (this.canEdit) {
      let deleteHtml = "";
      if (this.canDelete) {
        deleteHtml = await renderTemplate(
          "/src/frontend/templates/components/sites/site-delete-button.tpl.html",
          { id: chantier.id_chantier }
        );
      }
      editDeleteHtml = await renderTemplate(
        "/src/frontend/templates/components/sites/site-edit-delete.tpl.html",
        { id: chantier.id_chantier, deleteHtml }
      );
    }

    const actionsHtml = await renderTemplate(
      "/src/frontend/templates/components/sites/site-actions.tpl.html",
      { id: chantier.id_chantier, editDeleteHtml }
    );

    return await renderTemplate(
      "/src/frontend/templates/components/sites/site-row.tpl.html",
      {
        nom: chantier.nom_chantier,
        ville: chantier.ville_chantier,
        codePostal: chantier.cp_chantier,
        nbFrais: chantier.nbFrais || 0,
        montantTotal: formatCurrency(Number(chantier.montantTotal) || 0),
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
      const halfButtons = Math.floor(maxButtons / 2);
      if (this.currentPage <= halfButtons + 1) {
        endPage = maxButtons - 1;
      } else if (this.currentPage >= totalPages - halfButtons) {
        startPage = totalPages - maxButtons + 2;
      } else {
        startPage = this.currentPage - halfButtons;
        endPage = this.currentPage + halfButtons;
      }
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      const activeClass =
        this.currentPage === 1 ? "bg-primary text-primary-foreground" : "";
      pageButtons += await renderTemplate(
        "/src/frontend/templates/sites/sites-page-button.tpl.html",
        { page: 1, classes: activeClass }
      );
      if (startPage > 2) {
        pageButtons += '<span class="px-2">...</span>';
      }
    }

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      const activeClass =
        this.currentPage === i ? "bg-primary text-primary-foreground" : "";
      pageButtons += await renderTemplate(
        "/src/frontend/templates/sites/sites-page-button.tpl.html",
        { page: i, classes: activeClass }
      );
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageButtons += '<span class="px-2">...</span>';
      }
      const activeClass =
        this.currentPage === totalPages
          ? "bg-primary text-primary-foreground"
          : "";
      pageButtons += await renderTemplate(
        "/src/frontend/templates/sites/sites-page-button.tpl.html",
        { page: totalPages, classes: activeClass }
      );
    }

    // Render pagination container
    const disablePrevious = this.currentPage === 1;
    const disableNext = this.currentPage === totalPages;

    const paginationHtml = await renderTemplate(
      "/src/frontend/templates/sites/sites-pagination.tpl.html",
      {
        prevPage: this.currentPage - 1,
        nextPage: this.currentPage + 1,
        pageButtons: pageButtons,
        prevClasses: disablePrevious ? "opacity-50 cursor-not-allowed" : "",
        prevDisabled: disablePrevious ? "disabled" : "",
        nextClasses: disableNext ? "opacity-50 cursor-not-allowed" : "",
        nextDisabled: disableNext ? "disabled" : "",
      }
    );
    container.innerHTML = paginationHtml;

    lucide.createIcons();
  }

  public goToPage(page: number): void {
    console.log(
      "goToPage called with:",
      page,
      "current page:",
      this.currentPage
    );
    const totalPages = Math.ceil(
      this.filteredChantiers.length / this.itemsPerPage
    );
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    void this.renderTable();
  }

  public viewChantier(id: number): void {
    // TODO: Navigate to detail-chantier page with ID
    console.log("View chantier:", id);
    alert(`Navigation vers détails du chantier #${id} - À implémenter`);
  }

  public editChantier(id: number): void {
    const chantier = this.allChantiers.find((c) => c.id_chantier === id);
    if (!chantier) return;

    // TODO: Open edit modal
    console.log("Edit chantier:", chantier);
    alert(
      `Édition du chantier "${chantier.nom_chantier}" - Modal à implémenter`
    );
  }

  public async deleteChantier(id: number): Promise<void> {
    const chantier = this.allChantiers.find((c) => c.id_chantier === id);
    if (!chantier) return;

    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer le chantier "${chantier.nom_chantier}" ?\n\nCette action est irréversible et supprimera également tous les frais associés.`
      )
    ) {
      return;
    }

    try {
      const response = await ChantierService.delete(id);
      if (response.success) {
        alert("Chantier supprimé avec succès");
        await this.loadData();
      } else {
        alert("Erreur lors de la suppression du chantier");
      }
    } catch (error) {
      console.error("Error deleting chantier:", error);
      alert("Erreur lors de la suppression du chantier");
    }
  }

  public showAddModal(): void {
    // TODO: Open add modal
    alert("Modal d'ajout de chantier - À implémenter");
  }

  private exportCSV(): void {
    const headers = [
      "Nom",
      "Ville",
      "Code postal",
      "Adresse",
      "Nb frais",
      "Montant total",
    ];
    const rows = this.filteredChantiers.map((c) => [
      c.nom_chantier,
      c.ville_chantier,
      c.cp_chantier,
      c.adresse_chantier || "",
      (c.nbFrais || 0).toString(),
      (c.montantTotal || 0).toFixed(2),
    ]);

    const csvContent =
      headers.join(",") +
      "\n" +
      rows.map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chantiers_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
