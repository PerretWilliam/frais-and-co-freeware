import { renderTemplate } from "../../template-helper";

declare const lucide: {
  createIcons: () => void;
};

/**
 * Gestion de la pagination
 */

export class UserPaginationRenderer {
  /**
   * Rend les boutons de pagination
   */
  static async render(
    totalItems: number,
    currentPage: number,
    itemsPerPage: number,
    onPageChange: (page: number) => void
  ): Promise<void> {
    const container = document.getElementById("pagination-container");
    if (!container) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    // Calculate indices
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    // Info text
    const showing = `Affichage de ${startIndex + 1} à ${endIndex} sur ${totalItems} utilisateurs`;

    // Generate page buttons
    const pageButtons = this.generatePageButtons(currentPage, totalPages);

    // Render pagination container
    const disablePrevious = currentPage === 1;
    const disableNext = currentPage === totalPages;

    const paginationHtml = await renderTemplate(
      "/src/frontend/templates/common/pagination-container.tpl.html",
      {
        showing,
        pageButtons,
        prevClasses: disablePrevious ? "opacity-50 cursor-not-allowed" : "",
        prevDisabled: disablePrevious ? "disabled" : "",
        nextClasses: disableNext ? "opacity-50 cursor-not-allowed" : "",
        nextDisabled: disableNext ? "disabled" : "",
      }
    );
    container.innerHTML = paginationHtml;

    // Setup event listeners
    const prevBtn = container.querySelector(".btn-prev-page");
    prevBtn?.addEventListener("click", () => {
      if (currentPage > 1) onPageChange(currentPage - 1);
    });

    const nextBtn = container.querySelector(".btn-next-page");
    nextBtn?.addEventListener("click", () => {
      if (currentPage < totalPages) onPageChange(currentPage + 1);
    });

    container.querySelectorAll(".btn-page").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const page = parseInt(
          (e.currentTarget as HTMLElement).dataset.page || "1"
        );
        onPageChange(page);
      });
    });

    lucide.createIcons();
  }

  /**
   * Génère les boutons de numéros de page avec pagination intelligente
   */
  private static generatePageButtons(
    currentPage: number,
    totalPages: number
  ): string {
    let pageButtons = "";
    const maxButtons = 7;
    let startPage = 1;
    let endPage = totalPages;

    if (totalPages > maxButtons) {
      const halfButtons = Math.floor(maxButtons / 2);
      if (currentPage <= halfButtons + 1) {
        endPage = maxButtons - 1;
      } else if (currentPage >= totalPages - halfButtons) {
        startPage = totalPages - maxButtons + 2;
      } else {
        startPage = currentPage - halfButtons;
        endPage = currentPage + halfButtons;
      }
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      const activeClass =
        currentPage === 1 ? "bg-primary text-primary-foreground" : "";
      pageButtons += `
        <button
          class="btn-page px-3 py-1 text-sm border rounded-md hover:bg-accent ${activeClass}"
          data-page="1"
        >
          1
        </button>
      `;
      if (startPage > 2) {
        pageButtons += '<span class="px-2">...</span>';
      }
    }

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      const activeClass =
        currentPage === i ? "bg-primary text-primary-foreground" : "";
      pageButtons += `
        <button
          class="btn-page px-3 py-1 text-sm border rounded-md hover:bg-accent ${activeClass}"
          data-page="${i}"
        >
          ${i}
        </button>
      `;
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageButtons += '<span class="px-2">...</span>';
      }
      const activeClass =
        currentPage === totalPages ? "bg-primary text-primary-foreground" : "";
      pageButtons += `
        <button
          class="btn-page px-3 py-1 text-sm border rounded-md hover:bg-accent ${activeClass}"
          data-page="${totalPages}"
        >
          ${totalPages}
        </button>
      `;
    }

    return pageButtons;
  }
}
