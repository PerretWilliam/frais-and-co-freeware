import { User } from "./User";
import { Expense, Status } from "./Expense";
import { Site } from "./Site";

/**
 * Modèle Employee
 * Représente un employé qui peut saisir des frais
 */
export class Employee extends User {
  private sites: Site[] = [];
  private submittedExpenses: Expense[] = [];

  /**
   * Saisit un nouveau frais
   * @param expense Frais à saisir
   * @returns true si la saisie réussit
   */
  submitExpense(expense: Expense): boolean {
    if (!this.isValid()) {
      console.error("Compte employé non validé");
      return false;
    }

    if (!expense.isValid()) {
      console.error("Le frais saisi n'est pas valide");
      return false;
    }

    this.submittedExpenses.push(expense);
    return true;
  }

  /**
   * Valide un frais (soumet pour validation comptable)
   * @param expense Frais à valider
   * @returns true si la validation réussit
   */
  validateExpense(expense: Expense): boolean {
    const index = this.submittedExpenses.indexOf(expense);
    if (index === -1) {
      console.error("Ce frais n'appartient pas à cet employé");
      return false;
    }

    if (!expense.canBeModified()) {
      console.error("Ce frais ne peut plus être modifié");
      return false;
    }

    expense.changeStatus(Status.IN_PROGRESS);
    return true;
  }

  /**
   * Consulte tous les frais saisis
   * @returns Liste de tous les frais
   */
  viewExpenses(): Expense[] {
    return [...this.submittedExpenses];
  }

  /**
   * Consulte les frais par statut
   * @param status Statut recherché
   * @returns Liste des frais avec ce statut
   */
  viewExpensesByStatus(status: string): Expense[] {
    return this.submittedExpenses.filter((e) => e.getStatus() === status);
  }

  /**
   * Modifie un frais existant
   * @param expense Frais à modifier
   * @param newData Nouvelles données du frais
   * @returns true si la modification réussit
   */
  updateExpense(
    expense: Expense,
    newData: { date?: Date; amount?: number; receipt?: string }
  ): boolean {
    const index = this.submittedExpenses.indexOf(expense);
    if (index === -1) {
      console.error("Ce frais n'appartient pas à cet employé");
      return false;
    }

    if (!expense.canBeModified()) {
      console.error("Ce frais ne peut plus être modifié");
      return false;
    }

    // Mise à jour des données
    if (newData.date !== undefined) {
      expense.setDate(newData.date);
    }
    if (newData.amount !== undefined) {
      expense.setAmount(newData.amount);
    }
    if (newData.receipt !== undefined) {
      expense.setReceipt(newData.receipt);
    }

    return true;
  }

  /**
   * Supprime un frais
   * @param expense Frais à supprimer
   * @returns true si la suppression réussit
   */
  deleteExpense(expense: Expense): boolean {
    const index = this.submittedExpenses.indexOf(expense);
    if (index === -1) {
      console.error("Ce frais n'appartient pas à cet employé");
      return false;
    }

    if (!expense.canBeModified()) {
      console.error("Ce frais ne peut plus être supprimé");
      return false;
    }

    this.submittedExpenses.splice(index, 1);
    return true;
  }

  /**
   * Ajoute un chantier à l'employé
   * @param site Chantier à ajouter
   */
  addSite(site: Site): void {
    if (!this.sites.includes(site)) {
      this.sites.push(site);
    }
  }

  /**
   * Retire un chantier de l'employé
   * @param site Chantier à retirer
   */
  removeSite(site: Site): void {
    const index = this.sites.indexOf(site);
    if (index !== -1) {
      this.sites.splice(index, 1);
    }
  }

  /**
   * Consulte tous les chantiers
   * @returns Liste des chantiers
   */
  viewSites(): Site[] {
    return [...this.sites];
  }

  /**
   * Calcule le total des frais saisis
   * @returns Montant total
   */
  calculateTotalExpenses(): number {
    return this.submittedExpenses.reduce((total, expense) => {
      return total + (expense.getAmount() || 0);
    }, 0);
  }

  /**
   * Calcule le total des frais validés
   * @returns Montant total validé
   */
  calculateTotalValidatedExpenses(): number {
    return this.submittedExpenses
      .filter(
        (e) =>
          e.getStatus() === Status.VALIDATED || e.getStatus() === Status.PAID
      )
      .reduce((total, expense) => total + (expense.getAmount() || 0), 0);
  }

  /**
   * Obtient le nombre de frais en attente
   * @returns Nombre de frais en cours
   */
  getPendingExpensesCount(): number {
    return this.submittedExpenses.filter(
      (e) => e.getStatus() === Status.IN_PROGRESS
    ).length;
  }
}
