// ============================
// GESTION RESPONSIVE
// ============================

// Menu hamburger
document.getElementById('hamburger').addEventListener('click', function() {
    document.getElementById('nav-links').classList.toggle('active');
});
function adjustLayoutForScreen() {
    const screenWidth = window.innerWidth;
    const gameContainer = document.querySelector('.game-container');
    
    if (screenWidth >= 1025 && screenWidth <= 1280) {
        // Ajustement pour écrans moyens
        gameContainer.style.gap = '15px';
    } else if (screenWidth > 1280) {
        // Réinitialiser pour grands écrans
        gameContainer.style.gap = '25px';
    }
}
window.addEventListener('load', adjustLayoutForScreen);
window.addEventListener('resize', adjustLayoutForScreen);
// Fermer le menu en cliquant sur un lien
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('nav-links').classList.remove('active');
    });
});
function truncatePlayerNames() {
    const playerNames = document.querySelectorAll('.player-name span');
    const maxLength = window.innerWidth <= 480 ? 12 : 
                     window.innerWidth <= 768 ? 15 : 20;
    
    playerNames.forEach(span => {
        const text = span.textContent;
        if (text.length > maxLength) {
            span.textContent = text.substring(0, maxLength) + '...';
        }
    });
}

// Ajuster la taille du cookie en fonction de l'écran
function adjustCookieSize() {
    const cookie = document.getElementById('click-target');
    const screenWidth = window.innerWidth;
    
    if (screenWidth <= 480) {
        cookie.style.width = '150px';
        cookie.style.height = '150px';
    } else if (screenWidth <= 768) {
        cookie.style.width = '180px';
        cookie.style.height = '180px';
    } else {
        cookie.style.width = '250px';
        cookie.style.height = '250px';
    }
}

// Ajuster au redimensionnement
window.addEventListener('resize', adjustCookieSize);
window.addEventListener('load', adjustCookieSize);

// ============================
// CLIENT MULTIJOUEUR RÉEL
// ============================

class MultiplayerClient {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.currentRoom = null;
        this.currentPlayer = null;
        this.players = [];
        this.previousPlayerOrder = [];
        this.activeParty = false;
        this.activeBoost = false;
        this.activeChallenge = false;
        this.challengeTimeLeft = 0;
        this.challengeInterval = null;
        
