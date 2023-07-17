const profilePicture = document.getElementById('profilePicture')
var playBtn = document.getElementById('playBtn')
var loginBtn = document.getElementsByClassName('loginMS')[0]
var progressbar = document.getElementById('progress-bar')
var fullBar = document.getElementById('fullBar')
var tab = document.getElementById('v-pills-tab')
var range = document.getElementById('customRange3')
var label = document.getElementById('ramSelect')
var saveRam = document.getElementById('saveRam')
var showGameFolder = document.getElementById('showGameFolder')
var changelogsPlace = document.getElementById('changelogs')
var closeBtn = document.getElementById('closeApp')
var reduceBtn = document.getElementById('reduceApp')
var nbModsDownloaded = 1

window.app.versionApp().then((res) => {
    document.title = 'Blackrock Launcher | V' + res
})
window.app.getChangelogs()

window.app.changelogs((__event, data) => {
    data.forEach((element) => {
        console.log(element)
        let dateGithub = Date.parse(element.created_at)
        let realDate = new Date(dateGithub).toLocaleDateString('fr')
        let title = document.createElement('h3')
        let titleContext = document.createTextNode('Mise a jour du ' + realDate + '. ' + element.tag_name)
        let text = document.createElement('p')
        let textGithub = document.createTextNode(element.body)


        title.appendChild(titleContext)
        text.appendChild(textGithub)
        changelogsPlace.appendChild(title)
        changelogsPlace.appendChild(text)
    })
})

loginBtn.addEventListener('click', () => {
    window.mc.login();
})

closeBtn.addEventListener('click', () => {
    window.app.closeApp()
})

reduceBtn.addEventListener('click', () => {
    window.app.reduceApp()
})

function onLogin(profilePicture, uid, username, playBtn, loginBtn) {
    profilePicture.src = 'https://crafatar.kashir.fr/avatars/' + uid
    loginBtn.disabled = true
    playBtn.disabled = false

    let newButton = document.createElement('button')
    let newContent = document.createTextNode('Paramètres')
    newButton.className = 'nav-link'
    newButton.id = 'v-pills-param-tab'
    newButton.setAttribute('data-bs-toggle', 'pill')
    newButton.setAttribute('data-bs-target', '#v-pills-param')
    newButton.type = 'button'
    newButton.setAttribute('role', 'tab')
    newButton.setAttribute('aria-controls', 'v-pills-param')
    newButton.ariaSelected = 'false'

    newButton.appendChild(newContent)
    tab.appendChild(newButton)
    
}

window.mc.onLoginDone((__event, profile) => {
    onLogin(profilePicture, profile[1], profile[0], playBtn, loginBtn)
    console.log('test')
})

//MC PARTS

const changeProgress = (progress) => {
    progressbar.style.width = `${progress}%`;
};


playBtn.addEventListener('click', () => {
    window.mc.play()
    playBtn.disabled = true
    saveRam.disabled = true
    fullBar.style.width = '100%'
    progressbar.style.width = '100%'
    progressbar.innerHTML = 'Préparation du lancement...'
})

/* The `window.mc.onDataDownload` function is an event listener that listens for the "dataDownload"
event emitted by the `window.mc` object. When this event is triggered, the provided callback
function is executed. */
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
    fullBar.style.width = '0'
    playBtn.disabled = false
    saveRam.disabled = false
})

window.mc.getRam().then((res) => {
    label.innerHTML = res
    range.value = res
})

range.oninput = function(){
    label.innerHTML = this.value + 'G'
}

saveRam.addEventListener('click', () => {
    window.app.saveRam(range.value)
})

showGameFolder.addEventListener('click', () => {
    window.app.showGameFolder()
})

window.app.ramSaved((__event, data) => {
    label.innerHTML = data
    range.value = data
})