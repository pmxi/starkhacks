import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, UserPlus, X, UserMinus, Users, Send, AlertCircle, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { PlayerAvatar } from './PlayerAvatar';

interface FriendEntry {
  id: string;
  username: string;
}

export default function FriendsList() {
  const navigate = useNavigate();
  const { socket, playerId, playerName } = useGame();

  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [inputUsername, setInputUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const refresh = useCallback(() => {
    socket?.emit('get-friends', { userId: playerId });
  }, [socket, playerId]);

  useEffect(() => {
    if (!socket) return;
    refresh();

    const onData = ({ friends }: { friends: FriendEntry[] }) => setFriends(friends);
    const onResult = ({ ok, message: msg }: { ok: boolean; message: string }) => {
      setStatus(ok ? 'success' : 'error');
      setMessage(msg);
      if (ok) setInputUsername('');
    };

    socket.on('friends-data', onData);
    socket.on('add-friend-result', onResult);
    return () => {
      socket.off('friends-data', onData);
      socket.off('add-friend-result', onResult);
    };
  }, [socket, playerId, refresh]);

  const handleAdd = () => {
    const trimmed = inputUsername.trim().replace(/^@/, '');
    if (!trimmed) return;
    setStatus('loading');
    setMessage('');
    socket?.emit('add-friend', { fromId: playerId, toUsername: trimmed });
  };

  const handleRemove = (friendId: string) => {
    socket?.emit('remove-friend', { userId: playerId, friendId });
  };

  const closeModal = () => {
    setShowModal(false);
    setInputUsername('');
    setStatus('idle');
    setMessage('');
  };

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
          <h1 className="text-xl font-black italic text-white tracking-tighter uppercase">Squad</h1>
          <button
            onClick={() => { setShowModal(true); setStatus('idle'); setMessage(''); }}
            className="w-10 h-10 rounded-xl bg-[#b794f6] flex items-center justify-center text-white shadow-[0_4px_15px_rgba(183,148,246,0.3)] active:scale-95 transition-all"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Friend count */}
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#b794f6]/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-[#b794f6]" />
          </div>
          <div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Squad Size</div>
            <div className="text-lg font-black text-white italic">{friends.length} Friend{friends.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Friends list */}
        <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 px-1">
          Friends ({friends.length})
        </h2>

        {friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-[20px] bg-white/3 border border-white/5 flex items-center justify-center">
              <Users className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/20 text-xs font-bold uppercase tracking-widest text-center">
              No friends yet.<br />Tap + to add someone.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {friends.map(friend => (
                <motion.div
                  key={friend.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:border-[#b794f6]/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PlayerAvatar name={friend.username} size={44} className="rounded-xl" />
                      <span className="text-sm font-bold text-white">{friend.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('/create-team')}
                        title="Invite to game"
                        className="w-9 h-9 rounded-xl bg-[#b794f6]/10 text-[#b794f6] border border-[#b794f6]/20 flex items-center justify-center hover:bg-[#b794f6] hover:text-white transition-all active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemove(friend.id)}
                        title="Remove friend"
                        className="w-9 h-9 rounded-xl bg-white/5 text-white/20 border border-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all active:scale-95"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-[#0f0f18] border border-white/10 rounded-[28px] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black text-white italic uppercase tracking-tighter">Add Friend</h2>
                <button onClick={closeModal} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-6">
                Enter their exact username
              </p>

              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-black text-sm select-none">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={inputUsername}
                  onChange={e => { setInputUsername(e.target.value); setStatus('idle'); setMessage(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-8 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#b794f6]/50 focus:bg-white/10 transition-all"
                />
              </div>

              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-2 mb-4 text-xs font-bold ${status === 'error' ? 'text-red-400' : 'text-[#b794f6]'}`}
                  >
                    {status === 'error'
                      ? <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      : <Check className="w-3.5 h-3.5 shrink-0" />}
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleAdd}
                disabled={!inputUsername.trim() || status === 'loading'}
                className="w-full bg-gradient-to-r from-[#b794f6] to-[#8b5cf6] rounded-2xl py-4 font-black text-white uppercase italic tracking-tighter transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === 'loading'
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><UserPlus className="w-4 h-4" /> Add Friend</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
