/**
 * Tests pour le handler Grille Tarifaire
 * Teste toutes les fonctionnalités liées aux tarifs kilométriques
 */

import * as GrilleTarifaireHandler from "../handlers/grille-tarifaire.handler";

export async function testGrilleTarifaire() {
  console.log("\n" + "=".repeat(70));
  console.log("TEST GRILLE TARIFAIRE");
  console.log("=".repeat(70));

  let successCount = 0;
  let failCount = 0;

  // Test 1: Créer/Mettre à jour un tarif (upsert)
  console.log("\n[TEST 1] Création d'un nouveau tarif (2500cc)...");
  try {
    const result = await GrilleTarifaireHandler.upsertTarif({
      cylindree: 2500,
      tarif_km: 0.65,
    });

    if (result.success && result.data) {
      console.log(
        `✓ Tarif créé: ${result.data.cylindree}cc - ${result.data.tarif_km}€/km`
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

  // Test 2: Mettre à jour un tarif existant (upsert)
  console.log("\n[TEST 2] Mise à jour d'un tarif existant (2500cc)...");
  try {
    const result = await GrilleTarifaireHandler.upsertTarif({
      cylindree: 2500,
      tarif_km: 0.7, // Nouveau tarif
    });

    if (result.success && result.data) {
      // Vérifier le tarif en le récupérant à nouveau
      const verif = await GrilleTarifaireHandler.getTarifByCylindree(2500);
      if (verif.success && verif.data && Number(verif.data.tarif_km) === 0.7) {
        console.log(
          `✓ Tarif mis à jour: ${verif.data.cylindree}cc - ${verif.data.tarif_km}€/km`
        );
        successCount++;
      } else {
        console.log(
          `✗ Le tarif récupéré ne correspond pas (${verif.data?.tarif_km}€/km au lieu de 0.7€/km)`
        );
        failCount++;
      }
    } else {
      console.log(`✗ Échec: ${result.error || "Données manquantes"}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 3: Créer plusieurs tarifs
  console.log("\n[TEST 3] Création de plusieurs tarifs...");
  const tarifs = [
    { cylindree: 3000, tarif_km: 0.75 },
    { cylindree: 3500, tarif_km: 0.8 },
    { cylindree: 4000, tarif_km: 0.85 },
  ];

  let createdCount = 0;
  for (const tarif of tarifs) {
    try {
      const result = await GrilleTarifaireHandler.upsertTarif(tarif);
      if (result.success) createdCount++;
    } catch (error) {
      console.log(`✗ Erreur pour ${tarif.cylindree}cc: ${error.message}`);
    }
  }

  if (createdCount === tarifs.length) {
    console.log(`✓ ${createdCount} tarifs créés avec succès`);
    successCount++;
  } else {
    console.log(`✗ Seulement ${createdCount}/${tarifs.length} tarifs créés`);
    failCount++;
  }

  // Test 4: Récupérer tous les tarifs
  console.log("\n[TEST 4] Récupération de tous les tarifs...");
  try {
    const result = await GrilleTarifaireHandler.getAllTarifs();

    if (result.success && result.data && result.data.length > 0) {
      console.log(`✓ ${result.data.length} tarif(s) récupéré(s)`);
      successCount++;
    } else {
      console.log(`✗ Échec: ${result.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 5: Récupérer un tarif par cylindrée
  console.log("\n[TEST 5] Récupération d'un tarif par cylindrée (1600cc)...");
  try {
    const result = await GrilleTarifaireHandler.getTarifByCylindree(1600);

    if (result.success && result.data) {
      console.log(
        `✓ Tarif récupéré: ${result.data.cylindree}cc - ${result.data.tarif_km}€/km`
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

  // Test 6: Récupérer un tarif inexistant
  console.log("\n[TEST 6] Récupération d'un tarif inexistant (9999cc)...");
  try {
    const result = await GrilleTarifaireHandler.getTarifByCylindree(9999);

    if (!result.success) {
      console.log("✓ Tarif inexistant correctement géré");
      successCount++;
    } else {
      console.log("✗ Un tarif a été trouvé alors qu'il ne devrait pas exister");
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 7: Calculer le montant d'un déplacement
  console.log(
    "\n[TEST 7] Calcul du montant d'un déplacement (1600cc, 450km)..."
  );
  try {
    const result = await GrilleTarifaireHandler.calculateDeplacementAmount(
      1600,
      450
    );

    if (result.success && result.data) {
      console.log(
        `✓ Montant calculé: ${result.data.montant}€ (${result.data.tarifKm}€/km × 450km)`
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

  // Test 8: Calculer avec une cylindrée sans tarif
  console.log(
    "\n[TEST 8] Calcul avec une cylindrée sans tarif défini (9999cc)..."
  );
  try {
    const result = await GrilleTarifaireHandler.calculateDeplacementAmount(
      9999,
      100
    );

    if (!result.success) {
      console.log("✓ Calcul impossible pour cylindrée sans tarif (attendu)");
      successCount++;
    } else {
      console.log("✗ Le calcul ne devrait pas réussir");
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 9: Calculer avec distance 0
  console.log("\n[TEST 9] Calcul avec distance 0...");
  try {
    const result = await GrilleTarifaireHandler.calculateDeplacementAmount(
      1600,
      0
    );

    if (result.success && result.data && result.data.montant === 0) {
      console.log("✓ Montant correct pour distance 0: 0€");
      successCount++;
    } else {
      console.log(`✗ Échec: ${result.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 10: Supprimer un tarif
  console.log("\n[TEST 10] Suppression d'un tarif (2500cc)...");
  try {
    const result = await GrilleTarifaireHandler.deleteTarif(2500);

    if (result.success) {
      console.log("✓ Tarif supprimé avec succès");
      successCount++;
    } else {
      console.log(`✗ Échec: ${result.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 11: Vérifier que le tarif a bien été supprimé
  console.log("\n[TEST 11] Vérification de la suppression (2500cc)...");
  try {
    const result = await GrilleTarifaireHandler.getTarifByCylindree(2500);

    if (!result.success) {
      console.log("✓ Le tarif n'existe plus");
      successCount++;
    } else {
      console.log("✗ Le tarif existe encore");
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 12: Supprimer les tarifs de test
  console.log("\n[TEST 12] Nettoyage des tarifs de test...");
  const cylindreesToDelete = [3000, 3500, 4000];
  let deletedCount = 0;

  for (const cylindree of cylindreesToDelete) {
    try {
      const result = await GrilleTarifaireHandler.deleteTarif(cylindree);
      if (result.success) deletedCount++;
    } catch (error) {
      console.log(`✗ Erreur pour ${cylindree}cc: ${error.message}`);
    }
  }

  if (deletedCount === cylindreesToDelete.length) {
    console.log(`✓ ${deletedCount} tarifs supprimés avec succès`);
    successCount++;
  } else {
    console.log(
      `✗ Seulement ${deletedCount}/${cylindreesToDelete.length} tarifs supprimés`
    );
    failCount++;
  }

  // Résumé
  console.log("\n" + "=".repeat(70));
  console.log("RÉSUMÉ TESTS GRILLE TARIFAIRE");
  console.log("=".repeat(70));
  console.log(`✓ Réussites: ${successCount}`);
  console.log(`✗ Échecs: ${failCount}`);
  console.log(
    `Taux de réussite: ${((successCount / (successCount + failCount)) * 100).toFixed(1)}%`
  );
  console.log("=".repeat(70));

  return { successCount, failCount };
}
