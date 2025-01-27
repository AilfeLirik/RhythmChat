//Creation de la connexion avec le serveur
const ws = new WebSocket("ws://localhost:8080");

//Stockage des variables globales
let token = '';
let username = '';
let lastMessage = {username: '', timestamp: 0};
let sessionsCounter = 0;
let doNotificateXp = true;

//Fonction appelée lorsque la connexion est établie
ws.addEventListener('open', function () {

    console.log("Connected to server");

    //On examine les cookies de l'utilisateur pour voir s'il a un token
    let cookies = document.cookie;
    if (cookies && cookies !== '') token = cookies.split('; ').find(row => row.startsWith('token=')).split('=')[1] ?? null;

    //Lorsque l'utilisateur se déconnecte, un token spécial est sauvegardé pour savoir par quel moyen il s'est déconnecté
    //Cette situation se produit lorsque l'utilisateur se déconnecte manuellement
    if (token === 'logout') {
        token = "";
        document.cookie = "token=; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
        createToast("success", "Vous avez été déconnecté avec succès");

    } else if (token === 'delete') { //Cette situation se produit lorsque l'utilisateur supprime son compte
        token = "";
        document.cookie = "token=; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
        createToast("success", "Votre compte a été supprimé avec succès");
    }

    //Si l'utilisateur a un token, on tente de se connecter avec (si il vient de se déconnecter, le token est ducoup effacé auparavant)
    if (token) login();

    //On écoute les messages du serveur
    ws.addEventListener('message', ev => {
        let data = JSON.parse(ev.data);
        console.log("Message from server: " + ev.data); //TODO: remove
        onPacketRecieve(data);
    });
});

/**
 * Gère les packets reçus du serveur
 * @param data {object}
 * @returns {void}
 */
function onPacketRecieve(data) {

    switch (data.type) {
        case 'login':
            if (data.success) {
                //ici, le login est réussi
                console.log("Login successful");

                token = data.token;
                document.cookie = "token=" + token + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";

                //On récupère les données de l'utilisateur qui ont été envoyées par le serveur
                username = data.username;
                xp = data.xp;
                myMessageColor.colorName = data.mine;
                otherMessageColor.colorName = data.other;
                soundEffects.soundName = data.effects;
                soundMusic.soundName = data.music;

                //Si l'utlisateur est nouveau, on lui envoie le tutoriel
                if (data.new) sendTutorialMessage();

                //Si l'utlisateur s'est connecté sur la page de connexion, on le redirige vers la page de chat
                if (isOnLoginPage()) window.location.href = 'chat.html';

                //On envoie une requête pour récupérer le nombre de sessions actives, et on met à jour le compteur
                // (si l'utilisateur n'est pas sur la page de connexion, car autrement il n'y aurait pas de barre de navigation)
                if (!isOnLoginPage()) ws.send(JSON.stringify({type: 'count'}));

                //On envoie une requête pour récupérer l'historique des messages
                if (isOnChatPage()) {
                    ws.send(JSON.stringify({"type": "history", token}));
                    setBarProgression();
                    createToast("success", "Vous êtes connecté en tant que <b>" + username + "</b>");
                }

                //On envoie une requête pour récupérer tout le classement
                if (isOnRankPage()) ws.send(JSON.stringify({type: 'rank'}));

                //On fait le rendu des perks débloqués
                if (isOnPerkPage()) renderUnlockedPerks();

                //On envoie une requête pour récupérer les données du compte
                if (isOnAccountPage()) {
                    ws.send(JSON.stringify({type: 'account', token}));
                    setDropdownText("color_mine");
                    setDropdownText("color_other")
                    setDropdownText("sound_effects");
                    setDropdownText("sound_music");
                }
            }
            break;

        case 'logout':
            if (data.success) {
                //ici, le logout a été fait côté serveur donc on peut déconnecter l'utilisateur
                console.log("Logout successful");
                token = '';
                document.cookie = "token=logout; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
                window.location.href = 'login.html';
            }
            break;

        case 'history':
            //ici, on reçoit l'historique des messages, on les charges donc un par un
            for (let message of data.messages) {
                if (username === message.username) showMessage(message.message, message.username, message.lvl, message.timestamp, true);
                else showMessage(message.message, message.username, message.lvl, message.timestamp);
            }
            const chat = document.getElementById("chat");
            chat.scrollTop = chat.scrollHeight;
            break;

        case 'rank':
            //ici, on reçoit le classement et on le charge
            renderRanks(data.ranks);
            break;

        case 'message':
            //ici, on reçoit un message, on l'affiche donc
            showMessage(data.message, data.username, data.lvl, data.timestamp);
            playSound("recieve");
            break;

        case 'count':
            //ici, on reçoit le nombre de sessions actives, on met donc à jour le compteur si il a changé
            if (data.count !== sessionsCounter) {
                sessionsCounter = data.count;
                updateSessionCounter();
            }
            break;

        case 'account':
            //ici, on reçoit les données du compte, on les affiche donc
            renderAccountData(data.rank, data.msgCount, data.accountCreateDate);
            break;

        case 'password_change':
            if (data.success) {
                //ici, le changement de mot de passe a été fait côté serveur donc on peut le notifier à l'utilisateur
                createToast("success", "Mot de passe changé avec succès");

                //Le changement de mdp est validé donc on retourne sur la page du compte
                let currentPasswordInput = document.getElementById("current_password");
                let newPasswordInput = document.getElementById("new_password");
                if (currentPasswordInput && newPasswordInput) {
                    currentPasswordInput.value = "";
                    newPasswordInput.value = "";
                }
                renderAccountPageContainer("password_change_container", false);

            } else createToast("error", "Mot de passe incorrect");
            break;

        case 'delete_account':
            if (data.success) {
                //ici, la suppression du compte a été faite côté serveur donc on peut déconnecter l'utilisateur
                console.log("Account delete successful");
                token = '';
                document.cookie = "token=delete; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
                window.location.href = 'login.html';
            } else createToast("error", "Mot de passe incorrect");
            break;

        case 'save_preferences':
            //ici, on reçoit une confirmation de sauvegarde des préférences, on peut donc notifier l'utilisateur si elle est réussie
            if (data.success) createToast("success", "Préférences sauvegardées avec succès");
            break;

        case 'error':
            //ici on reçoit une erreur, on peut donc notifier l'utilisateur on fonction de l'erreur reçue
            if (data.message === "Invalid token") {
                console.log("server asking to renew token because it hasn't been recognized, deleting cookie");
                token = '';
                document.cookie = "token=; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
            } else if (data.message === "Wrong password") {
                createToast("error", "Mot de passe incorrect");
            }
            break;
    }
}
