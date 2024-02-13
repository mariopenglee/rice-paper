import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import './Token.css';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';



interface TokenProps {
  token: any;
  cellSize: number;
  getDotFromCursorPosition: (x: number, y: number) => { DotX: number, DotY: number };
  deleteToken: (id: string) => void;
  inventoryRef: any;
  setDraggingToken: (token: any) => void;
}

export default function Token({ token, cellSize, getDotFromCursorPosition, deleteToken, inventoryRef, setDraggingToken }: TokenProps) {
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
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState(token.label);
  const [labelVisibility, setLabelVisibility] = useState(true);
  const [overInventory, setOverInventory] = useState(false);

  const isOverInventory = useCallback((x: number, y: number) => {
    if (!inventoryRef.current) {
      return false;
    }
    const inventoryRect = inventoryRef.current.getBoundingClientRect();
    
    const tokenRect = { x, y };
    if (
      tokenRect.x > inventoryRect.x &&
      tokenRect.x < inventoryRect.x + inventoryRect.width &&
      tokenRect.y > inventoryRect.y &&
      tokenRect.y < inventoryRect.y + inventoryRect.height
    ) {
      return true;
    }
    return false;
  }
  , [inventoryRef]);

  const handleDrag = useCallback((x: number, y: number) => {
    if (isOverInventory(x, y)) {
      setOverInventory(true);
    }
    else {
      setOverInventory(false);
    }
    const { DotX, DotY } = getDotFromCursorPosition(x, y);
    console.log('dot', DotX, DotY);
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

  useEffect(() => {
    // console.log('Token updated:', token.id);
    // console.log('labelvisibility:', labelVisibility);
  }
  ), [token, renaming];

  return (
    <React.Fragment>
      {isDragging &&
      (
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
              opacity: 0.5,
              display: overInventory ? 'none' : 'block',
            }}
          ></div>
          {/* SVG Overlay */}
          <svg style={{ 
            position: 'absolute', 
            left: 0, 
            top: 0, 
            width: '100%', 
            height: '100%', 
            pointerEvents: 'none',
            zIndex: '100',
            display: overInventory ? 'none' : 'block',
             }}>
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
          background: token.color,
          left: `${positions.x}px`,
          top: `${positions.y}px`,
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          backgroundImage: `url(${token.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: overInventory ? 0.5 : 1,
        }}
        drag
        dragMomentum={false}
        layout
        transition={{
          duration: 0.2,
        }}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0}
        onPointerDown={(event) => event.stopPropagation()}
        onContextMenu={(event) => {
          event.preventDefault();
          deleteToken(token.id);
        }}
        onDragStart={() => {
          setDraggingToken(
            {
              id: token.id,
              x: positions.x,
              y: positions.y,
              color: token.color,
              label: label,
              image: token.image,
            }
          );
        }}
        onDragEnd={(_, info) =>
          {
            if (isDragging) {
              handleDragEnd(info);
              setDraggingToken(null);
            }
          }}
        onDrag={(_, info) => {
          // Prevent dragging if renaming is in progress
          if (!renaming) {
            handleDrag(info.point.x, info.point.y);
          }
        }}
        onDoubleClick={() => setRenaming(true)}
      >
        <div
          className={'token-label-container'}
          style={{
           pointerEvents: renaming ? 'auto' : 'none',
          }}
        >
          {renaming ? (
            <>
              <input
                className={'token-label-input'}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={() => setRenaming(false)}
                autoFocus
                autoSave='true'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setRenaming(false);
                  }
                }}
              />
              <button
                onPointerDown={(e) => {
                  e.preventDefault(); // Prevents the input from losing focus
                  setRenaming(false);
                  setLabelVisibility(!labelVisibility);
                }}
                className={'visibility-button'}
              >
                {labelVisibility ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </button>
            </>
          ) : (
            label && (
              <span
                className={'token-label'}
                onClick={() => setRenaming(true)}
              >
                {labelVisibility ? label : '...'}
              </span>
            )
          )}
        </div>

      </motion.div>
    </React.Fragment>
  );
};


