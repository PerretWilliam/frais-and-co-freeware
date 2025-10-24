import { User } from "./User";

/**
 * Modèle Administrator
 * Représente un administrateur qui peut gérer les comptes utilisateurs
 */
export class Administrator extends User {
  private managedAccounts: User[] = [];

  /**
   * Modifie les informations d'un compte utilisateur
   * @param user Utilisateur à modifier
   * @param newData Nouvelles données à appliquer
   * @returns true si la modification réussit
   */
  updateAccount(
    user: User,
    newData: {
      lastName?: string;
      firstName?: string;
      email?: string;
      address?: string;
    }
  ): boolean {
    if (!this.isValid()) {
      console.error("Compte administrateur non validé");
      return false;
    }

    if (!user) {
      console.error("Utilisateur invalide");
      return false;
    }

    // Mise à jour des données
    if (newData.lastName !== undefined) {
      user.setLastName(newData.lastName);
    }
    if (newData.firstName !== undefined) {
      user.setFirstName(newData.firstName);
    }
    if (newData.email !== undefined) {
      user.setEmail(newData.email);
    }
    if (newData.address !== undefined) {
      user.setAddress(newData.address);
    }

    return true;
  }

  /**
   * Supprime un compte utilisateur
   * @param user Utilisateur à supprimer
   * @returns true si la suppression réussit
   */
  deleteAccount(user: User): boolean {
    if (!this.isValid()) {
      console.error("Compte administrateur non validé");
      return false;
    }

    if (!user) {
      console.error("Utilisateur invalide");
      return false;
    }

    // Ne peut pas se supprimer soi-même
    if (user.getId() === this.getId()) {
      console.error(
        "Un administrateur ne peut pas supprimer son propre compte"
      );
      return false;
    }

    const index = this.managedAccounts.indexOf(user);
    if (index !== -1) {
      this.managedAccounts.splice(index, 1);
    }

    return true;
  }

  /**
   * Valide un compte utilisateur
   * @param user Utilisateur à valider
   * @returns true si la validation réussit
   */
  validateAccount(user: User): boolean {
    if (!this.isValid()) {
      console.error("Compte administrateur non validé");
      return false;
    }

    if (!user) {
      console.error("Utilisateur invalide");
      return false;
    }

    user.setValide(true);

    // Ajouter à la liste des comptes gérés si pas déjà présent
    if (!this.managedAccounts.includes(user)) {
      this.managedAccounts.push(user);
    }

    return true;
  }

  /**
   * Invalide un compte utilisateur (suspension)
   * @param user Utilisateur à invalider
   * @returns true si l'invalidation réussit
   */
  invalidateAccount(user: User): boolean {
    if (!this.isValid()) {
      console.error("Compte administrateur non validé");
      return false;
    }

    if (!user) {
      console.error("Utilisateur invalide");
      return false;
    }

    // Ne peut pas s'invalider soi-même
    if (user.getId() === this.getId()) {
      console.error(
        "Un administrateur ne peut pas invalider son propre compte"
      );
      return false;
    }

    user.setValide(false);
    return true;
  }

  /**
   * Liste tous les comptes non validés
   * @returns Liste des utilisateurs non validés
   */
  listUnvalidatedAccounts(): User[] {
    return this.managedAccounts.filter((u) => !u.isValid());
  }

  /**
   * Liste tous les comptes validés
   * @returns Liste des utilisateurs validés
   */
  listValidatedAccounts(): User[] {
    return this.managedAccounts.filter((u) => u.isValid());
  }

  /**
   * Liste tous les comptes gérés
   * @returns Liste de tous les utilisateurs
   */
  listAllAccounts(): User[] {
    return [...this.managedAccounts];
  }

  /**
   * Recherche un utilisateur par email
   * @param email Email de l'utilisateur
   * @returns Utilisateur trouvé ou undefined
   */
  searchByEmail(email: string): User | undefined {
    return this.managedAccounts.find((u) => u.getEmail() === email);
  }

  /**
   * Recherche un utilisateur par nom et prénom
   * @param lastName Nom de l'utilisateur
   * @param firstName Prénom de l'utilisateur
   * @returns Utilisateur trouvé ou undefined
   */
  searchByName(lastName: string, firstName: string): User | undefined {
    return this.managedAccounts.find(
      (u) => u.getLastName() === lastName && u.getFirstName() === firstName
    );
  }

  /**
   * Ajoute un utilisateur à la liste des comptes gérés
   * @param user Utilisateur à ajouter
   */
  addManagedAccount(user: User): void {
    if (!this.managedAccounts.includes(user)) {
      this.managedAccounts.push(user);
    }
  }

  /**
   * Retire un utilisateur de la liste des comptes gérés
   * @param user Utilisateur à retirer
   */
  removeManagedAccount(user: User): void {
    const index = this.managedAccounts.indexOf(user);
    if (index !== -1) {
      this.managedAccounts.splice(index, 1);
    }
  }

  /**
   * Obtient le nombre de comptes en attente de validation
   * @returns Nombre de comptes non validés
   */
  getPendingAccountsCount(): number {
    return this.listUnvalidatedAccounts().length;
  }

  /**
   * Obtient le nombre total de comptes gérés
   * @returns Nombre total de comptes
   */
  getTotalAccountsCount(): number {
    return this.managedAccounts.length;
  }

  /**
   * Réinitialise le mot de passe d'un utilisateur
   * @param user Utilisateur dont le mot de passe doit être réinitialisé
   * @param newPassword Nouveau mot de passe temporaire
   * @returns true si la réinitialisation réussit
   */
  resetPassword(user: User, newPassword: string): boolean {
    if (!this.isValid()) {
      console.error("Compte administrateur non validé");
      return false;
    }

    if (!user) {
      console.error("Utilisateur invalide");
      return false;
    }

    if (!newPassword || newPassword.length < 8) {
      console.error(
        "Le nouveau mot de passe doit contenir au moins 8 caractères"
      );
      return false;
    }

    user.setPassword(newPassword);
    return true;
  }
}
