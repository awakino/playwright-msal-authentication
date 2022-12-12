import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthenticationPage } from './authenticate';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
      <AuthenticationPage />
  </React.StrictMode>
)