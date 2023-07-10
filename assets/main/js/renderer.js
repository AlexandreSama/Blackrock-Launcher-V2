const profilePicture = document.getElementById('profilePicture')
let dropdownMenu = document.getElementById('dropdown-menu')
let playBtn = document.getElementById('playBtn')
let progressbar = document.getElementById('progress-bar')
let fullBar = document.getElementById('fullBar')
let goToParam
let nbModsDownloaded = 1


window.app.versionApp().then((res) => {
    document.title = 'Blackrock Launcher | V' + res
})

document.getElementById('loginMS').addEventListener('click', () => {
    window.mc.login();
})

function onLogin(profilePicture, dropdownMenu, uid, username, playBtn) {
    profilePicture.src = 'https://crafatar.kashir.fr/avatars/' + uid

    dropdownMenu.children[0].remove()

    //Header Dropdown
    let liHeader = document.createElement('li')
    let h6Header = document.createElement('h6')

    h6Header.className = 'dropdown-header'
    h6Header.innerHTML = username
    liHeader.appendChild(h6Header)

    //Parameter Dropdown
    let liParameter = document.createElement('li')
    let aParameter = document.createElement('a')

    aParameter.className = 'dropdown-item'
    aParameter.href = '#'
    aParameter.id = 'parameterLink'
    aParameter.innerHTML = 'Paramètres'
    liParameter.appendChild(aParameter)

    dropdownMenu.appendChild(liHeader)
    dropdownMenu.appendChild(liParameter)

    playBtn.disabled = false
    goToParam =  document.getElementById('parameterLink')

    goToParam.addEventListener('click', () => {
        window.app.goToParam()
    })
    
}

window.mc.onLoginDone((__event, profile) => {
    onLogin(profilePicture, dropdownMenu, profile[1], profile[0], playBtn)
    console.log('test')
})
//MC PARTS

const changeProgress = (progress) => {
    progressbar.style.width = `${progress}%`;
};


playBtn.addEventListener('click', () => {
    window.mc.play()
    playBtn.disabled = true
    fullBar.style.width = '100%'
    progressbar.style.width = '100%'
    progressbar.innerHTML = 'Préparation du lancement...'
})

window.mc.onDataDownload((__event, data) => {
    progressbar.innerHTML = `Téléchargement des ${data.type} : ${data.task} / ${data.total}`

    if (data.type === "assets") {
        let percent = (data.task / data.total) * 100
        changeProgress(percent)
    } else if (data.type === "natives") {
        let percent = (data.task / data.total) * 100
        changeProgress(percent)
    } else if (data.type === "classes-maven-custom") {
        let percent = (data.task / data.total) * 100
        changeProgress(percent)
    } else if (data.type === "classes-custom") {
        let percent = (data.task / data.total) * 100
        changeProgress(percent)
    } else if (data.type === "classes") {
        let percent = (data.task / data.total) * 100
        changeProgress(percent)
    }
})

window.mc.onMissedModsDownload((__event, data) => {
    progressbar.innerHTML =
        `Téléchargement de ${nbModsDownloaded} mods sur ${data}`
    let percent = (nbModsDownloaded / data) * 100
    console.log(percent)
    changeProgress(percent)
    nbModsDownloaded++
})

window.mc.onForgeAlreadyDownload((__event, data) => {
    progressbar.innerHTML = "Forge déjà téléchargé"
})

window.mc.onForgeDownloaded((__event, data) => {
    progressbar.innerHTML = data
})

window.mc.onJavaAlreadyDownloaded((__event, data) => {
    progressbar.innerHTML = "Java déjà téléchargé"
})

window.mc.onJavaDownloaded((__event, data) => {
    progressbar.innerHTML = data
})

window.mc.onStoppingGame((__event, data) => {
    progressbar.innerHTML = ''
    playBtn.disabled = false
})