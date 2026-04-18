import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Copy, Check, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useGame } from '../../context/GameContext';

type GameType = 'Pushup' | 'Squat' | 'Plank';

export default function CreateTeam() {
  const navigate = useNavigate();
  const { createRoom, playerName } = useGame();
  const [teamName, setTeamName] = useState('');
  const [gameType, setGameType] = useState<GameType>('Pushup');
  const [inviteCode, setInviteCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!teamName.trim()) return;
    setIsGenerating(true);
    setError('');
    try {
      const room = await createRoom(teamName.trim(), gameType);
      setInviteCode(room.code);
    } catch {
      setError('Could not reach server. Is it running?');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="size-full flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      <div className="w-full max-w-[390px] h-full flex flex-col p-6 relative">

        {/* Header */}
        <div className="flex items-center justify-between mb-10 pt-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black italic text-white tracking-tighter uppercase">Create Team</h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pb-6">
          {/* Host info */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-[#b794f6]" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Host:</span>
            <span className="text-sm font-bold text-white">{playerName || 'Unknown'}</span>
          </div>

          {/* Team Name Input */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">
              Team Designation
            </label>
            <input
              type="text"
              placeholder="e.g. ALPHA SQUAD"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              disabled={!!inviteCode}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white placeholder:text-white/20 focus:outline-none focus:border-[#b794f6]/50 focus:bg-white/10 transition-all text-lg font-bold disabled:opacity-50"
            />
          </div>

          {/* Game Type Selector */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">
              Protocol Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Pushup', 'Squat', 'Plank'] as GameType[]).map(type => (
                <button
                  key={type}
                  onClick={() => !inviteCode && setGameType(type)}
                  disabled={!!inviteCode}
                  className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:cursor-default ${
                    gameType === type
                      ? 'bg-[#b794f6] text-white shadow-[0_4px_15px_rgba(183,148,246,0.3)]'
                      : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Code Generation */}
          <div className="space-y-4">
            {!inviteCode ? (
              <>
                <button
                  onClick={handleGenerate}
                  disabled={!teamName.trim() || isGenerating}
                  className="w-full bg-white/5 border border-dashed border-white/20 rounded-2xl py-6 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-[#b794f6]/30 border-t-[#b794f6] rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5 text-[#b794f6] group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-[10px] font-black text-[#b794f6] uppercase tracking-[0.2em]">
                    {isGenerating ? 'Creating Room...' : 'Generate Invite Code'}
                  </span>
                </button>
                {error && (
                  <p className="text-center text-[10px] font-bold text-red-400 uppercase tracking-widest">{error}</p>
                )}
              </>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#b794f6]/20 rounded-[24px] blur-xl" />
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-[#b794f6]/30 rounded-[24px] p-6 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] block mb-1">
                      Invite Code
                    </span>
                    <div className="text-3xl font-black text-white tracking-[0.1em] italic">{inviteCode}</div>
                    <span className="text-[9px] font-bold text-[#b794f6]/60 uppercase tracking-widest mt-1 block">
                      Share with your squad
                    </span>
                  </div>
                  <button
                    onClick={copyCode}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      isCopied ? 'bg-[#b794f6] text-white' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pb-4">
          <button
            onClick={() => navigate('/lobby')}
            disabled={!inviteCode}
            className="w-full bg-gradient-to-r from-[#b794f6] to-[#8b5cf6] rounded-2xl py-5 font-black text-lg text-white uppercase italic tracking-tighter shadow-[0_10px_40px_rgba(183,148,246,0.4)] active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            Continue to Lobby
          </button>
        </div>

      </div>
    </div>
  );
}
