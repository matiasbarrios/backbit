// Requirements
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app.jsx';
import './style/main.css';


// Main
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
