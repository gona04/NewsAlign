import React, { createContext, useContext, useState } from 'react';

const FactCheckContext = createContext();

export function FactCheckProvider({ children }) {
  const [mode, setMode] = useState('nlp');

  // Kept for backward compatibility with FactCheckResult
  const isNLP = mode !== 'llm';

  const apiBase = {
    'nlp':        `${process.env.REACT_APP_API_URL}/api`,
    'nlp-vector': `${process.env.REACT_APP_API_URL}/api`,
    'llm':        `${process.env.REACT_APP_API_URL}/fact-checking`,
  }[mode];

  return (
    <FactCheckContext.Provider value={{ mode, setMode, isNLP, apiBase }}>
      {children}
    </FactCheckContext.Provider>
  );
}

export function useFactCheck() {
  return useContext(FactCheckContext);
}