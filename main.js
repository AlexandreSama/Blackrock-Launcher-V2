const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { Client } = require('minecraft-launcher-core');
const { Auth } = require("msmc");
const authManager = new Auth("select_account");
const launcher = new Client();
const fs = require('fs').promises;
const fs2 = require('fs')
const AdmZip = require("adm-zip");
const Downloader = require("nodejs-file-downloader");
const axios = require('axios').default
const logNocturia = require('electron-log');
const logApp = require('electron-log');
const { autoUpdater } = require('electron-updater');
const notifier = require('node-notifier');
let mainWindow;
let token;
let appPaths = [
    app.getPath('appData') + '\\Blackrock Launcher\\',
]
let nocturiaPaths = [
    appPaths[0] + 'Nocturia\\',
    appPaths[0] + 'Nocturia\\mods\\',
    appPaths[0] + 'Nocturia\\java\\'
]

autoUpdater.logger = logApp;
autoUpdater.logger.transports.file.level = "info"
autoUpdater.logger.transports.file.resolvePath = () => path.join(appPaths[0], 'logs/main.log')

logNocturia.transports.file.resolvePath = () => path.join(nocturiaPaths[0], 'NocturiaLogs/main.log')

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
        icon: './build/logo.ico',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    // mainWindow.webContents.openDevTools()
    mainWindow.loadFile('./views/main.html')
};
app.on('ready', function () {
    autoUpdater.checkForUpdatesAndNotify()
});

/* Listening for an update-not-available event and then sending a message to the window. */
autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
})

/* Listening for an update-not-available event and then sending a message to the window. */
autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('Update not available.');
})

/* A listener for the autoUpdater. It listens for an error and then sends the error to the window. */
autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater. ' + err);
})

/* Showing a notification to the user when an update is available. */
autoUpdater.on('update-available', () => {
    sendStatusToWindow('Update available.');
    notifier.notify({
        title: 'Mise a jour est disponible !',
        message: 'Une mise a jour est disponible ! Voulez-vous la télécharger et l\'installer ?',
        actions: ['Oui', 'Non'],
        wait: true,
        icon: './logo.ico',
        sound: './update.mp3'
    },
        function (err, response, metadata) {
            responseUpdate = response
        })
})

/* Listening for an update-downloaded event and then sending a message to the window. */
autoUpdater.on('update-downloaded', () => {
    sendStatusToWindow('Update Téléchargé !')
    sendStatusToWindow(responseUpdate)
    if (responseUpdate == "oui") {
        autoUpdater.quitAndInstall(true, true)
    }
})

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('getAppName', () => {
    return app.getName();
});

ipcMain.handle('getAppVersion', () => {
    return app.getVersion();
});

ipcMain.handle('goToParam', () => {
    mainWindow.loadFile('./views/param.html')
})

ipcMain.handle('goToMain', () => {
    mainWindow.loadFile('./views/main.html').then(() => {
        mainWindow.webContents.send('loginDone', [token.profile.name, token.profile.id])
    })
})

ipcMain.handle('showGameFolder', () => {
    shell.openPath(nocturiaPaths[0])
})

ipcMain.handle('loginMS', async (event, data) => {
    const xboxManager = await authManager.launch("electron");
    token = await xboxManager.getMinecraft();

    mainWindow.webContents.send('loginDone', [token.profile.name, token.profile.id])
});

async function writeRamToFile(ram, rootFolder, event) {
    ram = ram + 'G'
    await fs.writeFile(rootFolder + 'options.json', JSON.stringify({ ram }));
    event.sender.send('ramSaved', 'La ram a bien été sauvegardé !')
}

async function getRamFromFile(rootFolder) {
    try {
      const data = await fs.readFile(rootFolder + 'options.json', 'utf-8');
      const json = JSON.parse(data);
      const ram = json.ram;
      return ram;
    } catch (error) {
      console.error('Error reading file:', error);
      return 0;
    }
}

