// src/components/CarouselVideos.jsx
import { useRef, useState, useEffect } from 'react';
import './CarouselVideos.css';

const CarouselVideos = ({ videos, onSelectPower }) => {
  const carouselRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div
      ref={carouselRef}
      className="carousel-container"
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {videos.map((video, index) => (
        <div key={index} className="carousel-item" onClick={() => onSelectPower?.(index)}>
          <div className="video-wrapper">
            <video
              src={`/videos/v${index + 1}.mp4`}
              autoPlay
              loop
              muted
              playsInline
              className="circular-video"
            />
          </div>
          <span className="power-name">POWER{index + 1}</span>
          <span className="power-value">{video.x}X</span>
        </div>
      ))}
    </div>
  );
};

export default CarouselVideos;