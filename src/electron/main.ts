import { app, BrowserWindow } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { registerIpcHandlers } from "../backend/ipc/ipc-handlers";
import { testConnection } from "../backend/config/database";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false, // Sécurité: désactiver l'intégration Node dans le renderer
      contextIsolation: true, // Sécurité: isoler le contexte
      // Content Security Policy sera géré par les meta tags HTML
    },
  });

  // Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: https:; " +
              "connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com; " +
              "font-src 'self' data:;",
          ],
        },
      });
    }
  );

  // Charger l'interface de test si on est en mode test
  const isTestMode = process.env.TEST_MODE === "true";

  if (isTestMode) {
    // En mode dev, charger depuis le serveur Vite
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(
        `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/frontend/test/index-test.html`
      );
      console.log("Mode test activé - Interface de test chargée (dev mode)");
    } else {
      // En mode production, charger depuis le build
      const testPath = path.join(__dirname, "../renderer/index-test.html");
      mainWindow.loadFile(testPath);
      console.log("Mode test activé - Interface de test chargée (production)");
    }
  } else {
    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(
        `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/frontend/index.html`
      );
    } else {
      mainWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
      );
    }
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  // Enregistrer tous les handlers IPC
  registerIpcHandlers();

  // Tester la connexion à la base de données
  console.log("Test de connexion à la base de données...");
  await testConnection();

  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
