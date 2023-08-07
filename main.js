const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  event,
} = require("electron");
const path = require("path");
const { Client } = require("minecraft-launcher-core");
const { Auth } = require("msmc");
const authManager = new Auth("select_account");
const launcher = new Client();
const fs = require("fs").promises;
const fs2 = require("fs");
const AdmZip = require("adm-zip");
const Downloader = require("nodejs-file-downloader");
const axios = require("axios").default;
const logNocturia = require("electron-log");
const logApp = require("electron-log");
const { autoUpdater } = require("electron-updater");
const notifier = require("node-notifier");
let mainWindow;
let bootstrapWindow;
let token;
let url =
  "https://api.github.com/repos/AlexandreSama/Blackrock-Launcher-V2/releases";
let appPaths = [app.getPath("appData") + "\\Blackrock Launcher\\"];
let nocturiaPaths = [
  appPaths[0] + "Nocturia\\",
  appPaths[0] + "Nocturia\\mods\\",
  appPaths[0] + "Nocturia\\java\\",
];

autoUpdater.logger = logApp;
autoUpdater.logger.transports.file.level = "info";
autoUpdater.logger.transports.file.resolvePath = () =>
  path.join(appPaths[0], "logs/main.log");

logNocturia.transports.file.resolvePath = () =>
  path.join(nocturiaPaths[0], "NocturiaLogs/main.log");

autoUpdater.setFeedURL({
  provider: "github",
  owner: "AlexandreSama",
  repo: "Blackrock-Launcher-V2",
});
/**
 * It takes a string as an argument and logs it to the console.
 * @param text - The text to be displayed in the status bar.
 */
function sendStatusToWindow(text) {
  logApp.info(text);
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: "./build/logo.ico",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      // devTools: true
    },
    autoHideMenuBar: true,
    frame: false,
  });
  bootstrapWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true, 
    show: false,
    width: 400,
    height: 200,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    },
    // autoHideMenuBar: true,
    // frame: false
  });

  mainWindow.loadFile("./views/main.html");
  bootstrapWindow.loadFile("./views/bootstrap.html");

  // mainWindow.webContents.openDevTools({mode: 'detach', activate: true})
};
app.on("ready", function () {
  autoUpdater.checkForUpdatesAndNotify();
});

/* Listening for an update-not-available event and then sending a message to the window. */
autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("Checking for update...");
});

/* Listening for an update-not-available event and then sending a message to the window. */
autoUpdater.on("update-not-available", (info) => {
  sendStatusToWindow("Update not available.");
});

/* A listener for the autoUpdater. It listens for an error and then sends the error to the window. */
autoUpdater.on("error", (err) => {
  sendStatusToWindow("Error in auto-updater. " + err);
});

/* Showing a notification to the user when an update is available. */
autoUpdater.on("update-available", () => {
  sendStatusToWindow("Update available.");
  notifier.notify(
    {
      title: "Mise a jour est disponible !",
      message:
        "Une mise a jour est disponible ! Voulez-vous la télécharger et l'installer ?",
      actions: ["Oui", "Non"],
      wait: true,
      icon: "./logo.ico",
      sound: "./update.mp3",
    },
    function (err, response, metadata) {
      responseUpdate = response;
      if (response == "oui") {
        mainWindow.hide();
        bootstrapWindow.show()
      }
    }
  );
});

/* Listening for an update-downloaded event and then sending a message to the window. */
autoUpdater.on("update-downloaded", () => {
  sendStatusToWindow("Update Téléchargé !");
  sendStatusToWindow(responseUpdate);
  if (responseUpdate == "oui") {
    autoUpdater.quitAndInstall(true, true);
  }
});

autoUpdater.on("download-progress", (progress) => {
    bootstrapWindow.webContents.send('bootstrapDownload', progress)
});

// Creates and starts the window if it doesn't exist. This is called on startup
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

ipcMain.handle("getAppName", () => {
  return app.getName();
});

ipcMain.handle("getAppVersion", () => {
  return app.getVersion();
});

ipcMain.handle("goToParam", () => {
  mainWindow.loadFile("./views/param.html");
});

ipcMain.handle("showGameFolder", () => {
  shell.openPath(nocturiaPaths[0]);
});

/* The above code is a JavaScript code snippet that is using the Electron framework. It is defining an
IPC (Inter-Process Communication) handler for the 'loginMS' event. When this event is triggered, the
code asynchronously launches the 'authManager' with the argument "electron". It then retrieves a
token using the 'getMinecraft' method from the 'xboxManager' object. Finally, it sends a 'loginDone'
event to the mainWindow's webContents with an array containing the name and ID of the token's
profile. */
ipcMain.handle("loginMS", async (event, data) => {
  const xboxManager = await authManager.launch("electron");
  token = await xboxManager.getMinecraft();

  mainWindow.webContents.send("loginDone", [
    token.profile.name,
    token.profile.id,
  ]);
});

