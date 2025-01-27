import {WebSocketServer} from 'ws';
import fs from 'fs';
import http from 'http';
import path from 'path';

const {randomBytes, createHmac} = await import('node:crypto');

// Créer un serveur HTTP
const server = http.createServer((req, res) => {

    //Définir le chemin de base pour accéder aux fichiers statiques
    const basePath = './public';

    // Construire le chemin du fichier demandé par le client
    let filePath = path.join(basePath, req.url === '/' ? 'login.html' : req.url);

    // Déterminer le type de ressource demandée
    const extName = path.extname(filePath);
    let contentType = 'text/html';
    switch (extName) {
        case '.css':
            contentType = 'text/css';
            break;
        case '.js':
            contentType = 'application/javascript';
            break;
        case '.png':
            contentType = 'image/png';
            break;
    }


    // Lire et servir le fichier
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end(`File not found: ${req.url}`);
            return;
        }
        res.writeHead(200, {'Content-Type': contentType});
        res.end(content, 'utf-8');
    });
});

//Initialiser le serveur WebSocket
const wss = new WebSocketServer({server});

//Generer un id unique pour chaque client
wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4();
};

//Constante secrète pour le hashage du mot de passe
const salt = "Q5MjaTq-5ps5MjvdLVEhPi4XGFqNsKcXcnmuPNLR-HxtUHGVfpp0_cPSIv7";

//Obtenir toutes les informations des utilisateurs et l'histoire des messages à partir de fichiers JSON
let users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
let xpStorage = JSON.parse(fs.readFileSync('xp.json', 'utf8'));
let userPreferences = JSON.parse(fs.readFileSync('preferences.json', 'utf8'));
let isOld = JSON.parse(fs.readFileSync('isold.json', 'utf8'));
let accountAges = JSON.parse(fs.readFileSync('accountages.json', 'utf8'));
let oldSessions = JSON.parse(fs.readFileSync('oldsessions.json', 'utf8'));
let messageHistory = JSON.parse(fs.readFileSync('history.json', 'utf8'));
let sessions = {};

