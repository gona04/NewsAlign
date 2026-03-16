import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useUsageLimit } from '../../../context/Usage-Limit-Context';
import '../auth.css';

function UserMenu() {
  const { user, logout } = useAuth0();
  const { MAX_DAILY_CALLS, remaining, resetTime, isAdmin } = useUsageLimit();

  return (
    <div className="user-menu" style={{ position: 'relative', zIndex: 1 }}>
      <div className="user-info">
        {user.picture && (
          <img className="user-avatar" src={user.picture} alt={user.name} />
        )}
        <div className="user-details">
          <span className="user-name">{user.name}</span>
          {isAdmin ? (
            <span className="user-calls-admin">Unlimited access</span>
          ) : (
            <span className="user-calls">
              {remaining} of {MAX_DAILY_CALLS} AI checks remaining
            </span>
          )}
        </div>
      </div>
      <button
        className="button auth-btn-logout"
        onClick={() =>
          logout({ logoutParams: { returnTo: window.location.origin } })
        }
      >
        Log Out
      </button>
    </div>
  );
}

export default UserMenu;