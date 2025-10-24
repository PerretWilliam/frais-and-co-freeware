import { User } from "./User";

/**
 * Modèle MailService
 * Service pour l'envoi d'emails de notification
 */
export class MailService {
  private static instance: MailService;
  private sender: string;
  private smtpServer: string;
  private smtpPort: number;

  private constructor(
    sender = "noreply@frais-and-co.fr",
    smtpServer = "smtp.frais-and-co.fr",
    smtpPort = 587
  ) {
    this.sender = sender;
    this.smtpServer = smtpServer;
    this.smtpPort = smtpPort;
  }

  /**
   * Obtient l'instance unique du service (Singleton)
   */
  static getInstance(): MailService {
    if (!MailService.instance) {
      MailService.instance = new MailService();
    }
    return MailService.instance;
  }

  // Getters
  getSender(): string {
    return this.sender;
  }

  getSmtpServer(): string {
    return this.smtpServer;
  }

  getSmtpPort(): number {
    return this.smtpPort;
  }

  // Setters
  setSender(sender: string): void {
    this.sender = sender;
  }

  setSmtpServer(server: string): void {
    this.smtpServer = server;
  }

  setSmtpPort(port: number): void {
    this.smtpPort = port;
  }

  /**
   * Envoie une notification générique
   * @param recipient Email du destinataire
   * @param subject Sujet de l'email
   * @param content Contenu de l'email
   * @returns true si l'envoi réussit
   */
  sendNotification(
    recipient: string,
    subject: string,
    content: string
  ): boolean {
    if (!this.isValidEmail(recipient)) {
      console.error("Email destinataire invalide");
      return false;
    }

    if (!subject || subject.trim() === "") {
      console.error("Le sujet de l'email est requis");
      return false;
    }

    if (!content || content.trim() === "") {
      console.error("Le contenu de l'email est requis");
      return false;
    }

    // Simulation d'envoi d'email
    console.log("═══════════════════════════════════════");
    console.log(`📧 EMAIL ENVOYÉ`);
    console.log(`De: ${this.sender}`);
    console.log(`À: ${recipient}`);
    console.log(`Sujet: ${subject}`);
    console.log(`Serveur: ${this.smtpServer}:${this.smtpPort}`);
    console.log("─────────────────────────────────────");
    console.log(content);
    console.log("═══════════════════════════════════════");

    return true;
  }

  /**
   * Envoie un email de validation de compte
   * @param user Utilisateur dont le compte est validé
   * @returns true si l'envoi réussit
   */
  sendAccountValidation(user: User): boolean {
    const subject = "Votre compte Frais & Co a été validé";
    const content = `
Bonjour ${user.getFirstName()} ${user.getLastName()},

Nous avons le plaisir de vous informer que votre compte Frais & Co a été validé par un administrateur.

Vous pouvez désormais vous connecter à l'application avec vos identifiants :
Email : ${user.getEmail()}

Bienvenue dans l'équipe !

Cordialement,
L'équipe Frais & Co
    `.trim();

    return this.sendNotification(user.getEmail(), subject, content);
  }

  /**
   * Envoie un email de refus de frais
   * @param user Utilisateur concerné
   * @param expenseId ID du frais refusé
   * @param reason Motif du refus
   * @returns true si l'envoi réussit
   */
  sendExpenseRefusal(user: User, expenseId: number, reason: string): boolean {
    const subject = `Refus de votre note de frais #${expenseId}`;
    const content = `
Bonjour ${user.getFirstName()} ${user.getLastName()},

Votre note de frais #${expenseId} a été refusée par le service comptabilité.

Motif du refus :
${reason}

Vous pouvez modifier et resoumettre votre note de frais après correction.

Pour toute question, n'hésitez pas à contacter le service comptabilité.

Cordialement,
L'équipe Frais & Co
    `.trim();

    return this.sendNotification(user.getEmail(), subject, content);
  }

  /**
   * Envoie un email de confirmation de paiement
   * @param user Utilisateur concerné
   * @param expenseId ID du frais payé
   * @param amount Montant payé
   * @returns true si l'envoi réussit
   */
  sendPaymentConfirmation(
    user: User,
    expenseId: number,
    amount: number
  ): boolean {
    const subject = `Confirmation de paiement - Note de frais #${expenseId}`;
    const content = `
Bonjour ${user.getFirstName()} ${user.getLastName()},

Nous vous confirmons le paiement de votre note de frais #${expenseId}.

Montant : ${amount.toFixed(2)} €

Le virement sera effectué sous 2 à 3 jours ouvrés sur le compte bancaire associé à votre profil.

Pour toute question, n'hésitez pas à contacter le service comptabilité.

Cordialement,
L'équipe Frais & Co
    `.trim();

    return this.sendNotification(user.getEmail(), subject, content);
  }

  /**
   * Envoie un email de validation de frais
   * @param user Utilisateur concerné
   * @param expenseId ID du frais validé
   * @param amount Montant du frais
   * @returns true si l'envoi réussit
   */
  sendExpenseValidation(
    user: User,
    expenseId: number,
    amount: number
  ): boolean {
    const subject = `Validation de votre note de frais #${expenseId}`;
    const content = `
Bonjour ${user.getFirstName()} ${user.getLastName()},

Votre note de frais #${expenseId} a été validée par le service comptabilité.

Montant validé : ${amount.toFixed(2)} €

Le paiement sera effectué prochainement. Vous recevrez un email de confirmation une fois le virement effectué.

Cordialement,
L'équipe Frais & Co
    `.trim();

    return this.sendNotification(user.getEmail(), subject, content);
  }

  /**
   * Envoie un email de rappel pour des frais en attente
   * @param user Utilisateur concerné
   * @param expenseCount Nombre de frais en attente
   * @returns true si l'envoi réussit
   */
  sendPendingExpensesReminder(user: User, expenseCount: number): boolean {
    const subject = "Rappel : Notes de frais en attente de soumission";
    const content = `
Bonjour ${user.getFirstName()} ${user.getLastName()},

Vous avez actuellement ${expenseCount} note${expenseCount > 1 ? "s" : ""} de frais en brouillon.

N'oubliez pas de les soumettre pour validation avant la fin du mois afin de garantir un remboursement rapide.

Connectez-vous à l'application pour gérer vos notes de frais.

Cordialement,
L'équipe Frais & Co
    `.trim();

    return this.sendNotification(user.getEmail(), subject, content);
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   * @param user Utilisateur concerné
   * @param resetLink Lien de réinitialisation
   * @returns true si l'envoi réussit
   */
  sendPasswordReset(user: User, resetLink: string): boolean {
    const subject = "Réinitialisation de votre mot de passe Frais & Co";
    const content = `
Bonjour ${user.getFirstName()} ${user.getLastName()},

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :
${resetLink}

Ce lien est valide pendant 24 heures.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Cordialement,
L'équipe Frais & Co
    `.trim();

    return this.sendNotification(user.getEmail(), subject, content);
  }

  /**
   * Vérifie si un email est valide
   * @param email Email à vérifier
   * @returns true si l'email est valide
   */
  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Teste la connexion au serveur SMTP
   * @returns true si la connexion réussit
   */
  testConnection(): boolean {
    console.log(`Test de connexion à ${this.smtpServer}:${this.smtpPort}...`);
    // Simulation de test de connexion
    console.log("✓ Connexion SMTP réussie");
    return true;
  }
}
