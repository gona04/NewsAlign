import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '../../auth/auth.css';

const API_URL = process.env.REACT_APP_API_URL;
const MAX_CALLS = 6;

function UserMenu() {
  const { user, logout, getAccessTokenSilently } = useAuth0();
  const [callsUsed, setCallsUsed] = useState(null);

  const roles = user?.['https://fact-checker/roles'] || [];
  const isAdmin = roles.includes('admin');

  useEffect(() => {
    if (isAdmin) return;
    const fetchUsage = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch(`${API_URL}/api/usage`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setCallsUsed(data.ai_calls || 0);
      } catch (err) {
        console.error('Could not fetch usage', err);
      }
    };
    fetchUsage();
  }, [getAccessTokenSilently, isAdmin]);

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
            callsUsed !== null && (
              <span className="user-calls">
                {MAX_CALLS - callsUsed} of {MAX_CALLS} AI calls remaining
              </span>
            )
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