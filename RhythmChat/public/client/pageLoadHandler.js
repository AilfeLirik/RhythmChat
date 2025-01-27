//Ici, on va gérer les écouteurs d'évènements en fonction de la page chargée
document.addEventListener('DOMContentLoaded', function () {
    playSound("redirect");

    //Si l'utilisateur clique de le lien de la page actuelle, on empêche la redirection
    let currentPageLink = document.querySelector('.current_page_link');
    if (currentPageLink) {
        currentPageLink.addEventListener('click', function (event) {
            event.preventDefault();
        });
    }

    //L'écouteur d'évènement suivant n'est ajouté que si l'utilisateur n'est pas sur la page de connexion
    if (!isOnLoginPage()) {
        handleAuthorizations();

        //On ajoute un écouteur d'évènement sur le bouton de déconnexion
        let logoutButton = document.querySelector('.logout_button');
        if (logoutButton) {
            logoutButton.addEventListener('click', logout);
        }
    }

    //L'écouteur d'évènement suivant n'est ajouté que si l'utilisateur est sur la page de connexion
    if (isOnLoginPage()) {
        //On ajoute un écouteur d'évènement sur le formulaire de connexion (appellé quand l'utilisateur appuie sur Entrée ou sur le bouton de connexion)
        let loginForm = document.getElementById("login_form");
        if (loginForm) {
            loginForm.addEventListener('submit', function (event) {
                event.preventDefault();
                login();
            });
        }
    }

    //Tous les écouteurs d'évènements suivants ne sont ajoutés que si l'utilisateur est sur la page de chat
    if (isOnChatPage()) {
        //On sauvegarde les moments de frappe de touche
        let chatInput = document.getElementById('chat_input');
        if (chatInput) {
            chatInput.addEventListener('keydown', function (event) {
                if (event.key !== "Enter") onKeyPress();
            });
        }

        //On sauvegarde ajoute un écouteur d'évènement sur le formulaire de message (appellé quand l'utilisateur appuie sur Entrée ou sur le bouton d'envoi)
        let chatInputForm = document.getElementById("message_form");
        if (chatInputForm) {
            chatInputForm.addEventListener('submit', function (event) {
                event.preventDefault();
                sendMessage();
            });
        }

        //On ajoute un écouteur d'évènement sur le bouton de désactivation des notifications d'xp
        let musicButton = document.getElementById("music_button");
        if (musicButton) {
            musicButton.addEventListener('click', function (event) {
                playSound("button");
                let image = document.getElementById("variable_image");

                //Déterminer si les notifications sont activées ou non on fonction de l'image actuelle du bouton
                if (image.src.endsWith("images/notification.png")) {
                    image.src = "images/notification_off.png";
                    createToast("success", "Les notifications d'XP ont été désactivées avec succès");
                    doNotificateXp = false;
                } else {
                    image.src = "images/notification.png";
                    createToast("success", "Les notifications d'XP ont été activées avec succès");
                    doNotificateXp = true;
                }
            });
        }

        //On ajoute un écouteur d'évènement sur le bouton de fermeture du tutoriel
        let tutorialButton = document.getElementById("tutorial_button");
        if (tutorialButton) {
            tutorialButton.addEventListener('click', function (event) {
                playSound("button");
                removeTutorialMessage();
            });
        }
    }

    //Tous les écouteurs d'évènements suivants ne sont ajoutés que si l'utilisateur est sur la page du compte
    if (isOnAccountPage()) {

        //On ajoute un écouteur d'évènement sur le bouton de changement de mot de passe
        let passwordChangeButton = document.getElementById("password_change_button");
        if (passwordChangeButton) {
            passwordChangeButton.addEventListener('click', function (event) {
                playSound("button");

                //On affiche le formulaire de changement de mot de passe
                renderAccountPageContainer("password_change_container", true);
            });
        }


        //On ajoute un écouteur d'évènement sur le formulaire de changement de mot de passe (appellé quand l'utilisateur appuie sur Entrée ou sur le bouton de changement de mot de passe)
        let passwordChangeForm = document.getElementById("password_change_container");
        if (passwordChangeForm) {
            passwordChangeForm.addEventListener('submit', function (event) {
                event.preventDefault();
                playSound("button");
                let currentPasswordInput = document.getElementById("current_password");
                let newPasswordInput = document.getElementById("new_password");
                if (currentPasswordInput && newPasswordInput) {
                    let currentPassword = currentPasswordInput.value;
                    let newPassword = newPasswordInput.value;

                    if (currentPassword === newPassword) {
                        createToast("error", "Les mots de passe sont identiques");
                        return;
                    }
                    if (!passwordGenericChecks(newPassword)) return;

                    //On envoie la requête de changement de mot de passe au serveur
                    ws.send(JSON.stringify({type: 'password_change', token, currentPassword, newPassword}));
                }
            });
        }

        //On ajoute un écouteur d'évènement sur le bouton de suppression du compte
        let deleteAccountButton = document.getElementById("delete_account_button");
        if (deleteAccountButton) {
            deleteAccountButton.addEventListener('click', function (event) {
                playSound("button");

                //On affiche le formulaire de suppression du compte
                renderAccountPageContainer("delete_account_container", true);
            });
        }

        //On ajoute un écouteur d'évènement sur le formulaire de suppression du compte (appellé quand l'utilisateur appuie sur Entrée ou sur le bouton de suppression du compte)
        let deleteAccountForm = document.getElementById("delete_account_container");
        if (deleteAccountForm) {
            deleteAccountForm.addEventListener('submit', function (event) {
                event.preventDefault();
                playSound("button");
                let passwordInput = document.getElementById("delete_account_password");
                if (passwordInput) {
                    let password = passwordInput.value;
                    if (!passwordGenericChecks(password)) return;

                    //On envoie la requête de suppression du compte au serveur
                    ws.send(JSON.stringify({type: 'delete_account', token, password}));
                }
            });
        }

        //On définis les textes contenus dans les dropdowns (choix de couleur et de son)
        setDropdownText("color_mine");
        setDropdownText("color_other")
        setDropdownText("sound_effects");
        setDropdownText("sound_music");

        //On ajoute un écouteur d'évènement sur l'ouverture du dropdown de choix de couleur de ses propres messages
        let myColorDropdown = document.getElementById("dropdown_color_mine");
        if (myColorDropdown) {
            myColorDropdown.addEventListener('click', function (event) {
                playSound("button");
                onDropdownOpen("color", "mine")
            });
        }

        //On ajoute un écouteur d'évènement sur l'ouverture du dropdown de choix de couleur des messages des autres
        let otherColorDropdown = document.getElementById("dropdown_color_other");
        if (otherColorDropdown) {
            otherColorDropdown.addEventListener('click', function (event) {
                playSound("button");
                onDropdownOpen("color", "other")
            });
        }

        //On ajoute un écouteur d'évènement sur l'ouverture du dropdown de choix du son des passages de niveaux
        let soundEffectsDropdown = document.getElementById("dropdown_sound_effects");
        if (soundEffectsDropdown) {
            soundEffectsDropdown.addEventListener('click', function (event) {
                playSound("button");
                onDropdownOpen("sound", "effects")
            });
        }

        //On ajoute un écouteur d'évènement sur l'ouverture du dropdown de choix de la musique du site
        let soundMusicDropdown = document.getElementById("dropdown_sound_music");
        if (soundMusicDropdown) {
            soundMusicDropdown.addEventListener('click', function (event) {
                playSound("button");
                onDropdownOpen("sound", "music")
            });
        }

        //On ajoute un écouteur d'évènement sur le bouton de sauvegarde des préférences
        let savePreferencesButton = document.getElementById("save_preferences_button");
        if (savePreferencesButton) {
            savePreferencesButton.addEventListener('click', function (event) {
                playSound("button");

                //On envoie la requête de sauvegarde des préférences au serveur pour qu'il les stocke dans des fichiers json
                ws.send(JSON.stringify({
                    type: 'save_preferences',
                    mine: myMessageColor.colorName,
                    other: otherMessageColor.colorName,
                    effects: soundEffects.soundName,
                    music: soundMusic.soundName,
                }));
            });
        }
    }
});

