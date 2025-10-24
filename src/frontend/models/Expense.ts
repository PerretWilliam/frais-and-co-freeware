/**
 * Énumération des statuts de frais
 */
export enum Status {
  DRAFT = "Brouillon",
  IN_PROGRESS = "EnCours",
  VALIDATED = "Valide",
  PAID = "Paye",
  REFUSED = "Refuse",
}

/**
 * Modèle Expense
 * Classe de base pour tous les types de frais
 */
export class Expense {
  protected expenseId: number;
  protected date: Date;
  protected amount: number;
  protected receipt: string;
  protected status: Status;
  protected createdAt: Date;

  constructor(
    expenseId = 0,
    date = new Date(),
    amount = 0,
    receipt = "",
    status = Status.DRAFT,
    createdAt = new Date()
  ) {
    this.expenseId = expenseId;
    this.date = date;
    this.amount = amount;
    this.receipt = receipt;
    this.status = status;
    this.createdAt = createdAt;
  }

  // Getters
  getExpenseId(): number {
    return this.expenseId;
  }

  getDate(): Date {
    return this.date;
  }

  getAmount(): number {
    return this.amount;
  }

  getReceipt(): string {
    return this.receipt;
  }

  getStatus(): Status {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  // Setters
  setExpenseId(id: number): void {
    this.expenseId = id;
  }

  setDate(date: Date): void {
    this.date = date;
  }

  setAmount(amount: number): void {
    this.amount = amount;
  }

  setReceipt(receipt: string): void {
    this.receipt = receipt;
  }

  setStatus(status: Status): void {
    this.status = status;
  }

  // Méthodes métier
  /**
   * Vérifie si le frais est valide
   */
  isValid(): boolean {
    return (
      this.amount > 0 &&
      this.date !== null &&
      (this.status === Status.VALIDATED || this.status === Status.PAID)
    );
  }

  /**
   * Change le statut du frais
   * @param newStatus Nouveau statut à appliquer
   */
  changeStatus(newStatus: Status): void {
    this.status = newStatus;
  }

  /**
   * Ajoute un justificatif au frais
   * @param path Chemin vers le fichier justificatif
   * @returns true si l'ajout est réussi
   */
  addReceipt(path: string): boolean {
    if (!path || path.trim() === "") {
      console.error("Le chemin du justificatif est invalide");
      return false;
    }
    this.receipt = path;
    return true;
  }

  /**
   * Vérifie si le frais peut être modifié
   * @returns true si le statut permet la modification
   */
  canBeModified(): boolean {
    return this.status === Status.DRAFT || this.status === Status.IN_PROGRESS;
  }

  /**
   * Génère un résumé textuel du frais
   * @returns Description formatée
   */
  generateSummary(): string {
    return `Frais #${this.expenseId} - ${this.amount.toFixed(2)}€ (${this.status})`;
  }

  /**
   * Calcule le nombre de jours depuis la création
   * @returns Nombre de jours
   */
  getDaysSinceCreation(): number {
    const now = new Date();
    const diff = now.getTime() - this.createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Vérifie si le frais est ancien (plus de 30 jours)
   * @returns true si plus de 30 jours
   */
  isOld(): boolean {
    return this.getDaysSinceCreation() > 30;
  }
}
