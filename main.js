const { app, BrowserWindow, ipcMain, shell, event } = require("electron");
const path = require("path");
const { Client } = require("minecraft-launcher-core");
const { Auth } = require("msmc");
const fs = require("fs").promises;
const fs2 = require("fs");
const AdmZip = require("adm-zip");
const Downloader = require("nodejs-file-downloader");
const axios = require("axios").default;
const logNocturia = require("electron-log");
const logApp = require("electron-log");
const { autoUpdater } = require("electron-updater");
const WindowsToaster = require('node-notifier').WindowsToaster;
const host = '188.165.38.14';
const mcs = require('node-mcstatus');
const portMC = 25565;
const options = { query: true };

const authManager = new Auth("select_account");
const launcher = new Client();

let windowsToasterNotifier = new WindowsToaster({
  withFallback: true
});
let mainWindow;
let responseUpdate
let bootstrapWindow;
let token;
let url = "https://api.github.com/repos/AlexandreSama/Blackrock-Launcher-V2/releases";
let appPaths = [app.getPath("appData") + "\\Blackrock Launcher\\"];
let nocturiaPaths = [appPaths[0] + "Nocturia\\", appPaths[0] + "Nocturia\\mods\\", appPaths[0] + "Nocturia\\java\\"];

autoUpdater.logger = logApp;
autoUpdater.logger.transports.file.level = "info";
autoUpdater.logger.transports.file.resolvePath = () => path.join(appPaths[0], "logs/main.log");
logNocturia.transports.file.resolvePath = () => path.join(nocturiaPaths[0], "NocturiaLogs/main.log");
autoUpdater.setFeedURL({ provider: "github", owner: "AlexandreSama", repo: "Blackrock-Launcher-V2" });
// autoUpdater.setFeedURL({ 
//   provider: "generic",
//   url: 'https://kashir.fr/UpdaterBlackrock/'
// });

function sendStatusToWindow(text) {
  logApp.info(text);
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1115,
    height: 720,
    icon: "./build/logo.ico",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      // devTools: true
    },
    autoHideMenuBar: true,
    frame: true,
  });

  bootstrapWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    show: false,
    width: 400,
    height: 200,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    frame: false,
  });

  mainWindow.loadFile("./views/main.html");
  bootstrapWindow.loadFile("./views/bootstrap.html");
  // bootstrapWindow.show()
};

app.on("ready", function () {
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("Checking for update...");
});

autoUpdater.on("update-not-available", (info) => {
  sendStatusToWindow("Update not available.");
});

autoUpdater.on("error", (err) => {
  sendStatusToWindow("Error in auto-updater. " + err);
});

console.log(path.join(__dirname, "/logo.jpg"))
autoUpdater.on("update-available", () => {
  sendStatusToWindow("Update available.");
  windowsToasterNotifier.notify({
    title: "Mise a jour est disponible !",
    icon: path.join(__dirname, "logo.jpg"),
    message: "Une mise a jour est disponible ! Voulez-vous la télécharger et l'installer ?",
    actions: ["Oui", "Non"],
    wait: true,
    sound: "SMS"
  }, function (err, response, metadata) {
    if (response === "oui") {
      responseUpdate = response
      mainWindow.hide();
      bootstrapWindow.show();
    }
  });
});

autoUpdater.on("update-downloaded", () => {
  sendStatusToWindow("Update Téléchargé !");
  if (responseUpdate === "oui") {
    autoUpdater.quitAndInstall(true, true);
  }
});

