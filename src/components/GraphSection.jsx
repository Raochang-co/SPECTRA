// src/components/GraphSection.jsx
import { useEffect, useState } from 'react';
import './GraphSection.css';

const GraphSection = ({ leftX, rightX, onBet, disabled, gameActive }) => {
  const [leftBars, setLeftBars] = useState([1, 1, 1]);
  const [rightBars, setRightBars] = useState([1, 1, 1]);

  useEffect(() => {
    if (leftX) setLeftBars(leftX);
    if (rightX) setRightBars(rightX);
  }, [leftX, rightX]);

  const getBarHeight = (x) => {
    const maxX = 10;
    const minHeight = 20;
    const maxHeight = 150;
    return minHeight + (x / maxX) * maxHeight;
  };

  const getBarColor = (x, isLeft) => {
    if (isLeft) {
      return `rgba(239, 68, 68, ${0.3 + (x / 10) * 0.7})`;
    }
    return `rgba(34, 197, 94, ${0.3 + (x / 10) * 0.7})`;
  };

  return (
    <div className="graph-section">
      <div className="graph-side left-side">
        <h3 className="side-title left">RED TEAM</h3>
        <div className="bars-container">
          {leftBars.map((x, idx) => (
            <div key={idx} className="bar-wrapper">
              <div
                className="bar left-bar"
                style={{
                  height: `${getBarHeight(x)}px`,
                  backgroundColor: getBarColor(x, true)
                }}
              />
              <span className="bar-value">{x}X</span>
              <span className="bar-label">{idx + 1}{idx === 2 ? 'rd' : idx === 0 ? 'st' : 'nd'}</span>
            </div>
          ))}
        </div>
        <div className="bet-buttons">
          <button
            className={`bet-btn free-bet-btn ${disabled ? 'disabled' : ''}`}
            onClick={() => onBet('left', true)}
            disabled={disabled || !gameActive}
          >
            FREE BET
          </button>
          <button
            className={`bet-btn red-bet-btn ${disabled ? 'disabled' : ''}`}
            onClick={() => onBet('left', false)}
            disabled={disabled || !gameActive}
          >
            BET
          </button>
        </div>
      </div>

      <div className="graph-divider">
        <span className="vs-text">VS</span>
      </div>

      <div className="graph-side right-side">
        <h3 className="side-title right">GREEN TEAM</h3>
        <div className="bars-container">
          {rightBars.map((x, idx) => (
            <div key={idx} className="bar-wrapper">
              <div
                className="bar right-bar"
                style={{
                  height: `${getBarHeight(x)}px`,
                  backgroundColor: getBarColor(x, false)
                }}
              />
              <span className="bar-value">{x}X</span>
              <span className="bar-label">{idx + 1}{idx === 2 ? 'rd' : idx === 0 ? 'st' : 'nd'}</span>
            </div>
          ))}
        </div>
        <div className="bet-buttons">
          <button
            className={`bet-btn free-bet-btn ${disabled ? 'disabled' : ''}`}
            onClick={() => onBet('right', true)}
            disabled={disabled || !gameActive}
          >
            FREE BET
          </button>
          <button
            className={`bet-btn green-bet-btn ${disabled ? 'disabled' : ''}`}
            onClick={() => onBet('right', false)}
            disabled={disabled || !gameActive}
          >
            BET
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraphSection;