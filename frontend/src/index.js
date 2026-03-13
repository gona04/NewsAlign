import React from 'react';
import ReactDOM from 'react-dom/client';
import News from './component/news/news';
import './style.css';
import FactCheckForm from './component/fact-checking/fact-checking-form';
import { FactCheckProvider } from './context/FactCheckContext';
import ModeSelector from './component/mode-selector/mode-selector';

function App() {
  return (
    <FactCheckProvider>
      <div className="app-shell">
        <header className="hero-panel">
          <h1 className="app-title">Most Recent News</h1>
          <p className="app-subtitle">Illustrated, soft-depth dashboard for fast fact checking.</p>
        </header>
        <ModeSelector />
        <News />
        <FactCheckForm />
      </div>
    </FactCheckProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
