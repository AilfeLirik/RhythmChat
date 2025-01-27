//Ici, on crée un dictionnaire qui associe les sons à leur localisation dans le dossier public/client/sounds

const soundPath = {
    "send": {path: "sounds/send.mp3", volume: 0.1},
    "receive": {path: "sounds/receive.mp3", volume: 0.6},
    "notif": {path: "sounds/notif.mp3", volume: 0.4},
    "button": {path: "sounds/button.mp3", volume: 0.5},
    "redirect": {path: "sounds/redirect.mp3", volume: 0.3},
}

/**
 * Joue un son
 * @param sound {string}
 * @returns {void}
 */
function playSound(sound) {

    let audio = new Audio(soundPath[sound].path);
    audio.volume = soundPath[sound].volume;
    audio.play().then(r => {
    });
}

/**
 * Joue un son de niveau
 * @returns {void}
 */
function playLevelUpSound() {
    //On récupère le son choisi par l'utilisateur dans ses préférences
    let soundPath = valuesFromNames[soundEffects.soundName];
    let audio = new Audio(soundPath);
    audio.volume = 0.5;
    audio.play().then(r => {
    });
}