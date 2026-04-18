import { Outlet, useLocation, useNavigate } from 'react-router';
import { Home, Plus, UserPlus, Users, LogOut, Zap, Trophy, TrendingUp, Flame } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getAvatarColor, getInitials } from '../../lib/avatar';

const NAV = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Create Team', path: '/create-team', icon: Plus },
  { label: 'Join Team', path: '/join-team', icon: UserPlus },
  { label: 'Friends', path: '/friends', icon: Users },
];

export default function AppLayout() {
  const { playerName, userPicture, userEmail, stats, logout } = useGame();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const color = getAvatarColor(playerName);
  const initials = getInitials(playerName);
  const gameRecord = Math.max(stats.pushupRecord, stats.squatRecord, stats.plankRecord);

  return (
    <div className="flex h-full bg-[#0a0a0f]">

      {/* ── Sidebar (desktop only) ─────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-full border-r border-white/5 p-6 overflow-y-auto relative">

        {/* Ambient glow */}
        <div className="absolute top-0 left-0 w-full h-64 bg-[#b794f6]/4 pointer-events-none" />

        {/* Wordmark */}
        <div className="flex items-center gap-3 mb-10 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#b794f6] to-[#8b5cf6] flex items-center justify-center shadow-[0_4px_20px_rgba(183,148,246,0.35)]">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-black italic text-white uppercase tracking-tighter">SOLFIT</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 mb-8 relative z-10">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] px-3 mb-3">Navigate</p>
          {NAV.map(({ label, path, icon: Icon }) => {
            const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left ${
                  active
                    ? 'bg-[#b794f6]/15 text-[#b794f6] border border-[#b794f6]/20'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="h-px bg-white/5 mb-6" />

        {/* Stats */}
        <div className="mb-6 relative z-10">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Performance</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#b794f6]" />
                <span className="text-xs text-white/40 font-medium">Best Reps</span>
              </div>
              <span className="text-sm font-black text-white italic">{gameRecord || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-[#b794f6]" />
                <span className="text-xs text-white/40 font-medium">SOL Won</span>
              </div>
              <span className="text-sm font-black text-[#b794f6] italic">
                ◎ {stats.totalSolWon.toFixed(3)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-[#b794f6]" />
                <span className="text-xs text-white/40 font-medium">Wins</span>
              </div>
              <span className="text-sm font-black text-white italic">{stats.wins}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#b794f6]" />
                <span className="text-xs text-white/40 font-medium">Games</span>
              </div>
              <span className="text-sm font-black text-white italic">{stats.gamesPlayed}</span>
            </div>
          </div>
        </div>

        {/* Spacer pushes user to bottom */}
        <div className="flex-1" />

        <div className="h-px bg-white/5 mb-4" />

        {/* User profile */}
        <div className="flex items-center gap-3 mb-3 relative z-10">
          {userPicture ? (
            <img
              src={userPicture}
              alt={playerName}
              className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs border shrink-0"
              style={{ backgroundColor: color + '30', borderColor: color + '60' }}
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{playerName}</div>
            <div className="text-[10px] text-white/30 truncate">{userEmail}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-bold relative z-10"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </aside>

      {/* ── Main content ───────────────────────────────────── */}
      <main className="flex-1 h-full overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
}