//Lorsqu'un client se connecte au serveur WebSocket
wss.on('connection', client => {

    //Générer un id unique pour le client
    let id = client.id = wss.getUniqueID();

    try {
        let ip = client._socket.remoteAddress;
        console.log("New connection from " + ip + " with id " + client.id);


        //Lorsque le client se déconnecte
        client.on('close', () => {
            console.log("Client disconnected " + ip + " with id " + id);
            delete sessions[id];
            sendCount()
        });

        //Lorsque l'on reçois un message du client
        client.on('message', (message) => {
            //Json decode
            let data = '';
            try {
                data = JSON.parse(message);
            } catch (e) {
                console.log("Error parsing JSON from " + ip + " with id " + client.id);
                return;
            }

            //On peut afficher le message reçu dans la console
            //console.log(data)

            let username = 'placeholder';
            if (data.type !== "login" && !sessions[id]) {
                /*
                Le paquet n'est pas un paquet de connexion et le client n'est pas connecté (il n'y a pas de token dans ses cookies comme ce devrait normalement être le cas)
                Le client essaie donc de se connecter dans les autres pages directement sans passer par la page de connexion
                On le déconnecte donc
                */
                console.log("Unhautorized connection: didn't recieve a correct login packet from " + ip);
                client.send(JSON.stringify({type: "error", message: "Unhautorized connection, no token provided"}));
                client.close();
                return;
            }

            //On traite le paquet reçu en fonction de son type
            switch (data.type) {
                case 'login':
                    let isNew = false;
                    let token = randomBytes(20).toString('hex');
                    //Si le token est fourni par le client
                    if (data.token) {
                        //On vérifie que le token existe dans notre stockage de tokens
                        if (oldSessions[data.token]) {
                            username = oldSessions[data.token].username ?? 'placeholder';
                            token = data.token;
                        } else { //Sinon on demande au client de se reconnecter en réinitialisant ses cookies
                            console.log("Unauthorized connection: " + ip + " sended a false token");
                            client.send(JSON.stringify({type: "error", message: "Invalid token"}));
                            return;
                        }
                    } else {
                        //On crée un hash du mot de passe fourni par le client
                        let hash = createHmac('sha256', salt).update(data.password).digest('hex');

                        //On vérifie si le client est déjà enregistré
                        if (!users[data.username]) { //Exécuté si le client se connecte pour la première fois
                            users[data.username] = hash;
                            xpStorage[data.username] = 0;
                            console.log("New account created: " + data.username + " from " + ip)
                            accountAges[data.username] = Date.now();

                        } else if (users[data.username] !== hash) { //Exécuté si le client a déjà un compte mais qu'il a fourni un mauvais mot de passe
                            console.log("Wrong password from " + ip + " sended hash: " + hash);
                            client.send(JSON.stringify({type: "error", message: "Wrong password"}));
                            return;
                        }

                        username = data.username;
                    }

                    //On enregistre la session du client
                    console.log("Adding session for " + username + ", client id " + client.id + " with token " + token);
                    sessions[client.id] = {token, client, username, ip};
                    oldSessions[token] = {username, ip, time: Date.now()};

                    //Si le client est nouveau et qu'il arrive sur la page de chat, on lui envoie un paquet pour activer son tutoriel
                    if (data.page === 'chat' && !isOld[username]) {
                        isOld[username] = true;
                        isNew = true;
                    }

                    //On envoie un paquet de connexion réussie au client
                    client.send(JSON.stringify({
                        type: 'login', success: true, token, username, xp: xpStorage[username] ?? 0,
                        mine: userPreferences[username]?.mine ?? "Bleu Clair",
                        other: userPreferences[username]?.other ?? "Gris",
                        effects: userPreferences[username]?.effects ?? "Bip Boup",
                        music: userPreferences[username]?.music ?? "Par defaut",
                        new: isNew
                    }));
                    break;

                case 'logout':
                    //Le client demande la déconnexion, on supprime donc sa session
                    if (sessions[id]) {
                        console.log("Removing session for " + sessions[id].username + ", client id " + client.id + " with token " + sessions[id].token);
                        if (data.xp) xpStorage[sessions[id].username] = data.xp;
                        delete oldSessions[sessions[id].token];
                        delete sessions[id];

                        //On met à jour le compteur de sessions des autres clients
                        sendCount()
                        //On envoie un paquet de déconnexion réussie au client
                        client.send(JSON.stringify({type: 'logout', success: true}));
                    }
                    break;

                case "save_preferences":
                    //Le client envoie ses préférences, on les enregistre
                    if (sessions[id]) {
                        if (data.mine && data.other && data.effects && data.music) {
                            console.log("Saving preferences for " + sessions[id].username + ", client id " + client.id + " with token " + sessions[id].token);
                            userPreferences[sessions[id].username] = {
                                mine: data.mine,
                                other: data.other,
                                effects: data.effects,
                                music: data.music
                            };
                            //On envoie un paquet de sauvegarde réussie au client
                            client.send(JSON.stringify({type: 'save_preferences', success: true}));
                        }
                    }
                    break;

                case 'account':
                    //Le client demande des informations sur son compte, on les lui envoie
                    if (oldSessions[data.token]) {
                        //On calcule le rang du client en fonction de son xp
                        let rank = Object.keys(xpStorage).sort((a, b) => xpStorage[b] - xpStorage[a]).indexOf(oldSessions[data.token].username) + 1;
                        //On calcule le nombre de messages envoyés par le client
                        let msgCount = messageHistory.filter(msg => msg.username === oldSessions[data.token].username).length;
                        //On calcule l'âge du compte du client
                        let accountCreateDate = accountAges[oldSessions[data.token].username];
                        //On envoie un paquet contenant les informations au client
                        client.send(JSON.stringify({
                            type: 'account',
                            rank: rank,
                            msgCount: msgCount,
                            accountCreateDate: accountCreateDate
                        }));
                    }
                    break;

                case 'password_change':
                    //Le client demande un changement de mot de passe, on effectue des vérifications et on le change si tout est bon
                    if (oldSessions[data.token]) {
                        //On vérifie que le client a fourni un mot de passe actuel et un nouveau mot de passe
                        if (data.currentPassword && data.newPassword) {
                            username = oldSessions[data.token].username;

                            //On crée un hash du mot de passe actuel et du nouveau mot de passe
                            let currentPassword = createHmac('sha256', salt).update(data.currentPassword).digest('hex');
                            let newPassword = createHmac('sha256', salt).update(data.newPassword).digest('hex');

                            //On vérifie que le mot de passe actuel fourni par le client est correct
                            if (users[username] === currentPassword) {
                                users[username] = newPassword;
                                //On envoie un paquet de changement de mot de passe réussi au client
                                client.send(JSON.stringify({type: 'password_change', success: true}));
                            } else client.send(JSON.stringify({type: 'password_change', success: false})); //On envoie un paquet de changement de mot de passe échoué au client
                        }
                    }
                    break;

                case 'delete_account':
                    //Le client demande la suppression de son compte, on effectue des vérifications et on le supprime si tout est bon
                    if (oldSessions[data.token]) {
                        //On vérifie que le client a fourni un mot de passe
                        if (data.password) {
                            username = oldSessions[data.token].username;
                            //On crée un hash du mot de passe fourni par le client
                            let givenPassword = createHmac('sha256', salt).update(data.password).digest('hex');
                            //On vérifie que le mot de passe fourni par le client est correct
                            if (users[username] === givenPassword) { //On supprime le compte si le mot de passe est correct
                                delete users[username];
                                delete xpStorage[username];
                                delete accountAges[username];
                                delete oldSessions[data.token];
                                delete userPreferences[username];
                                delete isOld[username];
                                //On envoie un paquet de suppression de compte réussie au client
                                client.send(JSON.stringify({type: 'delete_account', success: true}));
                            } else client.send(JSON.stringify({type: 'delete_account', success: false})); //On envoie un paquet de suppression de compte échouée au client
                        }
                    }
                    break;

                case 'history':
                    //Le client demande l'historique des messages, on lui envoie les 100 derniers messages
                    //Si il y a moins de 100 messages, on lui envoie tous les messages
                    if (messageHistory.length > 100) client.send(JSON.stringify({
                        type: 'history',
                        messages: messageHistory.slice(-100)
                    }));
                    //On envoie un paquet contenant l'historique des messages au client
                    else client.send(JSON.stringify({type: 'history', messages: messageHistory}));
                    break;

                case 'rank':
                    //Le client demande le classement des utilisateurs, on lui envoie les 20 premiers
                    //On trie les utilisateurs en fonction de leur xp et on garde les 20 premiers
                    let topUsers = Object.keys(xpStorage).sort((a, b) => xpStorage[b] - xpStorage[a]).slice(0, 20);
                    //On crée un tableau contenant les informations de chaque utilisateur du top 20
                    let ranks = [];
                    for (let i = 0; i < topUsers.length; i++) {
                        ranks.push({
                            rank: i + 1,
                            ison: isUserConnected(topUsers[i]),
                            username: topUsers[i],
                            xp: xpStorage[topUsers[i]]
                        });
                    }
                    //On envoie un paquet contenant le classement des utilisateurs au client
                    client.send(JSON.stringify({type: 'rank', ranks}));
                    break;

                case 'count':
                    //Le client demande le nombre de sessions actives, on lui envoie le nombre de sessions actives
                    sendCount()
                    break;

                case 'message':
                    //Le client envoie un message, on le renvoie à tous les autres clients
                    if (oldSessions[data.token]) {
                        //On récupère les informations liées au message
                        username = oldSessions[data.token].username;
                        let lvl = data.lvl;
                        message = data.message;

                        //On met à jour l'xp du client dans le stockage du serveur
                        if (data.xp && (data.xp !== xpStorage[username])) xpStorage[username] = data.xp;

                        //On envoie le message à tous les clients connectés sauf l'auteur du message
                        Object.values(sessions) //On récupère toutes les sessions
                            .filter(session => session.client !== client) //On filtre les sessions pour ne garder que celles qui ne sont pas celle de l'auteur du message
                            .forEach(session => { //On envoie le message avec ses informations à chaque session
                                console.log("Sending message to " + session.username + " client id " + session.client.id);
                                session.client.send(JSON.stringify({
                                    type: 'message',
                                    username,
                                    lvl,
                                    message: message,
                                    timestamp: Date.now() / 1000
                                }))
                            });
                        //On stocke le message reçu dans l'historique des messages
                        messageHistory.push({username, lvl, message, timestamp: Date.now() / 1000});
                    }
                    break;
            }
        });
    } catch (e) {
        //Si une erreur se produit, on l'affiche dans la console
        console.log("Error: " + e);
    }
});

