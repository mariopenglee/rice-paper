// src/components/Grid.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './Grid.css';
import Toolbox from './Toolbox';
import Token from './Token';
import { Token as TokenType } from '../types';

interface GridCell {
    color: string;
    tokens?: TokenType[];
}


const Grid: React.FC = () => {
    const initialGridSize = 100; // Initial grid size
    const cellSize = 30; // Assuming each cell
    const initialColor = '#FFF8DC'; // Default color: rice paper
    const [gridSize, setGridSize] = useState(initialGridSize);
    const [painting, setPainting] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string>('#000000'); // Default painting color: Black
    const [tool, setTool] = useState('paintbrush'); // 'paintbrush' or 'pan'
    const [displayBorders, setDisplayBorders] = useState(false); // Whether to display borders around cells
    const gridRef = useRef<HTMLDivElement>(null); // Ref for the grid container
    const [zoom, setZoom] = useState(1); // Zoom level [0.1, 10]
    const [clickPositions, setClickPositions] = useState([]);

    const [tokens, setTokens] = useState<TokenType[]>([]); // State for tokens


    const handleScreenClick = (event: MouseEvent) => {
        const newClickPosition = { x: event.clientX, y: event.clientY };
        setClickPositions([...clickPositions, newClickPosition]);
    }



    // zoom related
    const zoomIn = () => {
        setZoom(zoom + 0.1);
    }

    const zoomOut = () => {
        setZoom(zoom - 0.1);
    }

    // Initial color palette
    const initialPalette = ['#0D0D0D', '#4D4D4D', '#B3B3B3', '#5C4033', '#8B1A1A', '#D0F0C0',
        '#789EC6', '#FFF8DC', '#7D7D7D', '#1A2421']
    const [colorPalette, setColorPalette] = useState<string[]>(initialPalette);
    const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number | null>(null);


    // Create an initial grid based on the grid size
    const createInitialGrid = (): GridCell[][] => {
        return Array.from({ length: gridSize }, () =>
            Array.from({ length: gridSize }, () => ({ color: initialColor }))
        );
    };

    

    // Function to add a new token
    const addToken = useCallback((x: number, y: number, token: TokenType) => {
        setTokens([...tokens, { ...token, x, y, id: tokens.length }]);
        console.log(tokens);
    }, [tokens]);

    // Drag and Drop handlers
    const onDragStart = (event, id) => {
        // Set data and indicate what is being dragged
        event.dataTransfer.setData("token-id", id);
    };

    const onDragOver = (event) => {
        event.preventDefault(); // Necessary to allow dropping
    };

    const onDrop = (event, rowIndex, colIndex) => {
        const id = event.dataTransfer.getData("token-id");
        moveToken(id, colIndex, rowIndex);
    };

    // Rendering tokens
    const renderedTokens = tokens.map(token => 
       {
              return (
                <Token
                     key={token.id}
                     token={token}
                     style={{
                          position: 'absolute',
                          left: `${token.y * cellSize * zoom - cellSize/2}px`,
                            top: `${token.x * cellSize * zoom - cellSize/2}px`,
                          width: `${cellSize * zoom}px`,
                          height: `${cellSize * zoom}px`,
                            zIndex: 1,
                            cursor: 'grab',
                            border: '1px solid #000',
                            borderRadius: '50%',
                     }}
                     onClick={() => console.log('clicked')}
                     onDragStart={(event) => onDragStart(event, token.id)}
                />
              );

       }
    );





    const [grid, setGrid] = useState<GridCell[][]>(createInitialGrid());

    // Function to update a cell's color
    const paintCell = useCallback((rowIndex: number, colIndex: number, color: string) => {
        const newGrid = [...grid];
        newGrid[rowIndex][colIndex].color = color;
        setGrid(newGrid);
    }, [grid]);

    // Event handlers
    const handlePaletteColorClick = (index: number) => {
        setSelectedColor(colorPalette[index]);
        setSelectedPaletteIndex(index);
    };

    // Function to update color in palette
    const handleColorChange = (color: string) => {
        setSelectedColor(color);
        if (selectedPaletteIndex !== null) {
            const newPalette = [...colorPalette];
            newPalette[selectedPaletteIndex] = color;
            setColorPalette(newPalette);
        }
    };


    const handleCellClick = (rowIndex: number, colIndex: number) => {
        if (tool === 'paintbrush') {
            paintCell(rowIndex, colIndex, selectedColor);
        }
        else if (tool === 'pan') {
            console.log('pan');
        }
        else if (tool === 'token') {
            console.log('token');
        }
    }

    const handleDotClick = (rowIndex: number, colIndex: number, color: string) => {
        if (tool === 'token') {
            console.log('dot');
            console.log(rowIndex, colIndex);
            addToken(rowIndex, colIndex, { color });
        }
        
    }

    const handleCellRightClick = (event: React.MouseEvent, rowIndex: number, colIndex: number) => {
        event.preventDefault();
        paintCell(rowIndex, colIndex, initialColor);
    };
    const handleMouseEnterPainting = (rowIndex: number, colIndex: number) => {
        if (painting) paintCell(rowIndex, colIndex, selectedColor);
    };
    const handleMouseDownPainting = () => setPainting(true);
    const handleMouseUpPainting = () => setPainting(false);
    const handleMouseDownPanning = (event: React.MouseEvent) => {
        if (tool === 'pan' && gridRef.current) {
            event.preventDefault(); // Prevent default action
            const startX = event.clientX;
            const startY = event.clientY;
            let newPos = { x: startX, y: startY };

            const handleMouseMovePanning = (moveEvent: MouseEvent) => {
                const dx = moveEvent.clientX - newPos.x;
                const dy = moveEvent.clientY - newPos.y;
                newPos = { x: moveEvent.clientX, y: moveEvent.clientY };
                if (gridRef.current) {
                    gridRef.current.scrollLeft -= dx;
                    gridRef.current.scrollTop -= dy;

                }

            };

            const handleMouseUpPanning = () => {
                if (gridRef.current) {
                    gridRef.current.removeEventListener('mousemove', handleMouseMovePanning);
                    gridRef.current.removeEventListener('mouseup', handleMouseUpPanning);
                }
            }

            if (gridRef.current) {
                gridRef.current.addEventListener('mousemove', handleMouseMovePanning);
                gridRef.current.addEventListener('mouseup', handleMouseUpPanning);
            }


        }
    };


    
    // Adjust the grid size on window resize
    useEffect(() => {
        const adjustGridSize = () => {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            const newWidth = Math.ceil(screenWidth / cellSize);
            const newHeight = Math.ceil(screenHeight / cellSize);
            setGridSize(Math.max(newWidth, newHeight));
        };

        window.addEventListener('resize', adjustGridSize);
        adjustGridSize();

        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'b':
                    setTool('paintbrush');
                    break;
                case 'v':
                    setTool('pan');
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);


        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', adjustGridSize);
        }
    }, []);

    // Rendering the grid
    return (
        <div>
            {/* Toolbar */}
            <div className="toolbar" style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
                <button onClick={() => setTool('paintbrush')}>Paintbrush</button>
                <button onClick={() => setTool('pan')}>Pan</button>
                <button onClick={() => setTool('token')}>Token</button>
                <button onClick={() => zoomIn()}>+</button>
                <button onClick={() => zoomOut()}>-</button>
                <input type="color" value={selectedColor} onChange={(e) => handleColorChange(e.target.value)} />
                {colorPalette.map((color, index) => (
                    <button key={index} style={{ backgroundColor: color }} onClick={() => handlePaletteColorClick(index)} />
                ))}
                <button onClick={() => setDisplayBorders(!displayBorders)}>Toggle Borders</button>
            </div>



            {/* Grid */}
            <div
                onMouseDown={tool === 'paintbrush' ? handleMouseDownPainting : tool === 'pan' ? handleMouseDownPanning : undefined}
                onMouseUp={tool === 'paintbrush' ? handleMouseUpPainting : undefined}
                style={{ 
                    width: '100%', 
                    height: '100vh',
                 }}
            >
               <div 
               className="grid" 
               ref={gridRef}>
                <div
                className="grid-overlay"
                style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: 'fit-content',
                    height: 'fit-content',
                }}
            >
                
                
    {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="grid-row">
            {row.map((cell, colIndex) => (
                <div
                    key={colIndex}
                    className="grid-cell"
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
                    onMouseEnter={() => handleMouseEnterPainting(rowIndex, colIndex)}
                    style={{
                        position: 'relative', // Set position relative for absolute positioning of the dot
                        backgroundColor: cell.color,
                        width: `${cellSize * zoom}px`,
                        height: `${cellSize * zoom}px`,
                        border: displayBorders ? '0.5px solid #ccc' : 'none'
                    }}
                >
                    <div
                    className="dot-container"
                    onClick={() => handleDotClick(rowIndex, colIndex, selectedColor)}
                    style={{
                        position: 'absolute',
                        top: `-${15 * zoom}px`, // Half of 30px
                        left: `-${15 * zoom}px`, // Half of 30px
                        width: `${30 * zoom}px`,
                        height: `${30 * zoom}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                     <div
                        className="dot"
                        style={{
                            width: `${2 * zoom}px`,
                            height: `${2 * zoom}px`,
                            backgroundColor: '#000',
                            borderRadius: '50%',
                        }}
                    />
                    </div>

                    
                </div>
            ))}
            
        </div>
    ))}
    {/* Tokens */}
    {renderedTokens}
    </div>
</div>

            </div>
        </div>
    );
};

export default Grid;

