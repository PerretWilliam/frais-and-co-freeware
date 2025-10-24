import { User } from "./User";
import { Expense, Status } from "./Expense";

/**
 * Modèle Accountant
 * Représente un comptable qui peut contrôler et valider les frais
 */
export class Accountant extends User {
  private expensesToControl: Expense[] = [];

  /**
   * Contrôle un frais (vérifie les justificatifs et montants)
   * @param expense Frais à contrôler
   * @returns true si le contrôle réussit
   */
  controlExpense(expense: Expense): boolean {
    if (!this.isValid()) {
      console.error("Compte comptable non validé");
      return false;
    }

    if (expense.getStatus() !== Status.IN_PROGRESS) {
      console.error("Ce frais n'est pas en cours de validation");
      return false;
    }

    // Vérifications de base
    if (!expense.isValid()) {
      console.error("Le frais ne respecte pas les critères de validité");
      return false;
    }

    if (!expense.getReceipt() || expense.getReceipt().trim() === "") {
      console.error("Le frais ne possède pas de justificatif");
      return false;
    }

    // Ajouter à la liste des frais à contrôler si pas déjà présent
    if (!this.expensesToControl.includes(expense)) {
      this.expensesToControl.push(expense);
    }

    return true;
  }

  /**
   * Accepte un frais
   * @param expense Frais à accepter
   * @returns true si l'acceptation réussit
   */
  acceptExpense(expense: Expense): boolean {
    if (!this.isValid()) {
      console.error("Compte comptable non validé");
      return false;
    }

    if (expense.getStatus() !== Status.IN_PROGRESS) {
      console.error("Ce frais n'est pas en cours de validation");
      return false;
    }

    expense.changeStatus(Status.VALIDATED);
    return true;
  }

  /**
   * Refuse un frais avec un motif
   * @param expense Frais à refuser
   * @param reason Motif du refus
   * @returns true si le refus réussit
   */
  refuseExpense(expense: Expense, reason: string): boolean {
    if (!this.isValid()) {
      console.error("Compte comptable non validé");
      return false;
    }

    if (expense.getStatus() !== Status.IN_PROGRESS) {
      console.error("Ce frais n'est pas en cours de validation");
      return false;
    }

    if (!reason || reason.trim() === "") {
      console.error("Un motif de refus est obligatoire");
      return false;
    }

    expense.changeStatus(Status.REFUSED);
    // Le motif pourrait être stocké dans le justificatif ou une nouvelle propriété
    expense.setReceipt(`REFUS: ${reason}`);

    return true;
  }

  /**
   * Met un frais en paiement
   * @param expense Frais à mettre en paiement
   * @returns true si la mise en paiement réussit
   */
  setExpenseForPayment(expense: Expense): boolean {
    if (!this.isValid()) {
      console.error("Compte comptable non validé");
      return false;
    }

    if (expense.getStatus() !== Status.VALIDATED) {
      console.error("Ce frais n'est pas validé");
      return false;
    }

    expense.changeStatus(Status.PAID);
    return true;
  }

  /**
   * Confirme le paiement d'un frais
   * @param expense Frais dont le paiement est confirmé
   * @returns true si la confirmation réussit
   */
  confirmPayment(expense: Expense): boolean {
    if (!this.isValid()) {
      console.error("Compte comptable non validé");
      return false;
    }

    if (expense.getStatus() !== Status.PAID) {
      console.error("Ce frais n'est pas marqué comme payé");
      return false;
    }

    // Le frais reste au statut PAID, mais on pourrait ajouter une confirmation
    console.log(`Paiement confirmé pour le frais #${expense.getExpenseId()}`);
    return true;
  }

  /**
   * Liste tous les frais en attente de contrôle
   * @returns Liste des frais avec statut IN_PROGRESS
   */
  listPendingExpenses(): Expense[] {
    return this.expensesToControl.filter(
      (e) => e.getStatus() === Status.IN_PROGRESS
    );
  }

  /**
   * Liste tous les frais validés
   * @returns Liste des frais avec statut VALIDATED
   */
  listValidatedExpenses(): Expense[] {
    return this.expensesToControl.filter(
      (e) => e.getStatus() === Status.VALIDATED
    );
  }

  /**
   * Liste tous les frais refusés
   * @returns Liste des frais avec statut REFUSED
   */
  listRefusedExpenses(): Expense[] {
    return this.expensesToControl.filter(
      (e) => e.getStatus() === Status.REFUSED
    );
  }

  /**
   * Liste tous les frais payés
   * @returns Liste des frais avec statut PAID
   */
  listPaidExpenses(): Expense[] {
    return this.expensesToControl.filter((e) => e.getStatus() === Status.PAID);
  }

  /**
   * Calcule le total des frais validés
   * @returns Montant total des frais validés
   */
  calculateTotalValidatedExpenses(): number {
    return this.listValidatedExpenses().reduce((total, expense) => {
      return total + expense.getAmount();
    }, 0);
  }

  /**
   * Calcule le total des frais payés
   * @returns Montant total des frais payés
   */
  calculateTotalPaidExpenses(): number {
    return this.listPaidExpenses().reduce((total, expense) => {
      return total + expense.getAmount();
    }, 0);
  }

  /**
   * Calcule le total des frais en attente
   * @returns Montant total des frais en attente de validation
   */
  calculateTotalPendingExpenses(): number {
    return this.listPendingExpenses().reduce((total, expense) => {
      return total + expense.getAmount();
    }, 0);
  }

  /**
   * Ajoute un frais à la liste de contrôle
   * @param expense Frais à ajouter
   */
  addExpenseToControl(expense: Expense): void {
    if (!this.expensesToControl.includes(expense)) {
      this.expensesToControl.push(expense);
    }
  }

  /**
   * Retire un frais de la liste de contrôle
   * @param expense Frais à retirer
   */
  removeExpenseToControl(expense: Expense): void {
    const index = this.expensesToControl.indexOf(expense);
    if (index !== -1) {
      this.expensesToControl.splice(index, 1);
    }
  }

  /**
   * Obtient le nombre de frais en attente de validation
   * @returns Nombre de frais en attente
   */
  getPendingExpensesCount(): number {
    return this.listPendingExpenses().length;
  }

  /**
   * Obtient le nombre de frais traités (validés + refusés + payés)
   * @returns Nombre de frais traités
   */
  getProcessedExpensesCount(): number {
    return this.expensesToControl.filter(
      (e) =>
        e.getStatus() === Status.VALIDATED ||
        e.getStatus() === Status.REFUSED ||
        e.getStatus() === Status.PAID
    ).length;
  }
}
