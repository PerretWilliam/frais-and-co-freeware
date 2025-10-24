/**
 * Tests pour le handler Chantier
 * Teste toutes les fonctionnalités liées aux chantiers
 */

import * as ChantierHandler from "../handlers/chantier.handler";

export async function testChantiers() {
  console.log("\n" + "=".repeat(70));
  console.log("TEST CHANTIERS");
  console.log("=".repeat(70));

  let testChantierId: number | undefined;
  let successCount = 0;
  let failCount = 0;

  // Test 1: Créer un chantier
  console.log("\n[TEST 1] Création d'un nouveau chantier...");
  try {
    const newChantier = await ChantierHandler.createChantier({
      nom_chantier: "Chantier Test Alpha",
      adresse_chantier: "10 Avenue de Test",
      cp_chantier: "75001",
      ville_chantier: "Paris",
    });

    if (newChantier.success && newChantier.data) {
      testChantierId = newChantier.data.id_chantier;
      console.log(`✓ Chantier créé avec ID: ${testChantierId}`);
      successCount++;
    } else {
      console.log(`✗ Échec: ${newChantier.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 2: Récupérer un chantier par ID
  if (testChantierId) {
    console.log("\n[TEST 2] Récupération d'un chantier par ID...");
    try {
      const chantierResult =
        await ChantierHandler.getChantierById(testChantierId);

      if (chantierResult.success && chantierResult.data) {
        console.log(`✓ Chantier récupéré: ${chantierResult.data.nom_chantier}`);
        successCount++;
      } else {
        console.log(`✗ Échec: ${chantierResult.error}`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
      failCount++;
    }
  }

  // Test 3: Récupérer tous les chantiers
  console.log("\n[TEST 3] Récupération de tous les chantiers...");
  try {
    const allChantiers = await ChantierHandler.getAllChantiers();

    if (
      allChantiers.success &&
      allChantiers.data &&
      allChantiers.data.length > 0
    ) {
      console.log(`✓ ${allChantiers.data.length} chantier(s) récupéré(s)`);
      successCount++;
    } else {
      console.log(`✗ Échec: ${allChantiers.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 4: Mettre à jour un chantier
  if (testChantierId) {
    console.log("\n[TEST 4] Mise à jour d'un chantier...");
    try {
      const updateResult = await ChantierHandler.updateChantier(
        testChantierId,
        {
          ville_chantier: "Lyon",
          cp_chantier: "69000",
          adresse_chantier: "20 Boulevard de Lyon",
        }
      );

      if (updateResult.success && updateResult.data) {
        console.log(
          `✓ Chantier mis à jour: ${updateResult.data.ville_chantier}`
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

  // Test 5: Rechercher des chantiers
  console.log("\n[TEST 5] Recherche de chantiers par nom...");
  try {
    const searchResult = await ChantierHandler.searchChantiers("Test");

    if (searchResult.success && searchResult.data) {
      console.log(
        `✓ ${searchResult.data.length} chantier(s) trouvé(s) avec "Test"`
      );
      successCount++;
    } else {
      console.log(`✗ Échec: ${searchResult.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 6: Rechercher des chantiers par ville
  console.log("\n[TEST 6] Recherche de chantiers par ville...");
  try {
    const searchResult = await ChantierHandler.searchChantiers("Lyon");

    if (searchResult.success && searchResult.data) {
      console.log(`✓ ${searchResult.data.length} chantier(s) trouvé(s) à Lyon`);
      successCount++;
    } else {
      console.log(`✗ Échec: ${searchResult.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 7: Supprimer le chantier de test
  if (testChantierId) {
    console.log("\n[TEST 7] Suppression du chantier de test...");
    try {
      const deleteResult = await ChantierHandler.deleteChantier(testChantierId);

      if (deleteResult.success) {
        console.log("✓ Chantier supprimé avec succès");
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

  // Test 8: Vérifier que le chantier a bien été supprimé
  if (testChantierId) {
    console.log("\n[TEST 8] Vérification de la suppression...");
    try {
      const chantierResult =
        await ChantierHandler.getChantierById(testChantierId);

      if (!chantierResult.success) {
        console.log("✓ Le chantier n'existe plus");
        successCount++;
      } else {
        console.log("✗ Le chantier existe encore");
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
      failCount++;
    }
  }

  // Résumé
  console.log("\n" + "=".repeat(70));
  console.log("RÉSUMÉ TESTS CHANTIERS");
  console.log("=".repeat(70));
  console.log(`✓ Réussites: ${successCount}`);
  console.log(`✗ Échecs: ${failCount}`);
  console.log(
    `Taux de réussite: ${((successCount / (successCount + failCount)) * 100).toFixed(1)}%`
  );
  console.log("=".repeat(70));

  return { successCount, failCount };
}
