import React, { useState } from 'react';
import './IsometricGrid.css'; // Import CSS for styling

// Types for tiles
type TileType = 'cube' | 'halfCube';
interface Tile {
  type: TileType;
  color: string;
  layer: number;
  x: number;
  y: number;
}

const IsometricGrid: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [activeLayer, setActiveLayer] = useState<number>(1);
  const [previewAll, setPreviewAll] = useState<boolean>(false);

  const addTestTile = () => {
    handleTilePlacement(0, 0, 'cube', 'red'); // Adds a red cube at position (0, 0)
  };

  // Function to handle tile placement
  const handleTilePlacement = (x: number, y: number, type: TileType, color: string) => {
    const newTile = { type, color, layer: activeLayer, x, y };
    setTiles([...tiles, newTile]);
  };

  // Function to handle tile removal
  const handleTileRemoval = (tileIndex: number) => {
    setTiles(tiles.filter((_, index) => index !== tileIndex));
  };

  // Function to toggle layers
  const toggleLayer = (layer: number) => {
    setActiveLayer(layer);
    setPreviewAll(false);
  };

  // Function to render a tile (SVG)
  const renderTile = (tile: Tile) => {
    const tileWidth = 100; // Define the width of the tile
    const tileHeight = tile.type === 'cube' ? 100 : 50; // Height based on type

    const xOffset = tile.x * tileWidth * 0.5;
    const yOffset = tile.y * tileHeight * 0.5;

    const tileStyle = {
      fill: tile.color,
      stroke: 'black',
      strokeWidth: 2,
      opacity: (previewAll || tile.layer === activeLayer) ? 1 : 0.5
    };

    // SVG paths for cube and half-cube
    const cubePath = `M0 0 L${tileWidth} 0 L${tileWidth * 1.5} ${tileHeight / 2} L${tileWidth} ${tileHeight} L0 ${tileHeight} L-${tileWidth / 2} ${tileHeight / 2} Z`;
    const halfCubePath = `M0 0 L${tileWidth} 0 L${tileWidth * 1.5} ${tileHeight / 2} L${tileWidth} ${tileHeight} L0 ${tileHeight} Z`;

    return (
      <svg x={xOffset} y={yOffset} width={tileWidth * 1.5} height={tileHeight} style={tileStyle}>
        <path d={tile.type === 'cube' ? cubePath : halfCubePath} />
      </svg>
    );
  };

  return (
    <div className='isometric-grid'>
      <div className='menu'>
        <button onClick={() => toggleLayer(1)}>Layer 1</button>
        <button onClick={() => toggleLayer(2)}>Layer 2</button>
        <button onClick={() => toggleLayer(3)}>Layer 3</button>
        <button onClick={() => setPreviewAll(!previewAll)}>Preview All</button>
        <button onClick={addTestTile}>Add Test Tile</button>
      </div>
      <div className='grid'>
        {tiles.map((tile, index) => (
          <div key={index} onClick={() => handleTileRemoval(index)}>
            {renderTile(tile)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IsometricGrid;
