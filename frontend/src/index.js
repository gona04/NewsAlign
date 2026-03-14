import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { FactCheckProvider } from './context/FactCheckContext';
import News from './component/news/news';
import FactCheckForm from './component/fact-checking/fact-checking-form';
import ModeSelector from './component/mode-selector/mode-selector';
import LoginPage from './component/auth/login/login-page';
import UserMenu from './component/auth/user-menu/user-menue';
import './style.css';

function App() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="app-shell">
        <div className="app-container" style={{ textAlign: 'center', padding: '2rem' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="app-shell">
      <div className="app-header app-container">
        <h1 className="app-title">Fact Checker</h1>
        <UserMenu />
      </div>
      <ModeSelector />
      <News />
      <FactCheckForm />
    </div>
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
  >
    <FactCheckProvider>
      <App />
    </FactCheckProvider>
  </Auth0Provider>
);