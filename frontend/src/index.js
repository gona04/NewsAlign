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
      <div>
        <h1>Most Recent News</h1>
        <ModeSelector />
        <News />
        <FactCheckForm />
      </div>
    </FactCheckProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);