/**
 * Tests pour le handler Téléphone
 * Teste toutes les fonctionnalités liées aux numéros de téléphone
 */

import * as TelephoneHandler from "../handlers/telephone.handler";
import * as UtilisateurHandler from "../handlers/utilisateur.handler";
import { Role, TypeEssence } from "../types";

export async function testTelephones() {
  console.log("\n" + "=".repeat(70));
  console.log("TEST TÉLÉPHONES");
  console.log("=".repeat(70));

  let testUserId: number | undefined;
  let testTelephone1Id: number | undefined;
  let testTelephone2Id: number | undefined;
  let successCount = 0;
  let failCount = 0;

  // Préparation: Créer un utilisateur de test
  console.log("\n[SETUP] Création d'un utilisateur de test...");
  try {
    const user = await UtilisateurHandler.createUtilisateur({
      nom_utilisateur: "TelTest",
      prenom: "User",
      email: "tel.test@test.com",
      mot_de_passe: "Password123!",
      adresse_utilisateur: "1 Rue Test",
      cp_utilisateur: "75000",
      ville_utilisateur: "Paris",
      role: Role.EMPLOYE,
      valide: true,
      plaque: "TEL-001",
      cylindree: 1600,
      marque: "TestCar",
      modele: "Model T",
      type_essence: TypeEssence.ESSENCE95,
    });

    if (user.success && user.data) {
      testUserId = user.data.id_utilisateur;
      console.log(`✓ Utilisateur créé avec ID: ${testUserId}`);
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
  }

  if (!testUserId) {
    console.log("\n✗ ERREUR: Impossible de continuer sans utilisateur");
    return { successCount: 0, failCount: 1 };
  }

  // Test 1: Créer un premier téléphone
  console.log(
    "\n[TEST 1] Création d'un numéro de téléphone (mobile français)..."
  );
  try {
    const result = await TelephoneHandler.createTelephone({
      indic_pays: "33",
      indic_region: "6",
      numero: "12345678",
      id_utilisateur: testUserId,
    });

    if (result.success && result.data) {
      testTelephone1Id = result.data.id_telephone;
      console.log(
        `✓ Téléphone créé: +${result.data.indic_pays} ${result.data.indic_region} ${result.data.numero}`
      );
      successCount++;
    } else {
      console.log(`✗ Échec: ${result.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 2: Créer un second téléphone (fixe)
  console.log("\n[TEST 2] Création d'un second numéro (fixe français)...");
  try {
    const result = await TelephoneHandler.createTelephone({
      indic_pays: "33",
      indic_region: "1",
      numero: "23456789",
      id_utilisateur: testUserId,
    });

    if (result.success && result.data) {
      testTelephone2Id = result.data.id_telephone;
      console.log(
        `✓ Téléphone créé: +${result.data.indic_pays} ${result.data.indic_region} ${result.data.numero}`
      );
      successCount++;
    } else {
      console.log(`✗ Échec: ${result.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 3: Créer un téléphone international
  console.log("\n[TEST 3] Création d'un numéro international (USA)...");
  try {
    const result = await TelephoneHandler.createTelephone({
      indic_pays: "1",
      indic_region: "555",
      numero: "1234567",
      id_utilisateur: testUserId,
    });

    if (result.success && result.data) {
      console.log(
        `✓ Téléphone créé: +${result.data.indic_pays} ${result.data.indic_region} ${result.data.numero}`
      );
      successCount++;
    } else {
      console.log(`✗ Échec: ${result.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 4: Récupérer tous les téléphones de l'utilisateur
  console.log(
    "\n[TEST 4] Récupération de tous les téléphones de l'utilisateur..."
  );
  try {
    const result =
      await TelephoneHandler.getTelephonesByUtilisateur(testUserId);

    if (result.success && result.data && result.data.length >= 3) {
      console.log(`✓ ${result.data.length} téléphone(s) récupéré(s)`);
      result.data.forEach((tel) => {
        console.log(`  - +${tel.indic_pays} ${tel.indic_region} ${tel.numero}`);
      });
      successCount++;
    } else {
      console.log(`✗ Échec: ${result.error || "Nombre incorrect"}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 5: Récupérer les téléphones d'un utilisateur inexistant
  console.log(
    "\n[TEST 5] Récupération des téléphones d'un utilisateur inexistant..."
  );
  try {
    const result = await TelephoneHandler.getTelephonesByUtilisateur(99999);

    if (result.success && result.data && result.data.length === 0) {
      console.log("✓ Aucun téléphone trouvé (attendu)");
      successCount++;
    } else {
      console.log("✗ Des téléphones ont été trouvés");
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 6: Mettre à jour un téléphone
  if (testTelephone1Id) {
    console.log("\n[TEST 6] Mise à jour d'un numéro de téléphone...");
    try {
      const result = await TelephoneHandler.updateTelephone(testTelephone1Id, {
        indic_region: "7",
        numero: "98765432",
      });

      if (result.success && result.data) {
        console.log(
          `✓ Téléphone mis à jour: +${result.data.indic_pays} ${result.data.indic_region} ${result.data.numero}`
        );
        successCount++;
      } else {
        console.log(`✗ Échec: ${result.error}`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
      failCount++;
    }
  }

  // Test 7: Mettre à jour un téléphone inexistant
  console.log("\n[TEST 7] Mise à jour d'un téléphone inexistant...");
  try {
    const result = await TelephoneHandler.updateTelephone(99999, {
      numero: "00000000",
    });

    if (!result.success) {
      console.log("✓ Mise à jour refusée pour téléphone inexistant (attendu)");
      successCount++;
    } else {
      console.log("✗ La mise à jour ne devrait pas réussir");
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 8: Mettre à jour sans données
  if (testTelephone1Id) {
    console.log("\n[TEST 8] Mise à jour sans données...");
    try {
      const result = await TelephoneHandler.updateTelephone(
        testTelephone1Id,
        {}
      );

      if (!result.success) {
        console.log("✓ Mise à jour refusée sans données (attendu)");
        successCount++;
      } else {
        console.log("✗ La mise à jour ne devrait pas réussir");
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
      failCount++;
    }
  }

  // Test 9: Supprimer un téléphone
  if (testTelephone2Id) {
    console.log("\n[TEST 9] Suppression d'un téléphone...");
    try {
      const result = await TelephoneHandler.deleteTelephone(testTelephone2Id);

      if (result.success) {
        console.log("✓ Téléphone supprimé avec succès");
        successCount++;
      } else {
        console.log(`✗ Échec: ${result.error}`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
      failCount++;
    }
  }

  // Test 10: Vérifier la suppression
  console.log("\n[TEST 10] Vérification que le téléphone a été supprimé...");
  try {
    const result =
      await TelephoneHandler.getTelephonesByUtilisateur(testUserId);

    if (result.success && result.data && result.data.length === 2) {
      console.log(`✓ Il reste ${result.data.length} téléphone(s) (attendu)`);
      successCount++;
    } else {
      console.log(`✗ Nombre incorrect de téléphones`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 11: Supprimer un téléphone inexistant
  console.log("\n[TEST 11] Suppression d'un téléphone inexistant...");
  try {
    const result = await TelephoneHandler.deleteTelephone(99999);

    if (!result.success) {
      console.log("✓ Suppression refusée pour téléphone inexistant (attendu)");
      successCount++;
    } else {
      console.log("✗ La suppression ne devrait pas réussir");
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Nettoyage: Supprimer l'utilisateur (cascade supprime les téléphones)
  console.log("\n[CLEANUP] Suppression de l'utilisateur de test...");
  try {
    if (testUserId) {
      await UtilisateurHandler.deleteUtilisateur(testUserId);
      console.log("✓ Utilisateur supprimé (cascade sur téléphones)");
    }
  } catch (error) {
    console.log(`✗ Erreur lors du nettoyage: ${error.message}`);
  }

  // Résumé
  console.log("\n" + "=".repeat(70));
  console.log("RÉSUMÉ TESTS TÉLÉPHONES");
  console.log("=".repeat(70));
  console.log(`✓ Réussites: ${successCount}`);
  console.log(`✗ Échecs: ${failCount}`);
  console.log(
    `Taux de réussite: ${((successCount / (successCount + failCount)) * 100).toFixed(1)}%`
  );
  console.log("=".repeat(70));

  return { successCount, failCount };
}
