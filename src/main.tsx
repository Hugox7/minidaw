import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {startLanguageNavigation} from './browserLanguage';
import './style.css';
startLanguageNavigation();
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
