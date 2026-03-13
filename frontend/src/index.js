import React from 'react';
import ReactDOM from 'react-dom/client';
import News from './news/news';
import './style.css';
import FactCheckForm from './fact-checking/fact-checking-form';

function App() {
  return (
    <div>
      <h1>Most Recent News</h1>
      
      <News/>
      <FactCheckForm/>
      </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);