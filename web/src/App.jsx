import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
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
  return (
    <div className="app-container">
      {/* Sticky Header Bar */}
      <header className="header-bar">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <span className="logo-glyph">●</span>
          <span className="logo-text">BORK</span>
          <span className="network-badge">Robinhood L2 Testnet</span>
        </Link>
        <nav className="nav-pills">
          <Link to="/" className="nav-pill active">Launchpad</Link>
          <Link to="/ranking" className="nav-pill">Ranking</Link>
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