        this.initializeSocket();
        this.bindEvents();
    }
    
    showRoomModal() {
        document.getElementById('room-modal').style.display = 'flex';
    }

    hideRoomModal() {
        document.getElementById('room-modal').style.display = 'none';
        this.showNotification('Menu multijoueur fermé', 'var(--neon-pink)');
    }
    
    showEventsModal() {
        document.getElementById('events-modal').style.display = 'flex';
    }

    hideEventsModal() {
        document.getElementById('events-modal').style.display = 'none';
    }
    
    initializeSocket() {
        // Connexion au serveur Socket.io
        this.socket = io({
            transports: ['websocket']
        });
        
        this.socket.on('connect', () => {
            this.connected = true;
            this.updateConnectionStatus();
            console.log('✅ Connecté au serveur');
        });
        
        this.socket.on('disconnect', () => {
            this.connected = false;
            this.updateConnectionStatus();
            console.log('❌ Déconnecté du serveur');
        });
        
        this.socket.on('room-joined', (data) => {
            this.handleRoomJoined(data);
        });
        
        this.socket.on('room-full', () => {
            this.showNotification('Salle pleine!', 'var(--neon-pink)');
        });
        
        this.socket.on('player-joined', (player) => {
            this.handlePlayerJoined(player);
        });
        
        this.socket.on('player-left', (data) => {
            this.handlePlayerLeft(data);
        });
        
        this.socket.on('leaderboard-update', (players) => {
            this.updateLeaderboard(players);
        });
        
        this.socket.on('player-clicked', (data) => {
            this.showPlayerClick(data);
        });
        
        this.socket.on('upgrade-bought', (data) => {
            this.showUpgradeBought(data);
        });
        
        this.socket.on('golden-cookie-event', () => {
            this.triggerGoldenCookieEvent();
        });
        
        this.socket.on('cookie-party-started', () => {
            this.startCookieParty();
        });
        
        this.socket.on('multiplayer-boost-started', () => {
            this.startMultiplayerBoost();
        });
        
        this.socket.on('gift-distributed', () => {
            this.receiveGift();
        });
        
        this.socket.on('challenge-started', (data) => {
            this.startChallenge(data.duration);
        });
        
        this.socket.on('challenge-ended', (data) => {
            this.endChallenge(data.winner);
        });
    }
    
    bindEvents() {
        // Événements d'interface
        document.getElementById('multiplayer-btn').addEventListener('click', () => {
            this.showRoomModal();
        });
        
        document.getElementById('events-btn').addEventListener('click', () => {
            this.showEventsModal();
        });
        
        document.getElementById('show-events-btn').addEventListener('click', () => {
            this.showEventsModal();
        });
        
        document.getElementById('join-room-btn').addEventListener('click', () => {
            this.joinRoom();
        });
        
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.createRoom();
        });
        
        // ÉVÉNEMENTS POUR FERMER LES MODALS
        document.getElementById('cancel-room-btn').addEventListener('click', () => {
            this.hideRoomModal();
        });

        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.hideRoomModal();
        });
        
        document.getElementById('close-events-modal-btn').addEventListener('click', () => {
            this.hideEventsModal();
        });
        
        document.getElementById('close-events-btn').addEventListener('click', () => {
            this.hideEventsModal();
        });

        // Fermer en cliquant à l'extérieur
        document.getElementById('room-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('room-modal')) {
                this.hideRoomModal();
            }
        });
        
        document.getElementById('events-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('events-modal')) {
                this.hideEventsModal();
            }
        });

        // Fermer avec la touche Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('room-modal').style.display === 'flex') {
                    this.hideRoomModal();
                }
                if (document.getElementById('events-modal').style.display === 'flex') {
                    this.hideEventsModal();
                }
            }
        });
        
        document.getElementById('leave-room-btn').addEventListener('click', () => {
            this.leaveRoom();
        });
        
        // Nouveaux événements
        document.getElementById('start-party-btn-modal').addEventListener('click', () => {
            this.startCookieParty();
        });
        
        document.getElementById('start-boost-btn').addEventListener('click', () => {
            this.startMultiplayerBoost();
        });
        
        document.getElementById('start-gift-btn').addEventListener('click', () => {
            this.distributeGift();
        });
        
        document.getElementById('start-challenge-btn').addEventListener('click', () => {
            this.startChallenge(60);
        });
        
        document.getElementById('show-room-btn').addEventListener('click', () => {
            this.showRoomModal();
        });
    }
    
    joinRoom() {
        if (!this.connected) {
            this.showNotification('Non connecté au serveur', 'var(--neon-pink)');
            return;
        }
        
        const playerName = document.getElementById('player-name').value || 'Joueur';
        const roomCode = document.getElementById('room-code').value.toUpperCase();
        
        if (!roomCode) {
            this.showNotification('Veuillez entrer un code de salle', 'var(--neon-pink)');
            return;
        }
        
        this.socket.emit('join-room', {
            playerName: playerName,
            roomCode: roomCode
        });
    }
    
    createRoom() {
        if (!this.connected) {
            this.showNotification('Non connecté au serveur', 'var(--neon-pink)');
            return;
        }
        
        const playerName = document.getElementById('player-name').value || 'Joueur';
        const roomCode = this.generateRoomCode();
        
        document.getElementById('room-code').value = roomCode;
        
        this.socket.emit('join-room', {
            playerName: playerName,
            roomCode: roomCode
        });
    }
    
    leaveRoom() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket.connect();
        }
        
        this.currentRoom = null;
        this.currentPlayer = null;
        this.players = [];
        this.previousPlayerOrder = [];
        
        this.updateLeaderboard([]);
        this.hideRoomModal();
        this.showNotification('Vous avez quitté la salle', 'var(--neon-pink)');
    }
    
    handleRoomJoined(data) {
        this.currentRoom = data.room;
        this.currentPlayer = data.player;
        this.players = data.players;
        this.previousPlayerOrder = [];
        
        this.showRoomInfo();
        this.updateLeaderboard(this.players);
        this.hideRoomModal();
        
        this.showNotification(`Bienvenue dans la salle ${data.room}!`, 'var(--neon-green)');
    }
    
    handlePlayerJoined(player) {
        this.players.push(player);
        this.updateLeaderboard(this.players);
        this.showNotification(`${player.name} a rejoint la partie!`, 'var(--neon-blue)');
    }
    
    handlePlayerLeft(data) {
        this.players = data.players;
        this.updateLeaderboard(this.players);
    }
    
    updateLeaderboard(players) {
        const leaderboard = document.getElementById('leaderboard');
        leaderboard.innerHTML = '';
        
        // Trier par score
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        
        // Détecter les changements de position
        if (this.previousPlayerOrder.length > 0) {
            this.detectPositionChanges(this.previousPlayerOrder, sortedPlayers);
        }
        
        this.previousPlayerOrder = sortedPlayers.map(p => ({ id: p.id, name: p.name, score: p.score }));
        
        // Afficher les joueurs
        sortedPlayers.forEach((player, index) => {
            const isCurrentPlayer = player.id === this.currentPlayer?.id;
            const playerElement = document.createElement('div');
            playerElement.className = `player-info ${isCurrentPlayer ? 'current-player' : ''}`;
            
            playerElement.innerHTML = `
                <div class="player-name">
                    <i class="fas fa-${index === 0 ? 'crown' : 'user'}"></i>
                    <span>${player.name}</span>
                    ${player.isHost ? '<span class="host-badge">HÔTE</span>' : ''}
                    ${isCurrentPlayer ? '<i class="fas fa-star"></i>' : ''}
                </div>
                <div class="player-score">${Math.floor(player.score)}</div>
            `;
            
            leaderboard.appendChild(playerElement);
        });
        setTimeout(truncatePlayerNames, 0);
    }

    // Nouvelle méthode pour détecter les changements de position
    detectPositionChanges(previousOrder, newOrder) {
        const currentPlayerId = this.currentPlayer?.id;
        
        previousOrder.forEach((prevPlayer, prevIndex) => {
            const newIndex = newOrder.findIndex(p => p.id === prevPlayer.id);
            
            if (newIndex !== -1 && newIndex < prevIndex) {
                // Ce joueur a monté dans le classement
                const overtakenPlayers = previousOrder.slice(newIndex + 1, prevIndex + 1);
                
                overtakenPlayers.forEach(overtakenPlayer => {
                    if (overtakenPlayer.id !== prevPlayer.id) {
                        // Afficher la notification seulement si le joueur actuel est concerné
                        if (prevPlayer.id === currentPlayerId || overtakenPlayer.id === currentPlayerId) {
                            const overtakerName = prevPlayer.id === currentPlayerId ? "Vous" : prevPlayer.name;
                            const overtakenName = overtakenPlayer.id === currentPlayerId ? "vous" : overtakenPlayer.name;
                            
                            this.showNotification(
                                `${overtakerName} avez dépassé ${overtakenName} ! 🎯`, 
                                'var(--neon-orange)'
                            );
                        }
                    }
                });
            }
        });
    }
    
    updatePlayerScore(gameData) {
        if (!this.connected || !this.currentRoom) return;
        
        this.socket.emit('update-score', {
            score: gameData.score,
            level: gameData.level,
            cookiesPerClick: gameData.cookiesPerClick,
            autoCookies: gameData.autoCookies
        });
    }
    
    sendPlayerClick(cookiesEarned) {
        if (!this.connected || !this.currentRoom) return;
        
        this.socket.emit('player-click', {
            cookiesEarned: cookiesEarned
        });
    }
    
    sendUpgradeBought(upgrade, cost) {
        if (!this.connected || !this.currentRoom) return;
        
        this.socket.emit('buy-upgrade', {
            upgrade: upgrade,
            cost: cost
        });
    }
    
    showRoomInfo() {
        const roomInfo = document.getElementById('room-info');
        roomInfo.style.display = 'block';
        document.getElementById('current-room-code').textContent = this.currentRoom;
        document.getElementById('player-count').textContent = this.players.length;
    }
    
    updateConnectionStatus() {
        const statusElement = document.getElementById('connection-status');
        if (this.connected) {
            statusElement.className = 'connection-status connected';
            statusElement.innerHTML = '<i class="fas fa-wifi"></i> Connecté';
        } else {
            statusElement.className = 'connection-status disconnected';
            statusElement.innerHTML = '<i class="fas fa-wifi"></i> Déconnecté';
        }
    }
    
    showNotification(message, color) {
        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.textContent = message;
        notification.style.borderColor = color;
        notification.style.boxShadow = `0 0 15px ${color}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    showPlayerClick(data) {
        // Ne plus afficher les notifications pour chaque clic normal
        // Afficher seulement pour les très gros clics (optionnel)
        if (data.cookiesEarned >= 500) {
            this.showNotification(`${data.playerName} a fait un méga-clic de ${data.cookiesEarned} cookies! 💥`, 'var(--neon-yellow)');
        }
    }
    
    showUpgradeBought(data) {
        this.showNotification(`${data.playerName} a acheté ${data.upgrade} pour ${data.cost} cookies! 🛒`, 'var(--neon-purple)');
    }
    
    triggerGoldenCookieEvent() {
        this.showNotification('🎉 COOKIE DORÉ MULTIJOUEUR! Bonus activé!', 'gold');
        creerCookieDore();
    }
    
    startCookieParty() {
        if (!this.connected || !this.currentRoom) return;
        
        this.socket.emit('start-cookie-party');
        this.showNotification('🎊 FÊTE DES COOKIES LANÇÉE!', 'var(--neon-yellow)');
        
        // Limite de 10 secondes
        this.activeParty = true;
        
        // Effet visuel de fête
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createPartyParticle();
            }, i * 100);
        }
        
        // Arrêter après 10 secondes
        setTimeout(() => {
            this.activeParty = false;
            this.showNotification('Fête terminée!', 'var(--neon-pink)');
        }, 10000);
    }
    
    startMultiplayerBoost() {
        if (!this.connected || !this.currentRoom) return;
        
        this.socket.emit('start-multiplayer-boost');
        this.showNotification('🚀 BOOST MULTIJOUEUR ACTIVÉ! +50% de production', 'var(--neon-green)');
        
        // Activer le boost pendant 30 secondes
        this.activeBoost = true;
        gameData.boostMultiplier = 1.5;
        updateBoostDisplay();
        
        setTimeout(() => {
            this.activeBoost = false;
            gameData.boostMultiplier = 1.0;
            updateBoostDisplay();
            this.showNotification('Boost terminé!', 'var(--neon-pink)');
        }, 30000);
    }
    
    distributeGift() {
        if (!this.connected || !this.currentRoom) return;
        
        this.socket.emit('distribute-gift');
        this.showNotification('🎁 CADEAU ENVOYÉ À TOUS LES JOUEURS!', 'var(--neon-blue)');
    }
    
    receiveGift() {
        score += 1000;
        totalCookies += 1000;
        mettreAJourAffichage();
        this.showNotification('🎁 Vous avez reçu 1000 cookies!', 'var(--neon-blue)');
    }
    
    startChallenge(duration) {
        if (!this.connected || !this.currentRoom) return;
        
        this.socket.emit('start-challenge', { duration: duration });
        this.showNotification('🏁 DÉFI COMMENCÉ! Le premier gagne un bonus!', 'var(--neon-orange)');
        
        this.activeChallenge = true;
        this.challengeTimeLeft = duration;
        
        // Afficher l'indicateur de défi
        const indicator = document.getElementById('challenge-indicator');
        const timer = document.getElementById('challenge-timer');
        indicator.style.display = 'block';
        
        // Mettre à jour le timer
        this.challengeInterval = setInterval(() => {
            this.challengeTimeLeft--;
            timer.textContent = `${this.challengeTimeLeft}s`;
            
            if (this.challengeTimeLeft <= 0) {
                clearInterval(this.challengeInterval);
                indicator.style.display = 'none';
                this.activeChallenge = false;
            }
        }, 1000);
    }
    
    endChallenge(winner) {
        this.activeChallenge = false;
        clearInterval(this.challengeInterval);
        document.getElementById('challenge-indicator').style.display = 'none';
        
        if (winner === this.currentPlayer?.id) {
            score += 5000;
            totalCookies += 5000;
            mettreAJourAffichage();
            this.showNotification('🏆 VOUS AVEZ GAGNÉ LE DÉFI! +5000 cookies!', 'gold');
        } else {
            this.showNotification('💫 Le défi est terminé!', 'var(--neon-pink)');
        }
    }
    
    createPartyParticle() {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = '-20px';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        particle.style.animation = 'fall 3s linear forwards';
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 3000);
    }
}

// ============================
// JEU COOKIE CLICKER ORIGINAL
// ============================

// Éléments DOM
const cookieCible = document.getElementById("click-target");
const affichageScore = document.getElementById("score-display");
const btnAmeliorationAuto = document.getElementById("upgrade-auto-click");
const coutAuto = document.getElementById("auto-click-cost");
const btnAmeliorationClic = document.getElementById("upgrade-click-power");
const coutClic = document.getElementById("click-power-cost");
const btnMegaClic = document.getElementById("upgrade-mega-click");
const coutMegaClic = document.getElementById("mega-click-cost");
const btnCriticalClick = document.getElementById("upgrade-critical-click");
const coutCriticalClick = document.getElementById("critical-click-cost");
const btnGrandma = document.getElementById("upgrade-grandma");
const coutGrandma = document.getElementById("grandma-cost");
const btnBakery = document.getElementById("upgrade-bakery");
const coutBakery = document.getElementById("bakery-cost");
const btnFactory = document.getElementById("upgrade-factory");
const coutFactory = document.getElementById("factory-cost");
const btnLuckyCookie = document.getElementById("upgrade-lucky-cookie");
const coutLuckyCookie = document.getElementById("lucky-cookie-cost");
const btnGoldenCookie = document.getElementById("upgrade-golden-cookie");
const coutGoldenCookie = document.getElementById("golden-cookie-cost");
const btnTimeWarp = document.getElementById("upgrade-time-warp");
const coutTimeWarp = document.getElementById("time-warp-cost");

// Boutons de sauvegarde
const btnSaveGame = document.getElementById("save-game");
const btnLoadGame = document.getElementById("load-game");
const btnResetGame = document.getElementById("reset-game");

// Éléments de statistiques
const affichageClicsParSec = document.getElementById("auto-clicks");
const affichageCookiesParClic = document.getElementById("cookies-per-click");
const affichagePuissanceClic = document.getElementById("click-power");
const affichageCookiesTotaux = document.getElementById("total-cookies");
const affichageNiveau = document.getElementById("player-level");

// Variables du jeu
let score = 0;
let totalCookies = 0;
let niveau = 1;
let puissanceClic = 1;
let autoPowerClick = 0;
let grandmas = 0;
let bakeries = 0;
let factories = 0;
let luckyCookieActive = false;
let goldenCookieActive = false;
let megaClickChance = 0;
let criticalClickChance = 0;
let timeWarpActive = false;

// Données du jeu avec boosts
let gameData = {
    score: 0,
    level: 1,
    cookiesPerClick: 1,
    autoCookies: 0,
    boostMultiplier: 1.0,
    activeBoosts: []
};

// Coûts des améliorations
const couts = {
    autoClick: 25,
    clickPower: 15,
    megaClick: 100,
    criticalClick: 500,
    grandma: 100,
    bakery: 500,
    factory: 2000,
    luckyCookie: 250,
    goldenCookie: 1000,
    timeWarp: 5000
};

// Mise à jour des coûts affichés
coutAuto.textContent = couts.autoClick;
coutClic.textContent = couts.clickPower;
coutMegaClic.textContent = couts.megaClick;
coutCriticalClick.textContent = couts.criticalClick;
coutGrandma.textContent = couts.grandma;
coutBakery.textContent = couts.bakery;
coutFactory.textContent = couts.factory;
coutLuckyCookie.textContent = couts.luckyCookie;
coutGoldenCookie.textContent = couts.goldenCookie;
coutTimeWarp.textContent = couts.timeWarp;

// Gestion du clic sur le cookie
cookieCible.addEventListener("click", () => {
    let cookiesGagnes = puissanceClic * gameData.boostMultiplier;
    
    // Chance de méga-clic
    if (megaClickChance > 0 && Math.random() < megaClickChance) {
        cookiesGagnes *= 10;
        afficherEffetSpecial("MÉGA-CLIC! x10", "var(--neon-yellow)");
    }
    
    // Chance de clic critique
    if (criticalClickChance > 0 && Math.random() < criticalClickChance) {
        cookiesGagnes *= 3;
        afficherEffetSpecial("CLIC CRITIQUE! x3", "var(--neon-red)");
    }
    
    // Chance de cookie chanceux
    if (luckyCookieActive && Math.random() < 0.1) {
        cookiesGagnes *= 2;
        afficherEffetSpecial("COOKIE CHANCEUX! x2", "var(--neon-green)");
    }
    
    score += cookiesGagnes;
    totalCookies += cookiesGagnes;
    mettreAJourAffichage();
    verifierAmeliorations();
    creerParticuleClic(event);
    
    // Vérifier le niveau
    verifierNiveau();
    
    // Envoyer le clic au multijoueur
    if (window.multiplayerClient) {
        window.multiplayerClient.sendPlayerClick(cookiesGagnes);
    }
});

// Acheter amélioration auto-clic
btnAmeliorationAuto.addEventListener("click", () => {
    if (score >= couts.autoClick) {
        score -= couts.autoClick;
        autoPowerClick++;
        couts.autoClick = Math.floor(couts.autoClick * 1.5);
        coutAuto.textContent = couts.autoClick;
        mettreAJourAffichage();
        verifierAmeliorations();
        
        // Envoyer l'achat au multijoueur
        if (window.multiplayerClient) {
            window.multiplayerClient.sendUpgradeBought("Robot cuisinier", couts.autoClick);
        }
    }
});

// Acheter amélioration puissance de clic
btnAmeliorationClic.addEventListener("click", () => {
    if (score >= couts.clickPower) {
        score -= couts.clickPower;
        puissanceClic++;
        couts.clickPower = Math.floor(couts.clickPower * 1.8);
        coutClic.textContent = couts.clickPower;
        mettreAJourAffichage();
        verifierAmeliorations();
        
        if (window.multiplayerClient) {
            window.multiplayerClient.sendUpgradeBought("Main renforcée", couts.clickPower);
        }
    }
});

// Acheter méga-clic
btnMegaClic.addEventListener("click", () => {
    if (score >= couts.megaClick) {
        score -= couts.megaClick;
        megaClickChance += 0.05;
        couts.megaClick = Math.floor(couts.megaClick * 2);
        coutMegaClic.textContent = couts.megaClick;
        mettreAJourAffichage();
        verifierAmeliorations();
        
        if (window.multiplayerClient) {
            window.multiplayerClient.sendUpgradeBought("Méga-clic", couts.megaClick);
        }
    }
});

// Acheter clic critique
btnCriticalClick.addEventListener("click", () => {
    if (score >= couts.criticalClick) {
        score -= couts.criticalClick;
        criticalClickChance += 0.03;
        couts.criticalClick = Math.floor(couts.criticalClick * 2.5);
        coutCriticalClick.textContent = couts.criticalClick;
        mettreAJourAffichage();
        verifierAmeliorations();
        
        if (window.multiplayerClient) {
            window.multiplayerClient.sendUpgradeBought("Clic Critique", couts.criticalClick);
        }
    }
});

// Acheter grand-mère
btnGrandma.addEventListener("click", () => {
    if (score >= couts.grandma) {
        score -= couts.grandma;
        grandmas++;
        couts.grandma = Math.floor(couts.grandma * 1.5);
        coutGrandma.textContent = couts.grandma;
        mettreAJourAffichage();
        verifierAmeliorations();
        
        if (window.multiplayerClient) {
            window.multiplayerClient.sendUpgradeBought("Grand-mère", couts.grandma);
        }
    }
});

// Acheter boulangerie
btnBakery.addEventListener("click", () => {
    if (score >= couts.bakery) {
        score -= couts.bakery;
        bakeries++;
        couts.bakery = Math.floor(couts.bakery * 1.5);
        coutBakery.textContent = couts.bakery;
        mettreAJourAffichage();
        verifierAmeliorations();
        
        if (window.multiplayerClient) {
            window.multiplayerClient.sendUpgradeBought("Boulangerie", couts.bakery);
        }
    }
});

// Acheter usine
btnFactory.addEventListener("click", () => {
    if (score >= couts.factory) {
        score -= couts.factory;
        factories++;
        couts.factory = Math.floor(couts.factory * 1.5);
        coutFactory.textContent = couts.factory;
        mettreAJourAffichage();
        verifierAmeliorations();
        
        if (window.multiplayerClient) {
            window.multiplayerClient.sendUpgradeBought("Usine à Cookies", couts.factory);
        }
    }
});

// Acheter cookie chanceux
btnLuckyCookie.addEventListener("click", () => {
    if (score >= couts.luckyCookie) {
        score -= couts.luckyCookie;
        luckyCookieActive = true;
        btnLuckyCookie.disabled = true;
        btnLuckyCookie.innerHTML = `
            <div class="upgrade-info">
                <div class="upgrade-name">Cookie chanceux</div>
                <div class="upgrade-description">ACTIVÉ - Chance de cookies bonus</div>
            </div>
            <div class="upgrade-cost">ACHETÉ</div>
        `;
        mettreAJourAffichage();
        
        if (window.multiplayerClient) {
            window.multiplayerClient.sendUpgradeBought("Cookie chanceux", couts.luckyCookie);
        }
    }
});

// Acheter cookie doré
btnGoldenCookie.addEventListener("click", () => {
    if (score >= couts.goldenCookie) {
        score -= couts.goldenCookie;
        goldenCookieActive = true;
        btnGoldenCookie.disabled = true;
        btnGoldenCookie.innerHTML = `
            <div class="upgrade-info">
                <div class="upgrade-name">Cookie doré</div>
                <div class="upgrade-description">ACTIVÉ - Apparition de cookies bonus</div>
            </div>
            <div class="upgrade-cost">ACHETÉ</div>
        `;
        // Démarrer l'apparition de cookies dorés
        setInterval(creerCookieDore, 30000);
        mettreAJourAffichage();
        
        if (window.multiplayerClient) {
            window.multiplayerClient.sendUpgradeBought("Cookie doré", couts.goldenCookie);
        }
    }
});

// Acheter distorsion temporelle
btnTimeWarp.addEventListener("click", () => {
    if (score >= couts.timeWarp) {
        score -= couts.timeWarp;
        timeWarpActive = true;
        gameData.boostMultiplier *= 2;
        updateBoostDisplay();
        
        // Désactiver après 1 minute
        setTimeout(() => {
            timeWarpActive = false;
            gameData.boostMultiplier /= 2;
            updateBoostDisplay();
            afficherNotification("Distorsion temporelle terminée!", "var(--neon-pink)");
        }, 60000);
        
        btnTimeWarp.disabled = true;
        btnTimeWarp.innerHTML = `
            <div class="upgrade-info">
                <div class="upgrade-name">Distorsion Temporelle</div>
                <div class="upgrade-description">ACTIVÉ - x2 production (1min)</div>
            </div>
            <div class="upgrade-cost">ACHETÉ</div>
        `;
        mettreAJourAffichage();
        
        if (window.multiplayerClient) {
            window.multiplayerClient.sendUpgradeBought("Distorsion Temporelle", couts.timeWarp);
        }
    }
});

// Sauvegarder la partie
btnSaveGame.addEventListener("click", () => {
    const gameState = {
        score,
        totalCookies,
        niveau,
        puissanceClic,
        autoPowerClick,
        grandmas,
        bakeries,
        factories,
        luckyCookieActive,
        goldenCookieActive,
        megaClickChance,
        criticalClickChance,
        timeWarpActive,
        couts
    };
    
    localStorage.setItem('cookieClickerNeonSave', JSON.stringify(gameState));
    afficherNotification("Partie sauvegardée!");
});

// Charger la partie
btnLoadGame.addEventListener("click", () => {
    const savedGame = localStorage.getItem('cookieClickerNeonSave');
    
    if (savedGame) {
        const gameState = JSON.parse(savedGame);
        
        score = gameState.score;
        totalCookies = gameState.totalCookies;
        niveau = gameState.niveau;
        puissanceClic = gameState.puissanceClic;
        autoPowerClick = gameState.autoPowerClick;
        grandmas = gameState.grandmas;
        bakeries = gameState.bakeries;
        factories = gameState.factories;
        luckyCookieActive = gameState.luckyCookieActive;
        goldenCookieActive = gameState.goldenCookieActive;
        megaClickChance = gameState.megaClickChance;
        criticalClickChance = gameState.criticalClickChance;
        timeWarpActive = gameState.timeWarpActive;
        
        // Mettre à jour les coûts
        Object.keys(couts).forEach(key => {
            couts[key] = gameState.couts[key];
        });
        
        // Mettre à jour l'interface
        mettreAJourAffichage();
        verifierAmeliorations();
        
        // Mettre à jour les boutons d'améliorations achetées
        if (luckyCookieActive) {
            btnLuckyCookie.disabled = true;
            btnLuckyCookie.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">Cookie chanceux</div>
                    <div class="upgrade-description">ACTIVÉ - Chance de cookies bonus</div>
                </div>
                <div class="upgrade-cost">ACHETÉ</div>
            `;
        }
        
        if (goldenCookieActive) {
            btnGoldenCookie.disabled = true;
            btnGoldenCookie.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">Cookie doré</div>
                    <div class="upgrade-description">ACTIVÉ - Apparition de cookies bonus</div>
                </div>
                <div class="upgrade-cost">ACHETÉ</div>
            `;
            // Démarrer l'apparition de cookies dorés
            setInterval(creerCookieDore, 30000);
        }
        
        if (timeWarpActive) {
            btnTimeWarp.disabled = true;
            btnTimeWarp.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">Distorsion Temporelle</div>
                    <div class="upgrade-description">ACTIVÉ - x2 production (1min)</div>
                </div>
                <div class="upgrade-cost">ACHETÉ</div>
            `;
        }
        
        afficherNotification("Partie chargée!");
    } else {
        afficherNotification("Aucune sauvegarde trouvée", "var(--neon-pink)");
    }
});

