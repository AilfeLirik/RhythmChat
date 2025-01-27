//ici, on définis un dictionnaire qui va contenir les valeurs exploitées dans le code en fonction de leurs valeurs d'affichage
const valuesFromNames = {
    "Bleu Clair": "#07c",
    "Gris": "#333",
    "Rose": "#FF99C8",
    "Vert": "#33CA7F",
    "Bleu Fonce": "#083D77",
    "Orange": "#ffa500",
    "Rouge": "#B23A48",
    "Bip Boup": "sounds/levelup/bip_boup.mp3",
    "Carillon": "sounds/levelup/carillon.mp3",
    "Orchestre": "sounds/levelup/orchestre.mp3",
    "Piano": "sounds/levelup/piano.mp3",
    "Clown": "sounds/levelup/clown.mp3",
    "Bonus": "sounds/levelup/bonus.mp3"/*,
    "Haggstrom": "haggstrom",
    "Moog City": "moog_city",
    "Aria Math": "aria_math",
    "Sweden": "sweden"*/
}

//ici, on définis une liste de dictinnaire qui va contenir les données à afficher en fonction du niveau de l'utilisateur
const colorByLevel = [
    {level: 2, colorName: "Rose"},
    {level: 5, colorName: "Vert"},
    {level: 8, colorName: "Bleu Fonce"},
    {level: 11, colorName: "Orange"},
    {level: 14, colorName: "Rouge"},
]

//ici, on définis une liste de dictinnaire qui va contenir les données à afficher en fonction du niveau de l'utilisateur
const soundEffectsByLevel = [
    {level: 3, soundName: "Carillon"},
    {level: 6, soundName: "Orchestre"},
    {level: 9, soundName: "Piano"},
    {level: 12, soundName: "Clown"},
    {level: 15, soundName: "Bonus"}
]

//ici, on définis une liste de dictinnaire qui va contenir les données à afficher, sans condition (la liste est accessible à partir du niveau 13)
const soundMusics = [
    {soundName: "Wet Hands"},
    {soundName: "Haggstrom"},
    {soundName: "Moog City"},
    {soundName: "Aria Math"},
    {soundName: "Sweden"},
];

/*
Variables qui vont contenir les données de l'utilisateur, elle sont employables dans tout le code pour obtenir
les préférences de l'utilisateur, elles sont initialisées avec les valeurs par défaut puis remplacées par les valeurs
envoyées par le serveur lorsqu'elles sont reçues après la connexion (voir client.js)
 */
let myMessageColor = {
    colorName: "Bleu Clair"
};
let otherMessageColor = {
    colorName: "Gris"
}
let soundEffects = {
    soundName: "Bip Boup"
}
let soundMusic = {
    soundName: "Par défaut"
}

/**
 * Appelé pour fabriquer les menus déroulants lors de leur ouverture
 * @param dropdownType {string}
 * @param option {string}
 * @returns {void}
 */
function onDropdownOpen(dropdownType, option) {

    //On vérifie si l'utilisateur a l'autorisation d'ouvrir le menu déroulant de choix de la musique du site (niveau 13 minimum)
    if (option === "music" && HasAuthorization("choose_music") === false) {
        return;
    }

    let dropdownOptions = document.querySelector(`#dropdown_${dropdownType}_${option}_options`);
    //Marche dans les deux sens, si le menu déroulant est ouvert, on le ferme, et inversement

    //Gestion des options du menu déroulant
    if (dropdownOptions.innerHTML === createDropdownContent(dropdownType, option)) {
        dropdownOptions.innerHTML = " ";
    } else dropdownOptions.innerHTML = createDropdownContent(dropdownType, option);

    //Affichage du menu déroulant
    dropdownOptions.classList.toggle("hidden");

    //Rotation de la flèche à l'ouverture/fermeture du menu déroulant
    rotateArrow(dropdownType + "_" + option);
    handleSettingsChange("dropdown_" + dropdownType + "_" + option + "_options");
}

/**
 * Appelé pour fabriquer les écoutteurs d'événements sur les menus déroulants
 * @param settingsId {string}
 * @returns {void}
 */
function handleSettingsChange(settingsId) {
    // Récupérer toutes les options du menu déroulant spécifié
    let dropdownOptions = document.querySelectorAll(`#${settingsId} .option`);

    // Attacher un écouteur d'événements à chaque option
    dropdownOptions.forEach(option => {
        option.addEventListener("click", function () {

            //Un menu déroulant est identifié par son id, qui est de la forme "dropdown_type_option"
            //Le type est soit "color" soit "sound"
            //L'option est soit "mine" soit "other" pour les couleurs, et "effects" ou "music" pour les sons
            let dropdownType = settingsId.split("_")[1];

            if (dropdownType === "color") {
                //On envoie la valeur de l'option à la suite du code
                onOptionSelect(dropdownType, settingsId.split("_")[2], option.dataset.value);

            } else if (dropdownType === "sound") {
                //On envoie la valeur de l'option à la suite du code
                onOptionSelect(dropdownType, settingsId.split("_")[2], option.dataset.value);
            }
        });
    });
}

/**
 * Appelé lorsqu'une option est sélectionnée dans un menu déroulant
 * @param dropdownType {string}
 * @param option {string}
 * @param optionName {string}
 * @returns {void}
 */
