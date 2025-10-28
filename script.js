
        // ============================
        // GESTION RESPONSIVE
        // ============================
        
        // Menu hamburger
        document.getElementById('hamburger').addEventListener('click', function() {
            document.getElementById('nav-links').classList.toggle('active');
        });
        
        // Fermer le menu en cliquant sur un lien
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                document.getElementById('nav-links').classList.remove('active');
            });
        });
        
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
            
            initializeSocket() {
                // Connexion au serveur Socket.io
                this.socket = io('http://localhost:3000', {
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
            }
            
            bindEvents() {
                // Événements d'interface
                document.getElementById('multiplayer-btn').addEventListener('click', () => {
                    this.showRoomModal();
                });
                
                document.getElementById('join-room-btn').addEventListener('click', () => {
                    this.joinRoom();
                });
                
                document.getElementById('create-room-btn').addEventListener('click', () => {
                    this.createRoom();
                });
                
                // ÉVÉNEMENTS POUR FERMER LE MODAL
                document.getElementById('cancel-room-btn').addEventListener('click', () => {
                    this.hideRoomModal();
                });
        
                document.getElementById('close-modal-btn').addEventListener('click', () => {
                    this.hideRoomModal();
                });
        
                // Fermer en cliquant à l'extérieur
                document.getElementById('room-modal').addEventListener('click', (e) => {
                    if (e.target === document.getElementById('room-modal')) {
                        this.hideRoomModal();
                    }
                });
        
                // Fermer avec la touche Échap
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && document.getElementById('room-modal').style.display === 'flex') {
                        this.hideRoomModal();
                    }
                });
                
                document.getElementById('leave-room-btn').addEventListener('click', () => {
                    this.leaveRoom();
                });
                
                document.getElementById('start-party-btn').addEventListener('click', () => {
                    this.startCookieParty();
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
                
                this.updateLeaderboard([]);
                this.hideRoomModal();
                this.showNotification('Vous avez quitté la salle', 'var(--neon-pink)');
            }
            
            handleRoomJoined(data) {
                this.currentRoom = data.room;
                this.currentPlayer = data.player;
                this.players = data.players;
                
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
                this.showNotification(`${data.playerName} a gagné ${data.cookiesEarned} cookies!`, 'var(--neon-blue)');
            }
            
            showUpgradeBought(data) {
                this.showNotification(`${data.playerName} a acheté ${data.upgrade} pour ${data.cost} cookies!`, 'var(--neon-purple)');
            }
            
            triggerGoldenCookieEvent() {
                this.showNotification('🎉 COOKIE DORÉ MULTIJOUEUR! Bonus activé!', 'gold');
                creerCookieDore();
            }
            
            startCookieParty() {
                if (!this.connected || !this.currentRoom) return;
                
                this.socket.emit('start-cookie-party');
                this.showNotification('🎊 FÊTE DES COOKIES LANÇÉE!', 'var(--neon-yellow)');
                
                // Effet visuel de fête
                for (let i = 0; i < 20; i++) {
                    setTimeout(() => {
                        this.createPartyParticle();
                    }, i * 100);
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
        const btnGrandma = document.getElementById("upgrade-grandma");
        const coutGrandma = document.getElementById("grandma-cost");
        const btnBakery = document.getElementById("upgrade-bakery");
        const coutBakery = document.getElementById("bakery-cost");
        const btnLuckyCookie = document.getElementById("upgrade-lucky-cookie");
        const coutLuckyCookie = document.getElementById("lucky-cookie-cost");
        const btnGoldenCookie = document.getElementById("upgrade-golden-cookie");
        const coutGoldenCookie = document.getElementById("golden-cookie-cost");
        
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
        let luckyCookieActive = false;
        let goldenCookieActive = false;
        let megaClickChance = 0;
        
        // Coûts des améliorations
        const couts = {
            autoClick: 25,
            clickPower: 15,
            megaClick: 100,
            grandma: 100,
            bakery: 500,
            luckyCookie: 250,
            goldenCookie: 1000
        };
        
        // Mise à jour des coûts affichés
        coutAuto.textContent = couts.autoClick;
        coutClic.textContent = couts.clickPower;
        coutMegaClic.textContent = couts.megaClick;
        coutGrandma.textContent = couts.grandma;
        coutBakery.textContent = couts.bakery;
        coutLuckyCookie.textContent = couts.luckyCookie;
        coutGoldenCookie.textContent = couts.goldenCookie;
        
        // Gestion du clic sur le cookie
        cookieCible.addEventListener("click", () => {
            let cookiesGagnes = puissanceClic;
            
            // Chance de méga-clic
            if (megaClickChance > 0 && Math.random() < megaClickChance) {
                cookiesGagnes *= 10;
                afficherEffetSpecial("MÉGA-CLIC! x10", "var(--neon-yellow)");
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
                luckyCookieActive,
                goldenCookieActive,
                megaClickChance,
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
                luckyCookieActive = gameState.luckyCookieActive;
                goldenCookieActive = gameState.goldenCookieActive;
                megaClickChance = gameState.megaClickChance;
                
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
                luckyCookieActive = false;
                goldenCookieActive = false;
                megaClickChance = 0;
                
                // Réinitialiser les coûts
                couts.autoClick = 25;
                couts.clickPower = 15;
                couts.megaClick = 100;
                couts.grandma = 100;
                couts.bakery = 500;
                couts.luckyCookie = 250;
                couts.goldenCookie = 1000;
                
                // Réinitialiser l'interface
                mettreAJourAffichage();
                verifierAmeliorations();
                
                // Réinitialiser les boutons d'améliorations
                btnLuckyCookie.disabled = false;
                btnLuckyCookie.innerHTML = `
                    <div class="upgrade-info">
                        <div class="upgrade-name">Cookie chanceux</div>
                        <div class="upgrade-description">Chance de cookies bonus</div>
                    </div>
                    <div class="upgrade-cost">Coût: <span id="lucky-cookie-cost">250</span></div>
                `;
                
                btnGoldenCookie.disabled = false;
                btnGoldenCookie.innerHTML = `
                    <div class="upgrade-info">
                        <div class="upgrade-name">Cookie doré</div>
                        <div class="upgrade-description">Apparition de cookies bonus</div>
                    </div>
                    <div class="upgrade-cost">Coût: <span id="golden-cookie-cost">1000</span></div>
                `;
                
                afficherNotification("Partie réinitialisée!");
            }
        });
        
        // Mettre à jour l'affichage
        function mettreAJourAffichage() {
            affichageScore.textContent = Math.floor(score);
            affichageCookiesTotaux.textContent = Math.floor(totalCookies);
            affichageClicsParSec.textContent = autoPowerClick + (grandmas * 5) + (bakeries * 25);
            affichageCookiesParClic.textContent = puissanceClic;
            affichagePuissanceClic.textContent = puissanceClic;
            affichageNiveau.textContent = niveau;
            
            // Mettre à jour le score multijoueur
            if (window.multiplayerClient) {
                window.multiplayerClient.updatePlayerScore({
                    score: score,
                    level: niveau,
                    cookiesPerClick: puissanceClic,
                    autoCookies: autoPowerClick + (grandmas * 5) + (bakeries * 25)
                });
            }
        }
        
        // Vérifier quelles améliorations sont disponibles
        function verifierAmeliorations() {
            btnAmeliorationAuto.disabled = score < couts.autoClick;
            btnAmeliorationClic.disabled = score < couts.clickPower;
            btnMegaClic.disabled = score < couts.megaClick;
            btnGrandma.disabled = score < couts.grandma;
            btnBakery.disabled = score < couts.bakery;
            btnLuckyCookie.disabled = score < couts.luckyCookie || luckyCookieActive;
            btnGoldenCookie.disabled = score < couts.goldenCookie || goldenCookieActive;
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
            const gainsAuto = autoPowerClick + (grandmas * 5) + (bakeries * 25);
            score += gainsAuto;
            totalCookies += gainsAuto;
            mettreAJourAffichage();
            verifierAmeliorations();
            verifierNiveau();
        }, 1000);
        
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