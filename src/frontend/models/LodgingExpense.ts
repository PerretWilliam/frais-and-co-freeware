import { Expense, Status } from "./Expense";

/**
 * Modèle LodgingExpense
 * Représente un frais d'hébergement
 */
export class LodgingExpense extends Expense {
  private lodgingCity: string;
  private startDate: Date;
  private endDate: Date;
  private numberOfNights: number;

  constructor(
    expenseId = 0,
    date = new Date(),
    amount = 0,
    receipt = "",
    status = Status.DRAFT,
    createdAt = new Date(),
    lodgingCity = "",
    startDate = new Date(),
    endDate = new Date(),
    numberOfNights = 1
  ) {
    super(expenseId, date, amount, receipt, status, createdAt);
    this.lodgingCity = lodgingCity;
    this.startDate = startDate;
    this.endDate = endDate;
    this.numberOfNights = numberOfNights;
  }

  // Getters
  getLodgingCity(): string {
    return this.lodgingCity;
  }

  getStartDate(): Date {
    return this.startDate;
  }

  getEndDate(): Date {
    return this.endDate;
  }

  getNumberOfNights(): number {
    return this.numberOfNights;
  }

  // Setters
  setLodgingCity(city: string): void {
    this.lodgingCity = city;
  }

  setStartDate(date: Date): void {
    this.startDate = date;
  }

  setEndDate(date: Date): void {
    this.endDate = date;
  }

  setNumberOfNights(nights: number): void {
    this.numberOfNights = nights;
  }

  // Méthodes métier
  /**
   * Calcule le montant total basé sur le tarif par nuit
   * @param pricePerNight Tarif par nuit
   * @returns Montant total
   */
  calculateAmount(pricePerNight: number): number {
    const total = this.numberOfNights * pricePerNight;
    this.setAmount(total);
    return total;
  }

  /**
   * Calcule la durée du séjour en jours
   * @returns Nombre de jours
   */
  calculateDuration(): number {
    const diff = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Vérifie la cohérence entre les dates et le nombre de nuits
   * @returns true si cohérent
   */
  checkConsistency(): boolean {
    const calculatedNights = this.calculateDuration();
    if (calculatedNights !== this.numberOfNights) {
      console.warn(
        `Incohérence: ${calculatedNights} nuits calculées vs ${this.numberOfNights} nuits déclarées`
      );
      return false;
    }
    return true;
  }

  /**
   * Vérifie si le frais est valide
   */
  override isValid(): boolean {
    return (
      super.isValid() &&
      this.lodgingCity.trim() !== "" &&
      this.numberOfNights > 0 &&
      this.startDate < this.endDate &&
      this.checkConsistency()
    );
  }
}