ipcMain.handle("closeApp", async (event, data) => {
  app.quit();
});

ipcMain.handle("reduceApp", async (event, data) => {
  mainWindow.minimize();
});

/**
 * The function `getChangelogs` is an asynchronous function that retrieves JSON content from a
 * specified URL using the axios library.
 * @param {string} url - The `url` parameter is the URL of the API endpoint or website from which you want to
 * retrieve the changelogs.
 * @returns the JSON content obtained from the specified URL.
 */
async function getChangelogs(url) {
  const response = await axios.get(url);
  let jsonContent = response.data;
  return jsonContent;
}

ipcMain.handle("getChangelogs", async (event, data) => {
  getChangelogs(url).then((res) => {
    event.sender.send("changelogs", res);
  });
});

/**
 * The function `writeRamToFile` takes in a RAM value, a root folder path, and an event object, and
 * writes the RAM value to a JSON file in the specified root folder.
 * @param {string} ram - The `ram` parameter represents the amount of RAM (Random Access Memory) in gigabytes.
 * It is a string value.
 * @param {string} rootFolder - The `rootFolder` parameter is the path to the root folder where the file will be
 * saved. It should be a string representing the directory path.
 * @param {Electron.IpcMainInvokeEvent} event - The `event` parameter is an object that represents the event that triggered the
 * function. It is typically used in Electron applications to send messages between the main process
 * and the renderer process. In this case, the `event` object is used to send a message to the renderer
 * process indicating that the RAM has
 */
async function writeRamToFile(ram, rootFolder, event) {
  ram = ram + "G";
  await fs.writeFile(
    rootFolder + "nocturiaOptions.json",
    JSON.stringify({ ram })
  );
  event.sender.send("ramSaved", "La ram a bien été sauvegardé !");
}

/**
 * The function `getRamFromFile` reads a JSON file and returns the value of the `ram` property, or a
 * default value of 8 if there is an error reading the file.
 * @param {string} rootFolder - The `rootFolder` parameter is a string that represents the root folder where the
 * file `nocturiaOptions.json` is located.
 * @return the value of the `ram` property from the parsed JSON data. If there is an error reading the
 * file, it will return a default value of 8.
 */
async function getRamFromFile(rootFolder) {
  try {
    const data = await fs.readFile(
      rootFolder + "nocturiaOptions.json",
      "utf-8"
    );
    const json = JSON.parse(data);
    const ram = json.ram;
    return ram;
  } catch (error) {
    console.error("Error reading file:", error);
    return 8;
  }
}

/**
 * The function creates a folder if it doesn't already exist.
 * @param {string} folderPath - The folderPath parameter is a string that represents the path of the folder that
 * needs to be created if it doesn't already exist.
 */
async function createFolderIfNotExist(folderPath) {
  try {
    // Creates a folder if it doesn t exist.
    if (!(await fs.access(folderPath).catch(() => false))) {
      console.warn(`Folder ${folderPath} missing! Creating it.`);
      await fs.mkdir(folderPath);
    }
  } catch (err) {
    console.error(`Error creating folder ${folderPath}:`, err);
  }
}

/**
 * The function checks if certain folders exist and creates them if they don't, then logs a message and
 * sends a finishFile event.
 * @param {string} rootFolder - The root folder is the main folder where the launcher is installed or where the
 * launcher files are located. It is the top-level folder that contains all other folders and files
 * related to the launcher.
 * @param {string} javaFolder - The `javaFolder` parameter represents the folder path where the Java files are
 * located.
 * @param {string} modsFolder - The `modsFolder` parameter is the path to the folder where the game mods are
 * stored.
 * @param {Electron.IpcMainInvokeEvent} event - The `event` parameter is an object that represents the event that triggered the
 * function. It is used to send a message back to the sender of the event. In this case, the function
 * is sending a message with the key `'finishFile'` back to the sender.
 * @returns a boolean value of true.
 */
async function checkLauncherPaths(rootFolder, javaFolder, modsFolder, event) {
  const arrayPath = [rootFolder, modsFolder, javaFolder];

  for (const element of arrayPath) {
    await createFolderIfNotExist(element);
  }

  logNocturia.info("Folders checked!");
  event.sender.send("finishFile");
  return true;
}