autoUpdater.on("download-progress", (progress) => {
  bootstrapWindow.webContents.send("bootstrapDownload", progress);
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("getAppName", () => app.getName());

ipcMain.handle("getAppVersion", () => app.getVersion());

ipcMain.handle("getPlayers", () => {
  mcs.statusJava(host, portMC, options)
  .then((result) => {
      if(result.online == false){
        mainWindow.webContents.send("receivePlayers", [0, 'Fermé', '0ms'])
      }else{
        mainWindow.webContents.send("receivePlayers", [result.players.online, 'Ouvert', '10ms'])
      }
  }).catch((err) => {
    console.log(err)
  })
})

ipcMain.handle("goToParam", () => mainWindow.loadFile("./views/param.html"));
ipcMain.handle("goToMain", async () =>{
  mainWindow.loadFile("./views/main.html")
  mainWindow.webContents.on('did-finish-load', () => {
    if(token){
      mainWindow.webContents.send("loginDone", [token.profile.name, token.profile.id])
    }
  })
})
ipcMain.handle("showGameFolder", () => shell.openPath(nocturiaPaths[0]));

ipcMain.handle("loginMS", async (event, data) => {
  const xboxManager = await authManager.launch("electron");
  token = await xboxManager.getMinecraft();
  mainWindow.webContents.send("loginDone", [token.profile.name, token.profile.id]);
});

ipcMain.handle("closeApp", () => app.quit());

ipcMain.handle("reduceApp", () => mainWindow.minimize());

async function getChangelogs(url) {
  const response = await axios.get(url);
  return response.data;
}

ipcMain.handle("getChangelogs", async (event, data) => {
  const res = await getChangelogs(url);
  event.sender.send("changelogs", res);
});

async function writeRamToFile(ram, rootFolder, event) {
  ram = ram + "G";
  await fs.writeFile(path.join(rootFolder, "nocturiaOptions.json"), JSON.stringify({ ram }));
  event.sender.send("ramSaved", "La ram a bien été sauvegardé !");
}

async function getRamFromFile(rootFolder) {
  try {
    const data = await fs.readFile(path.join(rootFolder, "nocturiaOptions.json"), "utf-8");
    const json = JSON.parse(data);
    return json.ram;
  } catch (error) {
    console.error("Error reading file:", error);
    return 8;
  }
}

async function createFolderIfNotExist(folderPath) {
  try {
    if (!(await fs.access(folderPath).catch(() => false))) {
      console.warn(`Folder ${folderPath} missing! Creating it.`);
      await fs.mkdir(folderPath);
    }
  } catch (err) {
    console.error(`Error creating folder ${folderPath}:`, err);
  }
}

async function checkLauncherPaths(rootFolder, javaFolder, modsFolder, event) {
  const arrayPath = [rootFolder, modsFolder, javaFolder];
  for (const element of arrayPath) {
    await createFolderIfNotExist(element);
  }
  logNocturia.info("Folders checked!");
  event.sender.send("finishFile");
  return true;
}

async function checkJavaAndForge(rootFolder, javaFolder, event) {
  try {
    const files = await fs.readdir(javaFolder);
    if (files.length === 0) {
      event.sender.send("javaEvents", "Java is missing! I'm ready to download!");
      const downloadJava = new Downloader({
        url: "https://blackrockapi.kashir.fr/java",
        directory: javaFolder,
      });

      try {
        await downloadJava.download();
        event.sender.send("javaEvents", "Java is downloaded and being extracted");
        const zip = new AdmZip(path.join(javaFolder, "java.zip"));
        zip.extractAllTo(javaFolder, true);
        await fs.unlink(path.join(javaFolder, "java.zip"));
        event.sender.send("javaEvents", "Java is extracted");
        event.sender.send("javaEvents", "javaDownloaded", "Java téléchargé avec succès");
      } catch (error) {
        event.sender.send("javaEvents", "Error downloading or extracting Java:", error);
      }
    }

    const forgeFilePath = path.join(rootFolder, "forge.jar");

    try {
      await fs.access(forgeFilePath);
      event.sender.send("forgeEvents", "forgeAlreadyDownload");
    } catch {
      event.sender.send("forgeEvents", "Forge is missing! Preparing to download...");

      const downloadForge = new Downloader({
        url: "https://blackrockapi.kashir.fr/forge",
        directory: rootFolder,
      });

      try {
        event.sender.send("forgeEvents", "Downloading Forge...");
        await downloadForge.download();
        event.sender.send("forgeEvents", "Forge Downloaded!");
        event.sender.send("forgeEvents", "forgeDownloaded", "Forge téléchargé avec succès");
      } catch (error) {
        event.sender.send("forgeEvents", "Error downloading Forge:", error);
      }
    }

    event.sender.send("Java and Forge checking completed!");
    return true;
  } catch (error) {
    console.log(error);
    event.sender.send("Error checking Java and Forge");
    return false;
  }
}

async function synchronizeFilesWithJSON(folderPath, event) {
  try {
    const response = await axios.get("https://blackrockapi.kashir.fr/modlist");
    const jsonContent = response.data;
    const folderFiles = await fs.readdir(folderPath);
    const missingFiles = jsonContent.filter(file => !folderFiles.includes(file));

    if (missingFiles.length > 0) {
      event.sender.send("modEvents", `${missingFiles.length} files are missing from the folder!`);

      for (const file of missingFiles) {
        const downloadFile = new Downloader({
          url: `https://blackrockapi.kashir.fr/mod/${file}`,
          directory: folderPath,
          maxAttempts: 3,
        });

        await downloadFile.download();
        event.sender.send("modEvents", missingFiles.length);
      }
    }

    const extraFiles = folderFiles.filter(file => !jsonContent.includes(file));

    if (extraFiles.length > 0) {
      event.sender.send("modEvents", `${extraFiles.length} files are not present in the JSON!`);

      for (const file of extraFiles) {
        await fs.unlink(path.join(folderPath, file));
        event.sender.send("modEvents", `Removed file: ${file}`);
      }
    }

    event.sender.send("modEvents", "File synchronization completed successfully!");
    return true;
  } catch (error) {
    console.log(error);
    event.sender.send("modEvents", "Error synchronizing files");
    return false;
  }
}

async function launchGame(token, rootFolder, javaFolder, ram, event, mainWindow) {
  const opts = {
    clientPackage: null,
    authorization: token.mclc(),
    root: rootFolder,
    forge: path.join(rootFolder, "forge.jar"),
    javaPath: path.join(javaFolder, "java", "bin", "java.exe"),
    version: {
      number: "1.19.2",
      type: "release",
    },
    memory: {
      max: ram !== 0 ? ram : "8G",
      min: "4G",
    },
  };

  launcher.launch(opts);

  launcher.on("close", (e) => {
    const errorMessage = (e === 1) ? "closed the Minecraft Process" : "Minecraft Process has crashed";
    logNocturia.error(`The Minecraft Process Stop with Code Error: ${e} Which means that you ${errorMessage}.`);
    mainWindow.show();
    event.sender.send("stoppingGame");
  });

  launcher.on("progress", (e) => {
    logNocturia.info(`["Minecraft-Progress"] ${e.type} | ${e.task} | ${e.total}`);
    event.sender.send("dataDownload", {
      type: e.type,
      task: e.task,
      total: e.total,
    });
  });

  launcher.on("debug", (e) => {
    logNocturia.debug(`["Minecraft-Debug"] ${e}`);
  });

  launcher.on("data", (e) => {
    logNocturia.info(`["Minecraft-Data"] ${e}`);
  });

  launcher.once("data", () => {
    mainWindow.hide();
    event.sender.send("LaunchingGame");
  });
}

async function launchMC(token, rootFolder, modsFolder, javaFolder, event, mainWindow) {
  const checkPaths = await checkLauncherPaths(rootFolder, javaFolder, modsFolder, event);

  if (checkPaths) {
    const checkDeps = await checkJavaAndForge(rootFolder, javaFolder, event);

    if (checkDeps) {
      const response = await synchronizeFilesWithJSON(modsFolder, event);

      if (response) {
        getRamFromFile(rootFolder).then((ram) => {
          launchGame(token, rootFolder, javaFolder, ram, event, mainWindow);
        });
      }
    }
  }
}

ipcMain.handle("play", async (event, data) => {
  launchMC(
    token,
    nocturiaPaths[0],
    nocturiaPaths[1],
    nocturiaPaths[2],
    event,
    mainWindow
  );
});

ipcMain.handle("saveRam", async (event, data) => {
  writeRamToFile(data, nocturiaPaths[0], event);
});

ipcMain.handle("getRam", async () => {
  return getRamFromFile(nocturiaPaths[0]);
});