/* Les fonctions suivantes sont appelées par les écouteurs d'évènements
   Elles sont définies ici pour éviter de polluer le code des écouteurs d'évènements
*/

/**
 * Fonction appelée quand l'utilisateur se essaie de se connecter via le formulaire de connexion ou son token
 * @returns {void}
 */
function login() {
    console.log("Asking login to server");

    let username = "";
    let password = "";

    //Récupérer les valeurs des champs du formulaire de connexion
    let usernameInput = document.querySelector('#username');
    if (usernameInput) username = usernameInput.value;
    let passwordInput = document.querySelector('#password');
    if (passwordInput) password = passwordInput.value;

    if (token) { //Si l'utilisateur a un token, on essaie de se connecter avec
        console.log("Sending login token request to server")
        ws.send(JSON.stringify({
            type: 'login',
            token,
            page: isOnChatPage() ? 'chat' : 'login' //On envoie la page actuelle pour affiche le tutoriel sur la page de chat, non pas celle sur celle de connexion (Harcodé)
        }));
    } else { //Si l'utilisateur n'a pas de token, on essaie de se connecter avec les identifiants entrés dans le formulaire de connexion

        //Des vérifications côté client pour vérifier que les données entrées sont valides
        if (!usernameGenericChecks(username)) return;
        if (!passwordGenericChecks(password)) return;

        //On envoie la requête de connexion au serveur
        ws.send(JSON.stringify({
            type: 'login',
            username: username,
            password: password, //Le mot de passe est envoyé en clair, mais il est hashé au niveau du stockage serveur. TODO: Chiffrer le mot de passe
            page: isOnChatPage() ? 'chat' : 'login' //On envoie la page actuelle pour affiche le tutoriel sur la page de chat, non pas celle sur celle de connexion (Harcodé)
        }));
    }
}

