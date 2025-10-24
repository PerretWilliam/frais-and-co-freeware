import { Phone } from "./Phone";
import { Car } from "./Car";

/**
 * Modèle User
 * Classe de base pour tous les utilisateurs du système
 */
export class User {
  protected id: number;
  protected lastName: string;
  protected firstName: string;
  protected email: string;
  protected password: string;
  protected phone: Phone;
  protected address: string;
  protected isValidated: boolean;
  protected car?: Car;

  constructor(
    id = 0,
    lastName = "",
    firstName = "",
    email = "",
    password = "",
    phone = new Phone(),
    address = "",
    isValidated = false,
    car?: Car
  ) {
    this.id = id;
    this.lastName = lastName;
    this.firstName = firstName;
    this.email = email;
    this.password = password;
    this.phone = phone;
    this.address = address;
    this.isValidated = isValidated;
    this.car = car;
  }

  // Getters
  getId(): number {
    return this.id;
  }

  getLastName(): string {
    return this.lastName;
  }

  getFirstName(): string {
    return this.firstName;
  }

  getEmail(): string {
    return this.email;
  }

  getPassword(): string {
    return this.password;
  }

  getPhone(): Phone {
    return this.phone;
  }

  getAddress(): string {
    return this.address;
  }

  isValid(): boolean {
    return this.isValidated;
  }

  getCar(): Car | undefined {
    return this.car;
  }

  // Setters
  setId(id: number): void {
    this.id = id;
  }

  setLastName(lastName: string): void {
    this.lastName = lastName;
  }

  setFirstName(firstName: string): void {
    this.firstName = firstName;
  }

  setEmail(email: string): void {
    this.email = email;
  }

  setPassword(password: string): void {
    this.password = password;
  }

  setPhone(phone: Phone): void {
    this.phone = phone;
  }

  setAddress(address: string): void {
    this.address = address;
  }

  setValide(validated: boolean): void {
    this.isValidated = validated;
  }

  setCar(car: Car | undefined): void {
    this.car = car;
  }

  // Méthodes métier
  /**
   * Authentifie l'utilisateur
   * @param email Email de connexion
   * @param password Mot de passe
   * @returns true si l'authentification réussit
   */
  login(email: string, password: string): boolean {
    if (
      this.email === email &&
      this.password === password &&
      this.isValidated
    ) {
      console.log(`Connexion réussie pour ${this.firstName} ${this.lastName}`);
      return true;
    }
    console.error("Email, mot de passe incorrect ou compte non validé");
    return false;
  }

  /**
   * Crée un nouveau compte
   * @param lastName Nom
   * @param firstName Prénom
   * @param email Email
   * @param password Mot de passe
   * @param phone Téléphone
   * @param address Adresse
   * @returns true si la création réussit
   */
  createAccount(
    lastName: string,
    firstName: string,
    email: string,
    password: string,
    phone: Phone,
    address: string
  ): boolean {
    if (!this.isValidEmail(email)) {
      console.error("Email invalide");
      return false;
    }

    if (!this.isValidPassword(password)) {
      console.error("Mot de passe invalide (minimum 8 caractères requis)");
      return false;
    }

    this.lastName = lastName;
    this.firstName = firstName;
    this.email = email;
    this.password = password;
    this.phone = phone;
    this.address = address;
    this.isValidated = false; // Nécessite validation admin

    console.log("Compte créé avec succès. En attente de validation.");
    return true;
  }

  /**
   * Modifie le profil utilisateur
   * @param updates Données à mettre à jour
   * @returns true si la modification réussit
   */
  updateProfile(updates: {
    lastName?: string;
    firstName?: string;
    address?: string;
    phone?: Phone;
    car?: Car;
  }): boolean {
    if (updates.lastName !== undefined) {
      this.lastName = updates.lastName;
    }
    if (updates.firstName !== undefined) {
      this.firstName = updates.firstName;
    }
    if (updates.address !== undefined) {
      this.address = updates.address;
    }
    if (updates.phone !== undefined) {
      this.phone = updates.phone;
    }
    if (updates.car !== undefined) {
      this.car = updates.car;
    }

    console.log("Profil mis à jour avec succès");
    return true;
  }

  /**
   * Change le mot de passe
   * @param oldPassword Ancien mot de passe
   * @param newPassword Nouveau mot de passe
   * @returns true si le changement réussit
   */
  changePassword(oldPassword: string, newPassword: string): boolean {
    if (this.password !== oldPassword) {
      console.error("Ancien mot de passe incorrect");
      return false;
    }

    if (!this.isValidPassword(newPassword)) {
      console.error(
        "Nouveau mot de passe invalide (minimum 8 caractères requis)"
      );
      return false;
    }

    this.password = newPassword;
    console.log("Mot de passe changé avec succès");
    return true;
  }

  /**
   * Vérifie si un email est valide
   * @param email Email à vérifier
   * @returns true si valide
   */
  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Vérifie si un mot de passe est valide
   * @param password Mot de passe à vérifier
   * @returns true si valide
   */
  private isValidPassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Obtient le nom complet
   * @returns Prénom + Nom
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Vérifie si l'utilisateur a une voiture
   * @returns true si une voiture est associée
   */
  hasCar(): boolean {
    return this.car !== undefined;
  }
}
