export class Footer {
  private container: HTMLElement;

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Element with id "${containerId}" not found`);
    }
    this.container = element;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <footer class="border-t bg-card py-4 px-6 mt-auto z-20 relative">
        <div class="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div class="flex gap-4">
            <a href="#" class="hover:text-foreground transition-colors">Mentions légales</a>
            <a href="#" class="hover:text-foreground transition-colors">RGPD</a>
            <a href="#" class="hover:text-foreground transition-colors">Contact support</a>
          </div>
          <div>
            © 2025 GestionFrais Pro - v1.0
          </div>
        </div>
      </footer>
    `;
  }
}
