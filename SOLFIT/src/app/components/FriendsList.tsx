import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, UserPlus, Send, MoreVertical, ChevronLeft, Zap, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Friend {
  id: string;
  name: string;
  username: string;
  status: 'online' | 'offline' | 'in-game';
  level: number;
  streak: number;
}

const FRIENDS: Friend[] = [
  { id: '1', name: 'Sarah Jenkins', username: '@sarahfit', status: 'online', level: 24, streak: 12 },
  { id: '2', name: 'Mike Ross', username: '@mikeross', status: 'in-game', level: 18, streak: 5 },
  { id: '3', name: 'Jessica Chen', username: '@jess_c', status: 'online', level: 32, streak: 45 },
  { id: '4', name: 'David Miller', username: '@davey', status: 'offline', level: 12, streak: 2 },
  { id: '5', name: 'Elena Rodriguez', username: '@elena_fit', status: 'online', level: 21, streak: 8 },
  { id: '6', name: 'Chris Park', username: '@cpark', status: 'in-game', level: 15, streak: 3 },
];

const STATUS_COLOR = { online: 'bg-green-500', 'in-game': 'bg-[#b794f6]', offline: 'bg-white/20' };
const STATUS_TEXT = { online: 'Online', 'in-game': 'In Challenge', offline: 'Offline' };

function FriendCard({ friend }: { friend: Friend }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:border-[#b794f6]/20 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {/* Initials avatar */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm"
              style={{ background: `linear-gradient(135deg, #b794f620, #8b5cf620)`, border: '1px solid #b794f630' }}
            >
              {friend.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0f] shadow-lg ${STATUS_COLOR[friend.status]}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white leading-none">{friend.name}</span>
              <span className="text-[8px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded font-black uppercase">LVL {friend.level}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-white/30">{friend.username}</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{STATUS_TEXT[friend.status]}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={friend.status === 'offline'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
              friend.status === 'offline'
                ? 'bg-white/5 text-white/10 border border-white/5'
                : 'bg-[#b794f6]/10 text-[#b794f6] border border-[#b794f6]/20 hover:bg-[#b794f6] hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center text-white/20 hover:text-white/60 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {friend.status !== 'offline' && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-[#b794f6]" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{friend.streak} Day Streak</span>
          </div>
          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#b794f6]" style={{ width: `${Math.min((friend.streak / 50) * 100, 100)}%` }} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function FriendsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = FRIENDS.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = FRIENDS.filter(f => f.status !== 'offline').length;
  const highestStreak = Math.max(...FRIENDS.map(f => f.streak));

  return (
    <div className="min-h-full bg-[#0a0a0f] overflow-y-auto">
      <div className="w-full max-w-[390px] md:max-w-4xl mx-auto flex flex-col p-6 md:p-10 min-h-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-black italic text-white tracking-tighter uppercase">Friends</h1>
          <button className="w-10 h-10 rounded-xl bg-[#b794f6] flex items-center justify-center text-white shadow-[0_4px_15px_rgba(183,148,246,0.3)] active:scale-95 transition-all">
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-white/30 group-focus-within:text-[#b794f6] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#b794f6]/50 focus:bg-white/10 transition-all"
          />
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-[#b794f6]" />
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Active Now</span>
            </div>
            <div className="text-xl font-black text-white italic">{activeCount} Friends</div>
          </div>
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-3 h-3 text-[#b794f6]" />
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Top Streak</span>
            </div>
            <div className="text-xl font-black text-white italic">{highestStreak} Days</div>
          </div>
        </div>

        {/* Friends grid */}
        <div>
          <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 px-1">
            All Friends ({filtered.length})
          </h2>
          {/* 2-column on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map(friend => (
                <FriendCard key={friend.id} friend={friend} />
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
