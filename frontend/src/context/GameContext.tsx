import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { io, Socket } from 'socket.io-client';
import { BN, type Program } from '@coral-xyz/anchor';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import type { Solfit } from '../idl/solfit';
import {
  connectPhantom,
  createContest,
  disconnectPhantom,
  getJudgePubkey,
  getProgram,
  joinContest,
  type PhantomWallet,
} from '../lib/contest';

const SERVER_URL = 'http://localhost:3001';
const ESP_ID = import.meta.env.VITE_ESP_ID as string | undefined;

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  walletPubkey?: string | null;
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
  contestPda?: string | null;
}

export interface Stats {
  pushupRecord: number;
  squatRecord: number;
  plankRecord: number;
  totalSolWon: number;
  wins: number;
  gamesPlayed: number;
}

export interface PendingInvite {
  roomCode: string;
  fromUsername: string;
}

interface GameContextType {
  // Identity — sourced from Auth0
  playerName: string;
  playerId: string;
  userEmail: string;
  userPicture: string;
  // Solana wallet (Phantom)
  wallet: PhantomWallet | null;
  program: Program<Solfit> | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  // Game state
  room: Room | null;
  setRoom: (room: Room | null) => void;
  socket: Socket | null;
  isHost: boolean;
  // ESP32 rep sensor (optional; only wired if VITE_ESP_ID is set)
  espSocket: WebSocket | null;
  espConnected: boolean;
  // Incoming game invite from a friend
  pendingInvite: PendingInvite | null;
  clearPendingInvite: () => void;
  // Stats (persisted per Auth0 user)
  stats: Stats;
  updateStats: (reps: number, solWon: number, gameType: string) => void;
  // Actions
  createRoom: (opts: {
    teamName: string;
    gameType: string;
    wagerSol: number;
    maxPlayers: number;
    durationSecs: number;
  }) => Promise<Room>;
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
  const [wallet, setWallet] = useState<PhantomWallet | null>(null);
  const [espSocket, setEspSocket] = useState<WebSocket | null>(null);
  const [espConnected, setEspConnected] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);
  const clearPendingInvite = () => setPendingInvite(null);
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
  const espSocketRef = useRef<WebSocket | null>(null);

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

    s.on('game-invite', (invite: PendingInvite) => {
      setPendingInvite(invite);
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  // Open a persistent WebSocket to the ESP32 rep sensor, if one is configured.
  // If VITE_ESP_ID is unset, the integration is a no-op — MediaPipe still works.
  useEffect(() => {
    if (!ESP_ID) {
      setEspSocket(null);
      setEspConnected(false);
      return;
    }
    const ws = new WebSocket(`ws://${ESP_ID}/ws`);
    espSocketRef.current = ws;
    setEspSocket(ws);
    ws.addEventListener('open', () => setEspConnected(true));
    ws.addEventListener('close', () => setEspConnected(false));
    ws.addEventListener('error', () => setEspConnected(false));
    return () => {
      ws.close();
      setEspConnected(false);
      setEspSocket(null);
      espSocketRef.current = null;
    };
  }, []);

  // Register identity with server whenever socket or user changes
  useEffect(() => {
    if (socket && playerId !== 'guest' && playerName) {
      socket.emit('register-user', { userId: playerId, username: playerName });
    }
  }, [socket, playerId, playerName]);

  const program = useMemo(() => (wallet ? getProgram(wallet) : null), [wallet]);

  const connectWallet = useCallback(async () => {
    const w = await connectPhantom();
    setWallet(w);
  }, []);

  const disconnectWallet = useCallback(async () => {
    await disconnectPhantom();
    setWallet(null);
  }, []);

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

  const createRoom = useCallback(
    async (opts: {
      teamName: string;
      gameType: string;
      wagerSol: number;
      maxPlayers: number;
      durationSecs: number;
    }): Promise<Room> => {
      if (!wallet || !program) throw new Error('Connect Phantom wallet first');
      const walletPubkey = wallet.publicKey.toBase58();

      // 1. Create socket room.
      const res = await fetch(`${SERVER_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: opts.teamName,
          gameType: opts.gameType,
          playerName,
          playerId,
          walletPubkey,
        }),
      });
      if (!res.ok) throw new Error('Failed to create room');
      const data = await res.json();
      const newRoom = data.room as Room;
      setRoom(newRoom);
      socket?.emit('join-room', {
        code: newRoom.code,
        player: { id: playerId, name: playerName, isHost: true, isReady: true, walletPubkey },
      });

      // 2. Create on-chain contest. Judge pubkey comes from the server —
      //    the same server that will sign final scores at game end.
      const judgePubkey = await getJudgePubkey();
      const idBytes = new Uint8Array(8);
      crypto.getRandomValues(idBytes);
      const contestId = new BN(idBytes);
      const { contestPda } = await createContest(program, {
        contestId,
        wagerLamports: new BN(Math.round(opts.wagerSol * LAMPORTS_PER_SOL)),
        maxPlayers: opts.maxPlayers,
        durationSecs: opts.durationSecs,
        judge: judgePubkey,
      });
      const pdaStr = contestPda.toBase58();
      socket?.emit('set-contest-pda', { code: newRoom.code, contestPda: pdaStr });
      setRoom(prev => (prev ? { ...prev, contestPda: pdaStr } : prev));
      return { ...newRoom, contestPda: pdaStr };
    },
    [playerName, playerId, socket, wallet, program],
  );

  const joinRoom = useCallback(
    async (code: string): Promise<Room> => {
      if (!wallet) throw new Error('Connect Phantom wallet first');
      const walletPubkey = wallet.publicKey.toBase58();
      const res = await fetch(`${SERVER_URL}/api/rooms/${code.toUpperCase()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || 'Room not found');
      }
      const existingRoom = (await res.json()) as Room;
      setRoom(existingRoom);
      socket?.emit('join-room', {
        code: code.toUpperCase(),
        player: { id: playerId, name: playerName, isHost: false, isReady: false, walletPubkey },
      });
      return existingRoom;
    },
    [playerName, playerId, socket, wallet],
  );

  // Track which contest PDA we've joined on-chain, per browser session.
  // Every player (host or joiner) needs to join once contestPda is known.
  const joinedContestRef = useRef<string | null>(null);

  useEffect(() => {
    const pda = room?.contestPda;
    if (!pda || !program || !wallet) return;
    if (joinedContestRef.current === pda) return;
    joinedContestRef.current = pda;

    (async () => {
      try {
        await joinContest(program, new PublicKey(pda));
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        // Already-joined and already-processed are both fine — we got in.
        if (msg.includes('AlreadyJoined') || msg.toLowerCase().includes('already been processed')) return;
        joinedContestRef.current = null; // allow retry on next contestPda change
        console.error('joinContest failed:', msg);
      }
    })();
  }, [room?.contestPda, program, wallet]);

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
    if (!r || !socket) return;
    // Reset the ESP's rep counter at the start of a new match, if connected.
    if (espSocketRef.current?.readyState === WebSocket.OPEN) {
      espSocketRef.current.send('RESET');
    }
    socket.emit('start-game', { code: r.code, settings });
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
      wallet, program, connectWallet, disconnectWallet,
      room, setRoom, socket, isHost,
      espSocket, espConnected,
      pendingInvite, clearPendingInvite,
      stats, updateStats,
      createRoom, joinRoom, leaveRoom,
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
