const path = require("node:path");
const { app, BrowserWindow, dialog, shell } = require("electron");
const { autoUpdater } = require("electron-updater");

let mainWindow = null;
let httpServer = null;

function setupRuntimePaths() {
  const userData = app.getPath("userData");
  process.env.NODE_ENV ||= "production";
  process.env.PORT = "0";
  process.env.DB_PATH = path.join(userData, "data", "nexus.db");
  process.env.BACKUP_DIR = path.join(userData, "backups");
  process.env.LOG_DIR = path.join(userData, "logs");
  process.env.CORS_ORIGIN = "";
}

async function createWindow() {
  setupRuntimePaths();
  const { start } = require("./src/server");
  httpServer = await start({ port: 0 });
  const address = httpServer.address();
  const port = typeof address === "object" && address ? address.port : 3000;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: "Nexus Redação",
    icon: path.join(__dirname, "favicon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}`);
  setupAutoUpdater();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (httpServer) httpServer.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

function setupAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-downloaded", async () => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["Reiniciar e instalar", "Depois"],
      defaultId: 0,
      cancelId: 1,
      title: "Atualização baixada",
      message: "Uma nova versão do Nexus Redação foi baixada.",
      detail: "Reinicie o aplicativo para instalar a atualização agora."
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall(false, true);
    }
  });

  autoUpdater.on("error", (error) => {
    console.error("Erro no atualizador:", error);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error("Nao foi possivel verificar atualizacoes:", error);
    });
  }, 5000);
}
