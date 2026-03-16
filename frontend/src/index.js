import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { FactCheckProvider } from './context/FactCheckContext';
import { UsageLimitProvider } from './context/Usage-Limit-Context';
import LoginPage from './component/auth/login/login-page';
import UserMenu from './component/auth/user-menu/user-menue';
import './style.css';

const News = lazy(() => import('./component/news/news'));
const FactCheckForm = lazy(() => import('./component/fact-checking/fact-checking-form'));
const ModeSelector = lazy(() => import('./component/mode-selector/mode-selector'));

function App() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">News Align</h1>
          <p className="auth-subtitle" style={{ opacity: 0.5 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <UsageLimitProvider>
      <div className="app-shell">
        <div className="app-header app-container">
          <h1 className="app-title">News Align</h1>
          <Suspense fallback={<div style={{ padding: '0.5rem' }}>...</div>}>
            <UserMenu />
          </Suspense>
        </div>
        <Suspense fallback={
          <div className="app-container" style={{ padding: '1rem', color: 'var(--text-muted)' }}>
            Loading...
          </div>
        }>
          <ModeSelector />
          <News />
          <FactCheckForm />
        </Suspense>
      </div>
    </UsageLimitProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Auth0Provider
    domain={process.env.REACT_APP_0_AUTH_FACT_CHECKING_APP_DOMAIN}
    clientId={process.env.REACT_APP_0_AUTH_FACT_CHECKING_APP_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: process.env.REACT_APP_0_AUTH_FACT_CHECKING_APP_AUDIENCE,
    }}
    useRefreshTokens={true}
    cacheLocation="localstorage"
  >
    <FactCheckProvider>
      <App />
    </FactCheckProvider>
  </Auth0Provider>
);