// Réinitialiser la partie
btnResetGame.addEventListener("click", () => {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser votre partie? Toute votre progression sera perdue.")) {
        score = 0;
        totalCookies = 0;
        niveau = 1;
        puissanceClic = 1;
        autoPowerClick = 0;
        grandmas = 0;
        bakeries = 0;
        factories = 0;
        luckyCookieActive = false;
        goldenCookieActive = false;
        megaClickChance = 0;
        criticalClickChance = 0;
        timeWarpActive = false;
        gameData.boostMultiplier = 1.0;
        
        // Réinitialiser les coûts
        couts.autoClick = 25;
        couts.clickPower = 15;
        couts.megaClick = 100;
        couts.criticalClick = 500;
        couts.grandma = 100;
        couts.bakery = 500;
        couts.factory = 2000;
        couts.luckyCookie = 250;
        couts.goldenCookie = 1000;
        couts.timeWarp = 5000;
        
        // Réinitialiser l'interface
        mettreAJourAffichage();
        verifierAmeliorations();
        updateBoostDisplay();
        
        // Réinitialiser les boutons d'améliorations
        const upgrades = [
            { btn: btnLuckyCookie, name: "Cookie chanceux", desc: "Chance de cookies bonus", cost: 250 },
            { btn: btnGoldenCookie, name: "Cookie doré", desc: "Apparition de cookies bonus", cost: 1000 },
            { btn: btnTimeWarp, name: "Distorsion Temporelle", desc: "x2 production pendant 1 minute", cost: 5000 }
        ];
        
        upgrades.forEach(upgrade => {
            upgrade.btn.disabled = false;
            upgrade.btn.innerHTML = `
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-description">${upgrade.desc}</div>
                </div>
                <div class="upgrade-cost">Coût: <span>${upgrade.cost}</span></div>
            `;
        });
        
        afficherNotification("Partie réinitialisée!");
    }
});