/**
 * Fonction appelée quand l'utilisateur souhaite de déconnecter
 * @returns {void}
 */
function logout() {
    console.log("Asking logout to server");

    //On envoie la requête de déconnexion au serveur
    ws.send(JSON.stringify({
        type: 'logout',
        xp //On envoie le nombre d'xp de l'utilisateur pour qu'il soit sauvegardé dans les fichiers json
    }));
}

/**
 * Fonction appelée quand l'utilisateur envoie un message via le formulaire de message
 * @returns {boolean}
 */
function sendMessage() {
    const input = document.getElementById('chat_input');

    //Si le message est vide, on stoppe le processus d'envoi
    if (!input.value) {
        createToast("warning", "Vous ne pouvez pas envoyer un message vide")
        return false;
    }

    let message = input.value

    //Empêcher l'injection de code HTML
    message.replace(/<\/?[^>]+(>|$)/g, "");

    //Des vérifications côté client pour vérifier que l'utilisateur a le droit d'envoyer le message (notament les mentions et liens qui nécéssitent du niveau minimum)
    if (!isMessageContentValid(message)) return false;

    let finalMessage = reformatMessage(message);

    //On gère l'obtenion de l'xp et du niveau
    onMessageRelease();
    //On met à jour la barre de progression d'xp
    setBarProgression();

    playSound("send");

    //On envoie le message au serveur
    ws.send(JSON.stringify({"type": "message", "message": finalMessage, token, xp, lvl: getCurrentLevel()}));
    showMessage(finalMessage, username, getCurrentLevel(), (Date.now() / 1000), true);

    //On vide le champ de message
    input.value = '';
    return true;
}

/**
 * Fonction appelée quand l'utilisateur essaie d'afficher un message (en provenance du serveur ou de lieu même)
 * @param text {string}
 * @param username {string}
 * @param lvl {int}
 * @param timestamp {int}
 * @param isMine {boolean}
 * @returns {void}
 */
function showMessage(text, username, lvl, timestamp, isMine = false) {
    //On vérifie que l'utlisateur est bien sur la page de chat
    if(!isOnChatPage()) return;

    //Secondes écoulées depuis le 1er janvier 1970, cela permet de repérer le moment où le message a été envoyé
    let date = new Date(timestamp * 1000);
    //On formate la date pour l'afficher (ex: 02/12/2024 12:30:00)
    let formattedTime = reformatDate(date);

    //On détermine si le message doit être groupé avec le précédent (même auteur et envoyé il y a moins de 5 minutes)
    let isGroupping = lastMessage.username === username && lastMessage.timestamp + 300 > timestamp;

    if (!text) return; //On s'assure que le message n'est pas vide

    /*
    * On va, ici, crée le message pour l'afficher chez l'utilisateur
    *
    * On détermine si le message est de l'utilisateur ou d'un autre utilisateur
    * On affiche le niveau de l'utilisateur
    * On affiche le nom de l'utilisateur
    * On affiche l'heure d'envoi du message
    * On affiche le message
    */
    const messageRow = `
        <div class="message-row ${isMine ? 'mine' : 'theirs'}"> 
            ${isGroupping ? '' : `
                <div class="details">
                    ${isMine ? `
                        <div class="message-timestamp">${formattedTime}</div>
                        <div class="sender">${username} <span class="red">Niv. ${lvl}</span></div>
                    ` : `
                        <div class="sender">${username} <span class="red">Niv. ${lvl}</span></div>
                        <div class="message-timestamp">${formattedTime}</div>
                    `}
                </div>
            `}
            <div class="bubble" style="background-color: ${isMine ? valuesFromNames[myMessageColor.colorName] : valuesFromNames[otherMessageColor.colorName]}">${text}</div>
        </div>
    `;

    //On ajoute le message à la liste des messages
    document.getElementById("messages").innerHTML += messageRow;
    lastMessage = {username, timestamp};

    //On scroll jusqu'en bas de la page
    window.scrollTo(0, document.body.scrollHeight)
}

