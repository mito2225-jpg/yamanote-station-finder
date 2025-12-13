import { Routes, Route } from 'react-router-dom'
import DiagnosticWizard from './components/DiagnosticWizard'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <header className="App-header">
          <h1>山手線診断</h1>
        </header>
        <main>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<DiagnosticWizard />} />
              <Route path="/diagnostic" element={<DiagnosticWizard />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App