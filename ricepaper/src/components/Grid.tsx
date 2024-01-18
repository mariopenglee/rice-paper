// src/components/Grid.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './Grid.css';
import Toolbox from './Toolbox';
import { VariableSizeGrid as VGrid } from 'react-window';
import Token from './Token';
import Cell from './Cell';
import { Token as TokenType } from '../types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrop } from 'react-dnd';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { motion } from 'framer-motion';
interface GridCell {
    color: string;
    tokens?: TokenType[];
}


const Grid: React.FC = () => {
    const initialGridSize = 50; // Initial grid size
    const cellSize = 30; // Assuming each cell
    const initialColor = '#FFF8DC'; // Default color: rice paper
    const [gridSize, setGridSize] = useState(initialGridSize);
    const [painting, setPainting] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string>('#000000'); // Default painting color: Black
    const [tool, setTool] = useState('paintbrush'); // 'paintbrush' or 'pan'
    const [displayBorders, setDisplayBorders] = useState(false); // Whether to display borders around cells
    const gridRef = useRef<HTMLDivElement>(null); // Ref for the grid container
    const [clickPositions, setClickPositions] = useState([]);
    const vGridRef = useRef();

    const [tokens, setTokens] = useState<TokenType[]>([]); // State for tokens
    const [draggingToken, setDraggingToken] = useState<{ id: number, offsetX: number, offsetY: number } | null>(null);
    const [draggingVisualizer, setDraggingVisualizer] = useState<{ 
        originX: number, 
        originY: number, 
        currentX: number, 
        currentY: number, 
        distance: number 
    } | null>(null);


    const handleScreenClick = (event: MouseEvent) => {
        const newClickPosition = { x: event.clientX, y: event.clientY };
        setClickPositions([...clickPositions, newClickPosition]);
    }




    // Initial color palette
    const initialPalette = ['#0D0D0D', '#4D4D4D', '#B3B3B3', '#5C4033', '#8B1A1A', '#D0F0C0',
        '#789EC6', '#FFF8DC', '#7D7D7D', '#1A2421']
    const [colorPalette, setColorPalette] = useState<string[]>(initialPalette);
    const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number | null>(null);


    // Create an initial grid based on the grid size
    const createInitialGrid = (): { [key: string]: GridCell } => {
        const grid = {};
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                grid[`${row}-${col}`] = { color: initialColor };
            }
        }
        return grid;
    };
    
    const [grid, setGrid] = useState<{ [key: string]: GridCell }>(createInitialGrid());

    

    // Function to add a new token
    const addToken = useCallback((x: number, y: number, token: TokenType) => {
        setTokens([...tokens, { ...token, x, y, id: tokens.length }]);
    }, [tokens]);


    const moveToken = useCallback((id: number, x: number, y: number) => {
        setTokens(prevTokens => {
            const newTokens = [...prevTokens];
            const tokenIndex = newTokens.findIndex(token => token.id === id);
            if (tokenIndex !== -1) {
                newTokens[tokenIndex] = { ...newTokens[tokenIndex], x, y };
            }
            return newTokens;
        });
    }, []);


    // Rendering tokens
    const renderedTokens = tokens.map(token => 
       {
              return (
                <Token
                     key={token.id}
                     token={token}
                     style={{
                          position: 'absolute',
                          left: `${token.y * cellSize - cellSize/2}px`,
                            top: `${token.x * cellSize - cellSize/2}px`,
                          width: `${cellSize}px`,
                          height: `${cellSize}px`,
                            zIndex: 1,
                            cursor: 'grab',
                            border: '1px solid #000',
                            borderRadius: '50%',
                            //transform: `translate(${draggingToken && draggingToken.id === token.id ? event.clientX - draggingToken.offsetX : 0}px, ${draggingToken && draggingToken.id === token.id ? event.clientY - draggingToken.offsetY : 0}px)`,
                     }}
                     onClick={() => console.log('clicked')}

                    
                />
              );

       }
    );





   

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



    const handleDotClick = (rowIndex: number, colIndex: number, color: string) => {
        if (tool === 'token') {
            console.log('dot');
            console.log(rowIndex, colIndex);
            addToken(rowIndex, colIndex, { color });
        }
        
    }

    // Function to paint a cell
    const paintCell = useCallback((rowIndex, columnIndex, newColor) => {
        setGrid(prevGrid => {
            const newGrid = { ...prevGrid };
            newGrid[`${rowIndex}-${columnIndex}`].color = newColor;
            return newGrid;
        });
    }, []);

    // Function to handle mouse down on a cell
    const handleMouseDownPainting = () => setPainting(true);
    const handleMouseUpPainting = () => setPainting(false);
    const handleMouseDownPanning = (event: React.MouseEvent) => {
        if (tool === 'pan' && gridRef.current) {
            event.preventDefault(); // Prevent default action
            gridRef.current.style.cursor = 'grabbing';
            

            const handleMouseUpPanning = () => {
                if (gridRef.current) {
                    gridRef.current.removeEventListener('mouseup', handleMouseUpPanning);
                }
            }

            if (gridRef.current) {
                gridRef.current.addEventListener('mouseup', handleMouseUpPanning);
            }


        }
    };

    const Controls = () => {
        const { zoomIn, zoomOut, resetTransform } = useControls();
        return (
          <>
            <button onClick={() => zoomIn()}>Zoom In</button>
            <button onClick={() => zoomOut()}>Zoom Out</button>
            <button onClick={() => resetTransform()}>Reset</button>
          </>
        );
      };


    
    // Adjust the grid size on window resize
    useEffect(() => {
        if (VGrid.current) {
            VGrid.current.resetAfterIndices({ columnIndex: 0, rowIndex: 0 });
        }




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
        }
    }, [cellSize, draggingToken, draggingVisualizer, tokens]);

    // Rendering the grid
    return (
        <DndProvider backend={HTML5Backend}>

            {/* Toolbar */}
            <div className="toolbar" style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
                <button onClick={() => setTool('paintbrush')}>Paintbrush</button>
                <button onClick={() => setTool('pan')}>Pan</button>
                <button onClick={() => setTool('token')}>Token</button>
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
                 <TransformWrapper
                 disabled={tool === 'pan' ? false : true}
                 >
                    <Controls />
                    <TransformComponent>
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
               

              <VGrid
                    className="virtual-grid"
                    columnCount={gridSize}
                    columnWidth={() => cellSize}
                    height={gridSize * cellSize}
                    rowCount={gridSize}
                    rowHeight={() => cellSize}
                    width={gridSize * cellSize}
                    style={{
                        outline: 'none',
                    }}
                    ref={vGridRef}
                >
                    {
                        ({ columnIndex, rowIndex, style }) => {
                            const cellKey = `${rowIndex}-${columnIndex}`;
                            const cell = grid[cellKey];
                            return (
                                <Cell
                                    key={cellKey}
                                    rowIndex={rowIndex}
                                    columnIndex={columnIndex}
                                    cell={cell}
                                    style={style}
                                    displayBorders={displayBorders}
                                    handleDotClick={handleDotClick}
                                    selectedColor={selectedColor}
                                    moveToken={moveToken}
                                    tool={tool}
                                    paintCell={paintCell}
                                />
                            );
                        }
                    }
                    
                </VGrid>
     

    {/* Tokens */}
    {renderedTokens}
    
    </div>
</div>
                    </TransformComponent>
                </TransformWrapper>


            </div>
        </DndProvider>
    );
};

export default Grid;