function onOptionSelect(dropdownType, option, optionName) {
    playSound("button");

    //On cache le menu déroulant
    let dropdownOptions = document.querySelector(`#dropdown_${dropdownType}_${option}_options`);
    dropdownOptions.classList.toggle("hidden");
    dropdownOptions.innerHTML = " ";
    rotateArrow(dropdownType + "_" + option);

    //En fonction du type de menu déroulant, on met à jour les données de l'utilisateur avec la valeur de l'option sélectionnée
    switch (option) {
        case "mine":
            myMessageColor.colorName = optionName;
            break;

        case "other":
            otherMessageColor.colorName = optionName;
            break;

        case "effects":
            soundEffects.soundName = optionName;
            break;

        case "music":
            soundMusic.soundName = optionName;
            break;
    }
    //On met à jour le texte du menu déroulant
    setDropdownText(dropdownType + "_" + option);
}

/**
 * Appelé pour mettre à jour le texte du menu déroulant
 * @param dropdown {string}
 * @returns {void}
 */
function setDropdownText(dropdown) {
    let dropdownInput = document.getElementById(`dropdown_${dropdown}_selected_value`);
    //En fonction du type de menu déroulant, on met à jour le texte avec les données de l'utilisateur
    switch (dropdown) {
        case "color_mine":
            dropdownInput.innerHTML = myMessageColor.colorName;
            break;
        case "color_other":
            dropdownInput.innerHTML = otherMessageColor.colorName;
            break;
        case "sound_effects":
            dropdownInput.innerHTML = soundEffects.soundName;
            break;
        case "sound_music":
            dropdownInput.innerHTML = soundMusic.soundName;
            break;
    }
}

/**
 * Appelé pour faire tourner la flèche du menu déroulant
 * @param option {string}
 * @returns {void}
 */
function rotateArrow(option) {
    let arrowIcon = document.getElementById(`dropdown_${option}_icon`);
    //On fait tourner la flèche de 180° en jouant avec la classe "open" qui applique une rotation de 180°
    arrowIcon.classList.toggle("open");
}

/**
 * Appelé pour créer le contenu des menus déroulants
 * @param type {string}
 * @param option {string}
 * @returns {string}
 */
function createDropdownContent(type, option) {
    switch (type) {
        case "color":
            let innerHTML = "";

            //On récupère les options en fonction du niveau de l'utilisateur
            let selectedColorArray = selectColorFromLevel(option)

            //pour chaque option, on crée un élément html qui va la réprésenter dans le menu déroulant
            Array.from(selectedColorArray).forEach(color => {
                innerHTML += craftColorDropdownOption(color.colorName, option)
            })
            return innerHTML;
        case "sound":
            let innerHTMLSound = "";

            //On récupère les options en fonction du niveau de l'utilisateur
            let selectedSoundArray = selectSoundFromLevel(option)

            //pour chaque option, on crée un élément html qui va la réprésenter dans le menu déroulant
            Array.from(selectedSoundArray).forEach(sound => {
                innerHTMLSound += craftSoundDropdownOption(sound.soundName, option)
            })
            return innerHTMLSound;
    }
}

/**
 * Appelé pour récupérer les options en fonction du niveau de l'utilisateur
 * @param option {string}
 * @returns {array}
 */
function selectColorFromLevel(option) {
    //On ajoute la couleur par défaut en premier dans le menu déroulant
    const defaultColor = option === "mine" ? {colorName: "Bleu Clair"} :
        {colorName: "Gris"};
    const level = getCurrentLevel();

    //On filtrer les options en fonction du niveau de l'utilisateur
    return [defaultColor, ...Array.from(colorByLevel).filter(color => color.level <= level)];
}

/**
 * Appelé pour créer un élément html qui va réprésenter une option dans le menu déroulant
 * @param colorName {string}
 * @param option {string}
 * @returns {string}
 */
function craftColorDropdownOption(colorName, option) {
    //data-value permet de stocker la valeur de l'option dans l'élément html, pour pouvoir la récupérer plus tard
    return `<div class="dropdown_color_${option}_option option" data-value="${colorName}">
            <input type="checkbox">
            <label>${colorName}</label>
            </div>`
}

/**
 * Appelé pour récupérer les options en fonction du niveau de l'utilisateur
 * @param option {string}
 * @returns {array}
 */
function selectSoundFromLevel(option) {
    //On ajoute la couleur par défaut en premier dans le menu déroulant
    const defaultSound = option === "effects" ? {soundName: "Bip Boup"} :
        {soundName: "Par défaut"};
    const level = getCurrentLevel();

    //On filtrer les options en fonction du niveau de l'utilisateur, sauf si c'est le menu déroulant de la musique du site
    //(accessible à partir du niveau 13, ne contient pas de niveau minimum pour ses options)
    if (option === "effects") {

        //On filtre les options en fonction du niveau de l'utilisateur
        return [defaultSound, ...Array.from(soundEffectsByLevel).filter(sound => sound.level <= level)];
    } else {

        //On retourne toutes les options
        return [defaultSound, ...Array.from(soundMusics)];
    }
}

/**
 * Appelé pour créer un élément html qui va réprésenter une option dans le menu déroulant
 * @param soundName {string}
 * @param option {string}
 * @returns {string}
 */
function craftSoundDropdownOption(soundName, option) {
    //data-value permet de stocker la valeur de l'option dans l'élément html, pour pouvoir la récupérer plus tard
    return `<div class="dropdown_sound_${option}_option option" data-value="${soundName}">
        <input type="checkbox">
        <label>${soundName}</label>
        </div>`
}

