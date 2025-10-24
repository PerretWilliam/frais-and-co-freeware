// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

/**
 * API exposée au renderer process pour communiquer avec le main process
 * Toutes les fonctions utilisent IPC pour appeler les handlers backend
 */
contextBridge.exposeInMainWorld("electronAPI", {
  // ==========================================================
  // BASE DE DONNÉES
  // ==========================================================
  db: {
    testConnection: () => ipcRenderer.invoke("db:test-connection"),
  },

  // ==========================================================
  // UTILISATEURS
  // ==========================================================
  user: {
    create: (userData: unknown) => ipcRenderer.invoke("user:create", userData),
    login: (credentials: unknown) =>
      ipcRenderer.invoke("user:login", credentials),
    getAll: () => ipcRenderer.invoke("user:getAll"),
    getById: (id: number) => ipcRenderer.invoke("user:getById", id),
    update: (id: number, userData: unknown) =>
      ipcRenderer.invoke("user:update", id, userData),
    delete: (id: number) => ipcRenderer.invoke("user:delete", id),
    changePassword: (id: number, oldPassword: string, newPassword: string) =>
      ipcRenderer.invoke("user:changePassword", id, oldPassword, newPassword),
    validate: (id: number) => ipcRenderer.invoke("user:validate", id),
    getPending: () => ipcRenderer.invoke("user:getPending"),
  },

  // ==========================================================
  // CHANTIERS
  // ==========================================================
  chantier: {
    create: (chantierData: unknown) =>
      ipcRenderer.invoke("chantier:create", chantierData),
    getAll: () => ipcRenderer.invoke("chantier:getAll"),
    getById: (id: number) => ipcRenderer.invoke("chantier:getById", id),
    update: (id: number, chantierData: unknown) =>
      ipcRenderer.invoke("chantier:update", id, chantierData),
    delete: (id: number) => ipcRenderer.invoke("chantier:delete", id),
    search: (searchTerm: string) =>
      ipcRenderer.invoke("chantier:search", searchTerm),
  },

  // ==========================================================
  // FRAIS
  // ==========================================================
  frais: {
    createDeplacement: (fraisData: unknown) =>
      ipcRenderer.invoke("frais:createDeplacement", fraisData),
    createRepas: (fraisData: unknown) =>
      ipcRenderer.invoke("frais:createRepas", fraisData),
    createHebergement: (fraisData: unknown) =>
      ipcRenderer.invoke("frais:createHebergement", fraisData),
    getByUser: (idUtilisateur: number) =>
      ipcRenderer.invoke("frais:getByUser", idUtilisateur),
    getAll: (filters?: unknown) => ipcRenderer.invoke("frais:getAll", filters),
    getDeplacementById: (id: number) =>
      ipcRenderer.invoke("frais:getDeplacementById", id),
    getRepasById: (id: number) => ipcRenderer.invoke("frais:getRepasById", id),
    getHebergementById: (id: number) =>
      ipcRenderer.invoke("frais:getHebergementById", id),
    updateStatut: (id: number, statut: string) =>
      ipcRenderer.invoke("frais:updateStatut", id, statut),
    delete: (id: number) => ipcRenderer.invoke("frais:delete", id),
    getStatsByUser: (idUtilisateur: number) =>
      ipcRenderer.invoke("frais:getStatsByUser", idUtilisateur),
  },

  // ==========================================================
  // GRILLE TARIFAIRE
  // ==========================================================
  tarif: {
    upsert: (tarifData: unknown) =>
      ipcRenderer.invoke("tarif:upsert", tarifData),
    getAll: () => ipcRenderer.invoke("tarif:getAll"),
    getByCylindree: (cylindree: number) =>
      ipcRenderer.invoke("tarif:getByCylindree", cylindree),
    delete: (cylindree: number) =>
      ipcRenderer.invoke("tarif:delete", cylindree),
    calculateDeplacement: (cylindree: number, distanceKm: number) =>
      ipcRenderer.invoke("tarif:calculateDeplacement", cylindree, distanceKm),
  },

  // ==========================================================
  // TÉLÉPHONES
  // ==========================================================
  telephone: {
    create: (telephoneData: unknown) =>
      ipcRenderer.invoke("telephone:create", telephoneData),
    getByUser: (idUtilisateur: number) =>
      ipcRenderer.invoke("telephone:getByUser", idUtilisateur),
    update: (id: number, telephoneData: unknown) =>
      ipcRenderer.invoke("telephone:update", id, telephoneData),
    delete: (id: number) => ipcRenderer.invoke("telephone:delete", id),
  },
});

// Déclaration TypeScript pour l'autocomplétion
declare global {
  interface Window {
    electronAPI: {
      db: {
        testConnection: () => Promise<boolean>;
      };
      user: {
        create: (userData: unknown) => Promise<unknown>;
        login: (credentials: unknown) => Promise<unknown>;
        getAll: () => Promise<unknown>;
        getById: (id: number) => Promise<unknown>;
        update: (id: number, userData: unknown) => Promise<unknown>;
        delete: (id: number) => Promise<unknown>;
        changePassword: (
          id: number,
          oldPassword: string,
          newPassword: string
        ) => Promise<unknown>;
        validate: (id: number) => Promise<unknown>;
        getPending: () => Promise<unknown>;
      };
      chantier: {
        create: (chantierData: unknown) => Promise<unknown>;
        getAll: () => Promise<unknown>;
        getById: (id: number) => Promise<unknown>;
        update: (id: number, chantierData: unknown) => Promise<unknown>;
        delete: (id: number) => Promise<unknown>;
        search: (searchTerm: string) => Promise<unknown>;
      };
      frais: {
        createDeplacement: (fraisData: unknown) => Promise<unknown>;
        createRepas: (fraisData: unknown) => Promise<unknown>;
        createHebergement: (fraisData: unknown) => Promise<unknown>;
        getByUser: (idUtilisateur: number) => Promise<unknown>;
        getAll: (filters?: unknown) => Promise<unknown>;
        getDeplacementById: (id: number) => Promise<unknown>;
        getRepasById: (id: number) => Promise<unknown>;
        getHebergementById: (id: number) => Promise<unknown>;
        updateStatut: (id: number, statut: string) => Promise<unknown>;
        delete: (id: number) => Promise<unknown>;
        getStatsByUser: (idUtilisateur: number) => Promise<unknown>;
      };
      tarif: {
        upsert: (tarifData: unknown) => Promise<unknown>;
        getAll: () => Promise<unknown>;
        getByCylindree: (cylindree: number) => Promise<unknown>;
        delete: (cylindree: number) => Promise<unknown>;
        calculateDeplacement: (
          cylindree: number,
          distanceKm: number
        ) => Promise<unknown>;
      };
      telephone: {
        create: (telephoneData: unknown) => Promise<unknown>;
        getByUser: (idUtilisateur: number) => Promise<unknown>;
        update: (id: number, telephoneData: unknown) => Promise<unknown>;
        delete: (id: number) => Promise<unknown>;
      };
    };
  }
}
