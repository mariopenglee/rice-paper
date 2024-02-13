import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import InventoryIcon from '@mui/icons-material/Inventory';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DeleteIcon from '@mui/icons-material/Delete';
import { Reorder } from 'framer-motion';
import ReactDOM from 'react-dom';
import './Inventory.css';
interface InventoryProps {
    innerRef: any;
    draggingToken: any;
    setDraggingToken: (token: any) => void;
    deleteToken: (id: string) => void;
    gridRef: any;
    addToken: (token: any) => void;
    getDotFromCursorPosition: (x: number, y: number) => { DotX: number, DotY: number };
    selectedLayer: string;

}


interface TokenType {
    id: string;
    x: number;
    y: number;
    color: string;
    layer: string;
    label: string;
}

export default function Inventory({ innerRef, draggingToken, setDraggingToken, deleteToken, gridRef, addToken, getDotFromCursorPosition, selectedLayer }: InventoryProps) {
    const [inventoryTokens, setInventoryTokens] = useState<TokenType[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewPositions, setPreviewPositions] = useState({ x: 0, y: 0 });
    const [overInventory, setOverInventory] = useState(false);
    const [token, setToken] = useState<TokenType | null>(null);
    const [isOnGrid, setIsOnGrid] = useState(false);
    const cellSize = 30;

    const moveTokenToInventory = (token: TokenType) => {
        console.log('moving token to inventory', token);
        setInventoryTokens([...inventoryTokens, token]);
        deleteToken(token['id']);
    };

    const removeTokenFromInventory = (id: string) => {
        console.log('removing token from inventory', id);
        setInventoryTokens(inventoryTokens.filter((token) => token['id'] !== id));
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

    const handleDrag = (x: number, y: number) => {
        if (checkIfOnGrid(x, y)) {
            console.log('on grid');
            setIsOnGrid(true);
        }
        else {
            console.log('off grid');
            setIsOnGrid(false);
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
    }

    const handleDragEnd = (x: number, y: number) => {
        if (!overInventory && isOnGrid && token) {
            const { DotX, DotY } = getDotFromCursorPosition(x, y);
            console.log('dropping token on grid');
            addToken({
                id: token['id'],
                x: DotX,
                y: DotY,
                color: token['color'],
                label: token['label'],
                layer: selectedLayer,
                
            });
            removeTokenFromInventory(token['id']);
        }
    }


    const renderInventoryGrid = () => {
        const grid = inventoryTokens.map((token) => {
            console.log('rendering token', token);
            return (
                <Reorder.Item
                    key={token['id']}
                    value={token}
                    className="inventory-cell"
                    drag
                    onDragStart={() => {
                        setIsDragging(true);
                        setToken(token);
                        console.log('dragging token', token);
                        setDraggingToken(token);
                    }}

                    onDrag={(_, info) => {
                        handleDrag(info.point.x, info.point.y);
                        console.log('dragging token', token);
                    }
                    }

                    onDragEnd={(_, info) => {
                        handleDragEnd(info.point.x, info.point.y);
                        setIsDragging(false);
                        setPreviewPositions({ x: 0, y: 0 });
                        setToken(null);
                        setDraggingToken(null);

                    }}
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
                     }}
                    

                    >
                    </motion.div>
                    <div className="inventory-cell-label">{token['label']}</div>
                </Reorder.Item>
            );
        });

        
      
        return (
        <Reorder.Group 
        className={`inventory-grid ${isExpanded ? 'expanded' : ''}`}
        values={inventoryTokens}
        onReorder={setInventoryTokens}
        axis='x'
        >
            {grid}
        </Reorder.Group>);
      };

      
    useEffect(() => {
        console.log('Inventory mounted');
        return () => {
            console.log('Inventory unmounted');
        }
    }
    , [inventoryTokens]);

    const renderPreview = () => {
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
              width: `${cellSize}px`,
              height: `${cellSize}px`,
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
            if(draggingToken) {
                console.log('leaving token in inventory', draggingToken);
                if (isDragging) {
                    setDraggingToken(null);
                }
                else {
                moveTokenToInventory(draggingToken);
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
                    onClick={() => setInventoryTokens([])}
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