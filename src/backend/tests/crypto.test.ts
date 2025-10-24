/**
 * Test du système de cryptographie avec un utilisateur existant
 */

import pool from "./config/database";
import { verifyPassword } from "./utils/crypto";

async function testCrypto() {
  const client = await pool.connect();

  try {
    // Récupérer Pierre Dupont
    const result = await client.query(
      "SELECT id_utilisateur, email, mot_de_passe, salt FROM utilisateur WHERE id_utilisateur = 1"
    );

    if (result.rows.length === 0) {
      console.log("Utilisateur non trouvé");
      return;
    }

    const user = result.rows[0];
    console.log("Utilisateur trouvé:", user.email);
    console.log("Salt (premiers 20 chars):", user.salt.substring(0, 20));
    console.log(
      "Hash (premiers 50 chars):",
      user.mot_de_passe.substring(0, 50)
    );

    // Tester avec différents mots de passe
    const passwords = ["password1", "password", "admin", "test"];

    for (const pwd of passwords) {
      const isValid = await verifyPassword(pwd, user.salt, user.mot_de_passe);
      console.log(`\nTest avec "${pwd}":`, isValid ? "✓ VALIDE" : "✗ INVALIDE");
    }
  } catch (error) {
    console.error("Erreur:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

testCrypto();
