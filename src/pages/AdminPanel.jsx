// src/pages/AdminPanel.jsx
import { useState } from 'react';
import BorderGlow from '../components/BorderGlow';
import './AdminPanel.css';

const AdminPanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [slotNumber, setSlotNumber] = useState('');
  const [slotStatus, setSlotStatus] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState(null);

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (data.success) {
        setIsLoggedIn(true);
        localStorage.setItem('adminToken', data.token);
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('adminToken');
    setSlotNumber('');
    setSlotStatus(null);
  };

  const handleSearchSlot = async () => {
    try {
      const response = await fetch(`/api/admin/slot-status/${slotNumber}`);
      const data = await response.json();
      setSlotStatus(data);
    } catch (error) {
      console.error('Error fetching slot status:', error);
    }
  };

  const handleSetWinner = async (winner) => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch('/api/admin/set-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, slotNumber, winner })
      });
      const data = await response.json();
      if (data.success) {
        setSelectedWinner(winner);
        alert(`${winner.toUpperCase()} team has been set as winner!`);
      } else {
        alert('Failed to set winner');
      }
    } catch (error) {
      console.error('Error setting winner:', error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        <BorderGlow borderRadius={20} glowIntensity={1}>
          <div className="login-form">
            <h2>Admin Login</h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
          </div>
        </BorderGlow>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Control Panel</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="admin-content">
        <BorderGlow borderRadius={20} glowIntensity={0.8}>
          <div className="slot-search">
            <h3>Search Slot</h3>
            <div className="search-box">
              <input
                type="text"
                placeholder="Enter Slot Number (e.g., CGT1234)"
                value={slotNumber}
                onChange={(e) => setSlotNumber(e.target.value.toUpperCase())}
              />
              <button onClick={handleSearchSlot}>Search</button>
            </div>
          </div>
        </BorderGlow>

        {slotStatus && slotStatus.exists && (
          <BorderGlow borderRadius={20} glowIntensity={0.8} colors={['#c084fc', '#f472b6', '#38bdf8']}>
            <div className="slot-details">
              <h3>Slot Details: {slotNumber}</h3>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Game Status</span>
                  <span className={`stat-value ${slotStatus.gameActive ? 'active' : 'inactive'}`}>
                    {slotStatus.gameActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                
                <div className="stat-card red-bg">
                  <span className="stat-label">Red Team Population</span>
                  <span className="stat-value">{slotStatus.leftPopulation}</span>
                </div>
                
                <div className="stat-card green-bg">
                  <span className="stat-label">Green Team Population</span>
                  <span className="stat-value">{slotStatus.rightPopulation}</span>
                </div>
                
                <div className="stat-card">
                  <span className="stat-label">Total Bets (Red)</span>
                  <span className="stat-value">₱{slotStatus.leftBets?.toFixed(2)}</span>
                </div>
                
                <div className="stat-card">
                  <span className="stat-label">Total Bets (Green)</span>
                  <span className="stat-value">₱{slotStatus.rightBets?.toFixed(2)}</span>
                </div>
              </div>

              <div className="graph-status">
                <h4>Current Graph Values</h4>
                <div className="x-values">
                  <div className="x-value-group red">
                    <strong>Red Team:</strong>
                    <span>1st: {slotStatus.leftX?.[0]}X</span>
                    <span>2nd: {slotStatus.leftX?.[1]}X</span>
                    <span>3rd: {slotStatus.leftX?.[2]}X</span>
                  </div>
                  <div className="x-value-group green">
                    <strong>Green Team:</strong>
                    <span>1st: {slotStatus.rightX?.[0]}X</span>
                    <span>2nd: {slotStatus.rightX?.[1]}X</span>
                    <span>3rd: {slotStatus.rightX?.[2]}X</span>
                  </div>
                </div>
              </div>

              <div className="winner-control">
                <h4>Force Winner (Admin Override)</h4>
                <div className="winner-buttons">
                  <button
                    className="force-red-btn"
                    onClick={() => handleSetWinner('left')}
                    disabled={!slotStatus.gameActive}
                  >
                    FORCE RED WIN
                  </button>
                  <button
                    className="force-green-btn"
                    onClick={() => handleSetWinner('right')}
                    disabled={!slotStatus.gameActive}
                  >
                    FORCE GREEN WIN
                  </button>
                </div>
                {selectedWinner && (
                  <div className="selected-winner">
                    Current override: {selectedWinner.toUpperCase()} team will win
                  </div>
                )}
              </div>
            </div>
          </BorderGlow>
        )}

        {slotStatus && !slotStatus.exists && (
          <BorderGlow borderRadius={20}>
            <div className="not-found">
              <p>Slot not found. Start a game from the main page first.</p>
            </div>
          </BorderGlow>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;