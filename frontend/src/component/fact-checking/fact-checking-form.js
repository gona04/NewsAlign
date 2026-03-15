import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './fact-checking-form.css';
import { useFactCheck } from '../../context/FactCheckContext';
import FactCheckResult from './fact-checking-resuls/factCheckingResults';
import { hasReachedLimit, incrementUsage, getRemainingCalls, getResetTime } from '../../utils/useage';

const MAX_CALLS = 4;

function FactCheckForm() {
  const { getAccessTokenSilently, user } = useAuth0();
  const { mode, apiBase } = useFactCheck();
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const roles = user?.['https://fact-checker/roles'] || [];
  const isAdmin = roles.includes('admin');

  const remaining = isAdmin ? Infinity : getRemainingCalls();
  const resetTime = getResetTime();

  const getEndpoint = () => ({
    'nlp':        `${apiBase}/classify`,
    'nlp-vector': `${apiBase}/vector-classify`,
    'llm':        `${apiBase}/fact-check`,
  }[mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin && hasReachedLimit()) {
      setResult({
        error: `You have used all ${MAX_CALLS} of your daily AI fact-checks. Your limit resets at ${resetTime?.toLocaleTimeString()}.`
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(getEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userInput }),
      });

      if (!response.ok) {
        setResult({ error: 'Something went wrong. Please try again.' });
        return;
      }

      const data = await response.json();
      if (!isAdmin) incrementUsage();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container fact-form-container">
      <h2 className="fact-form-title">Fact Check a Statement</h2>

      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {isAdmin
          ? 'Unlimited access'
          : remaining > 0
            ? `${remaining} of ${MAX_CALLS} AI checks remaining today`
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

      <FactCheckResult result={result} />
    </div>
  );
}

export default FactCheckForm;