import { ipcMain } from "electron";
import * as UtilisateurHandler from "../handlers/utilisateur.handler";
import * as ChantierHandler from "../handlers/chantier.handler";
import * as FraisHandler from "../handlers/frais.handler";
import * as GrilleTarifaireHandler from "../handlers/grille-tarifaire.handler";
import * as TelephoneHandler from "../handlers/telephone.handler";
import { testConnection } from "../config/database";

/**
 * Enregistre tous les handlers IPC pour la communication avec le renderer
 */
export function registerIpcHandlers(): void {
  console.log("Enregistrement des handlers IPC...");

  // ==========================================================
  // CONNEXION À LA BASE DE DONNÉES
  // ==========================================================

  ipcMain.handle("db:test-connection", async () => {
    return await testConnection();
  });

  // ==========================================================
  // GESTION DES UTILISATEURS
  // ==========================================================

  ipcMain.handle("user:create", async (_, userData) => {
    return await UtilisateurHandler.createUtilisateur(userData);
  });

  ipcMain.handle("user:login", async (_, credentials) => {
    return await UtilisateurHandler.loginUtilisateur(credentials);
  });

  ipcMain.handle("user:getAll", async () => {
    return await UtilisateurHandler.getAllUtilisateurs();
  });

  ipcMain.handle("user:getById", async (_, id: number) => {
    return await UtilisateurHandler.getUtilisateurById(id);
  });

  ipcMain.handle("user:update", async (_, id: number, userData) => {
    return await UtilisateurHandler.updateUtilisateur(id, userData);
  });

  ipcMain.handle("user:delete", async (_, id: number) => {
    return await UtilisateurHandler.deleteUtilisateur(id);
  });

  ipcMain.handle(
    "user:changePassword",
    async (_, id: number, oldPassword: string, newPassword: string) => {
      return await UtilisateurHandler.changePassword(
        id,
        oldPassword,
        newPassword
      );
    }
  );

  ipcMain.handle("user:validate", async (_, id: number) => {
    return await UtilisateurHandler.validateUtilisateur(id);
  });

  ipcMain.handle("user:getPending", async () => {
    return await UtilisateurHandler.getPendingUtilisateurs();
  });

  // ==========================================================
  // GESTION DES CHANTIERS
  // ==========================================================

  ipcMain.handle("chantier:create", async (_, chantierData) => {
    return await ChantierHandler.createChantier(chantierData);
  });

  ipcMain.handle("chantier:getAll", async () => {
    return await ChantierHandler.getAllChantiers();
  });

  ipcMain.handle("chantier:getById", async (_, id: number) => {
    return await ChantierHandler.getChantierById(id);
  });

  ipcMain.handle("chantier:update", async (_, id: number, chantierData) => {
    return await ChantierHandler.updateChantier(id, chantierData);
  });

  ipcMain.handle("chantier:delete", async (_, id: number) => {
    return await ChantierHandler.deleteChantier(id);
  });

  ipcMain.handle("chantier:search", async (_, searchTerm: string) => {
    return await ChantierHandler.searchChantiers(searchTerm);
  });

  // ==========================================================
  // GESTION DES FRAIS
  // ==========================================================

  ipcMain.handle("frais:createDeplacement", async (_, fraisData) => {
    return await FraisHandler.createFraisDeplacement(fraisData);
  });

  ipcMain.handle("frais:createRepas", async (_, fraisData) => {
    return await FraisHandler.createFraisRepas(fraisData);
  });

  ipcMain.handle("frais:createHebergement", async (_, fraisData) => {
    return await FraisHandler.createFraisHebergement(fraisData);
  });

  ipcMain.handle("frais:getByUser", async (_, idUtilisateur: number) => {
    return await FraisHandler.getFraisByUtilisateur(idUtilisateur);
  });

  ipcMain.handle("frais:getAll", async (_, filters) => {
    return await FraisHandler.getAllFrais(filters);
  });

  ipcMain.handle("frais:getDeplacementById", async (_, id: number) => {
    return await FraisHandler.getFraisDeplacementById(id);
  });

  ipcMain.handle("frais:getRepasById", async (_, id: number) => {
    return await FraisHandler.getFraisRepasById(id);
  });

  ipcMain.handle("frais:getHebergementById", async (_, id: number) => {
    return await FraisHandler.getFraisHebergementById(id);
  });

  ipcMain.handle("frais:updateStatut", async (_, id: number, statut) => {
    return await FraisHandler.updateFraisStatut(id, statut);
  });

  ipcMain.handle("frais:delete", async (_, id: number) => {
    return await FraisHandler.deleteFrais(id);
  });

  ipcMain.handle("frais:getStatsByUser", async (_, idUtilisateur: number) => {
    return await FraisHandler.getFraisStatsByUtilisateur(idUtilisateur);
  });

  // ==========================================================
  // GESTION DE LA GRILLE TARIFAIRE
  // ==========================================================

  ipcMain.handle("tarif:upsert", async (_, tarifData) => {
    return await GrilleTarifaireHandler.upsertTarif(tarifData);
  });

  ipcMain.handle("tarif:getAll", async () => {
    return await GrilleTarifaireHandler.getAllTarifs();
  });

  ipcMain.handle("tarif:getByCylindree", async (_, cylindree: number) => {
    return await GrilleTarifaireHandler.getTarifByCylindree(cylindree);
  });

  ipcMain.handle("tarif:delete", async (_, cylindree: number) => {
    return await GrilleTarifaireHandler.deleteTarif(cylindree);
  });

  ipcMain.handle(
    "tarif:calculateDeplacement",
    async (_, cylindree: number, distanceKm: number) => {
      return await GrilleTarifaireHandler.calculateDeplacementAmount(
        cylindree,
        distanceKm
      );
    }
  );

  console.log("Handlers IPC enregistrés avec succès");
}
