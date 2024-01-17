import React from 'react';
//import './Tile.css'; // Assuming you have a Tile.css file for styles

interface TileProps {
  color: string;
  style: React.CSSProperties;
  onClick: () => void;
}

const Tile: React.FC<TileProps> = ({ color, style, onClick }) => {
  return (
    <div className="tile" style={{ ...style, background: color }} onClick={onClick}></div>
  );
};

export default Tile;
