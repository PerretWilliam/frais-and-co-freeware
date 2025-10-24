/**
 * Énumération des types d'essence
 */
export enum FuelType {
  DIESEL = "Diesel",
  ETHANOL = "Ethanol",
  OTHER = "Autres",
  GASOIL = "GazoIe",
  ELECTRIC = "Electrique",
  SP95 = "SP95",
  SP98 = "SP98",
}

/**
 * Modèle Car
 * Représente un véhicule utilisé pour les déplacements
 */
export class Car {
  private licensePlate: string;
  private isPersonal: boolean;
  private fuelType: FuelType;
  private engineSize: number;
  private brand: string;
  private model: string;

  constructor(
    licensePlate = "",
    isPersonal = true,
    fuelType = FuelType.DIESEL,
    engineSize = 1600,
    brand = "",
    model = ""
  ) {
    this.licensePlate = licensePlate;
    this.isPersonal = isPersonal;
    this.fuelType = fuelType;
    this.engineSize = engineSize;
    this.brand = brand;
    this.model = model;
  }

  // Getters
  getLicensePlate(): string {
    return this.licensePlate;
  }

  getIsPersonal(): boolean {
    return this.isPersonal;
  }

  getFuelType(): FuelType {
    return this.fuelType;
  }

  getEngineSize(): number {
    return this.engineSize;
  }

  getBrand(): string {
    return this.brand;
  }

  getModel(): string {
    return this.model;
  }

  // Setters
  setLicensePlate(licensePlate: string): void {
    this.licensePlate = licensePlate;
  }

  setIsPersonal(isPersonal: boolean): void {
    this.isPersonal = isPersonal;
  }

  setFuelType(fuelType: FuelType): void {
    this.fuelType = fuelType;
  }

  setEngineSize(engineSize: number): void {
    this.engineSize = engineSize;
  }

  setBrand(brand: string): void {
    this.brand = brand;
  }

  setModel(model: string): void {
    this.model = model;
  }

  // Méthodes métier
  /**
   * Calcule la consommation estimée pour une distance donnée
   * @param distance Distance en kilomètres
   * @returns Consommation estimée en litres
   */
  calculateConsumption(distance: number): number {
    // Consommation moyenne basée sur la cylindrée
    let consumptionPer100km: number;

    if (this.fuelType === FuelType.ELECTRIC) {
      // Pour les voitures électriques, on retourne 0 (consommation en kWh)
      return 0;
    }

    if (this.engineSize < 1200) {
      consumptionPer100km = 5.5;
    } else if (this.engineSize < 1600) {
      consumptionPer100km = 6.5;
    } else if (this.engineSize < 2000) {
      consumptionPer100km = 7.5;
    } else {
      consumptionPer100km = 9.0;
    }

    // Ajustement pour le diesel (environ 10% plus économique)
    if (
      this.fuelType === FuelType.DIESEL ||
      this.fuelType === FuelType.GASOIL
    ) {
      consumptionPer100km *= 0.9;
    }

    return (distance / 100) * consumptionPer100km;
  }

  /**
   * Calcule le coût du carburant pour un trajet
   * @param pricePerLiter Prix du carburant au litre
   * @param consumption Consommation en litres (optionnel)
   * @returns Coût total du carburant
   */
  calculateFuelCost(pricePerLiter: number, consumption?: number): number {
    if (this.fuelType === FuelType.ELECTRIC) {
      // Coût moyen électrique : 0.15€/km
      return consumption ? consumption * 0.15 : 0;
    }

    if (consumption === undefined) {
      console.error("La consommation doit être fournie pour calculer le coût");
      return 0;
    }

    return consumption * pricePerLiter;
  }

  /**
   * Vérifie si la voiture est valide
   */
  isValid(): boolean {
    return (
      this.licensePlate.trim() !== "" &&
      this.engineSize > 0 &&
      this.brand.trim() !== "" &&
      this.model.trim() !== ""
    );
  }

  /**
   * Retourne une description complète de la voiture
   */
  toString(): string {
    return `${this.brand} ${this.model} (${this.licensePlate}) - ${this.fuelType}, ${this.engineSize}cc`;
  }
}
