import React, { createContext, useContext, useState } from 'react';

const FactCheckContext = createContext();

export function FactCheckProvider({ children }) {
  const [isNLP, setNLP] = useState(true);

  const apiBase = isNLP
    ? `${process.env.REACT_APP_API_URL}/api`
    : `${process.env.REACT_APP_API_URL}/fact-checking`;

  return (
    <FactCheckContext.Provider value={{ isNLP, setNLP, apiBase }}>
      {children}
    </FactCheckContext.Provider>
  );
}

export function useFactCheck() {
  return useContext(FactCheckContext);
}