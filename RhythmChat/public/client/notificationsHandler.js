//Ici, on crée un dictionnaire qui associe les types de notifications à la localisation de leurs icônes
const imagesLinks = {
    success: "images/success.png",
    error: "images/error.png",
    warning: "images/warning.png",
    info: "images/info.png"
}
const toastTimer = 5000; //Durée d'affichage de la notification
const xpToastTimer = 2000; // Durée d'affichage de la notification de gain d'xp

/**
 * Supprimer progressivement la notification
 * @param toast {HTMLElement}
 * @param type {string}
 * @returns {void}
 */
function removeToast(toast, type) {
    //on applique une classe qui va animer la disparition de la notification
    if (type === "notification") {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 500); //On supprime la notification 500ms après l'avoir cachée
    } else if (type === "xp_notification") {
        toast.classList.add("hide_xp");
        setTimeout(() => toast.remove(), 500); //On supprime la notification 500ms après l'avoir cachée
    }
}

/**
 * Créer une notification
 * @param type {string}
 * @param text {string}
 * @returns {void}
 */
function createToast(type = "info", text = "I am a default notification") {
    let notifications = document.querySelector(".notifications")
    //On va chercher l'icone correspondant au type de notification
    let icon = imagesLinks[type]
    let toast = document.createElement("li"); //On crée un nouvel élément 'li' pour la notification (va s'inserer dans la liste des notifications)
    toast.className = `toast ${type}`; //On applique les classes pour la notification en fonction de son type
    toast.innerHTML = `<div class="content">
                         <img src="${icon}" alt="">
                         <span>${text}</span>
                      </div>`;
    notifications.appendChild(toast); //Ajouter la notification à la liste des notifications
    playSound("notif");

    //On applique un timeout pour supprimer la notification après 500ms
    toast.timeoutId = setTimeout(() => removeToast(toast, "notification"), toastTimer);
}

/**
 * Créer une notification de gain d'xp
 * @param xp
 * @returns {void}
 */
function sendXPNotification(xp) {

    //Si l'utilisateur a désactivé les notifications de gain d'xp, on ne fait rien
    if (!doNotificateXp) return;

    let xpNotifications = document.querySelector(".xp_notifications");
    let toast = document.createElement("li"); //On crée un nouvel élément 'li' pour la notification (va s'inserer dans la liste des notifications)
    toast.className = "xp_toast";
    toast.innerHTML = `<div class="content">
                            <span>+${xp} XP</span>  
                        </div>`;
    xpNotifications.appendChild(toast); //On ajoute la notification à la liste des notifications

    //On applique un timeout pour supprimer la notification après 200ms
    toast.timeoutId = setTimeout(() => removeToast(toast, "xp_notification"), xpToastTimer);

}