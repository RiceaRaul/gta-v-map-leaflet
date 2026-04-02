import React from 'react';
import { createRoot } from 'react-dom/client';
import { GtaVMapApp } from './App.js';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GtaVMapApp />
  </React.StrictMode>,
);
