import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ConnectButton } from 'thirdweb/react';
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { client } from './config';
import Home from './pages/Home';
import TokenDetail from './pages/TokenDetail';

const wallets = [
  createWallet("io.rabby"),
  createWallet("io.metamask"),
  createWallet("me.rainbow"),
  createWallet("io.zerion.wallet"),
  inAppWallet({ auth: { options: ["email", "google", "apple", "facebook", "phone"] } }),
];

function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      {/* Sticky Header Bar */}
      <header className="header-bar">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="logo-glyph">
            <path d="M12 3c-1.2 0-2.4.4-3.4 1.2L6 2l-.8 1.8L3 3.5l1 2.2C3.3 7 3 8.5 3 10c0 4.4 3.6 8 8 8h2c4.4 0 8-3.6 8-8 0-1.5-.3-3-1-4.3l1-2.2-2.2.3-.8-1.8-2.6 2.2c-1-.8-2.2-1.2-3.4-1.2zM9.5 9c.8 0 1.5.7 1.5 1.5S10.3 12 9.5 12 8 11.3 8 10.5 8.7 9 9.5 9zm5 0c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5.7-1.5 1.5-1.5zM12 14c1.1 0 2 .9 2 2H10c0-1.1.9-2 2-2z"/>
          </svg>
          <span className="logo-text">BORK</span>
          <span className="network-badge">Robinhood Chain</span>
        </Link>
        <nav className="nav-pills">
          <Link to="/" className={`nav-pill ${location.pathname === '/' ? 'active' : ''}`}>Launchpad</Link>
          <Link to="/ranking" className={`nav-pill ${location.pathname === '/ranking' ? 'active' : ''}`}>Ranking</Link>
        </nav>
        <div className="header-actions">
          <ConnectButton
            client={client}
            wallets={wallets}
            theme="dark"
            connectModal={{ size: "wide" }}
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/token/:address" element={<TokenDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