/**
 * Envoie le nombre de sessions actives à tous les clients connectés
 * @returns {void}
 */
function sendCount() {
    //On calcule le nombre de sessions actives
    let count = Object.keys(sessions).length;
    console.log(`sending session counter = ${count} to every sessions`)
    //On envoie le nombre de sessions actives à tous les clients connectés
    Object.values(sessions) //On récupère toutes les sessions
        .forEach(session => { //On envoie le nombre de sessions actives à chaque session
            session.client.send(JSON.stringify({
                type: 'count',
                count,
            }))
        });
}

/**
 * Vérifie si un utilisateur est connecté
 * @param username {string}
 * @returns {boolean}
 */
function isUserConnected(username) {
    //On vérifie si l'utilisateur est connecté en vérifiant si son nom d'utilisateur est présent dans les sessions
    return Object.values(sessions).some(session => session.username === username);
}

// Le serveur HTTP écoute sur le port 8080
server.listen(8080, () => {
    console.log('Serveur HTTP et WebSocket en écoute sur le port 8080');
});

//Quand le serveur se ferme, on enregistre toutes les informations dans des fichiers JSON
async function exitHandler(options, exitCode) {
    fs.writeFileSync('users.json', JSON.stringify(users));
    fs.writeFileSync('xp.json', JSON.stringify(xpStorage));
    fs.writeFileSync('oldsessions.json', JSON.stringify(oldSessions));
    fs.writeFileSync('preferences.json', JSON.stringify(userPreferences));
    fs.writeFileSync('history.json', JSON.stringify(messageHistory));
    fs.writeFileSync('isold.json', JSON.stringify(isOld));
    fs.writeFileSync('accountages.json', JSON.stringify(accountAges));

    process.exit();
    if (options.exit) process.exit();
}

//On écoute les évènements de fermeture du serveur (Ctrl+C, KILL PID, etc...)
process.on('exit', exitHandler.bind(null, {cleanup: true}));
process.on('SIGINT', exitHandler.bind(null, {exit: true}));//Ctrl+C
process.on('SIGUSR1', exitHandler.bind(null, {exit: true})); //KILL PID
process.on('SIGUSR2', exitHandler.bind(null, {exit: true}));
process.on('uncaughtException', function (exception) {
    console.log(exception)
    exitHandler({exit: true}, exception.message + "\n" + exception.stack).then();
});