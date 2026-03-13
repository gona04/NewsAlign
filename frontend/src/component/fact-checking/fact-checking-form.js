import React, { useState } from 'react';
import './fact-checking-form.css';
import { useFactCheck } from '../../context/FactCheckContext';
import FactCheckResult from './fact-checking-resuls/factCheckingResults';

function FactCheckForm() {
  const { isNLP, apiBase } = useFactCheck();
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const endpoint = isNLP ? `${apiBase}/classify` : `${apiBase}/fact-check`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Something went wrong.' });
    }
    setLoading(false);
  };

  return (
    <div className="app-container fact-form-container">
      <h2 className="fact-form-title">Fact Check a Statement</h2>
      <form className="fact-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="fact-input neu-input"
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