// Mettre à jour l'affichage
function mettreAJourAffichage() {
    affichageScore.textContent = Math.floor(score);
    affichageCookiesTotaux.textContent = Math.floor(totalCookies);
    affichageClicsParSec.textContent = (autoPowerClick + (grandmas * 5) + (bakeries * 25) + (factories * 100)) * gameData.boostMultiplier;
    affichageCookiesParClic.textContent = puissanceClic * gameData.boostMultiplier;
    affichagePuissanceClic.textContent = puissanceClic * gameData.boostMultiplier;
    affichageNiveau.textContent = niveau;
    
    // Mettre à jour le score multijoueur
    if (window.multiplayerClient) {
        window.multiplayerClient.updatePlayerScore({
            score: score,
            level: niveau,
            cookiesPerClick: puissanceClic * gameData.boostMultiplier,
            autoCookies: (autoPowerClick + (grandmas * 5) + (bakeries * 25) + (factories * 100)) * gameData.boostMultiplier
        });
    }
}

// Vérifier quelles améliorations sont disponibles
function verifierAmeliorations() {
    btnAmeliorationAuto.disabled = score < couts.autoClick;
    btnAmeliorationClic.disabled = score < couts.clickPower;
    btnMegaClic.disabled = score < couts.megaClick;
    btnCriticalClick.disabled = score < couts.criticalClick;
    btnGrandma.disabled = score < couts.grandma;
    btnBakery.disabled = score < couts.bakery;
    btnFactory.disabled = score < couts.factory;
    btnLuckyCookie.disabled = score < couts.luckyCookie || luckyCookieActive;
    btnGoldenCookie.disabled = score < couts.goldenCookie || goldenCookieActive;
    btnTimeWarp.disabled = score < couts.timeWarp || timeWarpActive;
}

