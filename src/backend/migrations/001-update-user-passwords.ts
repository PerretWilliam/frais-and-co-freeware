/**
 * Migration 001: Mise à jour des mots de passe des utilisateurs existants
 *
 * Ce script met à jour les 40 utilisateurs existants avec des mots de passe
 * hashés selon le système AES(bcrypt(salt+password))
 *
 * Format des mots de passe: password{id} (ex: password1, password2, etc.)
 */

import pool from "../config/database";
import { hashPassword, generateSalt } from "../utils/crypto";

async function migrateUserPasswords() {
  const client = await pool.connect();

  try {
    console.log("Début de la migration des mots de passe...\n");

    // Récupérer tous les utilisateurs (sauf ceux de test)
    const result = await client.query(`
      SELECT id_utilisateur, email, nom_utilisateur, prenom
      FROM Utilisateur
      WHERE email NOT LIKE '%test%'
      ORDER BY id_utilisateur
    `);

    const users = result.rows;
    console.log(`${users.length} utilisateur(s) trouvé(s)\n`);

    let updated = 0;
    let errors = 0;

    // Mettre à jour chaque utilisateur
    for (const user of users) {
      try {
        const userId = user.id_utilisateur;
        const password = `password${userId}`;

        // Générer un nouveau salt
        const salt = generateSalt();

        // Hasher le mot de passe avec AES(bcrypt(salt+password))
        const hashedPassword = await hashPassword(password, salt);

        // Mettre à jour dans la base de données
        await client.query(
          `UPDATE Utilisateur 
           SET mot_de_passe = $1, salt = $2
           WHERE id_utilisateur = $3`,
          [hashedPassword, salt, userId]
        );

        console.log(
          `✓ ${user.prenom} ${user.nom_utilisateur} (ID: ${userId}) - mot de passe: ${password}`
        );
        updated++;
      } catch (error) {
        console.error(
          `Erreur pour ${user.prenom} ${user.nom_utilisateur}:`,
          error.message
        );
        errors++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`Migration terminée:`);
    console.log(`  - ${updated} utilisateur(s) mis à jour avec succès`);
    console.log(`  - ${errors} erreur(s)`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter la migration
if (require.main === module) {
  migrateUserPasswords()
    .then(() => {
      console.log("\n✓ Migration réussie!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n✗ Échec de la migration:", error);
      process.exit(1);
    });
}

export default migrateUserPasswords;
