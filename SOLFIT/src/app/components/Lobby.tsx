import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Crown, CheckCircle2, CircleDashed, LogOut, Play, UserPlus, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { PlayerAvatar } from './PlayerAvatar';

export default function Lobby() {
  const navigate = useNavigate();
  const { room, socket, isHost, playerId, leaveRoom } = useGame();

  // Redirect if no room
  useEffect(() => {
    if (!room) {
      navigate('/');
    }
  }, [room, navigate]);

  // Non-host: listen for host starting the game
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      navigate('/gameplay');
    };
    socket.on('game-start', handler);
    return () => { socket.off('game-start', handler); };
  }, [socket, navigate]);

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  const handleStartGame = () => {
    navigate('/game-settings');
  };

  const copyCode = () => {
    if (room?.code) navigator.clipboard.writeText(room.code);
  };

  if (!room) return null;

  const allReady = room.players.every(p => p.isReady);

  return (
    <div className="size-full flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      <div className="w-full max-w-[390px] h-full flex flex-col p-6 relative">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <button
            onClick={handleLeave}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5"
          >
            <LogOut className="w-5 h-5 text-white/60" />
          </button>

          <div className="text-center">
            <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">{room.teamName}</h1>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b794f6] animate-pulse" />
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                {room.gameType} Challenge
              </span>
            </div>
          </div>

          <div
            onClick={() => navigate('/friends')}
            className="w-10 h-10 rounded-full bg-[#b794f6]/10 flex items-center justify-center border border-[#b794f6]/20 cursor-pointer hover:bg-[#b794f6]/20 transition-all active:scale-95 group"
          >
            <UserPlus className="w-5 h-5 text-[#b794f6] group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Invite code chip */}
        <button
          onClick={copyCode}
          className="flex items-center gap-2 mx-auto mb-6 bg-white/5 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/10 transition-all active:scale-95"
        >
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Code:</span>
          <span className="text-sm font-black text-[#b794f6] tracking-[0.1em]">{room.code}</span>
          <Copy className="w-3 h-3 text-white/30" />
        </button>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
          <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4 ml-1">
            Squad Members ({room.players.length}/6)
          </h2>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {room.players.map(player => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                    player.isReady
                      ? 'bg-gradient-to-r from-white/10 to-white/5 border-white/10'
                      : 'bg-white/5 border-dashed border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <PlayerAvatar
                        name={player.name}
                        size={48}
                        className="rounded-xl"
                        borderColor={player.id === playerId ? '#b794f6' : undefined}
                      />
                      {player.isHost && (
                        <div className="absolute -top-1.5 -left-1.5 bg-[#b794f6] rounded-lg p-1 shadow-[0_0_10px_rgba(183,148,246,0.4)] border border-white/20">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold tracking-tight ${player.id === playerId ? 'text-[#b794f6]' : 'text-white'}`}>
                          {player.name}{player.id === playerId ? ' (You)' : ''}
                        </span>
                        {player.isHost && (
                          <span className="text-[9px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border border-white/5">
                            Host
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {player.isReady ? (
                      <div className="bg-[#b794f6]/20 px-2 py-1 rounded-lg flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-[#b794f6]" />
                        <span className="text-[10px] text-[#b794f6] font-black uppercase">Ready</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg">
                        <CircleDashed className="w-3 h-3 text-white/20 animate-spin" />
                        <span className="text-[10px] text-white/20 font-black uppercase tracking-tighter">Waiting</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="pt-4 pb-6 space-y-4 bg-[#0a0a0f]">
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#b794f6] animate-ping" />
            <span className="text-[11px] font-bold text-[#b794f6] uppercase tracking-widest italic">
              {allReady ? 'All players ready!' : 'Waiting for squad...'}
            </span>
          </div>

          {isHost ? (
            <button
              onClick={handleStartGame}
              className="w-full relative group bg-gradient-to-r from-[#b794f6] to-[#8b5cf6] rounded-2xl py-5 px-6 font-black text-lg text-white uppercase italic tracking-tighter transition-all duration-300 active:scale-[0.98] shadow-[0_10px_40px_rgba(183,148,246,0.4)]"
            >
              <div className="flex items-center justify-center gap-3">
                <Play className="w-5 h-5 fill-white" />
                <span>Configure & Start</span>
              </div>
            </button>
          ) : (
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 flex items-center justify-center gap-3">
              <CircleDashed className="w-5 h-5 text-white/20 animate-spin" />
              <span className="text-white/40 font-bold uppercase italic tracking-tighter">
                Waiting for host to start...
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
