import { Play, UserPlus, LogOut, Zap, Trophy, TrendingUp, Users, Flame } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { getAvatarColor, getInitials } from '../../lib/avatar';

function UserAvatar({ name, picture }: { name: string; picture: string }) {
  if (picture) {
    return <img src={picture} alt={name} className="w-12 h-12 rounded-2xl object-cover border-2 border-[#b794f6]/40" />;
  }
  const color = getAvatarColor(name);
  return (
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm border-2"
      style={{ backgroundColor: color + '30', borderColor: color + '60' }}
    >
      {getInitials(name)}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { playerName, userPicture, stats, logout } = useGame();
  const gameRecord = Math.max(stats.pushupRecord, stats.squatRecord, stats.plankRecord);

  return (
    <div className="min-h-full bg-[#0a0a0f] overflow-y-auto">
      <div className="w-full max-w-[390px] md:max-w-4xl mx-auto flex flex-col p-6 md:p-10 relative min-h-full">

        {/* Ambient Glows */}
        <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] bg-[#b794f6]/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-[-5%] w-[250px] h-[250px] bg-[#b794f6]/4 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-10 pt-4 relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#b794f6] uppercase tracking-[0.3em]">Welcome Back</span>
            <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase">{playerName}</h1>
          </div>
          {/* Mobile-only user controls (desktop uses sidebar) */}
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => navigate('/friends')}>
              <UserAvatar name={playerName} picture={userPicture} />
            </button>
            <button
              onClick={logout}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Desktop: 2-col grid ─────────────────────────── */}
        <div className="md:grid md:grid-cols-2 md:gap-8 md:items-start space-y-8 md:space-y-0 relative z-10">

          {/* Left col: Main card + action grid */}
          <div className="space-y-6">
            {/* Launch Squad card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative group cursor-pointer"
              onClick={() => navigate('/create-team')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#b794f6] to-[#8b5cf6] rounded-[32px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative bg-gradient-to-br from-[#b794f6] to-[#8b5cf6] rounded-[32px] p-8 overflow-hidden shadow-[0_20px_50px_rgba(183,148,246,0.3)]">
                <div className="absolute top-0 right-0 p-4">
                  <Zap className="w-20 h-20 text-white/10 -rotate-12" />
                </div>
                <div className="relative z-10">
                  <div className="bg-white/20 w-fit px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-4 backdrop-blur-md">
                    Active Challenges
                  </div>
                  <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">
                    Launch<br />Squad
                  </h2>
                  <p className="text-white/70 text-sm font-medium mb-6 max-w-[200px]">
                    Create a team and compete for SOL rewards.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#b794f6]">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-white font-black uppercase text-xs tracking-widest">Start Now</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action grid */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                onClick={() => navigate('/join-team')}
                className="bg-white/5 border border-white/5 rounded-[24px] p-5 cursor-pointer active:scale-95 transition-all hover:bg-white/10"
              >
                <div className="w-10 h-10 rounded-xl bg-[#b794f6]/10 flex items-center justify-center mb-4">
                  <UserPlus className="w-5 h-5 text-[#b794f6]" />
                </div>
                <h3 className="text-white font-black italic uppercase text-sm tracking-tighter">Join Team</h3>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">Enter Code</p>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                onClick={() => navigate('/friends')}
                className="bg-white/5 border border-white/5 rounded-[24px] p-5 cursor-pointer active:scale-95 transition-all hover:bg-white/10"
              >
                <div className="w-10 h-10 rounded-xl bg-[#b794f6]/10 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-[#b794f6]" />
                </div>
                <h3 className="text-white font-black italic uppercase text-sm tracking-tighter">My Squad</h3>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">
                  {stats.wins} Win{stats.wins !== 1 ? 's' : ''}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Right col: Stats (always shown on mobile; shown on desktop too since sidebar is compact) */}
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Your Performance</h4>
              <div className="space-y-3">
                {[
                  { icon: TrendingUp, label: 'Best Rep Count', value: gameRecord || '—' },
                  { icon: Trophy, label: 'Total SOL Won', value: stats.totalSolWon > 0 ? `◎ ${stats.totalSolWon.toFixed(3)}` : '◎ 0.000', highlight: true },
                  { icon: Flame, label: 'Games Played', value: stats.gamesPlayed },
                  { icon: Zap, label: 'Wins', value: stats.wins },
                ].map(({ icon: Icon, label, value, highlight }) => (
                  <div key={label} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#b794f6]/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-[#b794f6]" />
                      </div>
                      <span className="text-sm font-bold text-white/80">{label}</span>
                    </div>
                    <span className={`text-lg font-black italic ${highlight ? 'text-[#b794f6]' : 'text-white'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Network status */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/3 border border-white/5 rounded-2xl">
              <div className="text-[10px] font-black text-[#b794f6] uppercase tracking-[0.2em]">
                {stats.gamesPlayed} Game{stats.gamesPlayed !== 1 ? 's' : ''} Played
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#b794f6] animate-pulse" />
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Online</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
