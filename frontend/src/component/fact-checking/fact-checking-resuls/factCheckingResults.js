import React from 'react';
import { useFactCheck } from '../../../context/FactCheckContext';

function FactCheckResult({ result }) {
  const { usedMode } = useFactCheck();

  if (!result) return null;

  const isNLP = usedMode === 'nlp' || usedMode === 'nlp-vector';

  return (
    <div className="fact-result">
      {result.error && <div className="fact-error">{result.error}</div>}

      {isNLP ? (
        <>
          {result.matches && result.matches.length > 0 && (
            <div className="fact-matches">
              <h3>Top Matches:</h3>
              <ul>
                {result.matches.map((m, i) => (
                  <li className="fact-match-item" key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {result.result && (
            <pre className="fact-output">{result.result.trim()}</pre>
          )}
        </>
      ) : (
        <>
          {result.verdict && (
            <div className="fact-verdict">
              <h3>Verdict:</h3>
              <p>{result.verdict}</p>
            </div>
          )}
          {result.sources && result.sources.length > 0 && (
            <div className="fact-matches">
              <h3>Sources Used:</h3>
              <ul>
                {result.sources.map((s, i) => (
                  <li className="fact-match-item" key={i}>{s.headline}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FactCheckResult;