import { renderTemplate } from "../template-helper";

declare const lucide: {
  createIcons: () => void;
};

declare global {
  interface Window {
    aidePage: AidePage;
  }
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "faq-1",
    question: "Comment déclarer un frais de déplacement ?",
    answer:
      'Pour déclarer un frais de déplacement, rendez-vous dans "Nouveau frais", sélectionnez l\'onglet "Déplacement", renseignez les villes de départ et d\'arrivée, sélectionnez votre véhicule, et le montant sera calculé automatiquement.',
  },
  {
    id: "faq-2",
    question: "Quels justificatifs dois-je fournir ?",
    answer:
      "Pour les repas et hébergements, vous devez obligatoirement joindre une facture ou un reçu. Pour les déplacements, le calcul automatique basé sur la distance suffit.",
  },
  {
    id: "faq-3",
    question: "Quand vais-je être remboursé ?",
    answer:
      "Une fois vos frais validés par le service comptable et mis en paiement, le remboursement intervient généralement sous 5 à 10 jours ouvrés.",
  },
  {
    id: "faq-4",
    question: "Comment modifier un frais ?",
    answer:
      'Vous pouvez modifier un frais uniquement s\'il est en statut "Brouillon". Une fois soumis pour validation, seul le service comptable peut le modifier ou le refuser.',
  },
  {
    id: "faq-5",
    question: "Que faire si mon frais est refusé ?",
    answer:
      "Si votre frais est refusé, vous recevrez une notification avec le motif du refus. Vous pouvez alors le corriger et le soumettre à nouveau.",
  },
  {
    id: "faq-6",
    question: "Comment mettre à jour mon véhicule ?",
    answer:
      'Rendez-vous dans "Véhicules", vous pouvez ajouter, modifier ou supprimer vos véhicules. Le tarif kilométrique est automatiquement appliqué selon le barème officiel.',
  },
];

/**
 * Aide Page - Page d'aide et support
 */
export class AidePage {
  private currentTab = "faq";

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const html = await renderTemplate(
      "/src/frontend/templates/aide-page.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    window.aidePage = this;

    await this.renderFAQ();
    await this.renderMentions();
    await this.renderRGPD();
    await this.renderContact();

    this.setupEventListeners();
    lucide.createIcons();
  }

  private async renderFAQ(): Promise<void> {
    const container = document.getElementById("faq-container");
    if (!container) return;

    const faqTemplate = await renderTemplate(
      "/src/frontend/templates/aide-faq.tpl.html",
      {}
    );
    container.innerHTML = faqTemplate;

    const accordion = document.getElementById("faq-accordion");
    if (!accordion) return;

    const itemPromises = FAQ_ITEMS.map((item) => this.renderFAQItem(item));
    const items = await Promise.all(itemPromises);
    accordion.innerHTML = items.join("");

    // Event listeners for FAQ accordion
    accordion.querySelectorAll(".faq-trigger").forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        const button = e.currentTarget as HTMLElement;
        const content = button.nextElementSibling as HTMLElement;
        const icon = button.querySelector("i");

        // Toggle current item
        content.classList.toggle("hidden");
        icon?.classList.toggle("rotate-180");

        // Optional: Close other items (accordion behavior)
        // Uncomment to enable single-item-open behavior
        /*
        if (isHidden) {
          accordion.querySelectorAll(".faq-content").forEach((otherContent) => {
            if (otherContent !== content) {
              otherContent.classList.add("hidden");
              const otherIcon = (otherContent.previousElementSibling as HTMLElement)?.querySelector("i");
              otherIcon?.classList.remove("rotate-180");
            }
          });
        }
        */
      });
    });

    lucide.createIcons();
  }

  private async renderFAQItem(item: FAQItem): Promise<string> {
    return await renderTemplate(
      "/src/frontend/templates/aide-faq-item.tpl.html",
      {
        id: item.id,
        question: item.question,
        answer: item.answer,
      }
    );
  }

  private async renderMentions(): Promise<void> {
    const container = document.getElementById("mentions-container");
    if (!container) return;

    const template = await renderTemplate(
      "/src/frontend/templates/aide-mentions.tpl.html",
      {}
    );
    container.innerHTML = template;
  }

  private async renderRGPD(): Promise<void> {
    const container = document.getElementById("rgpd-container");
    if (!container) return;

    const template = await renderTemplate(
      "/src/frontend/templates/aide-rgpd.tpl.html",
      {}
    );
    container.innerHTML = template;
  }

  private async renderContact(): Promise<void> {
    const container = document.getElementById("contact-container");
    if (!container) return;

    const template = await renderTemplate(
      "/src/frontend/templates/aide-contact.tpl.html",
      {}
    );
    container.innerHTML = template;

    // Form submission
    const form = document.getElementById("contact-form") as HTMLFormElement;
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleContactSubmit();
    });

    lucide.createIcons();
  }

  private setupEventListeners(): void {
    // Tab switching
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const tab = (e.currentTarget as HTMLElement).dataset.tab;
        if (tab) {
          this.switchTab(tab);
        }
      });
    });
  }

  private switchTab(tab: string): void {
    this.currentTab = tab;

    // Update button states
    document.querySelectorAll(".tab-button").forEach((button) => {
      const buttonTab = (button as HTMLElement).dataset.tab;
      if (buttonTab === tab) {
        button.classList.add("active", "bg-primary", "text-primary-foreground");
        button.classList.remove("text-muted-foreground", "hover:bg-accent");
      } else {
        button.classList.remove(
          "active",
          "bg-primary",
          "text-primary-foreground"
        );
        button.classList.add("text-muted-foreground", "hover:bg-accent");
      }
    });

    // Show/hide content
    document.querySelectorAll(".tab-content").forEach((content) => {
      const contentId = content.id.replace("tab-", "");
      if (contentId === tab) {
        content.classList.remove("hidden");
        content.classList.add("active");
      } else {
        content.classList.add("hidden");
        content.classList.remove("active");
      }
    });
  }

  private handleContactSubmit(): void {
    const sujetInput = document.getElementById("sujet") as HTMLInputElement;
    const messageInput = document.getElementById(
      "message"
    ) as HTMLTextAreaElement;

    if (!sujetInput || !messageInput) return;

    const sujet = sujetInput.value.trim();
    const message = messageInput.value.trim();

    if (!sujet || !message) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    // TODO: Send message to backend
    console.log("Contact form submitted:", { sujet, message });

    // Show success message
    alert(
      "Message envoyé avec succès. Nous vous répondrons dans les plus brefs délais."
    );

    // Reset form
    sujetInput.value = "";
    messageInput.value = "";
  }
}
