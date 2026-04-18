import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Search, 
  UserPlus, 
  Send, 
  MoreVertical, 
  ChevronLeft,
  Circle,
  Clock,
  Zap,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'in-game';
  level: number;
  streak: number;
}

export default function FriendsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [friends] = useState<Friend[]>([
    {
      id: '1',
      name: 'Sarah Jenkins',
      username: '@sarahfit',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      status: 'online',
      level: 24,
      streak: 12
    },
    {
      id: '2',
      name: 'Mike Ross',
      username: '@mikeross',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      status: 'in-game',
      level: 18,
      streak: 5
    },
    {
      id: '3',
      name: 'Jessica Chen',
      username: '@jess_c',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      status: 'online',
      level: 32,
      streak: 45
    },
    {
      id: '4',
      name: 'David Miller',
      username: '@davey',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      status: 'offline',
      level: 12,
      streak: 2
    },
    {
      id: '5',
      name: 'Elena Rodriguez',
      username: '@elena_fit',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      status: 'online',
      level: 21,
      streak: 8
    }
  ]);

  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'in-game': return 'bg-[#b794f6]';
      case 'offline': return 'bg-white/20';
      default: return 'bg-white/20';
    }
  };

  const getStatusText = (status: Friend['status']) => {
    switch (status) {
      case 'online': return 'Online';
      case 'in-game': return 'In Challenge';
      case 'offline': return 'Offline';
      default: return 'Offline';
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-[#0a0a0f] overflow-hidden">
      <div className="w-full max-w-[390px] h-full flex flex-col p-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
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

        {/* Search Bar */}
        <div className="relative mb-8 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-white/30 group-focus-within:text-[#b794f6] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#b794f6]/50 focus:bg-white/10 transition-all"
          />
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-[#b794f6]" />
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Active Now</span>
            </div>
            <div className="text-xl font-black text-white italic tracking-tighter">
              {friends.filter(f => f.status !== 'offline').length} Friends
            </div>
          </div>
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-3 h-3 text-[#b794f6]" />
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Highest Streak</span>
            </div>
            <div className="text-xl font-black text-white italic tracking-tighter">
              45 Days
            </div>
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
          <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 px-1">All Friends</h2>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredFriends.map((friend) => (
                <motion.div
                  layout
                  key={friend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/5 p-4 rounded-2xl group hover:border-[#b794f6]/20 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={friend.avatar} 
                          alt={friend.name} 
                          className="w-12 h-12 rounded-2xl object-cover border border-white/10" 
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0f] ${getStatusColor(friend.status)} shadow-lg`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white tracking-tight leading-none">{friend.name}</span>
                          <span className="text-[8px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">LVL {friend.level}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-white/30 font-medium">{friend.username}</span>
                          <span className="w-1 h-1 rounded-full bg-white/10" />
                          <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{getStatusText(friend.status)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        disabled={friend.status === 'offline'}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                          friend.status === 'offline' 
                            ? 'bg-white/5 text-white/10 border border-white/5' 
                            : 'bg-[#b794f6]/10 text-[#b794f6] border border-[#b794f6]/20 hover:bg-[#b794f6] hover:text-white'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-white/60 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Streak Progress if online */}
                  {friend.status !== 'offline' && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3 h-3 text-[#b794f6]" />
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{friend.streak} Day Streak</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#b794f6] w-2/3" />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
