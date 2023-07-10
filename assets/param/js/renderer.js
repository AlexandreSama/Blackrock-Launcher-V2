var range = document.getElementById('customRange3')
var label = document.getElementById('ramSelect')
var goToMain = document.getElementById('goToMain')
var saveRam = document.getElementById('saveRam')
var showGameFolder = document.getElementById('showGameFolder')

window.app.versionApp().then((res) => {
    document.title = 'Blackrock Launcher | V' + res
})

window.mc.getRam().then((res) => {
    label.innerHTML = res
    range.value = res
})

range.oninput = function(){
    label.innerHTML = this.value + 'G'
}

goToMain.addEventListener('click', () => {
    window.app.goToMain()
})

saveRam.addEventListener('click', () => {
    window.app.saveRam(range.value)
})

showGameFolder.addEventListener('click', () => {
    window.app.showGameFolder()
})

window.app.ramSaved((__event, data) => {
    label.innerHTML = data
})