/**
 * Tests pour le handler Utilisateur
 * Teste toutes les fonctionnalités liées aux utilisateurs
 */

import * as UtilisateurHandler from "../handlers/utilisateur.handler";
import { Role, TypeEssence } from "../types";

export async function testUtilisateurs() {
  console.log("=".repeat(70));
  console.log("TEST UTILISATEURS");
  console.log("=".repeat(70));

  let testUserId: number | undefined;
  let successCount = 0;
  let failCount = 0;

  // Générer un email unique pour éviter les conflits
  const timestamp = Date.now();
  const testEmail = `test.user.${timestamp}@test.com`;
  const shortId = timestamp.toString().slice(-6); // Utiliser seulement les 6 derniers chiffres

  // Test 1: Créer un utilisateur
  console.log("\n[TEST 1] Création d'un nouvel utilisateur...");
  try {
    const newUser = await UtilisateurHandler.createUtilisateur({
      nom_utilisateur: "TestUser",
      prenom: "Test",
      email: testEmail,
      mot_de_passe: "TestPassword123!",
      adresse_utilisateur: "1 Rue du Test",
      cp_utilisateur: "75000",
      ville_utilisateur: "Paris",
      role: Role.EMPLOYE,
      valide: false,
      plaque: `TST-${shortId}`,
      cylindree: 1600,
      marque: "TestCar",
      modele: "Model X",
      type_essence: TypeEssence.ESSENCE95,
    });

    if (newUser.success && newUser.data) {
      testUserId = newUser.data.id_utilisateur;
      console.log(`✓ Utilisateur créé avec ID: ${testUserId}`);
      successCount++;
    } else {
      console.log(`✗ Échec: ${newUser.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 2: Tentative de connexion avec utilisateur non validé
  console.log(
    "\n[TEST 2] Tentative de connexion avec utilisateur non validé..."
  );
  try {
    const loginResult = await UtilisateurHandler.loginUtilisateur({
      email: testEmail,
      password: "TestPassword123!",
    });

    if (!loginResult.success && loginResult.error?.includes("validé")) {
      console.log("✓ Rejet attendu pour utilisateur non validé");
      successCount++;
    } else {
      console.log(
        "✗ L'utilisateur non validé ne devrait pas pouvoir se connecter"
      );
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 3: Valider l'utilisateur
  if (testUserId) {
    console.log("\n[TEST 3] Validation de l'utilisateur...");
    try {
      const validateResult =
        await UtilisateurHandler.validateUtilisateur(testUserId);

      if (validateResult.success) {
        console.log("✓ Utilisateur validé avec succès");
        successCount++;
      } else {
        console.log(`✗ Échec de validation: ${validateResult.error}`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
      failCount++;
    }
  }

  // Test 4: Connexion réussie
  console.log("\n[TEST 4] Connexion avec utilisateur validé...");
  try {
    const loginResult = await UtilisateurHandler.loginUtilisateur({
      email: testEmail,
      password: "TestPassword123!",
    });

    if (loginResult.success && loginResult.data) {
      console.log(
        `✓ Connexion réussie: ${loginResult.data.utilisateur.prenom} ${loginResult.data.utilisateur.nom_utilisateur}`
      );
      successCount++;
    } else {
      console.log(`✗ Échec de connexion: ${loginResult.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 5: Connexion avec mauvais mot de passe
  console.log("\n[TEST 5] Tentative de connexion avec mauvais mot de passe...");
  try {
    const loginResult = await UtilisateurHandler.loginUtilisateur({
      email: testEmail,
      password: "WrongPassword",
    });

    if (!loginResult.success) {
      console.log("✓ Rejet attendu pour mauvais mot de passe");
      successCount++;
    } else {
      console.log("✗ La connexion ne devrait pas réussir");
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 6: Récupérer un utilisateur par ID
  if (testUserId) {
    console.log("\n[TEST 6] Récupération d'un utilisateur par ID...");
    try {
      const userResult =
        await UtilisateurHandler.getUtilisateurById(testUserId);

      if (userResult.success && userResult.data) {
        console.log(`✓ Utilisateur récupéré: ${userResult.data.email}`);
        successCount++;
      } else {
        console.log(`✗ Échec: ${userResult.error}`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
      failCount++;
    }
  }

  // Test 7: Mettre à jour un utilisateur
  if (testUserId) {
    console.log("\n[TEST 7] Mise à jour d'un utilisateur...");
    try {
      const updateResult = await UtilisateurHandler.updateUtilisateur(
        testUserId,
        {
          ville_utilisateur: "Lyon",
          cp_utilisateur: "69000",
        }
      );

      if (updateResult.success && updateResult.data) {
        console.log(
          `✓ Utilisateur mis à jour: ${updateResult.data.ville_utilisateur}`
        );
        successCount++;
      } else {
        console.log(`✗ Échec: ${updateResult.error}`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
      failCount++;
    }
  }

  // Test 8: Changer le mot de passe
  if (testUserId) {
    console.log("\n[TEST 8] Changement de mot de passe...");
    try {
      const changeResult = await UtilisateurHandler.changePassword(
        testUserId,
        "TestPassword123!",
        "NewPassword456!"
      );

      if (changeResult.success) {
        console.log("✓ Mot de passe changé avec succès");
        successCount++;

        // Vérifier la connexion avec le nouveau mot de passe
        const loginResult = await UtilisateurHandler.loginUtilisateur({
          email: testEmail,
          password: "NewPassword456!",
        });

        if (loginResult.success) {
          console.log("✓ Connexion avec nouveau mot de passe réussie");
          successCount++;
        } else {
          console.log("✗ Échec de connexion avec nouveau mot de passe");
          failCount++;
        }
      } else {
        console.log(`✗ Échec: ${changeResult.error}`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
      failCount++;
    }
  }

  // Test 9: Récupérer tous les utilisateurs
  console.log("\n[TEST 9] Récupération de tous les utilisateurs...");
  try {
    const allUsers = await UtilisateurHandler.getAllUtilisateurs();

    if (allUsers.success && allUsers.data && allUsers.data.length > 0) {
      console.log(`✓ ${allUsers.data.length} utilisateur(s) récupéré(s)`);
      successCount++;
    } else {
      console.log(`✗ Échec: ${allUsers.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 10: Récupérer les utilisateurs en attente de validation
  console.log("\n[TEST 10] Récupération des utilisateurs en attente...");
  try {
    const pendingUsers = await UtilisateurHandler.getPendingUtilisateurs();

    if (pendingUsers.success && pendingUsers.data) {
      console.log(
        `✓ ${pendingUsers.data.length} utilisateur(s) en attente trouvé(s)`
      );
      successCount++;
    } else {
      console.log(`✗ Échec: ${pendingUsers.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 11: Tester les contraintes uniques (email en double)
  console.log("\n[TEST 11] Test de contrainte unique sur email...");
  try {
    const duplicateUser = await UtilisateurHandler.createUtilisateur({
      nom_utilisateur: "Duplicate",
      prenom: "Test",
      email: testEmail, // Email déjà utilisé
      mot_de_passe: "Password123!",
      adresse_utilisateur: "2 Rue du Test",
      cp_utilisateur: "75000",
      ville_utilisateur: "Paris",
      role: Role.EMPLOYE,
      valide: false,
      plaque: `DUP-${shortId}`,
      cylindree: 1400,
      marque: "TestCar",
      modele: "Model Y",
      type_essence: TypeEssence.DIESEL,
    });

    if (!duplicateUser.success && duplicateUser.error?.includes("email")) {
      console.log("✓ Contrainte unique sur email respectée");
      successCount++;
    } else {
      console.log("✗ La contrainte unique n'a pas été respectée");
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 12: Supprimer l'utilisateur de test
  if (testUserId) {
    console.log("\n[TEST 12] Suppression de l'utilisateur de test...");
    try {
      const deleteResult =
        await UtilisateurHandler.deleteUtilisateur(testUserId);

      if (deleteResult.success) {
        console.log("✓ Utilisateur supprimé avec succès");
        successCount++;
      } else {
        console.log(`✗ Échec: ${deleteResult.error}`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
      failCount++;
    }
  }

  // Résumé
  console.log("\n" + "=".repeat(70));
  console.log("RÉSUMÉ TESTS UTILISATEURS");
  console.log("=".repeat(70));
  console.log(`✓ Réussites: ${successCount}`);
  console.log(`✗ Échecs: ${failCount}`);
  console.log(
    `Taux de réussite: ${((successCount / (successCount + failCount)) * 100).toFixed(1)}%`
  );
  console.log("=".repeat(70));

  return { successCount, failCount };
}
