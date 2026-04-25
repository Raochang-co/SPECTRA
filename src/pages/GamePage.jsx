// src/pages/GamePage.jsx
import { useState, useEffect, useRef } from 'react';
import BorderGlow from '../components/BorderGlow';
import CarouselVideos from '../components/CarouselVideos';
import GraphSection from '../components/GraphSection';
import Counter from '../components/Counter';
import createSocket from '../socket';
import './GamePage.css';

const GamePage = () => {
  const [wallet, setWallet] = useState(1000);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [slotNumber, setSlotNumber] = useState('CGT' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'));
  const [leftX, setLeftX] = useState([1, 1, 1]);
  const [rightX, setRightX] = useState([1, 1, 1]);
  const [leftPopulation, setLeftPopulation] = useState(0);
  const [rightPopulation, setRightPopulation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [bettingDisabled, setBettingDisabled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const socketRef = useRef(null);
  const playerIdRef = useRef('player_' + Math.random().toString(36).substr(2, 9));
  const audioRef = useRef(null);
  const winnerAudioRef = useRef(null);
  const looserAudioRef = useRef(null);
  const coinsAudioRef = useRef(null);

  const powerVideos = [
    { x: 9.2 }, { x: 6.1 }, { x: 4.3 }, { x: 10 }, { x: 7 }, { x: 6.6 }, { x: 7.9 }, { x: 8.5 }, { x: 5.2 }, { x: 4.9 }
  ];

  useEffect(() => {
    socketRef.current = createSocket(slotNumber, playerIdRef.current);
    
    socketRef.current.on('gameState', (state) => {
      setGameActive(state.gameActive);
      if (state.leftX) setLeftX(state.leftX);
      if (state.rightX) setRightX(state.rightX);
      setLeftPopulation(state.leftPopulation || 0);
      setRightPopulation(state.rightPopulation || 0);
    });
    
    socketRef.current.on('graphUpdate', (data) => {
      setLeftX(data.left);
      setRightX(data.right);
    });
    
    socketRef.current.on('populationUpdate', (data) => {
      setLeftPopulation(data.left);
      setRightPopulation(data.right);
    });
    
    socketRef.current.on('gameStarted', ({ startTime }) => {
      setGameActive(true);
      setBettingDisabled(false);
      startTimer(120);
    });
    
    socketRef.current.on('gameResult', (result) => {
      setGameActive(false);
      setBettingDisabled(true);
      
      const won = result.winnings.some(([id]) => id === playerIdRef.current);
      if (won) {
        setResultData({ type: 'winner', multiplier: result.thirdBarMultiplier });
        winnerAudioRef.current?.play();
      } else {
        setResultData({ type: 'loosed' });
        looserAudioRef.current?.play();
      }
      setShowResult(true);
      
      // Add winnings to wallet
      const playerWin = result.winnings.find(([id]) => id === playerIdRef.current);
      if (playerWin) {
        setWallet(prev => prev + playerWin[1]);
        coinsAudioRef.current?.play();
      }
    });
    
    socketRef.current.on('gameReset', () => {
      setShowResult(false);
      setResultData(null);
      setTimeLeft(0);
      setBettingDisabled(false);
    });
    
    socketRef.current.on('walletUpdate', ({ balance }) => {
      setWallet(balance);
    });
    
    socketRef.current.on('betResult', (result) => {
      if (result.success) {
        setWallet(result.wallet);
      } else {
        alert(result.message);
      }
    });
    
    return () => {
      socketRef.current?.disconnect();
    };
  }, [slotNumber]);
  
  const startTimer = (duration) => {
    let timer = duration;
    const interval = setInterval(() => {
      if (timer <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
      } else {
        timer--;
        setTimeLeft(timer);
      }
    }, 1000);
    return () => clearInterval(interval);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStartGame = () => {
    socketRef.current?.emit('startGame', { slotNumber });
  };
  
  const handleBet = (side, isFreeBet) => {
    if (!gameActive) {
      alert('Game is not active!');
      return;
    }
    
    if (isFreeBet) {
      socketRef.current?.emit('freeBet', { slotNumber, playerId: playerIdRef.current, side });
    } else {
      socketRef.current?.emit('placeBet', { slotNumber, playerId: playerIdRef.current, side, amount: 1 });
    }
  };
  
  const handleSelectPower = (index) => {
    console.log('Selected power:', index + 1);
  };
  
  return (
    <div className="game-page">
      {/* Audio elements */}
      <audio ref={winnerAudioRef} src="/audio/winner.mp3" />
      <audio ref={looserAudioRef} src="/audio/loosed.mp3" />
      <audio ref={coinsAudioRef} src="/audio/coins.mp3" />
      
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo-container">
          <video src="/videos/logo.mp4" autoPlay loop muted playsInline className="logo-video" />
        </div>
        <div className="wallet-container">
          <span className="wallet-label">WALLET:</span>
          <span className="wallet-amount">₱{wallet.toFixed(2)}</span>
          <button className="add-funds-btn" onClick={() => alert('Wallet page coming soon!')}>+</button>
        </div>
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
        {menuOpen && (
          <div className="menu-dropdown">
            <button onClick={() => setMenuOpen(false)}>Home</button>
            <button onClick={() => setMenuOpen(false)}>About</button>
            <button onClick={() => setMenuOpen(false)}>Privacy Policy</button>
            <button onClick={() => setMenuOpen(false)}>Wallet</button>
            <button onClick={() => setMenuOpen(false)}>Settings</button>
          </div>
        )}
      </nav>
      
      {/* Banner Ads */}
      <div className="banner-ads">
        <img src="/api/placeholder/728/90" alt="Advertisement" />
      </div>
      
      {/* Small Video */}
      <div className="small-video-container">
        <video src="/videos/sm.mp4" autoPlay loop muted playsInline className="small-video" />
      </div>
      
      {/* Carousel */}
      <CarouselVideos videos={powerVideos} onSelectPower={handleSelectPower} />
      
      {/* Timer and Controls */}
      <BorderGlow borderRadius={20} glowIntensity={0.8} colors={['#c084fc', '#f472b6', '#38bdf8']}>
        <div className="game-controls">
          <div className="live-indicator">
            <span className="live-dot"></span>
            LIVE
          </div>
          <div className="timer-container">
            <span className="timer-label">TIMER:</span>
            <span className="timer-value">{formatTime(timeLeft)}</span>
          </div>
          <div className="slot-container">
            <span className="slot-label">SLOT NUMBER:</span>
            <span className="slot-value">{slotNumber}</span>
          </div>
          <div className="bet-amount">
            <span>BET AMOUNT: ₱1.00</span>
          </div>
          {!gameActive && timeLeft === 0 && (
            <button className="start-btn" onClick={handleStartGame}>
              START
            </button>
          )}
        </div>
      </BorderGlow>
      
      {/* Counters with videos in between */}
      <div className="counters-section">
        <Counter initialMin={2334} initialMax={9999} label="PLAYERS" />
        <div className="inline-video">
          <video src="/videos/sm.mp4" autoPlay loop muted playsInline className="inline-small-video" />
        </div>
        <Counter initialMin={2334} initialMax={9999} label="VIEWERS" />
      </div>
      
      {/* Two circular videos between counters */}
      <div className="circular-videos-row">
        <div className="circular-video-item">
          <video src="/videos/sm.mp4" autoPlay loop muted playsInline className="small-circular-video" />
        </div>
        <div className="circular-video-item">
          <video src="/videos/sm.mp4" autoPlay loop muted playsInline className="small-circular-video" />
        </div>
      </div>
      
      {/* Population counters */}
      <div className="population-stats">
        <div className="population left-pop">
          <span className="pop-label">RED TEAM</span>
          <span className="pop-value">{leftPopulation}</span>
        </div>
        <div className="population right-pop">
          <span className="pop-label">GREEN TEAM</span>
          <span className="pop-value">{rightPopulation}</span>
        </div>
      </div>
      
      {/* Graph Section */}
      <GraphSection
        leftX={leftX}
        rightX={rightX}
        onBet={handleBet}
        disabled={bettingDisabled}
        gameActive={gameActive}
      />
      
      {/* Result Popup */}
      {showResult && resultData && (
        <div className="result-overlay">
          <BorderGlow borderRadius={20} glowIntensity={1.2}>
            <div className="result-popup">
              <button className="close-result" onClick={() => setShowResult(false)}>✕</button>
              <video
                src={`/videos/${resultData.type}.mp4`}
                autoPlay
                loop
                muted={false}
                playsInline
                className="result-video"
              />
              {resultData.multiplier && (
                <div className="result-multiplier">
                  You won {resultData.multiplier}x your bet!
                </div>
              )}
            </div>
          </BorderGlow>
        </div>
      )}
    </div>
  );
};

export default GamePage;