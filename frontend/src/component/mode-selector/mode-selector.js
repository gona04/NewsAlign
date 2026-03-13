import React from 'react';
import { useFactCheck } from '../../context/FactCheckContext';

function ModeSelector() {
  const { isNLP, setNLP } = useFactCheck();

  return (
    <div style={{ margin: '1rem 0' }}>
      <label htmlFor="mode-select"><strong>Fact-Check Mode: </strong></label>
      <select
        id="mode-select"
        value={isNLP ? 'nlp' : 'llm'}
        onChange={e => setNLP(e.target.value === 'nlp')}
      >
        <option value="nlp">NLP (TensorFlow)</option>
        <option value="llm">LLM and Vector Store (OpenAI)</option>
      </select>
    </div>
  );
}

export default ModeSelector;