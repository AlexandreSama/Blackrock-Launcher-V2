var progressbar = document.getElementById('progress-bar')
var fullBar = document.getElementById('progress')


const changeProgress = (progress) => {
    progressbar.style.width = `${progress}%`;
};

let i = 1

setInterval(() => {
    changeProgress(i);
    i++
}, 1000)

window.app.bootstrapDownload((__event, data) => {
    changeProgress(data.percent.toString())
    progressbar.innerHTML = 'Téléchargement a ' + data.percent.toString() + ' % | Vitesse de DWL : ' + bytesPerSecond + ' Mb/s'
})