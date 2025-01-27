//Ce fichier contient des fonctions utiles pour le client

/**
 * Détermine si l'utilisateur est sur la page de login
 * @returns {boolean}
 */
function isOnLoginPage() {
    return window.location.pathname.endsWith("login.html");
}

/**
 * Détermine si l'utilisateur est sur la page de chat
 * @returns {boolean}
 */
function isOnChatPage() {
    return window.location.pathname.endsWith("chat.html");
}

/**
 * Détermine si l'utilisateur est sur la page de compte
 * @returns {boolean}
 */
function isOnAccountPage() {
    return window.location.pathname.endsWith("account.html");
}

/**
 * Détermine si l'utilisateur est sur la page de classement
 * @returns {boolean}
 */
function isOnRankPage() {
    return window.location.pathname.endsWith("rank.html");
}

/**
 * Détermine si l'utilisateur est sur la page de perks
 * @returns {boolean}
 */
function isOnPerkPage() {
    return window.location.pathname.endsWith("perk.html");
}

/**
 * Détermine si le texte contient des caractères spéciaux
 * @param str {string}
 * @returns {boolean}
 */
function containsSpecialCharacters(str) {
    //Liste des caractères spéciaux
    const specialCharacters = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '=', '{', '}', '[', ']', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '?', '/'];

    for (let i = 0; i < specialCharacters.length; i++) {
        //Si le texte contient un caractère spécial, on retourne true
        if (str.includes(specialCharacters[i])) {
            return true;
        }
    }
    return false;
}

/**
 * Vérification à effectuer sur le nom de l'utilisateur
 * @param username {string}
 * @returns {boolean}
 */
function usernameGenericChecks(username) {

    //On vérifie si le nom d'utilisateur contient des caractères spéciaux
    if (containsSpecialCharacters(username)) {
        createToast("error", "Le nom d'utilisateur ne peut pas contenir de caractères spéciaux");
        return false;
    }

    //On vérifie si le nom d'utilisateur contient des espaces
    if (username.includes(" ")) {
        createToast("error", "Le nom d'utilisateur ne peut pas contenir d'espace");
        return false;
    }

    /*
    On utilise des balises <b> pour valoriser les nombres dans les notifications
    On vérifie si le nom d'utilisateur dépasse la limite de caractères qui est de 15
     */
    if (username.length > 15) {
        createToast("error", "Le nom d'utilisateur ne peut pas faire plus de <b>15</b> caractères");
        return false;
    }

    //On vérifie si le nom d'utilisateur fait au moins 3 caractères
    if (username.length < 3) {
        createToast("error", "Le nom d'utilisateur doit faire au moins <b>3</b> caractères");
        return false;
    }
    return true;
}

/**
 * Vérification à effectuer sur le mot de passe
 * @param password {string}
 * @returns {boolean}
 */
function passwordGenericChecks(password) {

    //On vérifie si le mot de passe dépasse la limite de caractères qui est de 25
    if (password.length > 25) {
        createToast("error", "Le mot de passe ne peut pas faire plus de <b>25</b> caractères");
        return false;
    }

    //On vérifie si le mot de passe fait au moins 8 caractères
    if (password.length < 8) {
        createToast("error", "Le mot de passe doit faire au moins <b>8</b> caractères");
        return false;
    }

    //On vérifie si le mot de passe contient des espaces
    if (password.includes(" ")) {
        createToast("error", "Le mot de passe ne peut pas contenir d'espace");
        return false;
    }
    return true;
}

/**
 * Permet d'écrire progressivement un texte dans un élément HTML
 * @param elementId {string}
 * @param text {string}
 * @param typingSpeed {number}
 * @returns {boolean}
 */
function typeWriterEffect(elementId, text, typingSpeed) {
    let i = 0;
    let element = document.getElementById(elementId);

    //On ajoute une balise <b> à la fin de l'élément pour y insérer le texte
    //&nbsp; permet d'ajouter un espace insécable
    element.innerHTML += "&nbsp;<b></b>";

    /**
     * Fonction récursive qui va ajouter un caractère à la fin de l'élément toutes les 'typingSpeed' millisecondes
     * @returns {boolean}
     */
    function typing() {
        if (i < text.length) {

            //On ajoute le texte dans la balise <b> à la fin de l'élément
            element.innerHTML = element.innerHTML.slice(0, element.innerHTML.length - 4) + text.charAt(i) + "</b>";
            i++;
            setTimeout(typing, typingSpeed);
        } else return true;
    }

    if (typing()) return true;
}

/**
 * Permet de formater une date (partielle avec uniquement l'heure ou complète avec la date et l'heure)
 * @param date {Date}
 * @param isFull {boolean}
 * @returns {string}
 */
function reformatDate(date, isFull = false) {

    //Afficher uniquement l'heure
    if ((date.toLocaleDateString() === new Date().toLocaleDateString()) && !isFull) return date.toLocaleTimeString();
    //Afficher la date et l'heure
    else return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}