async function createFolderIfNotExist(folderPath) {
    try {
        if (!await fs.access(folderPath).catch(() => false)) {
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

    logNocturia.info('Folders checked!');
    event.sender.send('finishFile');
    return true
}

async function checkJavaAndForge(rootFolder, javaFolder, event) {
    try {
        const files = await fs.readdir(javaFolder);

        if (files.length === 0) {
            event.sender.send('javaEvents', 'Java is missing! I\'m ready to download!');
            const downloadJava = new Downloader({
                url: 'https://blackrockapi.kashir.fr/java',
                directory: javaFolder
            });

            try {
                await downloadJava.download();

                event.sender.send('javaEvents', 'Java is downloaded and being extracted');
                const zip = new AdmZip(path.join(javaFolder, 'java.zip'));
                zip.extractAllTo(javaFolder, true);
                await fs.unlink(path.join(javaFolder, 'java.zip'));

                event.sender.send('javaEvents', 'Java is extracted');

                event.sender.send('javaEvents', 'javaDownloaded', 'Java téléchargé avec succès');
            } catch (error) {
                event.sender.send('javaEvents', 'Error downloading or extracting Java:', error);
            }
        }

        const forgeFilePath = path.join(rootFolder, 'forge.jar');

        try {
            await fs.access(forgeFilePath);
            event.sender.send('forgeEvents', 'forgeAlreadyDownload');
        } catch {
            event.sender.send('forgeEvents', 'Forge is missing! Preparing to download...');

            const downloadForge = new Downloader({
                url: 'https://blackrockapi.kashir.fr/forge',
                directory: rootFolder
            });

            try {
                event.sender.send('forgeEvents', 'Downloading Forge...');
                await downloadForge.download();
                event.sender.send('forgeEvents', 'Forge Downloaded!');
                event.sender.send('forgeEvents', 'forgeDownloaded', 'Forge téléchargé avec succès');
            } catch (error) {
                event.sender.send('forgeEvents', 'Error downloading Forge:', error);
            }
        }

        event.sender.send('Java and Forge checking completed!');
        return true;
    } catch (error) {
        event.sender.send('Error checking Java and Forge');
        return false;
    }
}

async function synchronizeFilesWithJSON(folderPath, event) {
    try {
        // Charger le contenu du fichier JSON
        const response = await axios.get('https://blackrockapi.kashir.fr/modlist');
        console.log(response)

        const jsonContent = response.data;
        console.log(jsonContent)

        // Obtenir la liste des fichiers dans le dossier
        const folderFiles = await fs.readdir(folderPath);

        // Vérifier les fichiers manquants
        const missingFiles = jsonContent.filter(file => !folderFiles.includes(file));
        if (missingFiles.length > 0) {
            event.sender.send('modEvents', `${missingFiles.length} files are missing from the folder!`);

            for (const file of missingFiles) {
                const downloadFile = new Downloader({
                    url: `https://blackrockapi.kashir.fr/mod/` + file,
                    directory: folderPath,
                    maxAttempts: 3
                });

                await downloadFile.download();
                event.sender.send('modEvents', missingFiles.length);
            }
        }

        // Vérifier les fichiers en trop
        const extraFiles = folderFiles.filter(file => !jsonContent.includes(file));
        if (extraFiles.length > 0) {
            event.sender.send('modEvents', `${extraFiles.length} files are not present in the JSON!`);

            for (const file of extraFiles) {
                await fs.rm(path.join(folderPath, file));
                event.sender.send('modEvents', `Removed file: ${file}`);
            }
        }

        event.sender.send('modEvents', 'File synchronization completed successfully!');
        return true;
    } catch (error) {
        console.log(error)
        event.sender.send('modEvents', 'Error synchronizing files');
        return false;
    }
}

async function launchGame(token, rootFolder, javaFolder, ram, event, mainWindow) {
    const opts = {
        clientPackage: null,
        authorization: token.mclc(),
        root: rootFolder,
        forge: path.join(rootFolder, 'forge.jar'),
        javaPath: path.join(javaFolder, 'java', 'bin', 'java.exe'),
        version: {
            number: "1.20.1",
            type: "release"
        },
        memory: {
            max: ram !== 0 ? ram : "8G",
            min: "4G"
        }
    };

    launcher.launch(opts);

    launcher.on('close', (e) => {
        if (e === 1) {
            logNocturia.warn('The Minecraft Process Stop with Code Error: ' + e + ' Which means that you closed the Minecraft Process');
        } else {
            logNocturia.error("The Minecraft Process Stop with Code Error: " + e + " Which means that your Minecraft Process has crashed. Check your RAM or the logs, otherwise call my creator and give him this error code and your log file!");
        }
        mainWindow.show();
        event.sender.send('stoppingGame');
    });

    launcher.on('progress', (e) => {
        logNocturia.info('["Minecraft-Progress"] ' + e.type + ' | ' + e.task + ' | ' + e.total);
        event.sender.send('dataDownload', {
            type: e.type,
            task: e.task,
            total: e.total
        });
    });
    launcher.on('debug', (e) => {
        logNocturia.debug('["Minecraft-Debug"] ' + e);
    });
    launcher.on('data', (e) => {
        logNocturia.info('["Minecraft-Data"] ' + e);
    });
    launcher.once('data', (e) => {
        mainWindow.hide();
        event.sender.send('LaunchingGame');
    });
}

async function launchMC(token, rootFolder, modsFolder, javaFolder, event, mainWindow) {
    const checkPaths = await checkLauncherPaths(rootFolder, javaFolder, modsFolder, event)
    if (checkPaths == true) {
        console.log('Folders Checked !')
        const checkDeps = await checkJavaAndForge(rootFolder, javaFolder, event)
        if (checkDeps == true) {
            console.log('Java & Forge Checked !');
            const response = await synchronizeFilesWithJSON(modsFolder, event);
            if (response == true) {
                console.log('Mods Checked !');
                getRamFromFile(rootFolder)
                .then(ram => {
                    launchGame(token, rootFolder, javaFolder, ram, event, mainWindow);
                    // Utilisez la valeur de la RAM comme vous le souhaitez
                })
            }
        }
    }
}

ipcMain.handle('play', async (event, data) => {
    launchMC(token, nocturiaPaths[0], nocturiaPaths[1], nocturiaPaths[2], event, mainWindow)
})

ipcMain.handle('saveRam', async (event, data) => {
    writeRamToFile(data, nocturiaPaths[0], event)
})

ipcMain.handle('getRam', async (event, data) => {
    return getRamFromFile(nocturiaPaths[0], event)
})