import { Expense, Status } from "./Expense";

/**
 * Modèle MealExpense
 * Représente un frais de repas
 */
export class MealExpense extends Expense {
  private mealType: string;

  constructor(
    expenseId = 0,
    date = new Date(),
    amount = 0,
    receipt = "",
    status = Status.DRAFT,
    createdAt = new Date(),
    mealType = "Déjeuner"
  ) {
    super(expenseId, date, amount, receipt, status, createdAt);
    this.mealType = mealType;
  }

  // Getters
  getMealType(): string {
    return this.mealType;
  }

  // Setters
  setMealType(type: string): void {
    this.mealType = type;
  }

  // Méthodes métier
  /**
   * Calcule le montant du repas selon le type
   * @param mealPrice Tarif de base pour un repas
   * @returns Montant calculé
   */
  calculateAmount(mealPrice: number): number {
    let multiplier = 1.0;

    switch (this.mealType.toLowerCase()) {
      case "petit-déjeuner":
      case "petit déjeuner":
      case "breakfast":
        multiplier = 0.4;
        break;
      case "déjeuner":
      case "dejeuner":
      case "lunch":
        multiplier = 1.0;
        break;
      case "dîner":
      case "diner":
      case "dinner":
        multiplier = 1.2;
        break;
      default:
        multiplier = 1.0;
    }

    const total = mealPrice * multiplier;
    this.setAmount(total);
    return total;
  }

  /**
   * Vérifie si le type de repas est valide
   * @returns true si le type est reconnu
   */
  isValidMealType(): boolean {
    const validTypes = [
      "petit-déjeuner",
      "petit déjeuner",
      "breakfast",
      "déjeuner",
      "dejeuner",
      "lunch",
      "dîner",
      "diner",
      "dinner",
    ];
    return validTypes.some(
      (type) => type.toLowerCase() === this.mealType.toLowerCase()
    );
  }

  /**
   * Vérifie si le frais est valide
   */
  override isValid(): boolean {
    return super.isValid() && this.isValidMealType();
  }
}
