const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// In-memory room store: code -> Room
const rooms = new Map();

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calculatePrizes(players, entryFee) {
  const totalPot = entryFee * players.length * 0.95;
  return players.map((p, i) => ({
    ...p,
    prize: i === 0 ? parseFloat(totalPot.toFixed(3)) : 0,
  }));
}

// REST: Create room
app.post('/api/rooms', (req, res) => {
  const { teamName, gameType, playerName, playerId } = req.body;
  if (!teamName || !gameType || !playerName || !playerId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let code;
  do { code = generateCode(); } while (rooms.has(code));

  const room = {
    code,
    teamName,
    gameType,
    hostId: playerId,
    players: [{ id: playerId, name: playerName, isHost: true, isReady: true }],
    settings: { reps: 30, timeLimit: 60, entryFee: 0.1 },
    status: 'lobby',
    createdAt: Date.now(),
  };

  rooms.set(code, room);

  // Auto-cleanup after 2 hours
  setTimeout(() => rooms.delete(code), 2 * 60 * 60 * 1000);

  res.json({ code, room });
});

// REST: Get room by code
app.get('/api/rooms/:code', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.status === 'playing' || room.status === 'ended') {
    return res.status(409).json({ error: 'Game already in progress' });
  }
  res.json(room);
});

// Health check
app.get('/health', (_, res) => res.json({ ok: true, rooms: rooms.size }));

// Socket.io
io.on('connection', (socket) => {
  let currentRoom = null;
  let currentPlayerId = null;

  socket.on('join-room', ({ code, player }) => {
    const room = rooms.get(code);
    if (!room) { socket.emit('error', { message: 'Room not found' }); return; }

    currentRoom = code;
    currentPlayerId = player.id;
    socket.join(code);

    // Add player if not already present
    if (!room.players.find(p => p.id === player.id)) {
      if (room.players.length >= 6) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }
      room.players.push({ ...player, isHost: false, isReady: false });
    }

    io.to(code).emit('lobby-update', room);
  });

  socket.on('player-ready', ({ code, playerId }) => {
    const room = rooms.get(code);
    if (!room) return;
    room.players = room.players.map(p =>
      p.id === playerId ? { ...p, isReady: true } : p
    );
    io.to(code).emit('lobby-update', room);
  });

  socket.on('update-settings', ({ code, settings }) => {
    const room = rooms.get(code);
    if (!room) return;
    room.settings = { ...room.settings, ...settings };
    io.to(code).emit('settings-update', room.settings);
  });

  socket.on('start-game', ({ code, settings }) => {
    const room = rooms.get(code);
    if (!room) return;
    if (settings) room.settings = { ...room.settings, ...settings };
    room.status = 'playing';
    room.startedAt = Date.now();
    io.to(code).emit('game-start', { settings: room.settings, players: room.players, startedAt: room.startedAt });
  });

  socket.on('rep-update', ({ code, playerId, count }) => {
    // Broadcast to everyone else in the room
    socket.to(code).emit('rep-update', { playerId, count });
  });

  socket.on('game-end', ({ code, results }) => {
    const room = rooms.get(code);
    if (!room) return;
    room.status = 'ended';
    const withPrizes = calculatePrizes(results, room.settings.entryFee);
    io.to(code).emit('game-end', withPrizes);
  });

  socket.on('leave-room', ({ code, playerId }) => {
    const room = rooms.get(code);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== playerId);
    socket.leave(code);
    if (room.players.length === 0) {
      rooms.delete(code);
    } else {
      // Transfer host if host left
      if (room.hostId === playerId && room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
      }
      io.to(code).emit('lobby-update', room);
    }
    currentRoom = null;
  });

  socket.on('disconnect', () => {
    if (!currentRoom || !currentPlayerId) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== currentPlayerId);
    if (room.players.length === 0) {
      rooms.delete(currentRoom);
    } else {
      if (room.hostId === currentPlayerId) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
      }
      io.to(currentRoom).emit('lobby-update', room);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`SOLFIT server running on http://localhost:${PORT}`);
});
