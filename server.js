const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '.')));

// Stockage des salles et joueurs
const rooms = new Map();

// Générer un code de salle unique
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
    console.log('🔗 Nouvelle connexion:', socket.id);

    let currentPlayer = null;
    let currentRoom = null;

    // Rejoindre une salle
    socket.on('join-room', (data) => {
        const { playerName, roomCode } = data;
        let room = rooms.get(roomCode);

        // Créer la salle si elle n'existe pas
        if (!room) {
            room = {
                code: roomCode,
                players: [],
                host: socket.id,
                events: {
                    activeParty: false,
                    activeBoost: false,
                    activeChallenge: false,
                    challengeScores: {},
                    challengeEndTime: 0
                }
            };
            rooms.set(roomCode, room);
        }

        // Vérifier si la salle est pleine
        if (room.players.length >= 8) {
            socket.emit('room-full');
            return;
        }

        // Créer le joueur
        const player = {
            id: socket.id,
            name: playerName,
            score: 0,
            level: 1,
            cookiesPerClick: 1,
            autoCookies: 0,
            isHost: socket.id === room.host
        };

        // Ajouter le joueur à la salle
        room.players.push(player);
        currentPlayer = player;
        currentRoom = roomCode;

        // Rejoindre la room Socket.io
        socket.join(roomCode);

        // Envoyer les données de la salle au joueur
        socket.emit('room-joined', {
            room: roomCode,
            player: player,
            players: room.players
        });

        // Informer les autres joueurs
        socket.to(roomCode).emit('player-joined', player);
        
        // Mettre à jour le classement pour tous
        io.to(roomCode).emit('leaderboard-update', room.players);

        console.log(`🎮 ${playerName} a rejoint la salle ${roomCode}`);
    });

    // Mettre à jour le score
    socket.on('update-score', (data) => {
        if (!currentRoom || !currentPlayer) return;

        const room = rooms.get(currentRoom);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.score = data.score;
            player.level = data.level;
            player.cookiesPerClick = data.cookiesPerClick;
            player.autoCookies = data.autoCookies;

            // Mettre à jour le classement
            io.to(currentRoom).emit('leaderboard-update', room.players);

            // Mettre à jour les scores du défi si actif
            if (room.events.activeChallenge) {
                room.events.challengeScores[player.name] = data.score;
                io.to(currentRoom).emit('challenge-update', {
                    scores: room.events.challengeScores
                });
            }
        }
    });

    // Clic du joueur
    socket.on('player-click', (data) => {
        if (!currentRoom || !currentPlayer) return;
        
        socket.to(currentRoom).emit('player-clicked', {
            playerName: currentPlayer.name,
            cookiesEarned: data.cookiesEarned
        });
    });

    // Achat d'amélioration
    socket.on('buy-upgrade', (data) => {
        if (!currentRoom || !currentPlayer) return;
        
        socket.to(currentRoom).emit('upgrade-bought', {
            playerName: currentPlayer.name,
            upgrade: data.upgrade,
            cost: data.cost
        });
    });

    // ============================
    // ÉVÉNEMENTS MULTIJOUEURS CORRIGÉS
    // ============================

    // Fête des cookies
    socket.on('start-cookie-party', () => {
        if (!currentRoom) return;

        const room = rooms.get(currentRoom);
        if (!room || room.events.activeParty) return;

        room.events.activeParty = true;
        io.to(currentRoom).emit('cookie-party-started');

        // Désactiver après 10 secondes
        setTimeout(() => {
            room.events.activeParty = false;
        }, 10000);

        console.log(`🎉 Fête des cookies dans la salle ${currentRoom}`);
    });

    // Boost multijoueur
    socket.on('start-multiplayer-boost', () => {
        if (!currentRoom) return;

        const room = rooms.get(currentRoom);
        if (!room || room.events.activeBoost) return;

        room.events.activeBoost = true;
        io.to(currentRoom).emit('multiplayer-boost-started');

        // Désactiver après 30 secondes
        setTimeout(() => {
            room.events.activeBoost = false;
        }, 30000);

        console.log(`🚀 Boost multijoueur dans la salle ${currentRoom}`);
    });

    // Cadeau collectif
    socket.on('distribute-gift', () => {
        if (!currentRoom) return;

        const room = rooms.get(currentRoom);
        if (!room) return;

        io.to(currentRoom).emit('gift-distributed');
        console.log(`🎁 Cadeau distribué dans la salle ${currentRoom}`);
    });

    // Défi rapide
    socket.on('start-challenge', (data) => {
        if (!currentRoom) return;

        const room = rooms.get(currentRoom);
        if (!room || room.events.activeChallenge) return;

        room.events.activeChallenge = true;
        room.events.challengeScores = {};
        room.events.challengeEndTime = Date.now() + (data.duration * 1000);

        // Initialiser les scores du défi
        room.players.forEach(player => {
            room.events.challengeScores[player.name] = player.score;
        });

        io.to(currentRoom).emit('challenge-started', {
            duration: data.duration
        });

        console.log(`🏁 Défi commencé dans la salle ${currentRoom}`);

        // Timer pour la fin du défi
        setTimeout(() => {
            if (!room.events.activeChallenge) return;

            room.events.activeChallenge = false;
            
            // Déterminer le gagnant
            let winner = null;
            let highestScore = -1;

            room.players.forEach(player => {
                const challengeScore = player.score - (room.events.challengeScores[player.name] || player.score);
                if (challengeScore > highestScore) {
                    highestScore = challengeScore;
                    winner = player;
                }
            });

            io.to(currentRoom).emit('challenge-ended', {
                winner: winner
            });

            console.log(`🏆 Défi terminé dans la salle ${currentRoom}, gagnant: ${winner?.name}`);
        }, data.duration * 1000);
    });

    // Progression du défi
    socket.on('challenge-progress', (data) => {
        if (!currentRoom || !currentPlayer) return;

        const room = rooms.get(currentRoom);
        if (!room || !room.events.activeChallenge) return;

        // Le score est déjà mis à jour via update-score
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log('🔌 Déconnexion:', socket.id);

        if (currentRoom && currentPlayer) {
            const room = rooms.get(currentRoom);
            if (room) {
                // Retirer le joueur de la salle
                room.players = room.players.filter(p => p.id !== socket.id);

                // Si la salle est vide, la supprimer
                if (room.players.length === 0) {
                    rooms.delete(currentRoom);
                } else {
                    // Mettre à jour le classement
                    io.to(currentRoom).emit('player-left', {
                        players: room.players
                    });
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎯 Serveur Cookie Clicker Multijoueur démarré sur le port ${PORT}`);
    console.log(`📍 Accédez au jeu sur: http://localhost:${PORT}`);
});