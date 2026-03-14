import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './fact-checking-form.css';
import { useFactCheck } from '../../context/FactCheckContext';
import FactCheckResult from './fact-checking-resuls/factCheckingResults';

function FactCheckForm() {
  const { getAccessTokenSilently } = useAuth0();
  const { mode, apiBase } = useFactCheck();
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const getEndpoint = () => ({
    'nlp':        `${apiBase}/classify`,
    'nlp-vector': `${apiBase}/vector-classify`,
    'llm':        `${apiBase}/fact-check`,
  }[mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      if (response.status === 429) {
        setResult({ error: 'You have used all your available AI fact-checks.' });
        return;
      }

      if (!response.ok) {
        setResult({ error: 'Something went wrong. Please try again.' });
        return;
      }

      const data = await response.json();
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
      <form className="fact-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="fact-input"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your statement"
        />
        <button
          className="button fact-submit"
          type="submit"
          disabled={loading || !userInput}
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </form>
      <FactCheckResult result={result} />
    </div>
  );
}

export default FactCheckForm;