import { Buffer } from 'buffer';
// Anchor + @solana/web3.js reach for Node's Buffer global; Vite doesn't polyfill it.
(globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;

import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './app/App.tsx';
import { GameProvider } from './context/GameContext.tsx';
import './styles/index.css';

const domain = import.meta.env.VITE_AUTH0_DOMAIN as string;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string;

if (!domain || !clientId) {
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0f;color:#b794f6;font-family:monospace;text-align:center;padding:24px;">
      <div>
        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
        <h1 style="margin-bottom:8px;">Missing Auth0 Config</h1>
        <p style="color:#ffffff60">Copy <code>.env.example</code> to <code>.env</code> and fill in your Auth0 credentials.</p>
      </div>
    </div>`;
  throw new Error('VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID must be set in .env');
}

createRoot(document.getElementById('root')!).render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      redirect_uri: `${window.location.origin}/callback`,
      // Request offline_access so Auth0 issues refresh tokens
      scope: 'openid profile email offline_access',
    }}
    // Cache tokens in localStorage so the session survives page refresh
    cacheLocation="localstorage"
    useRefreshTokens={true}
  >
    <GameProvider>
      <App />
    </GameProvider>
  </Auth0Provider>
);
