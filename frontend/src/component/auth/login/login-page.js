import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '../../auth/auth.css';


function LoginPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Fact Checker</h1>
        <p className="auth-subtitle">
          Verify news statements in real time using NLP and AI.
        </p>
        <div className="auth-actions">
          <button
            className="button auth-btn-primary"
            onClick={() => loginWithRedirect()}
          >
            Log In
          </button>
          <button
            className="button auth-btn-secondary"
            onClick={() =>
              loginWithRedirect({
                authorizationParams: { screen_hint: 'signup' },
              })
            }
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;