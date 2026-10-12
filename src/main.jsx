import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { CLERK_PUBLISHABLE_KEY } from './config'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      afterSignInUrl="/#overview"
      afterSignUpUrl="/#overview"
      allowedRedirectOrigins={[
        'https://neuro-med-nine.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
      ]}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)