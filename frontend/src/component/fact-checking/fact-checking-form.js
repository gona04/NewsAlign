import React, { useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './fact-checking-form.css';
import { useFactCheck } from '../../context/FactCheckContext';
import { useUsageLimit } from '../../context/Usage-Limit-Context';
import FactCheckResult from './fact-checking-resuls/factCheckingResults';

function FactCheckForm() {
  const { getAccessTokenSilently } = useAuth0();
  const { mode, apiBase, setUsedMode } = useFactCheck();
  const {
    MAX_DAILY_CALLS,
    remaining,
    resetTime,
    isAdmin,
    checkLimit,
    consumeCall,
  } = useUsageLimit();

  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const tokenRef = useRef(null);

  const getToken = async () => {
    if (tokenRef.current) return tokenRef.current;
    const token = await getAccessTokenSilently();
    tokenRef.current = token;
    return token;
  };

  const getEndpoint = () => ({
    nlp:          `${apiBase}/classify`,
    'nlp-vector': `${apiBase}/vector-classify`,
    llm:          `${apiBase}/fact-check`,
  }[mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (checkLimit()) {
      setResult({
        error: `You have used all ${MAX_DAILY_CALLS} of your daily AI fact-checks. Resets at ${resetTime?.toLocaleTimeString()}.`,
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setUsedMode(mode);

    try {
      const token = await getToken();
      const response = await fetch(getEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userInput, mode }),
      });

      if (response.status === 429) {
        setResult({ error: 'You have used all your available AI fact-checks.' });
        return;
      }

      if (!response.ok) {
        setResult({ error: 'Something went wrong. Please try again.' });
        return;
      }

      const data = await response.json();
      consumeCall();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container fact-form-container">
      <h2 className="fact-form-title">News Align A Statement</h2>

      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {isAdmin
          ? 'Unlimited access'
          : remaining > 0
            ? `${remaining} of ${MAX_DAILY_CALLS} AI checks remaining today`
            : `Limit reached — resets at ${resetTime?.toLocaleTimeString()}`}
      </p>

      <form className="fact-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="neu-input fact-input"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your statement"
        />
        <button
          className="button fact-submit"
          type="submit"
          disabled={loading || !userInput || (!isAdmin && remaining === 0)}
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </form>

      {loading && (
        <p style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          margin: '0.5rem 0 0',
        }}>
          Analysing your statement...
        </p>
      )}

      <FactCheckResult result={result} />
    </div>
  );
}

export default FactCheckForm;