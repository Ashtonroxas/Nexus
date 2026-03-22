import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './firebase/AuthContext.jsx';
import './index.css';
import App from './App.jsx';

import 'bootstrap/dist/css/bootstrap.min.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
