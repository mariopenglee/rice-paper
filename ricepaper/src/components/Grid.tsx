// src/components/Grid.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './Grid.css';
import Toolbox from './Toolbox';
import Token from './Token';
import { Token as TokenType } from '../types';

interface GridCell {
    color: string;
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
    const [tokens, setTokens] = useState<TokenType[]>([]); // Tokens on the grid

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

    // Function to add a token
    const addToken = (token: TokenType) => {
        setTokens([...tokens, token]);
    };

    // Function to remove a token
    const removeToken = (token: TokenType) => {
        setTokens(tokens.filter((t) => t.id !== token.id));
    };

    const handleCellClick = (rowIndex: number, colIndex: number) => {
        if (tool === 'paintbrush')
        {
        paintCell(rowIndex, colIndex, selectedColor);
        }
        else if (tool === 'pan')
        {
            console.log('pan');
        }
        else if (tool === 'token')
        {
            addToken({
                id: Math.random().toString(36).substr(2, 9),
                name: 'Token',
                position: { x: colIndex * cellSize, y: rowIndex * cellSize },
                size: { width: cellSize, height: cellSize }
            });
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
          console.log(startX, startY);
    
          const handleMouseMovePanning = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - newPos.x;
            const dy = moveEvent.clientY - newPos.y;
            newPos = { x: moveEvent.clientX, y: moveEvent.clientY };
            if (gridRef.current) {
                gridRef.current.scrollLeft -= dx;
                gridRef.current.scrollTop -= dy;

            }
            console.log(dx, dy);
            
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
          style={{ width: '100%', height: '100vh' }}
        >
            <div 
            className="grid"
            ref={gridRef}
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
                                    backgroundColor: cell.color,
                                    width: `${cellSize}px`,
                                    height: `${cellSize}px`,
                                    border: displayBorders ? '0.5px solid #ccc' : 'none'
                                
                                    
                                 }}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Tokens */}
            <div className="tokens">
                {tokens.map((token) => (
                    <Token key={token.id} token={token} removeToken={removeToken} />
                ))}
            </div>
        </div>
        </div>
    );
};

export default Grid;

