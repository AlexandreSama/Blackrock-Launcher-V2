const range = document.querySelector('.form-range');
const saveRam = document.querySelector('.saveRam');
const showGameFolder = document.querySelector('.showFolder');
const label = document.querySelector('.labelRam');
const goToMain = document.querySelector('.custom-btn-width');

window.app.versionApp().then(res => {
    document.title = `Blackrock Launcher Paramètres | V${res}`;
});

window.mc.getRam().then(res => {
  label.innerHTML = res;
  range.value = res;
});

range.addEventListener('input', () => {
  label.innerHTML = `${range.value}G`;
});

saveRam.addEventListener('click', () => {
  window.app.saveRam(range.value);
});

goToMain.addEventListener('click', () => {
    window.app.goToMain()
})

showGameFolder.addEventListener('click', () => {
  window.app.showGameFolder();
});

window.app.ramSaved((__event, data) => {
  label.innerHTML = data;
  range.value = data;
});