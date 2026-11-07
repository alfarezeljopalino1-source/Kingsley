console.log('>>> RENDERER MAIN.TSX MOUNTED <<<')
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppContent } from './App'
import { ThemeProvider } from './context/ThemeContext'
import { FeaturesProvider } from './context/FeaturesContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { LanguageProvider } from './context/LanguageContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary fallbackTitle="Kingsley Root Error">
    <ThemeProvider>
      <LanguageProvider>
        <FeaturesProvider>
          <AppContent />
        </FeaturesProvider>
      </LanguageProvider>
    </ThemeProvider>
  </ErrorBoundary>
)
