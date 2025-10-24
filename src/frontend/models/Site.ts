import { Expense } from "./Expense";

/**
 * Modèle Site
 * Représente un chantier où sont effectués des travaux
 */
export class Site {
  private siteId: number;
  private siteName: string;
  private siteAddress: string;
  private sitePostalCode: string;
  private siteCity: string;
  private associatedExpenses: Expense[];

  constructor(
    siteId = 0,
    siteName = "",
    siteAddress = "",
    sitePostalCode = "",
    siteCity = "",
    associatedExpenses: Expense[] = []
  ) {
    this.siteId = siteId;
    this.siteName = siteName;
    this.siteAddress = siteAddress;
    this.sitePostalCode = sitePostalCode;
    this.siteCity = siteCity;
    this.associatedExpenses = associatedExpenses;
  }

  // Getters
  getSiteId(): number {
    return this.siteId;
  }

  getSiteName(): string {
    return this.siteName;
  }

  getSiteAddress(): string {
    return this.siteAddress;
  }

  getSitePostalCode(): string {
    return this.sitePostalCode;
  }

  getSiteCity(): string {
    return this.siteCity;
  }

  getAssociatedExpenses(): Expense[] {
    return [...this.associatedExpenses];
  }

  // Setters
  setSiteId(id: number): void {
    this.siteId = id;
  }

  setSiteName(name: string): void {
    this.siteName = name;
  }

  setSiteAddress(address: string): void {
    this.siteAddress = address;
  }

  setSitePostalCode(postalCode: string): void {
    this.sitePostalCode = postalCode;
  }

  setSiteCity(city: string): void {
    this.siteCity = city;
  }

  // Méthodes métier
  /**
   * Retourne l'adresse complète du chantier
   */
  getFullAddress(): string {
    return `${this.siteAddress}, ${this.sitePostalCode} ${this.siteCity}`;
  }

  /**
   * Ajoute un frais au chantier
   * @param expense Frais à ajouter
   */
  addExpense(expense: Expense): void {
    if (!this.associatedExpenses.includes(expense)) {
      this.associatedExpenses.push(expense);
    }
  }

  /**
   * Retire un frais du chantier
   * @param expense Frais à retirer
   */
  removeExpense(expense: Expense): void {
    const index = this.associatedExpenses.indexOf(expense);
    if (index !== -1) {
      this.associatedExpenses.splice(index, 1);
    }
  }

  /**
   * Calcule le total des frais associés au chantier
   * @returns Montant total
   */
  calculateTotalExpenses(): number {
    return this.associatedExpenses.reduce((total, expense) => {
      return total + (expense.getAmount() || 0);
    }, 0);
  }

  /**
   * Obtient les frais par statut
   * @param status Statut recherché
   * @returns Liste des frais avec ce statut
   */
  getExpensesByStatus(status: string): Expense[] {
    return this.associatedExpenses.filter((e) => e.getStatus() === status);
  }

  /**
   * Vérifie si le chantier a des frais
   * @returns true si le chantier a au moins un frais
   */
  hasExpenses(): boolean {
    return this.associatedExpenses.length > 0;
  }

  /**
   * Obtient le nombre de frais associés
   * @returns Nombre de frais
   */
  getExpenseCount(): number {
    return this.associatedExpenses.length;
  }

  /**
   * Vérifie si le chantier est valide
   */
  isValid(): boolean {
    return (
      this.siteName.trim() !== "" &&
      this.siteAddress.trim() !== "" &&
      this.sitePostalCode.trim() !== "" &&
      this.siteCity.trim() !== ""
    );
  }
}
