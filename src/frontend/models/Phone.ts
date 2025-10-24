/**
 * Modèle Phone
 * Représente un numéro de téléphone avec indicatifs
 */
export class Phone {
  private countryCode: string;
  private regionCode: string;
  private number: string;

  constructor(countryCode = "33", regionCode = "", number = "") {
    this.countryCode = countryCode;
    this.regionCode = regionCode;
    this.number = number;
  }

  // Getters
  getCountryCode(): string {
    return this.countryCode;
  }

  getRegionCode(): string {
    return this.regionCode;
  }

  getNumber(): string {
    return this.number;
  }

  // Setters
  setCountryCode(countryCode: string): void {
    this.countryCode = countryCode;
  }

  setRegionCode(regionCode: string): void {
    this.regionCode = regionCode;
  }

  setNumber(number: string): void {
    this.number = number;
  }

  // Méthodes utilitaires
  /**
   * Retourne le numéro de téléphone complet formaté
   */
  getFullNumber(): string {
    return `+${this.countryCode}${this.regionCode}${this.number}`;
  }

  /**
   * Vérifie si le numéro est valide
   */
  isValid(): boolean {
    return (
      this.countryCode.length >= 1 &&
      this.countryCode.length <= 3 &&
      this.number.length >= 8 &&
      this.number.length <= 15
    );
  }

  /**
   * Retourne une représentation textuelle du téléphone
   */
  toString(): string {
    return this.getFullNumber();
  }
}
