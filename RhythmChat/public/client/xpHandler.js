/*
    * Ici, on définit l'expérience de l'utilisateur, cette variable est incrémentée à chaque message envoyé
    * L'expérience est calculée en fonction de la vitesse et de la précision de ses frappes
    * L'expérience est utilisée pour déterminer le niveau de l'utilisateur
    * Le niveau de l'utilisateur est utilisé pour débloquer des fonctionnalités
    * L'expérience est affichée à l'utilisateur sous forme de barre de progression
    * L'expérience est sauvegardée côté serveur à chaque envoi de message et à chaque déconnexion
 */
let xp = 0;

/*
Ici, on définit le niveau de précision minimum pour que l'utilisateur gagne de l'expérience,
 celui-ci est exprimé en millisecondes (plus il est bas, plus l'utilisateur doit être précis, 0ms = 100% de précision)
 */
const accuracyLowestStandard = 250;

// Ici, on définit les variables qui vont permettre le stockage des données de frappes
let pressTimestamps = [];
let pressDiffs = [];

/**
 * Détermine le niveau actuel de l'utilisateur
 * @returns {number}
 */
function getCurrentLevel() { //TODO: utiliser une fonction exponentielle pour le calcul du niveau
    return Math.floor((xp / 250) + 1);
}

/**
 * Sauvegarde les informations de frappes (timestamps et écarts de frappes)
 * @returns {void}
 */
function onKeyPress() {
    let current = pressTimestamps.length;
    //On ajoute le timestamp de la frappe actuelle
    pressTimestamps[current] = Date.now();

    if (current > 0) {
        //On calcule l'écart de temps entre la frappe actuelle et la précédente
        pressDiffs[current - 1] = pressTimestamps[current] - pressTimestamps[current - 1];
    }
}


/**
 * Gestion de l'expérience lorsqu'un message est envoyé
 * @returns {void}
 */
function onMessageRelease() {

    //Déterminer les pourcentages de précision et de vitesse
    let accuracyPercentage = calculateAccuracy();
    let speedPercentage = calculateSpeed();

    //Ajouter l'expérience
    let previousLevel = getCurrentLevel();
    let xpAddition = Math.floor((accuracyPercentage * Math.max(1, speedPercentage / 100) * (pressTimestamps.length - 1)) / 100);
    xp += xpAddition;

    //Notifier l'utilisateur de son gain d'expérience
    if (xpAddition > 0) sendXPNotification(xpAddition);

    //Vérifier si l'utilisateur a passé un niveau
    let newLevel = getCurrentLevel();
    if (newLevel > previousLevel) {
        createToast("success", "Vous êtes passés niveau <b>" + newLevel + "</b> !");
        triggerLevelUpAnimation();
        playLevelUpSound();
    }

    //Réinitialiser les données de frappes
    pressTimestamps = [];
    pressDiffs = [];
}

/**
 * Calculer l'assiduité au rythme de frappe
 * @returns {number}
 */
function calculateAccuracy() {
    //Si les données sont vides on retourne zéro pour éviter la division par zéro
    if (pressDiffs.length === 0) return 0;

    //Calculer la moyenne des écarts de frappes
    let diffMoy = pressDiffs.reduce((a, b) => a + b, 0) / pressDiffs.length;

    //A chaque écart de temps de frappe on va ajouter un pourcentage de précision à la somme totale
    let accuracySum = 0;

    // Calculer la déviation de temps par rapport à la moyenne (diffMoy).
    // Math.abs() est utilisé pour obtenir une valeur toujours positive (car la déviation peut être négative)
    pressDiffs.forEach(diff => {
        let deviation = Math.abs(diff - diffMoy);
        //On compare la déviation à la précision la plus basse (accuracyLowestStandard) pour obtenir un pourcentage de précision à chaque frappe
        let accuracyForThisDiff = Math.max(1 - (deviation / accuracyLowestStandard), 0);

        //On ajoute le pourcentage de précision de cette frappe à la somme totale
        accuracySum += accuracyForThisDiff;
    });

    //On retourne la moyenne des pourcentages de précision sur toutes les frappes réalisées
    return Math.floor(accuracySum / pressDiffs.length * 100);
}

/**
 * Calculer la vitesse de frappe
 * @returns {number}
 */
function calculateSpeed() {
    if (pressDiffs.length === 0) return 0;

    //On calcule le temps total entre la première et la dernière frappe
    let totalTime = pressTimestamps[pressTimestamps.length - 1] - pressTimestamps[0];
    // Convertir ce temps en minutes
    let minutes = totalTime / 60000;
    // Calculer le rythme de frappe en frappes par minute
    let speedRate = Math.floor(pressDiffs.length / minutes);

    /*
    Empêcher le rythme de frappe d'être supérieur à 1000 (pour éviter les tricheurs,
    on multiplie par cette valeur après donc dangereux pour l'économie du jeu)
     */
    return speedRate > 1000 ? 0 : speedRate;
}

/**
 * Mettre à jour la barre de progression
 * @returns {void}
 */
function setBarProgression() {
    let progressBarFill = document.getElementById("progress_bar_fill");
    if (progressBarFill) {
        //On met à jour la longueur de la barre de progression, avec un minimum de 5% et un maximum de 100%
        //On élimine la partie entière du niveau avec un modulo pour garder uniquement la partie décimale qui représente la progression
        progressBarFill.style.height = Math.max((xp % 250) / 2.5, 5) + "%";
    }
}

/**
 * Déclencher l'animation de passage de niveau
 * @returns {void}
 */
function triggerLevelUpAnimation() {
    let progressBar = document.getElementById('progress_bar_anim');

    //On fait apparaître un nuage blanc sur la barre de progression (pour indiquer le passage de niveau)
    progressBar.style.opacity = 1;

    //Réduire l'opacité après un court délai pour revenir à l'état normal (l'animation dure donc 500ms)
    setTimeout(function () {
        progressBar.style.opacity = 0;
    }, 500);
}

/**
 * Faire le rendu des perks débloqués
 * @returns {void}
 */
function renderUnlockedPerks() {
    //Montrer son niveau actuel à l'utilisateur
    document.getElementById("current_level_text").innerHTML = "Vous êtes niveau&nbsp;<b>" + getCurrentLevel().toString() + "</b>";

    //Attribuer la classe "unlocked_perk" aux perks débloqués pour changer leur couleur
    let perksContainers = document.getElementsByClassName('perk_container');
    if (perksContainers) {
        Array.from(perksContainers).forEach(perkContainer => {
            let perkLevel = parseInt(perkContainer.getAttribute("data-level"));
            if (perkLevel <= getCurrentLevel()) {
                //Débloquage du perk (changement de couleur)
                perkContainer.classList.remove("locked_perk")
                perkContainer.classList.add("unlocked_perk");
                let perkLevelContainer = perkContainer.children[0];
                //Change la couleur d'arrière-plan du niveau du perk
                if (perkLevelContainer) {
                    perkLevelContainer.classList.remove("locked_container");
                    perkLevelContainer.classList.add("unlocked_container");
                }
            }
        });
    }
}


