const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('app', {
    nomApp: () => ipcRenderer.invoke('getAppName'),
    versionApp: () => ipcRenderer.invoke('getAppVersion'),
    goToParam: () => ipcRenderer.invoke('goToParam'),
    goToMain: () => ipcRenderer.invoke('goToMain'),
    saveRam: (ram) => ipcRenderer.invoke('saveRam', ram),
    ramSaved: (data) => ipcRenderer.on('ramSaved', (data)),
    showGameFolder: () => ipcRenderer.invoke('showGameFolder')
    // ping: () => ipcRenderer.invoke('ping')
    //nous pouvons aussi exposer des variables, pas seulement des fonctions
})
contextBridge.exposeInMainWorld('mc', {
    login: () => ipcRenderer.invoke('loginMS'),
    onLoginDone: (profile) => ipcRenderer.on('loginDone', (profile)),
    play: () => ipcRenderer.invoke('play'),
    onDataDownload: (data) => ipcRenderer.on('dataDownload', (data)),
    onMissedModsDownload: (data) => ipcRenderer.on('modEvents', (data)),
    onForgeAlreadyDownload: (data) => ipcRenderer.on('forgeEvents', (data)),
    onForgeDownloaded: (data) => ipcRenderer.on('forgeEvents', (data)),
    onJavaAlreadyDownloaded: (data) => ipcRenderer.on('javaEvents', (data)),
    onJavaDownloaded: (data) => ipcRenderer.on('javaEvents', (data)),
    onStoppingGame: (data) => ipcRenderer.on('stoppingGame', (data)),

})
