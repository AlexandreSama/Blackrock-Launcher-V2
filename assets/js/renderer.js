const profilePicture = document.getElementById('profilePicture');
const playBtn = document.querySelector('.playBtn')
const loginBtn = document.querySelector('.loginBtn');
const progressbar = document.getElementById('progress-bar');
const fullBar = document.getElementById('fullBar');
const tab = document.getElementById('v-pills-tab');
const range = document.getElementById('customRange3');
const label = document.getElementById('ramSelect');
const saveRam = document.getElementById('saveRam');
const showGameFolder = document.getElementById('showGameFolder');
const changelogsPlace = document.getElementById('changelogs');
const playersOnline = document.getElementById('playersOnline')
const paramBtn = document.querySelector('.paramBtn')
const statusServer = document.querySelector('.statusServer')
const pingServer = document.querySelector('.pingServer')
let nbModsDownloaded = 1;

window.app.versionApp().then(res => {
  document.title = `Blackrock Launcher | V${res}`;
});

window.mc.receivePlayers((__event, data) => {
  playersOnline.innerHTML = data[0] + ' joueurs connectés'
  statusServer.innerHTML = data[1]
  pingServer.innerHTML = data[2]
})
window.mc.getPlayers();

// window.app.getChangelogs();

// window.app.changelogs((__event, data) => {
//   data.forEach(element => {
//     const test = element.body.split('-');
//     const holderContentUpdate = document.createElement('ul');
//     holderContentUpdate.className = 'list-unstyled mt-3';

//     const dateGithub = Date.parse(element.created_at);
//     const realDate = new Date(dateGithub).toLocaleDateString('fr');

//     const title = document.createElement('h5');
//     title.className = 'mt-4';
//     title.innerHTML = `<span class="p-2 bg-light shadow rounded text-success">Version ${element.tag_name}</span> - ${realDate}`;

//     if (test.length > 1) {
//       test.forEach(content => {
//         if (content.length > 0) {
//           const contentUpdateLi = document.createElement('li');
//           contentUpdateLi.className = 'text-dark fw-bold ml-3';
//           contentUpdateLi.innerHTML = `<i class="mdi mdi-circle-medium mr-2"></i>${content}`;
//           holderContentUpdate.appendChild(contentUpdateLi);
//         }
//       });
//     } else {
//       const contentUpdateLi = document.createElement('li');
//       contentUpdateLi.className = 'text-dark fw-bold ml-3';
//       contentUpdateLi.innerHTML = `<i class="mdi mdi-circle-medium mr-2"></i>${element.body}`;
//       holderContentUpdate.appendChild(contentUpdateLi);
//     }

//     changelogsPlace.appendChild(title);
//     changelogsPlace.appendChild(holderContentUpdate);
//   });
// });

loginBtn.addEventListener('click', () => {
  window.mc.login();
});

const onLogin = (profilePicture, uid, username, playBtn, loginBtn) => {
  profilePicture.src = `https://minotar.net/avatar/${uid}`;
  loginBtn.disabled = true;
  loginBtn.innerHTML = username
  playBtn.disabled = false;

  const newButton = document.createElement('button');
  newButton.className = 'nav-link param';
  newButton.id = 'v-pills-param-tab';
  newButton.setAttribute('data-bs-toggle', 'pill');
  newButton.setAttribute('data-bs-target', '#v-pills-param');
  newButton.type = 'button';
  newButton.setAttribute('role', 'tab');
  newButton.setAttribute('aria-controls', 'v-pills-param');
  newButton.ariaSelected = false;
  newButton.innerHTML = 'Paramètres';
  tab.appendChild(newButton);
};

window.mc.onLoginDone((__event, profile) => {
  onLogin(profilePicture, profile[1], profile[0], playBtn, loginBtn);
  console.log('test');
});

const changeProgress = progress => {
  progressbar.style.width = `${progress}%`;
};

playBtn.addEventListener('click', () => {
  window.mc.play();
  playBtn.disabled = true;
  saveRam.disabled = true;
  fullBar.style.width = '100%';
  progressbar.style.width = '100%';
  progressbar.innerHTML = 'Préparation du lancement...';
});

window.mc.onDataDownload((__event, data) => {
  progressbar.innerHTML = `Téléchargement des ${data.type} : ${data.task} / ${data.total}`;
  const percent = (data.task / data.total) * 100;
  changeProgress(percent);
});

window.mc.onMissedModsDownload((__event, data) => {
  progressbar.innerHTML = `Téléchargement de ${nbModsDownloaded} mods sur ${data}`;
  const percent = (nbModsDownloaded / data) * 100;
  console.log(percent);
  changeProgress(percent);
  nbModsDownloaded++;
});

window.mc.onForgeAlreadyDownload((__event, data) => {
  progressbar.innerHTML = 'Forge déjà téléchargé';
});

window.mc.onForgeDownloaded((__event, data) => {
  progressbar.innerHTML = data;
});

window.mc.onJavaAlreadyDownloaded((__event, data) => {
  progressbar.innerHTML = 'Java déjà téléchargé';
});

window.mc.onJavaDownloaded((__event, data) => {
  progressbar.innerHTML = data;
});

window.mc.onStoppingGame((__event, data) => {
  progressbar.innerHTML = '';
  fullBar.style.width = '0';
  playBtn.disabled = false;
  saveRam.disabled = false;
});

// window.mc.getRam().then(res => {
//   label.innerHTML = res;
//   range.value = res;
// });

// range.addEventListener('input', () => {
//   label.innerHTML = `${range.value}G`;
// });

// saveRam.addEventListener('click', () => {
//   window.app.saveRam(range.value);
// });

// showGameFolder.addEventListener('click', () => {
//   window.app.showGameFolder();
// });

// window.app.ramSaved((__event, data) => {
//   label.innerHTML = data;
//   range.value = data;
// });