const { app, BrowserWindow, ipcMain, autoUpdater, dialog } = require('electron');
const path = require('path');
const { Client } = require('minecraft-launcher-core');
const { Auth } = require("msmc");
const authManager = new Auth("select_account");
const launcher = new Client();

require('update-electron-app')();

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('./views/login.html');
};

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

ipcMain.handle('errorPOU', () => {
  dialog.showErrorBox('Erreur', 'N\'oubliez pas de mettre un mot de passe et/ou un pseudonyme !');
});

ipcMain.handle('login', async (event, data) => {
  // const xboxManager = await authManager.launch("electron");
  // const token = await xboxManager.getMinecraft();
  // const opts = {
  //   clientPackage: null,
  //   authorization: token.mclc(),
  //   root: "./test",
  //   version: {
  //     number: "1.18.2",
  //     type: "release"
  //   },
  //   memory: {
  //     max: "6G",
  //     min: "4G"
  //   }
  // };
  // console.log("Starting!");
  // launcher.launch(opts);

  // launcher.on('debug', (e) => console.log(e));
  // launcher.on('data', (e) => console.log(e));
});