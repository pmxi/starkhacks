import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth0 } from '@auth0/auth0-react';
import LoadingScreen from './LoadingScreen';

export default function AuthCallback() {
  const { isLoading, error, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !error) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, error, navigate]);

  if (error) {
    return (
      <div className="size-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-full max-w-[340px] mx-6 bg-red-500/10 border border-red-500/20 rounded-[24px] p-8 flex flex-col items-center gap-4 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Auth Error</h2>
          <p className="text-sm text-white/50">{error.message}</p>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="w-full bg-[#b794f6] text-white rounded-2xl py-4 font-black uppercase italic tracking-tighter text-sm active:scale-95 transition-all mt-2"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return <LoadingScreen message="Signing you in..." />;
}
