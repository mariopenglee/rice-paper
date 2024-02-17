import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import './Token.css';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { roundToNearestDot, cellSize } from '../utils';
import { useSelector, useDispatch } from 'react-redux';
import {
  tokenMoved,
  tokenRemoved,
  tokenDraggingStarted,
  tokenLabelUpdated,
  tokenLabelVisibilityToggled,
  selectSelectedTokens,
} from '../redux/tokens/tokensSlice';


interface TokenProps {
  token: any;
  inventoryRef: any;
  gridRef: any;
}

const Token = ({ token, inventoryRef, gridRef }: TokenProps) => {

  const [previewPositions, setPreviewPositions] = useState({
    x: token.x,
    y: token.y,
  });

  const [startDragPosition, setStartDragPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [distanceInCells, setDistanceInCells] = useState(0); 
  const [renaming, setRenaming] = useState(false);
  const [overInventory, setOverInventory] = useState(false);

  const dispatch = useDispatch();
  const selectedTokens = useSelector(selectSelectedTokens);
  const selected = selectedTokens.includes(token);

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

  const handleDragStart = () => {
    setDistanceInCells(0);
    setIsDragging(true);
    setStartDragPosition({
      x: token.x,
      y: token.y,
    });
    if (selected) {
      console.log('Selected tokens:', selectedTokens);
      dispatch(tokenDraggingStarted(selectedTokens));
    }
    else {
      dispatch(tokenDraggingStarted([token]));
    }
  };

  const handleDrag = (x: number, y: number) => {
    if (isOverInventory(x, y)) {
      setOverInventory(true);
    }
    else {
      setOverInventory(false);
    }
    const { x : DotX, y: DotY } = roundToNearestDot(x, y, gridRef);
    if (previewPositions.x !== DotX ||
      previewPositions.y !== DotY) {
    setPreviewPositions({
      x: DotX,
      y: DotY,
    });
  }

    const { x: deltaX, y: deltaY } = {
      x: previewPositions.x - startDragPosition.x,
      y: previewPositions.y - startDragPosition.y,
    };
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2) / cellSize;
    
    if (distance !== distanceInCells) {
      setDistanceInCells(distance);
    }

  };

  const handleDragEnd = (info: any) => {
    setDistanceInCells(0);
    setIsDragging(false);
    if (selected) {
      if (isOverInventory(info.point.x, info.point.y)) {
        // If token is over inventory, remove it
        selectedTokens.forEach((SelectedToken: any) => {
          dispatch(tokenRemoved({ id: SelectedToken.id }));
        });
      }
      else {
        selectedTokens.forEach((SelectedToken: any) => {
          const { x: DotX, y: DotY } = roundToNearestDot(SelectedToken.x + info.point.x - startDragPosition.x, SelectedToken.y + info.point.y - startDragPosition.y, gridRef);
          dispatch(tokenMoved({ id: SelectedToken.id, x: DotX, y: DotY }));
        });
      }
    }
    else {
      if (isOverInventory(info.point.x, info.point.y)) {
        // If token is over inventory, remove it
        dispatch(tokenRemoved({ id: token.id }));
      }
      else {
          dispatch(tokenMoved({ id: token.id, x: previewPositions.x, y: previewPositions.y }));
      }
    }
    dispatch(tokenDraggingStarted([]));
    setPreviewPositions({
      x: token.x,
      y: token.y,
    });
  };

  useEffect(() => {
    console.log('Token updated:', token.id);
    // console.log('labelvisibility:', labelVisibility);
  }
  ), [token];

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
          left: `${token.x}px`,
          top: `${token.y}px`,
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          backgroundImage: `url(${token.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: overInventory ? 0.5 : selected ? 0.8 : 1,
          border: selected ? '2px dashed lightgray' : 'none',
          
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
          dispatch(tokenRemoved({ id: token.id }));
        }}
        onDragStart={() => handleDragStart()}
        onDragEnd={(_, info) => handleDragEnd(info)}
        onDrag={(_, info) => {
          // Prevent dragging if renaming is in progress
            handleDrag(info.point.x, info.point.y);
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
                value={token.label}
                onChange={(e) => dispatch(tokenLabelUpdated({ id: token.id, label: e.target.value })) }
                onBlur={() => 
                  {
                    setRenaming(false);
                    dispatch(tokenLabelUpdated({ id: token.id, label: token.label }));
                  }
                }
                autoFocus
                autoSave='true'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setRenaming(false);
                    dispatch(tokenLabelUpdated({ id: token.id, label: token.label }));
                    
                  }
                }}
              />
              <button
                onPointerDown={() => {
                  dispatch(tokenLabelVisibilityToggled({ id: token.id }));
                }}
                className={'visibility-button'}
              >
                {token.labelVisibility ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </button>
            </>
          ) : (
            token.label && (
              <span
                className={'token-label'}
                onClick={() => setRenaming(true)}
              >
                {token.labelVisibility ? token.label : '...'}
              </span>
            )
          )}
        </div>

      </motion.div>
    </React.Fragment>
  );
}


const MemoizedToken = React.memo(Token, (prevProps, nextProps) => {
  const shouldRerender = prevProps.token.x !== nextProps.token.x ||
    prevProps.token.y !== nextProps.token.y ||
    prevProps.token.color !== nextProps.token.color ||
    prevProps.token.image !== nextProps.token.image ||
    prevProps.token.label !== nextProps.token.label ||
    prevProps.token.labelVisibility !== nextProps.token.labelVisibility ||
    prevProps.inventoryRef !== nextProps.inventoryRef ||
    prevProps.gridRef !== nextProps.gridRef;
    
  if (shouldRerender) {
    console.log('Re-rendering due to change in props:', { prevProps, nextProps });
  }
  return !shouldRerender;
});
export default MemoizedToken;