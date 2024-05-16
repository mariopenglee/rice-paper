import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import InventoryIcon from '@mui/icons-material/Inventory';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Reorder } from 'framer-motion';
import ReactDOM from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import './Inventory.css';
import { roundToNearestDot, cellSize } from '../utils';
import { useDispatch, useSelector } from 'react-redux';
import {
    tokenDraggingStarted,
    tokenAdded,
    selectDraggingTokens,
  } from '../redux/tokens/tokensSlice';

import { TokenType } from '../redux/store';
interface InventoryProps {
    innerRef: any;
    gridRef: any;
}
import {
    inventoryItemAdded,
    inventoryItemRemoved,
    inventoryItemLabelUpdated,
    inventoryItemsSet,
    selectInventoryItems,
} from '../redux/inventory/inventorySlice';

import {
    selectSelectedLayer,
} from '../redux/layers/layersSlice';

import { 
    selectSelectedColor,
 } from '../redux/colors/colorsSlice';

export default function Inventory({ innerRef, gridRef }: InventoryProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewPositions, setPreviewPositions] = useState({ x: 0, y: 0 });
    const [overInventory, setOverInventory] = useState(false);
    const [token, setToken] = useState<TokenType | null>(null);
    const [isOnGrid, setIsOnGrid] = useState(false);
    const [editingToken, setEditingToken] = useState<string | null>(null);

    const dispatch = useDispatch();
    const selectedLayer = useSelector(selectSelectedLayer);
    const selectedColor = useSelector(selectSelectedColor);
    const draggingTokens = useSelector(selectDraggingTokens);
    const inventoryItems = useSelector(selectInventoryItems);

    const moveTokensToInventory = (tokens: TokenType[]) => {
        console.log('moving tokens to inventory', tokens);
        tokens.forEach((token) => {
            dispatch(inventoryItemAdded(token));
        });
    };

    const removeTokenFromInventory = (id: string) => {
        console.log('removing token from inventory', id);
        dispatch(inventoryItemRemoved(id));
    }

    const checkIfOnGrid = (x: number, y: number) => {
        if (!gridRef.current) {
            return false;
        }
        const gridRect = gridRef.current.getBoundingClientRect();
        const tokenRect = { x, y };
        if (
            tokenRect.x > gridRect.x &&
            tokenRect.x < gridRect.x + gridRect.width &&
            tokenRect.y > gridRect.y &&
            tokenRect.y < gridRect.y + gridRect.height
        ) {
            return true;
        }
        return false;
    }

    const handleDragStart = (token: TokenType) => {
        setIsDragging(true);
        setToken(token);
        console.log('dragging token', token);
        dispatch(tokenDraggingStarted(token));
    }

    const handleDrag = (x: number, y: number) => {
        if (checkIfOnGrid(x, y)) {
            console.log('on grid');
            setIsOnGrid(true);
        }
        else {
            console.log('off grid');
            setIsOnGrid(false);
        }
        const { x: DotX, y: DotY } = roundToNearestDot(x, y, gridRef);
        if (previewPositions.x !== DotX ||
            previewPositions.y !== DotY) {
          setPreviewPositions({
            x: DotX,
            y: DotY,
          });
        }
    }

    const handleDragEnd = (x: number, y: number) => {
        if (!overInventory && isOnGrid && token) {
            const { x: DotX, y: DotY } = roundToNearestDot(x, y, gridRef);
            console.log('dropping token on grid');
            dispatch(tokenAdded({
                
                id: token['id'],
                x: DotX,
                y: DotY,
                color: token['color'],
                label: token['label'],
                layer: selectedLayer,
                labelVisibility: true,
                width: token['width'],
                height: token['height'],
                
            }));

            removeTokenFromInventory(token['id']);
            setIsDragging(false);
        setPreviewPositions({ x: 0, y: 0 });
        setToken(null);
        dispatch(tokenDraggingStarted(null));
        }
        
    }

    const renderAddTokenButton = () => {
        return (
            <li
            className="inventory-cell"
            
            >
                 <motion.div 
                 className="inventory-cell-token-preview"
                 whileHover={
                    {
                        backgroundColor: selectedColor.color,

                    }
                 }
                 onClick={() => {
                    const newToken = {
                        id: uuidv4(),
                        x: 0,
                        y: 0,
                        color: selectedColor.color,
                        label: ``,
                        layer: selectedLayer,
                        labelVisibility: true,
                        width: cellSize,
                        height: cellSize,
                    };
                    dispatch(inventoryItemAdded(newToken));
                }}
                 >
                    <AddIcon />
                </motion.div>
                    <div className="inventory-cell-label"
                    style={{ 
                        pointerEvents: 'none',
                        color: 'black',
                        backgroundColor: 'transparent',
                        border: 'none',
                     }}
                    >
                        {`Add Token`}
                    </div>
            </li>
        );
    }
    
    const renderInventoryGrid = () => {
        const grid = inventoryItems.map((token : TokenType) => {
            return (
                <Reorder.Item
                    key={token['id']}
                    value={token}
                    className="inventory-cell"
                    drag
                    onDragStart={() => handleDragStart(token)}
                    onDrag={(_, info) => {
                        handleDrag(info.point.x, info.point.y);
                    }
                    }
                    onDragEnd={(_, info) => {
                        handleDragEnd(info.point.x, info.point.y);
                        

                    }}

                    onDoubleClick={() => {
                        console.log('editing token', token);
                        setEditingToken(token['id']);
                    }
                    }
                >
                    <button
                    className="token-delete-button"
                    onClick={() => removeTokenFromInventory(token['id'])}
                    >
                        <DeleteIcon />
                    </button>
                    <motion.div 
                    className="inventory-cell-token"
                    style={{ 
                        pointerEvents: 'none',
                        backgroundColor: `${token['color']}`,
                        // capture the ratio of the token's width and height to the cell size
                        aspectRatio: `${token['width']}/${token['height']}`,
                        
                     }}
                    

                    >
                    </motion.div>
                    {
                        editingToken === token['id'] ?
                        (

              <input
                className='inventory-cell-label-input'
                value={token['label']}
                onChange={(e) => {
                    dispatch(inventoryItemLabelUpdated({ id: token['id'], label: e.target.value }));
                }
                }
                onBlur={() => setEditingToken(null)}
                autoFocus
                autoSave='true'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditingToken(null);
                  }
                }}
              />
                        )
                        :
                        <div 
                        className="inventory-cell-label"
                        onClick={() => setEditingToken(token['id'])}
                        >{token['label']}</div>}
                </Reorder.Item>
            );
        });
        return (
        <Reorder.Group 
        className={`inventory-grid ${isExpanded ? 'expanded' : ''}`}
        values={inventoryItems}
        onReorder={(values) => {
            dispatch(inventoryItemsSet(values));
        }
        }
        axis='x'
        >
            {grid}
            {renderAddTokenButton()}
        </Reorder.Group>);
      };

      

      
    useEffect(() => {
        console.log('Inventory mounted');
        return () => {
            console.log('Inventory unmounted');
        }
    }
    , []);

    const renderPreview = () => {
        if (!gridRef.current || !token) {
            return null;
        }
        const preview = (
            <div 
        className={`preview-container`}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 100,
        }}
        >
          <div
            className={`token preview`}
            style={{
              position: 'absolute',
              cursor: 'pointer',
              borderRadius: '50%',
              border: '2px dashed gray',
              background: 'none',
              left: `${previewPositions.x}px`,
              top: `${previewPositions.y}px`,
              width: `${token['width']}px`,
              height: `${token['height']}px`,
              opacity: 0.5,
            }}
          ></div>
        </div>
        );
        return ReactDOM.createPortal(preview, gridRef.current);
    }

    return (
        <React.Fragment>
        {isDragging && isOnGrid && renderPreview()}
        <motion.div
        className={`inventory-row ${isExpanded ? 'expanded' : ''}`}
        ref={innerRef}
        onPointerUp={() => {
            if(draggingTokens) {
                console.log('leaving tokens in inventory', draggingTokens);
                if (isDragging) {
                    dispatch(tokenDraggingStarted(null));
                }
                else {
                moveTokensToInventory(draggingTokens);
                }
            }
            else {
                console.log('no token to drop');
            }
        }
        }
        onPointerEnter={() => setOverInventory(true)}
        onPointerLeave={() => setOverInventory(false)}
            >
            <div className='inventory-header'>
                {
                    isExpanded ? 
                    <button
                    className='delete-all-button'
                    onClick={() => dispatch(inventoryItemsSet([]))}
                    >
                        <DeleteForeverIcon />
                    </button>
                    : null

                }
                <InventoryIcon />
                <button
                className='inventory-expand-button'
                onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
                </button>


            </div>
            <div className='inventory-grid-container'>
                {renderInventoryGrid()}
            </div>

        </motion.div>
        </React.Fragment>
    )
}