// Vérifier et mettre à jour le niveau
function verifierNiveau() {
    const nouveauNiveau = Math.floor(Math.log10(totalCookies + 1)) + 1;
    if (nouveauNiveau > niveau) {
        niveau = nouveauNiveau;
        afficherEffetSpecial(`NIVEAU ${niveau} ATTEINT!`, "var(--neon-pink)");
    }
}

// Auto-clics
setInterval(() => {
    const gainsAuto = (autoPowerClick + (grandmas * 5) + (bakeries * 25) + (factories * 100)) * gameData.boostMultiplier;
    score += gainsAuto;
    totalCookies += gainsAuto;
    mettreAJourAffichage();
    verifierAmeliorations();
    verifierNiveau();
}, 1000);

// Mettre à jour l'affichage des boosts
function updateBoostDisplay() {
    const boostsList = document.getElementById('boosts-list');
    boostsList.innerHTML = '';
    
    const activeBoosts = [];
    
    if (gameData.boostMultiplier > 1.0) {
        activeBoosts.push(`Boost x${gameData.boostMultiplier}`);
    }
    
    if (window.multiplayerClient?.activeParty) {
        activeBoosts.push('Fête Active');
    }
    
    if (window.multiplayerClient?.activeChallenge) {
        activeBoosts.push('Défi en cours');
    }
    
    if (timeWarpActive) {
        activeBoosts.push('Distorsion Temporelle');
    }
    
    if (activeBoosts.length === 0) {
        boostsList.innerHTML = '<div class="no-boosts">Aucun boost actif</div>';
    } else {
        activeBoosts.forEach(boost => {
            const boostElement = document.createElement('div');
            boostElement.className = 'boost-item';
            boostElement.textContent = boost;
            boostsList.appendChild(boostElement);
        });
    }
}

