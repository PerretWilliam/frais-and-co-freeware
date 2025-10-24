import { Expense, Status } from "./Expense";

/**
 * Service externe pour le calcul de distances
 * (Simulation de l'API Google Maps)
 */
export class GoogleMapsAPI {
  /**
   * Calcule la distance entre deux villes
   * @param departure Ville de départ
   * @param arrival Ville d'arrivée
   * @returns Distance en kilomètres
   */
  static getDistance(departure: string, arrival: string): number {
    // Simulation : distances entre quelques villes françaises courantes
    const distances: { [key: string]: number } = {
      "paris-lyon": 465,
      "paris-marseille": 775,
      "lyon-marseille": 315,
      "paris-toulouse": 680,
      "paris-bordeaux": 580,
      "lyon-toulouse": 535,
    };

    const key1 = `${departure.toLowerCase()}-${arrival.toLowerCase()}`;
    const key2 = `${arrival.toLowerCase()}-${departure.toLowerCase()}`;

    return distances[key1] || distances[key2] || 100; // Distance par défaut
  }

  /**
   * Calcule le coût d'un déplacement
   * @param departure Ville de départ
   * @param arrival Ville d'arrivée
   * @param pricePerKm Tarif au kilomètre
   * @returns Coût total du déplacement
   */
  static calculateTravelCost(
    departure: string,
    arrival: string,
    pricePerKm: number
  ): number {
    const distance = this.getDistance(departure, arrival);
    return distance * pricePerKm;
  }
}

/**
 * Modèle TravelExpense
 * Représente un frais de déplacement en voiture
 */
export class TravelExpense extends Expense {
  private departureCity: string;
  private arrivalCity: string;
  private distanceKm: number;

  constructor(
    expenseId = 0,
    date = new Date(),
    amount = 0,
    receipt = "",
    status = Status.DRAFT,
    createdAt = new Date(),
    departureCity = "",
    arrivalCity = "",
    distanceKm = 0
  ) {
    super(expenseId, date, amount, receipt, status, createdAt);
    this.departureCity = departureCity;
    this.arrivalCity = arrivalCity;
    this.distanceKm = distanceKm;
  }

  // Getters
  getDepartureCity(): string {
    return this.departureCity;
  }

  getArrivalCity(): string {
    return this.arrivalCity;
  }

  getDistanceKm(): number {
    return this.distanceKm;
  }

  // Setters
  setDepartureCity(city: string): void {
    this.departureCity = city;
  }

  setArrivalCity(city: string): void {
    this.arrivalCity = city;
  }

  setDistanceKm(distance: number): void {
    this.distanceKm = distance;
  }

  // Méthodes métier
  /**
   * Calcule la distance du trajet via l'API Google Maps
   * @returns Distance calculée
   */
  calculateDistance(): number {
    if (this.departureCity && this.arrivalCity) {
      this.distanceKm = GoogleMapsAPI.getDistance(
        this.departureCity,
        this.arrivalCity
      );
    }
    return this.distanceKm;
  }

  /**
   * Calcule le montant total basé sur le tarif kilométrique
   * @param pricePerKm Tarif au kilomètre
   * @returns Montant total
   */
  calculateAmount(pricePerKm: number): number {
    // Si la distance n'est pas définie, la calculer
    if (this.distanceKm === 0) {
      this.calculateDistance();
    }

    const total = this.distanceKm * pricePerKm;
    this.setAmount(total);
    return total;
  }

  /**
   * Vérifie si le frais est valide
   */
  override isValid(): boolean {
    return (
      super.isValid() &&
      this.departureCity.trim() !== "" &&
      this.arrivalCity.trim() !== "" &&
      this.distanceKm > 0
    );
  }
}
