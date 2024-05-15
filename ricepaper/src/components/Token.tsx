import React, { useState, useCallback } from 'react';
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
  tokenSelected,
  tokenResized,
  selectedTokensMoved,
  selectedTokensResized,
  selectSelectedTokens,
} from '../redux/tokens/tokensSlice';

import {
  selectPressingShift,
} from '../redux/currentTool/currentToolSlice';

import { TokenType } from '../redux/store';

interface TokenProps {
  token: TokenType;
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
  const [isRenaming, setIsRenaming] = useState(false);
  const [overInventory, setOverInventory] = useState(false);

  const dispatch = useDispatch();
  const selectedTokens = useSelector(selectSelectedTokens);
  // create the selected boolean, which is true if the tokenid is in the selectedTokens array
  const selected = selectedTokens.some((selectedToken: any) => selectedToken.id === token.id);

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
    if (isRenaming || isResizing) {
      return; //
    }
    setPreviewSize({
      width: token.width,
      height: token.height,
    })
    setDistanceInCells(0);
    setIsDragging(true);
    setStartDragPosition({
      x: token.x + token.width / 2,
      y: token.y + token.height / 2,
    });
    if (selected) {

      dispatch(tokenDraggingStarted(selectedTokens));
    }
    else {
      dispatch(tokenDraggingStarted([token]));
    }
  };

  const handleDrag = (x: number, y: number) => {
    if (isRenaming || isResizing) {
      return; //
    }
    if (isOverInventory(x, y)) {
      setOverInventory(true);
    }
    else {
      setOverInventory(false);
    }
    const { x : DotX, y: DotY } = roundToNearestDot(
      x - token.width / 2,
      y - token.height / 2, 
      gridRef);
    if (previewPositions.x !== DotX ||
      previewPositions.y !== DotY) {
    setPreviewPositions({
      x: DotX,
      y: DotY,
    });
  }

    const { x: deltaX, y: deltaY } = {
      x: DotX - startDragPosition.x + token.width / 2,
      y: DotY - startDragPosition.y + token.height / 2,
    };
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2) / cellSize;
    
    if (distance !== distanceInCells) {
      setDistanceInCells(distance);
    }

  };

  const handleDragEnd = (info: any) => {
    if (isRenaming || isResizing) {
      return; //
    }
    setDistanceInCells(0);
    setIsDragging(false);
    if (selected) {
      if (isOverInventory(info.point.x, info.point.y)) {
        // If token is over inventory, remove it
        selectedTokens.forEach((SelectedToken: TokenType) => {
          dispatch(tokenRemoved({ id: SelectedToken.id }));
          tokenSelected([]);
          
        });
      }
      else {
        const { x: deltaX, y: deltaY } = {
          x: previewPositions.x - startDragPosition.x + token.width / 2,
          y: previewPositions.y - startDragPosition.y + token.height / 2,
        };
          dispatch(selectedTokensMoved({ x: deltaX, y: deltaY }));
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
  };

  // renaming

  const handleLabelUpdate = (newLabel: string) => {
    // Dispatch an action to update the label for all selected tokens
    if (selected) {
      selectedTokens.forEach((token: TokenType) => {
        dispatch(tokenLabelUpdated({ id: token.id, label: newLabel }));
      });
    }
    else {
      dispatch(tokenLabelUpdated({ id: token.id, label: newLabel }));
    }
  };

  const handleToggleLabelVisibility = () => {
    // Toggle visibility for all selected tokens
    if (selected) {
      selectedTokens.forEach((token: TokenType) => {
        dispatch(tokenLabelVisibilityToggled({ id: token.id, newVisibility: !token.labelVisibility }));
      });
    }
    else {
      dispatch(tokenLabelVisibilityToggled({ id: token.id }));
    }
  };
  
  // resizing
  const showResizeHandles = useSelector(selectPressingShift);


  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState(''); // 'nw', 'ne', 'sw', 'se', or ''
  const [previewSize, setPreviewSize] = useState({ width: token.width, height: token.height });
  const [resizeMove, setResizeMove] = useState({ x: 0, y: 0 });
  const handleResize = (x: number, y: number) => {

    
    if (isRenaming || isDragging) {
      return; //
    }
    const snapX = Math.round(x / cellSize) * cellSize;
    const snapY = Math.round(y / cellSize) * cellSize;
    if (snapX === 0 && snapY === 0) {
      return;
    }
    if (snapX === resizeMove.x && snapY === resizeMove.y) {
      return;
    }
    console.log('Resizing', { snapX, snapY });
    const newWidth = resizeStart.includes('w') ? token.width - snapX : token.width + snapX;
    const newHeight = resizeStart.includes('n') ? token.height - snapY : token.height + snapY;
    setPreviewSize({
      width: Math.max(newWidth, cellSize),
      height: Math.max(newHeight, cellSize),
    });
    const newX = resizeStart.includes('w') ? token.x + snapX : token.x;
    const newY = resizeStart.includes('n') ? token.y + snapY : token.y;
    setPreviewPositions({
      x: Math.min(newX, token.x + token.width - cellSize),
      y: Math.min(newY, token.y + token.height - cellSize),
    });
    setResizeMove({
      x: snapX,
      y: snapY,
    });
    
  };

  const handleResizeEnd = () => {
    if (isRenaming || isDragging) {
      return; //
    }
    if (selected) {
        dispatch(selectedTokensResized({
          width: previewSize.width,
          height: previewSize.height,
        }));
        dispatch(selectedTokensMoved({
          x: previewPositions.x - token.x,
          y: previewPositions.y - token.y,
        }));

    }
    else {
    dispatch(tokenResized({ id: token.id, width: previewSize.width, height: previewSize.height }));
    dispatch(tokenMoved({ id: token.id, x: previewPositions.x, y: previewPositions.y }));
    }
  };


  return (
    <React.Fragment>
      {(isDragging || isResizing) &&
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
              width: `${previewSize.width}px`,
              height: `${previewSize.height}px`,
              opacity: 0.5,
              display: overInventory ? 'none' : 'block',
            }}
          ></div>
          {/* SVG Overlay */}
         { isDragging &&
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
              x1={startDragPosition.x}
              y1={startDragPosition.y}
              x2={previewPositions.x + token.width / 2}
              y2={previewPositions.y + token.height / 2}
              stroke="gray"
              strokeWidth="2"
              strokeDasharray="4"
            />
            {/* Circle showing the radius of movement */}
            <circle
              cx={startDragPosition.x}
              cy={startDragPosition.y}
              r={distanceInCells * cellSize}
              stroke="gray"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4"
            />
            <text
              x={startDragPosition.x + 10} // Adjust as necessary for visibility
              y={startDragPosition.y - 10} // Adjust as necessary for visibility
              fill="gray"
              fontSize="16"
              fontFamily="Arial"
            >
              {`${distanceInCells.toFixed(1)} cells`}
            </text>
          </svg>}
        </>
      )}

      <motion.div
        className={`token token-${token.id}`}
        style={{
          background: token.color,
          left: `${token.x}px`,
          top: `${token.y}px`,
          width: `${token.width}px`,
          height: `${token.height}px`,
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
          type: 'spring',
          stiffness: 200,
          damping: 25,
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
        onDoubleClick={() => setIsRenaming(true)}

      
      >
        {/* the four corners of the token, used for resizing */}
        {showResizeHandles &&
          <div 
        className='token-resize-container'
        >
        <motion.div 
        className={'token-left-up-corner'}
        style={
          {
            position: 'absolute',
            left: 0,
            top: 0,
            width: '10px',
            height: '10px',
            cursor: 'nw-resize',
            backgroundColor: 'gray',
            border: '1px solid white',
          }
        }
        drag
        dragMomentum={false}
        layout
        transition={{
          duration: 0.2,
        }}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0}
        onDragStart={() => {
          setIsResizing(true);
          setResizeStart('nw');
        }}
        onDragEnd={() => {
          setIsResizing(false);
          setResizeStart('');
          handleResizeEnd();
        }}
        onDrag={(_, info) => {
          handleResize(info.offset.x, info.offset.y);
        }}
        />
        <motion.div
          className={'token-right-up-corner'}
          style={
            {
              position: 'absolute',
              right: 0,
              top: 0,
              width: '10px',
              height: '10px',
              cursor: 'ne-resize',
              backgroundColor: 'gray',
              border: '1px solid white',
            }
          }
          drag
          dragMomentum={false}
          layout
          transition={{
            duration: 0.2,
          }}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0}
          onDragStart={() => {
            setIsResizing(true);
            setResizeStart('ne');
          }}
          onDragEnd={() => {
            setIsResizing(false);
            setResizeStart('');
            handleResizeEnd();
          }}
          onDrag={(_, info) => {
            handleResize(info.offset.x, info.offset.y);
          }}
        />
        <motion.div
          className={'token-left-down-corner'}
          style={
            {
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '10px',
              height: '10px',
              cursor: 'sw-resize',
              backgroundColor: 'gray',
              border: '1px solid white',
            }
          }
          drag
          dragMomentum={false}
          layout
          transition={{
            duration: 0.2,
          }}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0}
          onDragStart={() => {
            setIsResizing(true);
            setResizeStart('sw');
          }}
          onDragEnd={() => {
            setIsResizing(false);
            setResizeStart('');
            handleResizeEnd();
          }}
          onDrag={(_, info) => {
            handleResize(info.offset.x, info.offset.y);
          }}
        />
        <motion.div
          className={'token-right-down-corner'}
          style={
            {
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: '10px',
              height: '10px',
              cursor: 'se-resize',
              backgroundColor: 'gray',
              border: '1px solid white',
            }
          }
          drag
          dragMomentum={false}
          layout
          transition={{
            duration: 0.2,
          }}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0}
          onDragStart={() => {
            setIsResizing(true);
            setResizeStart('se');
          }}
          onDragEnd={() => {
            setIsResizing(false);
            setResizeStart('');
            handleResizeEnd();
          }}
          onDrag={(_, info) => {
            handleResize(info.offset.x, info.offset.y);
          }}
          
        />
        </div>}
        <div
          className={'token-label-container'}
          style={{
           pointerEvents: isRenaming ? 'auto' : 'none',
          }}
        >
          {isRenaming ? (
            <>
              <input
                className={'token-label-input'}
                value={token.label}
                onChange={(e) => handleLabelUpdate(e.target.value)}
                onBlur={() => 
                  {
                    setIsRenaming(false);
                  }
                }
                autoFocus
                autoSave='true'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsRenaming(false);
                    
                  }
                }}
              />
              <button
                onPointerDown={() => {
                  handleToggleLabelVisibility();
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
                onClick={() => setIsRenaming(true)}
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
    prevProps.token.width !== nextProps.token.width ||
    prevProps.token.height !== nextProps.token.height ||
    prevProps.token.labelVisibility !== nextProps.token.labelVisibility ||
    prevProps.inventoryRef !== nextProps.inventoryRef ||
    prevProps.gridRef !== nextProps.gridRef;
    
  if (shouldRerender) {
    console.log('Re-rendering due to change in props:', { prevProps, nextProps });
  }
  return !shouldRerender;
});
export default MemoizedToken;