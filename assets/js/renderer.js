const profilePicture = document.getElementById('profilePicture');
const playBtn = document.querySelector('.playBtn')
const loginBtn = document.querySelector('.loginBtn');
const progressbar = document.querySelector('.progress-bar');
const labelBar = document.querySelector('.progress-label')
const goToParam = document.querySelector('.paramBtn')
const playersOnline = document.getElementById('playersOnline')
const paramBtn = document.querySelector('.paramBtn')
const statusServer = document.querySelector('.statusServer')
const pingServer = document.querySelector('.pingServer')
let nbModsDownloaded = 1;

window.app.versionApp().then(res => {
  document.title = `Blackrock Launcher Accueil | V${res}`;
  playBtn.disabled = true
});

window.mc.receivePlayers((__event, data) => {
  playersOnline.innerHTML = data[0] + ' joueurs connectés'
  statusServer.innerHTML = data[1]
  pingServer.innerHTML = data[2]
})
window.mc.getPlayers();

goToParam.addEventListener('click', () => {
  window.app.goToParam()
})

loginBtn.addEventListener('click', () => {
  window.mc.login();
});

const onLogin = (profilePicture, uid, username, playBtn, loginBtn) => {
  profilePicture.src = `https://minotar.net/avatar/${uid}`;
  loginBtn.disabled = true;
  loginBtn.innerHTML = username
  playBtn.disabled = false;

};

window.mc.onLoginDone((__event, profile) => {
  onLogin(profilePicture, profile[1], profile[0], playBtn, loginBtn);
});

const changeProgress = progress => {
  progressbar.style.width = `${progress}%`;
};

playBtn.addEventListener('click', () => {
  window.mc.play();
  playBtn.disabled = true;
  progressbar.style.width = '100%';
  labelBar.innerHTML = 'Préparation du lancement...';
});

window.mc.onDataDownload((__event, data) => {
  labelBar.innerHTML = `Téléchargement des ${data.type} : ${data.task} / ${data.total}`;
  const percent = (data.task / data.total) * 100;
  changeProgress(percent);
});

window.mc.onMissedModsDownload((__event, data) => {
  labelBar.innerHTML = `Téléchargement de ${nbModsDownloaded} mods sur ${data}`;
  const percent = (nbModsDownloaded / data) * 100;
  changeProgress(percent);
  nbModsDownloaded++;
});

window.mc.onForgeAlreadyDownload((__event, data) => {
  labelBar.innerHTML = 'Forge déjà téléchargé';
});

window.mc.onForgeDownloaded((__event, data) => {
  labelBar.innerHTML = data;
});

window.mc.onJavaAlreadyDownloaded((__event, data) => {
  labelBar.innerHTML = 'Java déjà téléchargé';
});

window.mc.onJavaDownloaded((__event, data) => {
  labelBar.innerHTML = data;
});

window.mc.onStoppingGame((__event, data) => {
  progressbar.innerHTML = '';
  progressbar.style.width = '0';
  playBtn.disabled = false;
});