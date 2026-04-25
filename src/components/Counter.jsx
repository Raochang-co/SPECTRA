// src/components/Counter.jsx
import { useState, useEffect } from 'react';
import './Counter.css';

const Counter = ({ initialMin = 2334, initialMax = 9999, label }) => {
  const [value, setValue] = useState(Math.floor(Math.random() * (initialMax - initialMin + 1) + initialMin));

  useEffect(() => {
    const interval = setInterval(() => {
      const change = Math.floor(Math.random() * 21) - 10;
      setValue(prev => {
        let newVal = prev + change;
        if (newVal < initialMin) newVal = initialMin;
        if (newVal > initialMax) newVal = initialMax;
        return newVal;
      });
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [initialMin, initialMax]);

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <div className="counter-container">
      {label && <span className="counter-label">{label}</span>}
      <div className="counter-value">{formatNumber(value)}</div>
    </div>
  );
};

export default Counter;