/**
 * Modèle PricingGrid
 * Représente un tarif kilométrique en fonction de la cylindrée
 */
export class PricingGrid {
  private engineSize: number;
  private pricePerKm: number;

  constructor(engineSize = 1600, pricePerKm = 0.45) {
    this.engineSize = engineSize;
    this.pricePerKm = pricePerKm;
  }

  // Getters
  getEngineSize(): number {
    return this.engineSize;
  }

  getPricePerKm(): number {
    return this.pricePerKm;
  }

  // Setters
  setEngineSize(engineSize: number): void {
    this.engineSize = engineSize;
  }

  setPricePerKm(price: number): void {
    this.pricePerKm = price;
  }

  // Méthodes métier
  /**
   * Calcule le tarif pour une distance donnée
   * @param distance Distance en kilomètres
   * @returns Montant total calculé
   */
  calculatePrice(distance: number): number {
    return this.pricePerKm * distance;
  }

  /**
   * Vérifie si le tarif est valide
   */
  isValid(): boolean {
    return this.engineSize > 0 && this.pricePerKm > 0;
  }

  /**
   * Retourne une description du tarif
   */
  toString(): string {
    return `${this.engineSize}cc - ${this.pricePerKm.toFixed(2)}€/km`;
  }

  /**
   * Compare avec un autre tarif
   * @param other Autre PricingGrid à comparer
   * @returns true si les cylindrées correspondent
   */
  matches(other: PricingGrid): boolean {
    return this.engineSize === other.getEngineSize();
  }

  /**
   * Calcule la différence de coût avec un autre tarif
   * @param other Autre PricingGrid
   * @param distance Distance pour le calcul
   * @returns Différence de coût
   */
  compareCost(other: PricingGrid, distance: number): number {
    const currentCost = this.calculatePrice(distance);
    const otherCost = other.calculatePrice(distance);
    return currentCost - otherCost;
  }
}
