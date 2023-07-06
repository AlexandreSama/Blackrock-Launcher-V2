const { contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('appInfos', {
    nomApp: () => ipcRenderer.invoke('getAppName'),
    versionApp: () => ipcRenderer.invoke('getAppVersion'),
    login: () => ipcRenderer.invoke('login'),
    errorPOU: () => ipcRenderer.invoke('errorPOU')
    // ping: () => ipcRenderer.invoke('ping')
    //nous pouvons aussi exposer des variables, pas seulement des fonctions
})