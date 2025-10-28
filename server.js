const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static(__dirname));

// Servir n'importe quel fichier HTML présent
app.get('/', (req, res) => {
  const fs = require('fs');
  const files = fs.readdirSync(__dirname);
  const htmlFiles = files.filter(file => file.endsWith('.html'));
  
  if (htmlFiles.length > 0) {
    res.sendFile(path.join(__dirname, htmlFiles[0]));
  } else {
    res.send('Aucun fichier HTML trouvé dans le dossier');
  }
});

// Stockage des salles et joueurs
const rooms = new Map();
const players = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log('Nouveau joueur connecté:', socket.id);

  socket.on('join-room', (data) => {
    const { playerName, roomCode } = data;
    let room = rooms.get(roomCode);

    if (!room) {
      room = {
        code: roomCode,
        players: [],
        createdAt: new Date(),
        host: socket.id
      };
      rooms.set(roomCode, room);
    }

    if (room.players.length >= 8) {
      socket.emit('room-full');
      return;
    }

    const player = {
      id: socket.id,
      name: playerName || `Joueur${room.players.length + 1}`,
      score: 0,
      level: 1,
      cookiesPerClick: 1,
      autoCookies: 0,
      joinTime: new Date(),
      isHost: socket.id === room.host
    };

    room.players.push(player);
    players.set(socket.id, { ...player, roomCode });
    socket.join(roomCode);

    socket.emit('room-joined', {
      room: roomCode,
      player: player,
      players: room.players
    });

    socket.to(roomCode).emit('player-joined', player);
    console.log(`Joueur ${playerName} a rejoint ${roomCode}`);
  });

  socket.on('update-score', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    player.score = data.score;
    player.level = data.level;
    player.cookiesPerClick = data.cookiesPerClick;
    player.autoCookies = data.autoCookies;

    const room = rooms.get(player.roomCode);
    if (room) {
      const roomPlayer = room.players.find(p => p.id === socket.id);
      if (roomPlayer) {
        roomPlayer.score = data.score;
        roomPlayer.level = data.level;
        roomPlayer.cookiesPerClick = data.cookiesPerClick;
        roomPlayer.autoCookies = data.autoCookies;
      }
      io.to(player.roomCode).emit('leaderboard-update', room.players);
    }
  });

  socket.on('player-click', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    socket.to(player.roomCode).emit('player-clicked', {
      playerId: socket.id,
      playerName: player.name,
      cookiesEarned: data.cookiesEarned
    });
  });

  socket.on('buy-upgrade', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    socket.to(player.roomCode).emit('upgrade-bought', {
      playerId: socket.id,
      playerName: player.name,
      upgrade: data.upgrade,
      cost: data.cost
    });
  });

  socket.on('start-cookie-party', () => {
    const player = players.get(socket.id);
    if (!player) return;

    const room = rooms.get(player.roomCode);
    if (room && room.host === socket.id) {
      io.to(player.roomCode).emit('cookie-party-started');
    }
  });

  socket.on('disconnect', () => {
    console.log('Joueur déconnecté:', socket.id);
    const player = players.get(socket.id);
    if (player) {
      const room = rooms.get(player.roomCode);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(player.roomCode);
        } else {
          if (room.host === socket.id) {
            room.host = room.players[0].id;
            room.players[0].isHost = true;
          }
          socket.to(player.roomCode).emit('player-left', {
            playerId: socket.id,
            players: room.players
          });
        }
      }
      players.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Serveur multijoueur démarré sur le port ${PORT}`);
  console.log(`📍 Connectez-vous via: http://localhost:${PORT}`);
  console.log(`📁 Dossier: ${__dirname}`);
});