/**
 * Fonction appelée quand l'utilisateur on veut afficher le tutoriel
 * @returns {void}
 */
function sendTutorialMessage() {
    if (isOnChatPage()) {
        let tutorialContainer = document.getElementById("tutorial_container");
        if (tutorialContainer) {
            //Jouer avec la classe hidden permet de faire apparaitre/disparaitre le tutoriel
            tutorialContainer.classList.remove("hidden");
        }
    }
}

/**
 * Fonction appelée quand on veut cacher le tutoriel
 * @returns {void}
 */
function removeTutorialMessage() {
    let tutorialContainer = document.getElementById("tutorial_container");
    if (tutorialContainer) {
        //Jouer avec la classe hidden permet de faire apparaitre/disparaitre le tutoriel
        tutorialContainer.classList.add("hidden");
    }
}

/**
 * Fonction appelée quand l'utilisateur reçois le compteur de sessions actives
 * @returns {void}
 */
function updateSessionCounter() {
    let sessionsCounterElement = document.querySelector(".sessions_counter_text")

    //Message différent en fonction du nombre de sessions actives
    if (sessionsCounter <= 1) sessionsCounterElement.innerHTML = `${sessionsCounter} Connecté`;
    else sessionsCounterElement.innerHTML = `${sessionsCounter} Connectés`;
}

/**
 * Fonction appelée quand l'utilisateur reçois le classement
 * @param ranks {array}
 * @returns {void}
 */
function renderRanks(ranks) {
    for (let i = 0; i < ranks.length; i++) {
        let currentRank = ranks[i];
        let rank = currentRank.rank;
        let isonline = currentRank.ison;
        let user = currentRank.username;
        let xp = currentRank.xp;

        //On ajoute une nouvelle ligne au tableau de classement
        //On détermine si l'utilisateur est lui-même dans le classement pour lui appliquer une couleur spéciale afin qui puisse se voir plus facilement
        let insertRank = document.querySelector("#rank_insert");
        if (insertRank) {
            insertRank.innerHTML += `<tr class="data ${user === username ? "self" : ""}">
                    <td class="table_value">${rank}</td>
                    <td class="table_value"><img src="${isonline ? "images/online.png" : "images/offline.png"}" alt=""></td>
                    <td class="table_value">${user}</td>
                    <td class="table_value">${xp}</td>
                </tr>`;

        }
    }

}

/**
 * Fonction appelée pour afficher/cacher les formulaires de changement de mot de passe et de suppression de compte
 * @param containerId {string}
 * @param doShow {boolean}
 * @returns {void}
 */
function renderAccountPageContainer(containerId, doShow) {

    //On va chercher les éléments à afficher/cacher
    let container = document.getElementById(containerId);
    let accountContainer = document.getElementById("account_container");
    let preferencesContainer = document.getElementById("preferences_container");

    if (container && accountContainer && preferencesContainer) {
        //On affiche/cache les éléments en fonction de la valeur de doShow en jouant avec la classe hidden_element
        if (doShow) {
            container.classList.remove("hidden_element");
            accountContainer.classList.add("hidden_element");
            preferencesContainer.classList.add("hidden_element");
        } else {
            container.classList.add("hidden_element");
            accountContainer.classList.remove("hidden_element");
            preferencesContainer.classList.remove("hidden_element");
        }
    }

}

/**
 * Fonction appelée quand l'utilisateur reçois les données de son compte
 * @param rank {int}
 * @param msgCount {int}
 * @param accountCreateDate {int}
 */
function renderAccountData(rank, msgCount, accountCreateDate) {
    //On va chercher les éléments à modifier
    let entries = ["account_username", "account_level", "account_xp",
        "account_rank", "account_message_count", "account_creation_date"];

    //On va chercher les valeurs à afficher
    let values = [username, getCurrentLevel(), xp, rank, msgCount, reformatDate(new Date(accountCreateDate), true)];

    //On va modifier les éléments un par un
    for (let i = 0; i < entries.length; i++) {
        let entry = entries[i];
        let value = values[i].toString();

        //On délaye l'écriture des valeurs pour qu'il y ai un effet de machine à écrire ligne par ligne
        //On détermine donc le délai en fonction de la longueur des valeurs précédentes et du temps d'écriture d'un caractère
        let delay = 0
        if (i > 0) {
            for (let a = 0; a < i; a++) {
                delay += values[a].toString().length * 150
            }
        }

        //On appelle la fonction d'écriture du chaque ligne en fonction du délai que prends celle d'avant s'écrire
        setTimeout(function () {
            typeWriterEffect(entry, value, 150);
        }, delay);
    }
}

