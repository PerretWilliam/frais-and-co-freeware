import { renderTemplate } from "./template-helper";

export class Footer {
  private container: HTMLElement;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Element with id "${containerId}" not found`);
    }
    this.container = element;
    void this.render();
  }

  private async render(): Promise<void> {
    const footerHtml = await renderTemplate(
      "/src/frontend/templates/footer.tpl.html",
      {}
    );
    this.container.innerHTML = footerHtml;
  }
}