// Créer des particules de fond
function creerParticulesFond() {
    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
        particle.style.width = `${Math.random() * 4 + 2}px`;
        particle.style.height = particle.style.width;
        particlesContainer.appendChild(particle);
    }
}

// Créer des particules lors d'un clic
function creerParticuleClic(event) {
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.position = 'fixed';
        particle.style.left = `${event.clientX}px`;
        particle.style.top = `${event.clientY}px`;
        particle.style.animation = 'float 2s forwards';
        particle.style.background = `hsl(${Math.random() * 60 + 30}, 100%, 50%)`;
        particle.style.width = '8px';
        particle.style.height = '8px';
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 2000);
    }
}

// Afficher un effet spécial
function afficherEffetSpecial(message, couleur) {
    const effet = document.createElement('div');
    effet.textContent = message;
    effet.style.position = 'fixed';
    effet.style.top = '50%';
    effet.style.left = '50%';
    effet.style.transform = 'translate(-50%, -50%)';
    effet.style.fontSize = '2rem';
    effet.style.fontWeight = 'bold';
    effet.style.color = couleur;
    effet.style.textShadow = `0 0 10px ${couleur}, 0 0 20px ${couleur}`;
    effet.style.zIndex = '1000';
    effet.style.pointerEvents = 'none';
    document.body.appendChild(effet);
    
    // Animation
    let opacity = 1;
    let yPos = 0;
    const animation = setInterval(() => {
        opacity -= 0.02;
        yPos -= 2;
        effet.style.opacity = opacity;
        effet.style.transform = `translate(-50%, calc(-50% + ${yPos}px))`;
        
        if (opacity <= 0) {
            clearInterval(animation);
            effet.remove();
        }
    }, 30);
}

