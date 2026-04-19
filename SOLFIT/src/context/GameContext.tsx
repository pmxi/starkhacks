import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
}

export interface GameSettings {
  reps: number;
  timeLimit: number;
  entryFee: number;
}

export interface Room {
  code: string;
  teamName: string;
  gameType: string;
  hostId: string;
  players: Player[];
  settings: GameSettings;
  status: 'lobby' | 'playing' | 'ended';
}

export interface Stats {
  pushupRecord: number;
  squatRecord: number;
  plankRecord: number;
  totalSolWon: number;
  wins: number;
  gamesPlayed: number;
}

interface GameContextType {
  // Identity — sourced from Auth0
  playerName: string;
  playerId: string;
  userEmail: string;
  userPicture: string;
  // Game state
  room: Room | null;
  setRoom: (room: Room | null) => void;
  socket: Socket | null;
  isHost: boolean;
  // Stats (persisted per Auth0 user)
  stats: Stats;
  updateStats: (reps: number, solWon: number, gameType: string) => void;
  // Actions
  createRoom: (teamName: string, gameType: string) => Promise<Room>;
  joinRoom: (code: string) => Promise<Room>;
  leaveRoom: () => void;
  emitSettings: (settings: GameSettings) => void;
  emitStartGame: (settings: GameSettings) => void;
  emitRepUpdate: (count: number) => void;
  emitGameEnd: (results: Array<{ id: string; name: string; count: number; isYou: boolean }>) => void;
  logout: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

const DEFAULT_STATS: Stats = {
  pushupRecord: 0,
  squatRecord: 0,
  plankRecord: 0,
  totalSolWon: 0,
  wins: 0,
  gamesPlayed: 0,
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user, logout: auth0Logout } = useAuth0();

  // Derive stable identity from Auth0 user
  // user.sub is the unique identifier (e.g. "auth0|64abc...")
  // user.nickname is the chosen username when Requires Username is enabled
  const playerId = user?.sub ?? 'guest';
  const playerName = user?.nickname || user?.name?.split('@')[0] || 'Player';
  const userEmail = user?.email ?? '';
  const userPicture = user?.picture ?? '';

  const statsKey = `solfit_stats_${playerId}`;

  const [room, setRoom] = useState<Room | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<Stats>(() => {
    try {
      const stored = localStorage.getItem(statsKey);
      return stored ? { ...DEFAULT_STATS, ...JSON.parse(stored) } : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  const roomRef = useRef<Room | null>(room);
  roomRef.current = room;

  // Reload stats if user changes (different player logs in)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(statsKey);
      setStats(stored ? { ...DEFAULT_STATS, ...JSON.parse(stored) } : DEFAULT_STATS);
    } catch {
      setStats(DEFAULT_STATS);
    }
  }, [statsKey]);

  // Initialize socket once
  useEffect(() => {
    const s = io(SERVER_URL, { reconnection: true, reconnectionDelay: 1000 });

    s.on('lobby-update', (updatedRoom: Room) => {
      setRoom(updatedRoom);
    });

    s.on('settings-update', (settings: GameSettings) => {
      setRoom(prev => prev ? { ...prev, settings } : prev);
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  // Register identity with server whenever socket or user changes
  useEffect(() => {
    if (socket && playerId !== 'guest' && playerName) {
      socket.emit('register-user', { userId: playerId, username: playerName });
    }
  }, [socket, playerId, playerName]);

  const updateStats = useCallback((reps: number, solWon: number, gameType: string) => {
    setStats(prev => {
      const recordKey = (gameType.toLowerCase() + 'Record') as keyof Stats;
      const currentRecord = typeof prev[recordKey] === 'number' ? prev[recordKey] as number : 0;
      const newStats: Stats = {
        ...prev,
        totalSolWon: parseFloat((prev.totalSolWon + solWon).toFixed(3)),
        gamesPlayed: prev.gamesPlayed + 1,
        wins: solWon > 0 ? prev.wins + 1 : prev.wins,
        [recordKey]: Math.max(currentRecord, reps),
      };
      localStorage.setItem(statsKey, JSON.stringify(newStats));
      return newStats;
    });
  }, [statsKey]);

  const createRoom = useCallback(async (teamName: string, gameType: string): Promise<Room> => {
    const res = await fetch(`${SERVER_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, gameType, playerName, playerId }),
    });
    if (!res.ok) throw new Error('Failed to create room');
    const data = await res.json();
    const newRoom = data.room as Room;
    setRoom(newRoom);
    socket?.emit('join-room', {
      code: newRoom.code,
      player: { id: playerId, name: playerName, isHost: true, isReady: true },
    });
    return newRoom;
  }, [playerName, playerId, socket]);

  const joinRoom = useCallback(async (code: string): Promise<Room> => {
    const res = await fetch(`${SERVER_URL}/api/rooms/${code.toUpperCase()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || 'Room not found');
    }
    const existingRoom = await res.json() as Room;
    setRoom(existingRoom);
    socket?.emit('join-room', {
      code: code.toUpperCase(),
      player: { id: playerId, name: playerName, isHost: false, isReady: false },
    });
    return existingRoom;
  }, [playerName, playerId, socket]);

  const leaveRoom = useCallback(() => {
    const r = roomRef.current;
    if (r && socket) socket.emit('leave-room', { code: r.code, playerId });
    setRoom(null);
  }, [playerId, socket]);

  const emitSettings = useCallback((settings: GameSettings) => {
    const r = roomRef.current;
    if (r && socket) {
      socket.emit('update-settings', { code: r.code, settings });
      setRoom(prev => prev ? { ...prev, settings } : prev);
    }
  }, [socket]);

  const emitStartGame = useCallback((settings: GameSettings) => {
    const r = roomRef.current;
    if (r && socket) socket.emit('start-game', { code: r.code, settings });
  }, [socket]);

  const emitRepUpdate = useCallback((count: number) => {
    const r = roomRef.current;
    if (r && socket) socket.emit('rep-update', { code: r.code, playerId, count });
  }, [playerId, socket]);

  const emitGameEnd = useCallback((results: Array<{ id: string; name: string; count: number; isYou: boolean }>) => {
    const r = roomRef.current;
    if (r && socket) socket.emit('game-end', { code: r.code, results });
  }, [socket]);

  const logout = useCallback(() => {
    leaveRoom();
    auth0Logout({ logoutParams: { returnTo: window.location.origin + '/auth' } });
  }, [leaveRoom, auth0Logout]);

  const isHost = room?.players.find(p => p.id === playerId)?.isHost ?? false;

  return (
    <GameContext.Provider value={{
      playerName, playerId, userEmail, userPicture,
      room, setRoom, socket, isHost, stats,
      updateStats, createRoom, joinRoom, leaveRoom,
      emitSettings, emitStartGame, emitRepUpdate, emitGameEnd,
      logout,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
