var range = document.getElementById('customRange3')
var label = document.getElementById('ramSelect')
var goToMain = document.getElementById('goToMain')
var saveRam = document.getElementById('saveRam')
var showGameFolder = document.getElementById('showGameFolder')

label.innerHTML = range.value + 'Go'

range.oninput = function(){
    label.innerHTML = this.value + 'Go'
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