/**
 * The function `checkJavaAndForge` checks if Java and Forge are present in the specified folders, and
 * downloads them if they are missing.
 * @param {string} rootFolder - The root folder is the main folder where the Java and Forge files are located or
 * where they will be downloaded to.
 * @param {string} javaFolder - The `javaFolder` parameter is the path to the folder where the Java files will
 * be downloaded and extracted.
 * @param {Electron.IpcMainInvokeEvent} event - The `event` parameter is an object that represents the event being triggered. It is
 * used to send messages or data back to the caller or to notify the caller about the progress or
 * completion of certain tasks. In this code, it is used to send messages to the caller about the
 * status of Java and
 * @returns a boolean value. If the Java and Forge checking is completed without any errors, it will
 * return true. Otherwise, if there is an error during the checking process, it will return false.
 */
async function checkJavaAndForge(rootFolder, javaFolder, event) {
  try {
    const files = await fs.readdir(javaFolder);

    // Download and extract Java files from blackrockapi.kashir.fr java folder
    if (files.length === 0) {
      event.sender.send(
        "javaEvents",
        "Java is missing! I'm ready to download!"
      );
      const downloadJava = new Downloader({
        url: "https://blackrockapi.kashir.fr/java",
        directory: javaFolder,
      });

      try {
        await downloadJava.download();

        event.sender.send(
          "javaEvents",
          "Java is downloaded and being extracted"
        );
        const zip = new AdmZip(path.join(javaFolder, "java.zip"));
        zip.extractAllTo(javaFolder, true);
        await fs.unlink(path.join(javaFolder, "java.zip"));

        event.sender.send("javaEvents", "Java is extracted");

        event.sender.send(
          "javaEvents",
          "javaDownloaded",
          "Java téléchargé avec succès"
        );
      } catch (error) {
        event.sender.send(
          "javaEvents",
          "Error downloading or extracting Java:",
          error
        );
      }
    }

    const forgeFilePath = path.join(rootFolder, "forge.jar");

    try {
      await fs.access(forgeFilePath);
      event.sender.send("forgeEvents", "forgeAlreadyDownload");
    } catch {
      event.sender.send(
        "forgeEvents",
        "Forge is missing! Preparing to download..."
      );

      const downloadForge = new Downloader({
        url: "https://blackrockapi.kashir.fr/forge",
        directory: rootFolder,
      });

      try {
        event.sender.send("forgeEvents", "Downloading Forge...");
        await downloadForge.download();
        event.sender.send("forgeEvents", "Forge Downloaded!");
        event.sender.send(
          "forgeEvents",
          "forgeDownloaded",
          "Forge téléchargé avec succès"
        );
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

/**
 * The function `synchronizeFilesWithJSON` synchronizes files in a folder with a JSON file by
 * downloading missing files and removing extra files.
 * @param {string} folderPath - The `folderPath` parameter is the path to the folder where the files are
 * located. It is a string that specifies the directory path.
 * @param {Electron.IpcMainInvokeEvent} event - The `event` parameter is an object that represents the event that triggered the file
 * synchronization. It is used to send messages or notifications about the progress or status of the
 * synchronization process. It is likely that this code is running in an Electron application, where
 * the `event.sender.send()` method is used to
 * @returns a boolean value. If the file synchronization is completed successfully, it returns `true`.
 * If there is an error synchronizing files, it returns `false`.
 */
async function synchronizeFilesWithJSON(folderPath, event) {
  try {
    const response = await axios.get("https://blackrockapi.kashir.fr/modlist");
    console.log(response);

    const jsonContent = response.data;
    console.log(jsonContent);

    const folderFiles = await fs.readdir(folderPath);

    const missingFiles = jsonContent.filter(
      (file) => !folderFiles.includes(file)
    );
    // Download missing files from the folder
    if (missingFiles.length > 0) {
      event.sender.send(
        "modEvents",
        `${missingFiles.length} files are missing from the folder!`
      );

      for (const file of missingFiles) {
        const downloadFile = new Downloader({
          url: `https://blackrockapi.kashir.fr/mod/` + file,
          directory: folderPath,
          maxAttempts: 3,
        });

        await downloadFile.download();
        event.sender.send("modEvents", missingFiles.length);
      }
    }

    const extraFiles = folderFiles.filter(
      (file) => !jsonContent.includes(file)
    );
    // Remove all files from the extraFiles array
    if (extraFiles.length > 0) {
      event.sender.send(
        "modEvents",
        `${extraFiles.length} files are not present in the JSON!`
      );

      for (const file of extraFiles) {
        await fs.rm(path.join(folderPath, file));
        event.sender.send("modEvents", `Removed file: ${file}`);
      }
    }

    event.sender.send(
      "modEvents",
      "File synchronization completed successfully!"
    );
    return true;
  } catch (error) {
    console.log(error);
    event.sender.send("modEvents", "Error synchronizing files");
    return false;
  }
}

/**
 * The function `launchGame` launches a Minecraft game using the specified token, root folder, Java
 * folder, RAM, event, and mainWindow.
 * @param {Minecraft} token - The `token` parameter is a token used for authorization. It is passed to the
 * `authorization` property in the `opts` object.
 * @param {string} rootFolder - The rootFolder parameter is the path to the folder where the Minecraft game
 * files are located. This folder should contain the necessary files for launching the game, such as
 * the Minecraft launcher, game assets, and libraries.
 * @param {string} javaFolder - The `javaFolder` parameter is the path to the folder where the Java installation
 * is located. It is used to specify the path to the Java executable (`java.exe`) that will be used to
 * launch the game.
 * @param {string}  ram - The `ram` parameter represents the amount of RAM allocated for the game. It can be
 * specified in either gigabytes (e.g., "8G") or megabytes (e.g., "8192M"). If the value is set to 0,
 * it means that the default RAM allocation of
 * @param {Electron.IpcMainInvokeEvent} event - The `event` parameter is an event emitter object that allows you to send and receive
 * events between different parts of your application. It is typically used to communicate between the
 * main process and renderer process in an Electron application.
 * @param {BrowserWindow} mainWindow - The `mainWindow` parameter is a reference to the main window of the application.
 * It is used to show or hide the window when launching or stopping the game.
 */
async function launchGame(
  token,
  rootFolder,
  javaFolder,
  ram,
  event,
  mainWindow
) {
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
    // This function will be called when the Minecraft Process Stop is called.
    if (e === 1) {
      logNocturia.warn(
        "The Minecraft Process Stop with Code Error: " +
          e +
          " Which means that you closed the Minecraft Process"
      );
    } else {
      logNocturia.error(
        "The Minecraft Process Stop with Code Error: " +
          e +
          " Which means that your Minecraft Process has crashed. Check your RAM or the logs, otherwise call my creator and give him this error code and your log file!"
      );
    }
    mainWindow.show();
    event.sender.send("stoppingGame");
  });

  launcher.on("progress", (e) => {
    logNocturia.info(
      '["Minecraft-Progress"] ' + e.type + " | " + e.task + " | " + e.total
    );
    event.sender.send("dataDownload", {
      type: e.type,
      task: e.task,
      total: e.total,
    });
  });
  launcher.on("debug", (e) => {
    logNocturia.debug('["Minecraft-Debug"] ' + e);
  });
  launcher.on("data", (e) => {
    logNocturia.info('["Minecraft-Data"] ' + e);
  });
  launcher.once("data", (e) => {
    mainWindow.hide();
    event.sender.send("LaunchingGame");
  });
}

/**
 * The function `launchMC` checks the paths and dependencies required to launch Minecraft, synchronizes
 * files with a JSON file, retrieves the allocated RAM from a file, and then launches the game.
 * @param {Minecraft} token - The token parameter is likely a token or authentication key used for accessing
 * certain resources or services. It could be used for authentication purposes when launching the
 * Minecraft game.
 * @param {string} rootFolder - The root folder is the main folder where the Minecraft launcher and game files
 * are located. It typically contains subfolders such as "versions", "libraries", and "assets".
 * @param {string} modsFolder - The `modsFolder` parameter is the path to the folder where the Minecraft mods
 * are located.
 * @param {string} javaFolder - The `javaFolder` parameter is the path to the folder where the Java executable
 * is located. This is typically the folder where the Java Development Kit (JDK) is installed.
 * @param {Electron.IpcMainInvokeEvent} event - The "event" parameter is likely an event object that is used to handle events or
 * trigger certain actions within the function. It could be an instance of an event class or an object
 * containing event-related data.
 * @param {BrowserWindow} mainWindow - The `mainWindow` parameter is likely a reference to the main window or
 * application window of the program. It is used to pass the reference to the main window to the
 * `launchGame` function so that it can interact with the window if needed.
 */
async function launchMC(
  token,
  rootFolder,
  modsFolder,
  javaFolder,
  event,
  mainWindow
) {
  const checkPaths = await checkLauncherPaths(
    rootFolder,
    javaFolder,
    modsFolder,
    event
  );
  if (checkPaths == true) {
    console.log("Folders Checked !");
    const checkDeps = await checkJavaAndForge(rootFolder, javaFolder, event);
    if (checkDeps == true) {
      console.log("Java & Forge Checked !");
      const response = await synchronizeFilesWithJSON(modsFolder, event);
      if (response == true) {
        console.log("Mods Checked !");
        getRamFromFile(rootFolder).then((ram) => {
          launchGame(token, rootFolder, javaFolder, ram, event, mainWindow);
          console.log("test");
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

ipcMain.handle("getRam", async (event, data) => {
  return getRamFromFile(nocturiaPaths[0], event);
});
