import { useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Settings from './components/Settings.jsx';

export default function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title" onClick={() => setPage('dashboard')}>
          Signal Convergence Tool
        </h1>
        <nav className="app-nav">
          <button
            className={`nav-btn ${page === 'dashboard' ? 'active' : ''}`}
            onClick={() => setPage('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-btn ${page === 'settings' ? 'active' : ''}`}
            onClick={() => setPage('settings')}
          >
            Settings
          </button>
        </nav>
      </header>
      <main className="app-main">
        {page === 'dashboard' ? <Dashboard /> : <Settings />}
      </main>
    </div>
  );
}
