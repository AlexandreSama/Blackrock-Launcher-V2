var range = document.getElementById('customRange3')
var label = document.getElementById('ramSelect')
var goToMain = document.getElementById('goToMain')
label.innerHTML = range.value + 'Go'

range.oninput = function(){
    label.innerHTML = this.value + 'Go'
}

goToMain.addEventListener('click', () => {
    window.app.goToMain()
})