// Afficher une notification
function afficherNotification(message, couleur = "var(--neon-blue)") {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;
    notification.style.borderColor = couleur;
    notification.style.boxShadow = `0 0 15px ${couleur}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Créer un cookie doré
function creerCookieDore() {
    if (!goldenCookieActive) return;
    
    const cookie = document.createElement('img');
    cookie.id = 'golden-cookie';
    cookie.src = 'cookie_doree.png';
    cookie.alt = "Cookie doré";
    cookie.classList.add('golden-cookie');
    cookie.style.width = '80px';
    cookie.style.height = '80px';
    cookie.style.position = 'fixed';
    cookie.style.left = `${Math.random() * 80 + 10}%`;
    cookie.style.top = `${Math.random() * 80 + 10}%`;
    cookie.style.cursor = 'pointer';
    cookie.style.zIndex = '100';
    
    document.body.appendChild(cookie);
    
    // Gérer le clic sur le cookie doré
    cookie.addEventListener('click', () => {
        const bonus = 100 * niveau;
        score += bonus;
        totalCookies += bonus;
        mettreAJourAffichage();
        afficherEffetSpecial(`+${bonus} COOKIES!`, "gold");
        cookie.remove();
    });
    cookie.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });

    cookie.addEventListener('mousedown', function(e) {
        e.preventDefault();
    });
    // Le cookie disparaît après 10 secondes
    setTimeout(() => {
        if (document.body.contains(cookie)) {
            cookie.remove();
        }
    }, 10000);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    creerParticulesFond();
    mettreAJourAffichage();
    verifierAmeliorations();
    updateBoostDisplay();
    
    // Initialiser le client multijoueur
    window.multiplayerClient = new MultiplayerClient();
    
    // Charger automatiquement la sauvegarde au démarrage
    const savedGame = localStorage.getItem('cookieClickerNeonSave');
    if (savedGame) {
        if (confirm("Une sauvegarde a été trouvée. Voulez-vous charger votre partie précédente?")) {
            btnLoadGame.click();
        }
    }

});

// Ajouter l'animation de chute pour les particules de fête
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Empêcher le drag & drop sur l'image
const cookies = document.getElementById('click-target');

cookies.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
});

cookies.addEventListener('mousedown', function(e) {
    e.preventDefault();
});