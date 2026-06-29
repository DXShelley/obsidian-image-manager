import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const { document } = window;
const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Website root element was not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
