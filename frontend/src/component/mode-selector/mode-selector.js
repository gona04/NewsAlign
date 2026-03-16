import React from 'react';
import { useFactCheck } from '../../context/FactCheckContext';
import './mode-selector.css'

function ModeSelector() {
  const { mode, setMode } = useFactCheck();

  return (
    <div className="app-container mode-selector">
      <label htmlFor="mode-select">News Align Mode</label>
      <select
        className="neu-select"
        id="mode-select"
        value={mode}
        onChange={e => setMode(e.target.value)}
      >
        <option value="nlp">NLP (TensorFlow)</option>
        <option value="nlp-vector">NLP (TensorFlow) + VectorDB (FAISS)</option>
        <option value="llm">LLM and Vector Store (OpenAI)</option>
      </select>
    </div>
  );
}

export default ModeSelector;