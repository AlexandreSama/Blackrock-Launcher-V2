var progressbar = document.getElementById('progress-bar')
var labelBar = document.querySelector('.progress-label')
const changeProgress = (progress) => {
    progressbar.style.width = `${progress}%`;
};

function bitsToMegabits(bits) {
    const megabits = bits / 1000000; // 1 mégabit = 1000000 bits
    return megabits;
}

window.app.bootstrapDownload((__event, data) => {
    changeProgress(data.percent.toString())
    labelBar.innerHTML = 'Téléchargement a ' + data.percent.toFixed(1) + ' %'
})