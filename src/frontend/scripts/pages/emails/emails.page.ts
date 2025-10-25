import { renderTemplate } from "../../template-helper";
import { AuthManager } from "../../auth";
import { router } from "../../router";
import { Role } from "../../../types/api.types";

declare const lucide: {
  createIcons: () => void;
};

declare global {
  interface Window {
    emailsPage: EmailsPage;
  }
}

/**
 * Page d'envoi d'emails (ADMIN et COMPTABLE uniquement)
 */
export class EmailsPage {
  constructor() {
    // Vérifier les autorisations
    const user = AuthManager.getUser();
    if (user?.role !== Role.ADMIN && user?.role !== Role.COMPTABLE) {
      router.navigate("/dashboard");
      return;
    }
  }

  public async render(): Promise<void> {
    const outlet = document.getElementById("router-outlet");
    if (!outlet) return;

    const html = await renderTemplate(
      "/src/frontend/templates/pages/emails-page.tpl.html",
      {}
    );
    outlet.innerHTML = html;

    window.emailsPage = this;

    this.setupEventListeners();
    lucide.createIcons();
  }

  private setupEventListeners(): void {
    // Email form submission
    const form = document.getElementById("email-form") as HTMLFormElement;
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSendEmail(new FormData(form));
    });
  }

  private async handleSendEmail(formData: FormData): Promise<void> {
    const destinataire = formData.get("destinataire") as string;
    const sujet = formData.get("sujet") as string;
    const message = formData.get("message") as string;

    if (!destinataire || !sujet || !message) {
      this.showError("Veuillez remplir tous les champs");
      return;
    }

    try {
      // TODO: Implémenter l'envoi réel d'email via API
      // Pour l'instant, simulation
      console.log("Envoi d'email:", { destinataire, sujet, message });

      this.showSuccess("Email envoyé avec succès");

      // Reset form
      const form = document.getElementById("email-form") as HTMLFormElement;
      form.reset();
    } catch (error) {
      console.error("Erreur envoi email:", error);
      this.showError("Erreur lors de l'envoi de l'email");
    }
  }

  private showSuccess(message: string): void {
    // TODO: Implement toast notification
    alert(message);
  }

  private showError(message: string): void {
    // TODO: Implement toast notification
    alert(message);
  }
}
