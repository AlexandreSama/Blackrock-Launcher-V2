var progressbar = document.getElementById('progress-bar')
var fullBar = document.getElementById('fullBar')


const changeProgress = (progress) => {
    progressbar.style.width = `${progress}%`;
};

window.app.bootstrapDownload((__event, data) => {
    changeProgress(data.percent)
    progressbar.innerHTML = 'Téléchargement a ' + data.percent + ' % | Vitesse de DWL : ' + bytesPerSecond + ' Mb/s'
})