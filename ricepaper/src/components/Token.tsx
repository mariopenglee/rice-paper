import React, { memo, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import './Token.css';

interface TokenProps {
  token: any;
  cellSize: number;
  layerIndex: number;
  layerOpacity: number;
  getDotFromCursorPosition: (x: number, y: number) => { DotX: number, DotY: number };
}

const Token: React.FC<TokenProps> = ({ token, cellSize, layerIndex, layerOpacity, getDotFromCursorPosition }) => {
  const [positions, setPositions] = useState({
    x: token.x * cellSize - cellSize / 2,
    y: token.y * cellSize - cellSize / 2,
  });

  const [previewPositions, setPreviewPositions] = useState({
    x: token.x * cellSize - cellSize / 2,
    y: token.y * cellSize - cellSize / 2,
  });

  const [startDragPosition, setStartDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [distanceInCells, setDistanceInCells] = useState(0); 

  const handleDrag = useCallback((x: number, y: number) => {
    const { DotX, DotY } = getDotFromCursorPosition(x, y);

    if (previewPositions.x !== DotX * cellSize - cellSize / 2 || 
        previewPositions.y !== DotY * cellSize - cellSize / 2) {
      setPreviewPositions({
        x: DotX * cellSize - cellSize / 2,
        y: DotY * cellSize - cellSize / 2,
      });
    }
    if (!isDragging) {
      setIsDragging(true);
      setStartDragPosition({ x: positions.x, y: positions.y });
    }
    const { x: deltaX, y: deltaY } = {
      x: DotX * cellSize - cellSize / 2 - startDragPosition.x,
      y: DotY * cellSize - cellSize / 2 - startDragPosition.y,
    };
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2) / cellSize;
    
    if (distance !== distanceInCells) {
      setDistanceInCells(distance);
    }

  }, [cellSize, getDotFromCursorPosition, isDragging, previewPositions, positions]);

  const handleDragEnd = useCallback((info: { offset: { x: number; y: number } }) => {
    setDistanceInCells(0);
    const deltaX = Math.round(info.offset.x / cellSize);
    const deltaY = Math.round(info.offset.y / cellSize);
    setPositions({
      x: positions.x + deltaX * cellSize,
      y: positions.y + deltaY * cellSize,
    });
    setPreviewPositions({
      x: positions.x,
      y: positions.y,
    });
    setIsDragging(false);
    
  }, [cellSize, positions]);

  return (
    <React.Fragment>
      {isDragging && (
        <>
          <div
            className={`token token-${token.id} preview`}
            style={{
              position: 'absolute',
              cursor: 'pointer',
              borderRadius: '50%',
              border: '2px dashed gray',
              background: 'none',
              left: `${previewPositions.x}px`,
              top: `${previewPositions.y}px`,
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              zIndex: layerIndex + 1,
              opacity: 0.5,
            }}
          ></div>
          {/* SVG Overlay */}
          <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <line
              x1={startDragPosition.x + cellSize / 2}
              y1={startDragPosition.y + cellSize / 2}
              x2={previewPositions.x + cellSize / 2}
              y2={previewPositions.y + cellSize / 2}
              stroke="gray"
              strokeWidth="2"
              strokeDasharray="4"
            />
            {/* Circle showing the radius of movement */}
            <circle
              cx={startDragPosition.x + cellSize / 2}
              cy={startDragPosition.y + cellSize / 2}
              r={distanceInCells * cellSize}
              stroke="gray"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4"
            />
            {/* Text indicating the distance in cells */}
            <text
              x={startDragPosition.x + cellSize / 2 + 10} // Adjust as necessary for visibility
              y={startDragPosition.y + cellSize / 2 - 10} // Adjust as necessary for visibility
              fill="gray"
              fontSize="16"
              fontFamily="Arial"
            >
              {`${distanceInCells.toFixed(1)} cells`}
            </text>
          </svg>
        </>
      )}

      <motion.div
        className={`token token-${token.id}`}
        style={{
          position: 'absolute',
          cursor: 'pointer',
          borderRadius: '50%',
          background: token.color,
          left: `${positions.x}px`,
          top: `${positions.y}px`,
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          zIndex: `${layerIndex + 10}`,
          opacity: layerOpacity,
        }}
        drag
        dragMomentum={false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0}
        onPointerDown={(event) => event.stopPropagation()}
        onDragEnd={(event, info) => handleDragEnd(info)}
        onDrag={(event, info) => handleDrag(info.point.x, info.point.y)}
      ></motion.div>
    </React.Fragment>
  );
};

export default memo(Token);
