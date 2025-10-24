/**
 * Script de test de connexion pour plusieurs utilisateurs
 * Permet de vérifier que la migration des mots de passe a bien fonctionné
 */

import * as UtilisateurHandler from "./handlers/utilisateur.handler";
import pool from "./config/database";

async function testMultipleLogins() {
  console.log("Test de connexion pour plusieurs utilisateurs...\n");

  // Liste d'utilisateurs à tester
  const testUsers = [
    {
      id: 1,
      email: "pierre.dupont@example.com",
      password: "password1",
      expectedRole: "admin",
    },
    {
      id: 2,
      email: "lucie.martin@example.com",
      password: "password2",
      expectedRole: "comptable",
    },
    {
      id: 10,
      email: "isabelle.lefevre@example.com",
      password: "password10",
      expectedRole: "comptable",
    },
    {
      id: 5,
      email: "antoine.moreau@example.com",
      password: "password5",
      expectedRole: "employe",
    },
    {
      id: 20,
      email: "claire.fontaine@example.com",
      password: "password20",
      expectedRole: "employe",
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const user of testUsers) {
    const result = await UtilisateurHandler.loginUtilisateur({
      email: user.email,
      password: user.password,
    });

    if (result.success && result.data) {
      const userData = result.data.utilisateur;
      const roleMatch = userData.role === user.expectedRole;

      console.log(
        `✓ ${userData.prenom} ${userData.nom_utilisateur} (${user.email})`
      );
      console.log(
        `  Rôle: ${userData.role} ${roleMatch ? "✓" : `✗ (attendu: ${user.expectedRole})`}`
      );
      console.log(`  Mot de passe: ${user.password}\n`);

      successCount++;
    } else {
      console.log(`✗ Échec de connexion pour ${user.email}`);
      console.log(`  Erreur: ${result.error}\n`);
      failCount++;
    }
  }

  console.log("=".repeat(60));
  console.log(`Résultats:`);
  console.log(`  ✓ Réussites: ${successCount}/${testUsers.length}`);
  console.log(`  ✗ Échecs: ${failCount}/${testUsers.length}`);
  console.log("=".repeat(60));

  // Test avec un mauvais mot de passe
  console.log("\nTest avec un mauvais mot de passe...");
  const badPasswordResult = await UtilisateurHandler.loginUtilisateur({
    email: "pierre.dupont@example.com",
    password: "wrongpassword",
  });

  console.log(
    badPasswordResult.success
      ? "✗ ERREUR: Ne devrait pas réussir"
      : "✓ Échec attendu"
  );
  console.log(`  Message: ${badPasswordResult.error}\n`);

  await pool.end();
}

testMultipleLogins()
  .then(() => {
    console.log("✓ Tests terminés!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("✗ Erreur lors des tests:", error);
    process.exit(1);
  });
