//Ici crée une constant pour associer les autorisations à leur niveau de débloquage
const authorizationByLevel = {
    "text_select": 1,
    "mention_user": 4,
    "send_link": 7,
    "send_image": 10,
    "choose_music": 13
}

/**
 * Détermine si l'utilisateur a l'autorisation d'utiliser une fonctionnalité
 * @param authorization {string}
 * @returns {boolean}
 **/
function HasAuthorization(authorization) {
    return getCurrentLevel() >= authorizationByLevel[authorization];
}

/**
 * Applique les autorisations auxquelles l'utilisateur a accès
 * @returns {void}
 */
function handleAuthorizations() {
    if (!HasAuthorization("text_select")) document.querySelector("*").style = "user-select: none";
}

/**
 * Vérifie si le message contient des mentions ou des liens pour vérifier si l'utilisateur a l'autorisation de les envoyer
 * @param message {string}
 * @returns {boolean}
 */
function isMessageContentValid(message) {
    //Vérifier si le message contient des mentions
    if (containsMention(message)) {
        if (HasAuthorization("mention_user") === false) {
            createToast("warning", "Vous n'avez pas le niveau suffisant pour mentionner un utilisateur.");
            return false;
        }
    }
    //Vérifier si le message contient des liens
    if (containsLink(message)) {
        if (HasAuthorization("send_link") === false) {
            createToast("warning", "Vous n'avez pas le niveau suffisant pour envoyer des liens.");
            return false;
        }
    }
    return true;
}

/**
 * Vérifie si le message contient des mentions
 * @param message {string}
 * @returns {boolean}
 */
function containsMention(message) {
    const regex = /@\w+/;
    return regex.test(message);
}

/**
 * Vérifie si le message contient des liens
 * @param message {string}
 * @returns {boolean}
 */
function containsLink(message) {
    const regex = /https?:\/\/[^\s]+/;
    return regex.test(message);
}

/**
 * Reformate le message pour afficher les mentions et les liens comme des balises HTML
 * @param message {string}
 * @returns {string}
 */
function reformatMessage(message) {
    //Encadrer les liens par des balises <a>
    message = message.replace(/(https?:\/\/[^\s]+)/g, '<a class="link" href="$1" target="_blank">$1</a>');
    //Encadrer les mentions par des balises <b>
    message = message.replace(/(@\w+)/g, '<b class="mention">$1</b>');
    return message;
}
