import { AuthManager } from "../auth";
import { TarifService } from "../../services/tarif.service";
import { GrilleTarifaire, Role } from "../../types/api.types";
import { renderTemplate } from "../template-helper";

declare const lucide: {
  createIcons: () => void;
};

declare global {
  interface Window {
    tarifsPage: TarifsPage;
  }
}

/**
 * Format a number as French currency (e.g., "1,234")
 */
function formatCurrency(amount: number): string {
  return amount.toFixed(3);
}

/**
 * Tarifs Page - Gestion de la grille tarifaire
 */
export class TarifsPage {
  private allTarifs: GrilleTarifaire[] = [];
  private filteredTarifs: GrilleTarifaire[] = [];
  private currentPage = 1;
  private itemsPerPage = 10;
  private canEdit = false;

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const user = AuthManager.getUser();
    // Comptable et Admin peuvent éditer
    this.canEdit = user?.role === Role.COMPTABLE || user?.role === Role.ADMIN;

    const html = await renderTemplate(
      "/src/frontend/templates/tarifs-page.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    window.tarifsPage = this;

    await this.loadData();
    this.setupEventListeners();
    lucide.createIcons();
  }

  private async loadData(): Promise<void> {
    try {
      const response = await TarifService.getAll();
      if (response.success && response.data) {
        this.allTarifs = Array.isArray(response.data) ? response.data : [];
        // Sort by cylindree
        this.allTarifs.sort((a, b) => a.cylindree - b.cylindree);
        this.filteredTarifs = [...this.allTarifs];
      }

      this.updateStats();
      await this.renderTable();
    } catch (error) {
      console.error("Error loading tarifs:", error);
    }
  }

  private setupEventListeners(): void {
    // Export CSV
    const btnExport = document.querySelector("#btn-export");
    btnExport?.addEventListener("click", () => this.exportCSV());

    // Search
    const searchInput = document.querySelector(
      "#search-input"
    ) as HTMLInputElement;
    searchInput?.addEventListener("input", () => {
      this.applyFilters();
    });
  }

  private updateStats(): void {
    const total = this.filteredTarifs.length;
    const moyenne =
      total > 0
        ? this.filteredTarifs.reduce(
            (sum: number, t: GrilleTarifaire) => sum + Number(t.tarif_km),
            0
          ) / total
        : 0;

    const statTotal = document.querySelector("#stat-total");
    const statMoyenne = document.querySelector("#stat-moyenne");

    if (statTotal) statTotal.textContent = total.toString();
    if (statMoyenne) statMoyenne.textContent = formatCurrency(moyenne);
  }

  private applyFilters(): void {
    const searchInput = document.querySelector(
      "#search-input"
    ) as HTMLInputElement;
    const searchText = searchInput?.value.trim() || "";

    this.filteredTarifs = this.allTarifs.filter((tarif) => {
      if (searchText && !tarif.cylindree.toString().includes(searchText)) {
        return false;
      }
      return true;
    });

    this.currentPage = 1;
    this.updateStats();
    this.renderTable();
  }

