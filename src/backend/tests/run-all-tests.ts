/**
 * Suite de tests complète pour tout le backend
 * Exécute tous les tests de manière organisée
 */

import { testConnection, closePool } from "../config/database";
import { testUtilisateurs } from "./utilisateur.test";
import { testChantiers } from "./chantier.test";
import { testFrais } from "./frais.test";
import { testGrilleTarifaire } from "./grille-tarifaire.test";
import { testTelephones } from "./telephone.test";

async function runAllTests() {
  console.log("\n");
  console.log("╔" + "═".repeat(68) + "╗");
  console.log(
    "║" +
      " ".repeat(15) +
      "SUITE DE TESTS BACKEND FREEWARE" +
      " ".repeat(22) +
      "║"
  );
  console.log("╚" + "═".repeat(68) + "╝");
  console.log("\n");

  // Test de connexion à la base de données
  console.log("Vérification de la connexion à la base de données...");
  const isConnected = await testConnection();

  if (!isConnected) {
    console.error("✗ ÉCHEC: Impossible de se connecter à la base de données");
    console.error("Assurez-vous que PostgreSQL est démarré (npm run db:up)");
    process.exit(1);
  }

  console.log("✓ Connexion à PostgreSQL établie\n");

  const startTime = Date.now();
  let totalSuccess = 0;
  let totalFail = 0;

  try {
    // Test 1: Utilisateurs
    const userResults = await testUtilisateurs();
    totalSuccess += userResults.successCount;
    totalFail += userResults.failCount;

    // Test 2: Chantiers
    const chantierResults = await testChantiers();
    totalSuccess += chantierResults.successCount;
    totalFail += chantierResults.failCount;

    // Test 3: Frais
    const fraisResults = await testFrais();
    totalSuccess += fraisResults.successCount;
    totalFail += fraisResults.failCount;

    // Test 4: Grille Tarifaire
    const tarifResults = await testGrilleTarifaire();
    totalSuccess += tarifResults.successCount;
    totalFail += tarifResults.failCount;

    // Test 5: Téléphones
    const telephoneResults = await testTelephones();
    totalSuccess += telephoneResults.successCount;
    totalFail += telephoneResults.failCount;

    // Résumé global
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n");
    console.log("╔" + "═".repeat(68) + "╗");
    console.log(
      "║" + " ".repeat(20) + "RÉSUMÉ GLOBAL DES TESTS" + " ".repeat(25) + "║"
    );
    console.log("╠" + "═".repeat(68) + "╣");
    console.log(
      `║  Total de tests exécutés: ${totalSuccess + totalFail}${" ".repeat(43 - String(totalSuccess + totalFail).length)}║`
    );
    console.log(
      `║  ✓ Réussites: ${totalSuccess}${" ".repeat(52 - String(totalSuccess).length)}║`
    );
    console.log(
      `║  ✗ Échecs: ${totalFail}${" ".repeat(55 - String(totalFail).length)}║`
    );
    console.log(
      `║  Taux de réussite: ${((totalSuccess / (totalSuccess + totalFail)) * 100).toFixed(1)}%${" ".repeat(44 - String(((totalSuccess / (totalSuccess + totalFail)) * 100).toFixed(1)).length)}║`
    );
    console.log(
      `║  Durée: ${duration}s${" ".repeat(56 - String(duration).length)}║`
    );
    console.log("╚" + "═".repeat(68) + "╝");

    if (totalFail === 0) {
      console.log("\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS! 🎉\n");
    } else {
      console.log(`\n⚠️  ${totalFail} TEST(S) ONT ÉCHOUÉ\n`);
    }
  } catch (error) {
    console.error("\n✗ ERREUR CRITIQUE lors de l'exécution des tests:", error);
    totalFail++;
  } finally {
    // Fermer la connexion à la base de données
    await closePool();
  }

  // Code de sortie basé sur les résultats
  process.exit(totalFail > 0 ? 1 : 0);
}

// Exécuter tous les tests
runAllTests().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});
