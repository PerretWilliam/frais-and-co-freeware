/**
 * Tests pour le handler Frais
 * Teste toutes les fonctionnalités liées aux frais (déplacement, repas, hébergement)
 */

import * as FraisHandler from "../handlers/frais.handler";
import * as UtilisateurHandler from "../handlers/utilisateur.handler";
import * as ChantierHandler from "../handlers/chantier.handler";
import * as GrilleTarifaireHandler from "../handlers/grille-tarifaire.handler";
import { Role, TypeEssence, StatutFrais } from "../types";

export async function testFrais() {
  console.log("\n" + "=".repeat(70));
  console.log("TEST FRAIS");
  console.log("=".repeat(70));

  let testUserId: number | undefined;
  let testChantierId: number | undefined;
  let testFraisDeplacementId: number | undefined;
  let testFraisRepasId: number | undefined;
  let testFraisHebergementId: number | undefined;
  let successCount = 0;
  let failCount = 0;

  // Préparation: Créer un utilisateur de test
  console.log("\n[SETUP] Création d'un utilisateur de test...");
  try {
    const user = await UtilisateurHandler.createUtilisateur({
      nom_utilisateur: "FraisTest",
      prenom: "User",
      email: "frais.test@test.com",
      mot_de_passe: "Password123!",
      adresse_utilisateur: "1 Rue Test",
      cp_utilisateur: "75000",
      ville_utilisateur: "Paris",
      role: Role.EMPLOYE,
      valide: true,
      plaque: "FRAIS-01",
      cylindree: 1600,
      marque: "TestCar",
      modele: "Model Z",
      type_essence: TypeEssence.ESSENCE95,
    });

    if (user.success && user.data) {
      testUserId = user.data.id_utilisateur;
      console.log(`✓ Utilisateur créé avec ID: ${testUserId}`);
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
  }

  // Préparation: Créer un chantier de test
  console.log("[SETUP] Création d'un chantier de test...");
  try {
    const chantier = await ChantierHandler.createChantier({
      nom_chantier: "Chantier Frais Test",
      adresse_chantier: "50 Avenue Test",
      cp_chantier: "69000",
      ville_chantier: "Lyon",
    });

    if (chantier.success && chantier.data) {
      testChantierId = chantier.data.id_chantier;
      console.log(`✓ Chantier créé avec ID: ${testChantierId}`);
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
  }

  // Préparation: Créer une grille tarifaire
  console.log("[SETUP] Création de la grille tarifaire...");
  try {
    await GrilleTarifaireHandler.upsertTarif({
      cylindree: 1600,
      tarif_km: 0.45,
    });
    console.log("✓ Grille tarifaire créée");
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
  }

  if (!testUserId || !testChantierId) {
    console.log(
      "\n✗ ERREUR: Impossible de continuer sans utilisateur ou chantier"
    );
    return { successCount: 0, failCount: 1 };
  }

  // Test 1: Créer un frais de déplacement
  console.log("\n[TEST 1] Création d'un frais de déplacement...");
  try {
    const justificatif = Buffer.from("Justificatif PDF déplacement");

    const frais = await FraisHandler.createFraisDeplacement({
      lieu: "Paris - Lyon",
      date: new Date(),
      justificatif: justificatif,
      statut: StatutFrais.BROUILLON,
      id_utilisateur: testUserId,
      id_chantier: testChantierId,
      ville_depart: "Paris",
      ville_arrivee: "Lyon",
      distance_km: 450,
      id_voiture: testUserId,
    });

    if (frais.success && frais.data) {
      testFraisDeplacementId = frais.data.id_deplacement;
      console.log(
        `✓ Frais de déplacement créé avec ID: ${testFraisDeplacementId}`
      );
      console.log(`  Montant calculé: ${frais.data.montant}€`);
      successCount++;
    } else {
      console.log(`✗ Échec: ${frais.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 2: Créer un frais de repas
  console.log("\n[TEST 2] Création d'un frais de repas...");
  try {
    const justificatif = Buffer.from("Justificatif PDF repas");

    const frais = await FraisHandler.createFraisRepas({
      lieu: "Restaurant Le Test",
      date: new Date(),
      justificatif: justificatif,
      montant: 25.5,
      statut: StatutFrais.BROUILLON,
      id_utilisateur: testUserId,
      id_chantier: testChantierId,
      type_repas: "Déjeuner",
    });

    if (frais.success && frais.data) {
      testFraisRepasId = frais.data.id_repas;
      console.log(`✓ Frais de repas créé avec ID: ${testFraisRepasId}`);
      console.log(`  Montant: ${frais.data.montant}€`);
      successCount++;
    } else {
      console.log(`✗ Échec: ${frais.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 3: Créer un frais d'hébergement
  console.log("\n[TEST 3] Création d'un frais d'hébergement...");
  try {
    const justificatif = Buffer.from("Justificatif PDF hébergement");

    const frais = await FraisHandler.createFraisHebergement({
      lieu: "Lyon",
      date: new Date(),
      justificatif: justificatif,
      montant: 120.0,
      statut: StatutFrais.BROUILLON,
      id_utilisateur: testUserId,
      id_chantier: testChantierId,
      date_debut: new Date("2025-10-20"),
      date_fin: new Date("2025-10-21"),
      nb_nuits: 1,
      nom_etablissement: "Hôtel Test",
    });

    if (frais.success && frais.data) {
      testFraisHebergementId = frais.data.id_hebergement;
      console.log(
        `✓ Frais d'hébergement créé avec ID: ${testFraisHebergementId}`
      );
      console.log(`  Montant: ${frais.data.montant}€`);
      successCount++;
    } else {
      console.log(`✗ Échec: ${frais.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 4: Récupérer les frais d'un utilisateur
  console.log("\n[TEST 4] Récupération des frais d'un utilisateur...");
  try {
    const frais = await FraisHandler.getFraisByUtilisateur(testUserId);

    if (frais.success && frais.data && frais.data.length >= 3) {
      console.log(
        `✓ ${frais.data.length} frais récupéré(s) pour l'utilisateur`
      );
      successCount++;
    } else {
      console.log(`✗ Échec: ${frais.error || "Nombre de frais incorrect"}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 5: Récupérer tous les frais
  console.log("\n[TEST 5] Récupération de tous les frais...");
  try {
    const frais = await FraisHandler.getAllFrais();

    if (frais.success && frais.data && frais.data.length > 0) {
      console.log(`✓ ${frais.data.length} frais récupéré(s) au total`);
      successCount++;
    } else {
      console.log(`✗ Échec: ${frais.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 6: Récupérer les détails d'un frais de déplacement
  if (testFraisDeplacementId) {
    console.log(
      "\n[TEST 6] Récupération des détails d'un frais de déplacement..."
    );
    try {
      const frais = await FraisHandler.getFraisDeplacementById(
        testFraisDeplacementId
      );

      if (frais.success && frais.data) {
        console.log(
          `✓ Frais de déplacement récupéré: ${frais.data.ville_depart} -> ${frais.data.ville_arrivee}`
        );
        successCount++;
      } else {
        console.log(`✗ Échec: ${frais.error}`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
      failCount++;
    }
  }

  // Test 7: Mettre à jour le statut d'un frais
  if (testFraisDeplacementId) {
    console.log("\n[TEST 7] Mise à jour du statut d'un frais...");
    try {
      const updateResult = await FraisHandler.updateFraisStatut(
        testFraisDeplacementId,
        StatutFrais.EN_COURS
      );

      if (updateResult.success && updateResult.data) {
        console.log(`✓ Statut mis à jour: ${updateResult.data.statut}`);
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

  // Test 8: Filtrer les frais par statut
  console.log("\n[TEST 8] Filtrage des frais par statut...");
  try {
    const frais = await FraisHandler.getAllFrais({
      statut: StatutFrais.EN_COURS,
    });

    if (frais.success && frais.data) {
      console.log(`✓ ${frais.data.length} frais "En Cours" trouvé(s)`);
      successCount++;
    } else {
      console.log(`✗ Échec: ${frais.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 9: Récupérer les statistiques des frais
  console.log("\n[TEST 9] Récupération des statistiques des frais...");
  try {
    const stats = await FraisHandler.getFraisStatsByUtilisateur(testUserId);

    if (stats.success && stats.data) {
      console.log(`✓ Statistiques récupérées:`);
      console.log(`  Total de frais: ${stats.data.total}`);
      console.log(`  Montant total: ${stats.data.montantTotal}€`);
      successCount++;
    } else {
      console.log(`✗ Échec: ${stats.error}`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ Erreur: ${error.message}`);
    failCount++;
  }

  // Test 10: Supprimer les frais de test
  console.log("\n[TEST 10] Suppression des frais de test...");
  let deletedCount = 0;

  if (testFraisDeplacementId) {
    try {
      const deleteResult = await FraisHandler.deleteFrais(
        testFraisDeplacementId
      );
      if (deleteResult.success) deletedCount++;
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
    }
  }

  if (testFraisRepasId) {
    try {
      const deleteResult = await FraisHandler.deleteFrais(testFraisRepasId);
      if (deleteResult.success) deletedCount++;
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
    }
  }

  if (testFraisHebergementId) {
    try {
      const deleteResult = await FraisHandler.deleteFrais(
        testFraisHebergementId
      );
      if (deleteResult.success) deletedCount++;
    } catch (error) {
      console.log(`✗ Erreur: ${error.message}`);
    }
  }

  if (deletedCount === 3) {
    console.log(`✓ ${deletedCount} frais supprimés avec succès`);
    successCount++;
  } else {
    console.log(`✗ Seulement ${deletedCount}/3 frais supprimés`);
    failCount++;
  }

  // Nettoyage: Supprimer l'utilisateur et le chantier de test
  console.log("\n[CLEANUP] Suppression de l'utilisateur et du chantier...");
  try {
    if (testUserId) {
      await UtilisateurHandler.deleteUtilisateur(testUserId);
    }
    if (testChantierId) {
      await ChantierHandler.deleteChantier(testChantierId);
    }
    console.log("✓ Nettoyage effectué");
  } catch (error) {
    console.log(`✗ Erreur lors du nettoyage: ${error.message}`);
  }

  // Résumé
  console.log("\n" + "=".repeat(70));
  console.log("RÉSUMÉ TESTS FRAIS");
  console.log("=".repeat(70));
  console.log(`✓ Réussites: ${successCount}`);
  console.log(`✗ Échecs: ${failCount}`);
  console.log(
    `Taux de réussite: ${((successCount / (successCount + failCount)) * 100).toFixed(1)}%`
  );
  console.log("=".repeat(70));

  return { successCount, failCount };
}