  private async renderTable(): Promise<void> {
    const tableContainer = document.querySelector("#tarifs-table-container");
    const countSpan = document.querySelector("#tarifs-count");

    if (!tableContainer) return;

    if (countSpan)
      countSpan.textContent = this.filteredTarifs.length.toString();

    // Pagination
    const totalPages = Math.ceil(
      this.filteredTarifs.length / this.itemsPerPage
    );
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedTarifs = this.filteredTarifs.slice(startIndex, endIndex);

    // Template principal
    const actionsHeaderHtml = this.canEdit
      ? '<th class="px-4 py-3 text-right text-sm font-medium">Actions</th>'
      : "";

    const tableTemplate = await renderTemplate(
      "/src/frontend/templates/tarifs-table.tpl.html",
      { actionsHeaderHtml }
    );
    tableContainer.innerHTML = tableTemplate;

    // Lignes
    const tbody = document.querySelector("#tarifs-table-body");
    if (tbody) {
      if (paginatedTarifs.length === 0) {
        const emptyTemplate = await renderTemplate(
          "/src/frontend/templates/tarifs-empty.tpl.html",
          { colspan: this.canEdit ? "3" : "2" }
        );
        tbody.innerHTML = emptyTemplate;
      } else {
        const rowPromises = paginatedTarifs.map((tarif) =>
          this.renderTarifRow(tarif)
        );
        const rows = await Promise.all(rowPromises);
        tbody.innerHTML = rows.join("");

        // Event listeners sur boutons edit
        if (this.canEdit) {
          tbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
            btn.addEventListener("click", (e) => {
              const cylindree = parseInt(
                (e.currentTarget as HTMLElement).dataset.cylindree || "0"
              );
              this.editTarif(cylindree);
            });
          });
        }
      }
    }

    // Mise à jour des contrôles de pagination
    const rangeStart = document.querySelector("#range-start");
    const rangeEnd = document.querySelector("#range-end");
    const totalCount = document.querySelector("#total-count");

    if (rangeStart)
      rangeStart.textContent =
        this.filteredTarifs.length > 0 ? (startIndex + 1).toString() : "0";
    if (rangeEnd)
      rangeEnd.textContent = Math.min(
        endIndex,
        this.filteredTarifs.length
      ).toString();
    if (totalCount)
      totalCount.textContent = this.filteredTarifs.length.toString();

    // Boutons de pagination
    this.renderPaginationButtons(totalPages);

    // Event listeners
    this.setupTableEventListeners();
  }

  private renderPaginationButtons(totalPages: number): void {
    const container = document.querySelector("#pagination-buttons");
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let buttons = "";

    // Bouton Previous
    buttons += `
      <button
        class="px-3 py-1 rounded border ${
          this.currentPage === 1
            ? "text-muted-foreground cursor-not-allowed"
            : "hover:bg-accent"
        }"
        ${this.currentPage === 1 ? "disabled" : ""}
        data-page="${this.currentPage - 1}"
      >
        <i data-lucide="chevron-left" class="h-4 w-4"></i>
      </button>
    `;

    // Logique des boutons de page (max 7 boutons)
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        buttons += this.createPageButton(i);
      }
    } else {
      if (this.currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          buttons += this.createPageButton(i);
        }
        buttons += '<span class="px-2">...</span>';
        buttons += this.createPageButton(totalPages);
      } else if (this.currentPage >= totalPages - 3) {
        buttons += this.createPageButton(1);
        buttons += '<span class="px-2">...</span>';
        for (let i = totalPages - 4; i <= totalPages; i++) {
          buttons += this.createPageButton(i);
        }
      } else {
        buttons += this.createPageButton(1);
        buttons += '<span class="px-2">...</span>';
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          buttons += this.createPageButton(i);
        }
        buttons += '<span class="px-2">...</span>';
        buttons += this.createPageButton(totalPages);
      }
    }

    // Bouton Next
    buttons += `
      <button
        class="px-3 py-1 rounded border ${
          this.currentPage === totalPages
            ? "text-muted-foreground cursor-not-allowed"
            : "hover:bg-accent"
        }"
        ${this.currentPage === totalPages ? "disabled" : ""}
        data-page="${this.currentPage + 1}"
      >
        <i data-lucide="chevron-right" class="h-4 w-4"></i>
      </button>
    `;

    container.innerHTML = buttons;

    // Re-initialize lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Event listeners
    container.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = parseInt(btn.getAttribute("data-page") || "1");
        this.goToPage(page);
      });
    });
  }

  private createPageButton(page: number): string {
    const isActive = page === this.currentPage;
    return `
      <button
        class="px-3 py-1 rounded border ${
          isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"
        }"
        data-page="${page}"
      >
        ${page}
      </button>
    `;
  }

  private setupTableEventListeners(): void {
    const itemsPerPageSelect = document.querySelector(
      "#items-per-page"
    ) as HTMLSelectElement;
    if (itemsPerPageSelect) {
      itemsPerPageSelect.value = this.itemsPerPage.toString();
      itemsPerPageSelect.addEventListener("change", () => {
        this.itemsPerPage = parseInt(itemsPerPageSelect.value);
        this.currentPage = 1;
        this.renderTable();
      });
    }
  }

  private goToPage(page: number): void {
    this.currentPage = page;
    this.renderTable();
  }

  private async renderTarifRow(tarif: GrilleTarifaire): Promise<string> {
    // Actions cell for editable roles
    let actionsCellHtml = "";
    if (this.canEdit) {
      actionsCellHtml = `
        <td class="px-4 py-3 text-right">
          <button
            onclick="window.tarifsPage.editTarif(${tarif.cylindree})"
            class="inline-flex items-center px-2 py-1 text-sm hover:bg-accent rounded-md"
          >
            <i data-lucide="edit" class="w-4 h-4"></i>
          </button>
        </td>
      `;
    }

    return await renderTemplate("/src/frontend/templates/tarif-row.tpl.html", {
      cylindree: tarif.cylindree,
      tarifKm: formatCurrency(Number(tarif.tarif_km)),
      actionsCellHtml,
    });
  }

  public editTarif(cylindree: number): void {
    const tarif = this.allTarifs.find((t) => t.cylindree === cylindree);
    if (!tarif) return;

    // TODO: Open edit modal
    console.log("Edit tarif:", tarif);
    alert(
      `Modification du tarif pour ${cylindree} CV (${tarif.tarif_km} €/km) - Modal à implémenter`
    );
  }

  private exportCSV(): void {
    const headers = ["Cylindrée (CV)", "Tarif/km (€)"];
    const rows = this.allTarifs.map((t) => [
      t.cylindree.toString(),
      Number(t.tarif_km).toFixed(3),
    ]);

    const csvContent =
      headers.join(",") +
      "\n" +
      rows.map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grille_tarifaire_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
