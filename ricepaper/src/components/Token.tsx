import React, { memo, useEffect, useState, useCallback } from 'react';
import { Token as TokenType } from '../types';
import { motion } from 'framer-motion';
import './Token.css';

interface TokenProps {
  token: TokenType;
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

  // New state for the preview position
  const [previewPositions, setPreviewPositions] = useState({
    x: token.x * cellSize - cellSize / 2,
    y: token.y * cellSize - cellSize / 2,
  });

  const [isDragging, setIsDragging] = useState(false); // New state to track dragging status

  const handleDrag = useCallback((x, y) => {
  const { DotX, DotY } = getDotFromCursorPosition(x, y);
  // Check if the token has moved to a new cell to minimize state updates
  if (previewPositions.x !== DotX * cellSize - cellSize / 2 || 
      previewPositions.y !== DotY * cellSize - cellSize / 2) {
    // Update the preview's position only if it has changed
    setPreviewPositions({
      x: DotX * cellSize - cellSize / 2,
      y: DotY * cellSize - cellSize / 2,
    });
  }
  // Only set dragging to true if it's not already set
  if (!isDragging) setIsDragging(true);
}, [cellSize, getDotFromCursorPosition, isDragging, previewPositions]);

const handleDragEnd = useCallback((info) => {
  //console.log(info.offset.x, info.offset.y);
  // calculate how many cells the token has moved
  const deltaX = Math.round(info.offset.x / cellSize);
  const deltaY = Math.round(info.offset.y / cellSize);
  // Update the token's position
  setPositions({
    x: positions.x + deltaX * cellSize - info.offset.x,
    y: positions.y + deltaY * cellSize - info.offset.y,
  });
  // Reset the preview position
  setPreviewPositions({
    x: positions.x,
    y: positions.y,
  });
  setIsDragging(false); // Reset dragging status
}, [cellSize, getDotFromCursorPosition, positions]);


useEffect(() => {
  //console.log('Token updated:', token.id);
}
);

  return (
    <React.Fragment>
      {/* Preview Overlay */}
      {isDragging && (
        <div
          className={`token token-${token.id} preview`}
          style={{
            position: 'absolute',
            cursor: 'pointer',
            borderRadius: '50%',
            border: '2px dashed gray', // Make the preview look different
            background: 'none',
            left: `${previewPositions.x}px`,
            top: `${previewPositions.y}px`,
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            zIndex: layerIndex + 1, // Ensure the preview is above the actual token
            opacity: 0.5, // Make the preview semi-transparent
          }}
        ></div>
      )}

      {/* Actual Token */}
      <motion.div
        className={`token token-${token.id}`}
        style={{
          position: 'absolute',
          cursor: 'pointer',
          borderRadius: '50%',
          border: '1px solid black',
          background: token.color,
          left: `${positions.x}px`,
          top: `${positions.y}px`,
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          zIndex: layerIndex,
          opacity: layerOpacity,
        }}
        drag
        dragMomentum={false}
        onPointerDown={(event) => 
          {
            event.stopPropagation();
            //console.log('Token clicked:', token.id);
          }
        }
        onDragEnd={(event, info) => handleDragEnd(info)}
        onDrag={(event, info) => handleDrag(info.point.x, info.point.y)}
      ></motion.div>
    </React.Fragment>
  );
};

export default memo(Token);
