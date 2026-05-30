import './amplify';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <Authenticator>
      <App />
    </Authenticator>
  </StrictMode>,
)
