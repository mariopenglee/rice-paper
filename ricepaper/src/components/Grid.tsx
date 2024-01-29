// src/components/Grid.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './Grid.css';
import Token from './Token';
import Cell from './Cell';
import Dot from './Dot';
import { Token as TokenType } from '../types';
interface GridCell {
    color: string;
}

interface LayerData {
    cells: { [key: string]: GridCell };
    opacity: number;
}







const Grid: React.FC = () => {
    const initialGridSize = 100; // Initial grid size
    const cellSize = 30; // Assuming each cell
    const initialColor = '#FFF8DC'; // Default color: rice paper
    const [gridSize, setGridSize] = useState(initialGridSize);
    const [painting, setPainting] = useState(false);
    const [erasing, setErasing] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string>('#000000'); // Default painting color: Black
    const [tool, setTool] = useState('paintbrush'); // 'paintbrush' or 'pan'
    const [displayBorders, setDisplayBorders] = useState(false); // Whether to display borders around cells
    const gridRef = useRef<HTMLDivElement>(null); // Ref for the grid container

    const [layers, setLayers] = useState<Array<LayerData>>([{ cells: {}, opacity: 1 }]);
    const [selectedLayer, setSelectedLayer] = useState<number>(0);
    const [layerVisibility, setLayerVisibility] = useState<boolean[]>([true]);

    const [isDrawingRectangle, setIsDrawingRectangle] = useState(false);
    const [rectanglePreview, setRectanglePreview] = useState({ startX: 0, startY: 0, endX: 0, endY: 0, show: false });

    const [rectangleStart, setRectangleStart] = useState({ x: 0, y: 0 });
    const addLayer = () => {
        setLayers([...layers, { cells: {}, opacity: 1 }]);
        setLayerVisibility([...layerVisibility, true]);
    };

    const updateLayerOpacity = (index: number, newOpacity: number) => {
        const updatedLayers = [...layers];
        updatedLayers[index].opacity = newOpacity;
        setLayers(updatedLayers);
    };

    const floodFill = (x, y, targetColor) => {
        // Check if the cell is out of bounds or already the fill color
        if ( x < 0 || x >= gridSize || y < 0 || y >= gridSize || layers[selectedLayer].cells[`${x}-${y}`]?.color === selectedColor) {
            return;
        }
    
        // Check if the cell is the target color
        if (layers[selectedLayer].cells[`${x}-${y}`]?.color === targetColor) {
            // Fill the cell
            paintCell(x, y);
    
            // Recur for north, east, south, and west
            floodFill(x-1, y, targetColor);
            floodFill(x+1, y, targetColor);
            floodFill(x, y-1, targetColor);
            floodFill(x, y+1, targetColor);
        }
    };
    

    
    const removeLayer = (index: number) => {
        const newLayers = layers.filter((_, i) => i !== index);
        const newVisibility = layerVisibility.filter((_, i) => i !== index);
        setLayers(newLayers);
        setLayerVisibility(newVisibility);
    };
    
    const selectLayer = (index: number) => {
        setSelectedLayer(index);
    };
    
    const toggleLayerVisibility = (index: number) => {
        const newVisibility = [...layerVisibility];
        newVisibility[index] = !newVisibility[index];
        setLayerVisibility(newVisibility);
    };
    
    


    const [tokens, setTokens] = useState<TokenType[]>([]); // State for tokens




    // Initial color palette
    const initialPalette = ['#0D0D0D', '#4D4D4D', '#B3B3B3', '#5C4033', '#8B1A1A', '#D0F0C0',
        '#789EC6', '#FFF8DC', '#7D7D7D', '#1A2421']
    const [colorPalette, setColorPalette] = useState<string[]>(initialPalette);
    const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number | null>(null);


    // Function to add a new token
    const addToken = useCallback((x: number, y: number, token: TokenType) => {
        setTokens([...tokens, { ...token, x, y}]);
    }, [tokens]);


    const dotSize = 2; // Size of the dots
    const dots = [];
    for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
            dots.push(
                <Dot 
                    key={`${i}-${j}`}
                    x={i * cellSize - dotSize / 2}
                    y={j * cellSize - dotSize / 2}
                    size={dotSize}
                />
            );
        }
    }



    const getCellFromCursorPosition = (x, y) => {
        const gridX = Math.floor(x / cellSize);
        const gridY = Math.floor(y / cellSize);
        return { gridX, gridY };
    };

    const getDotFromCursorPosition = (x, y) => {
        // get the dot closest to the cursor
        const DotX = Math.round(x / cellSize);
        const DotY = Math.round(y / cellSize);
        return { DotX, DotY };
    };

    const renderedLayersAndTokens = layers.map((layer, layerIndex) => {
        if (!layerVisibility[layerIndex]) return null;

        // Render cells for the current layer
        const renderedCells = Object.entries(layer.cells).map(([key, value]) => {
            const [gridX, gridY] = key.split('-').map(Number);
            return (
                <Cell
                    key={key}
                    x={gridX * cellSize}
                    y={gridY * cellSize}
                    size={cellSize}
                    color={value.color}
                    opacity={layer.opacity}
                    zIndex={layerIndex}
                />
            );
        });

        // Render tokens for the current layer
        const renderedTokensForLayer = tokens
            .filter(token => token.layer === layerIndex) // Filter tokens by current layer
            .map(token => (
                <Token
                    key={token.id}
                    token={token}
                    style={{
                        position: 'absolute',
                        left: `${token.y * cellSize - cellSize/2}px`,
                        top: `${token.x * cellSize - cellSize/2}px`,
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        zIndex: layerIndex, // Apply layerIndex as zIndex
                        cursor: 'grab',
                        border: '1px solid #000',
                        borderRadius: '50%',
                        opacity: layer.opacity,
                    }}
                    onClick={() => console.log('clicked')}
                />
            ));

        return (
            <React.Fragment key={layerIndex}>
                {renderedCells}
                {renderedTokensForLayer}
            </React.Fragment>
        );
    });

    






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

    const paintCell = (gridX: number, gridY: number) => {
        // Paint the cell at the given coordinates on the selected layer
        const cellKey = `${gridX}-${gridY}`;
        const updatedLayers = [...layers];
        updatedLayers[selectedLayer].cells[cellKey] = { color: selectedColor };
        setLayers(updatedLayers);
    }

    const eraseCell = (gridX: number, gridY: number) => {
        // Erase the cell at the given coordinates on the selected layer
        const cellKey = `${gridX}-${gridY}`;
        const updatedLayers = [...layers];
        delete updatedLayers[selectedLayer].cells[cellKey];
        setLayers(updatedLayers);
    }

    const paintRectangle = (startX: number, startY: number, endX: number, endY: number) => {
        // Paint a rectangle from the start coordinates to the end coordinates
        const minX = Math.min(startX, endX);
        const minY = Math.min(startY, endY);
        const maxX = Math.max(startX, endX);
        const maxY = Math.max(startY, endY);
        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                paintCell(i, j);
            }
        }
    }

    const eraseRectangle = (startX: number, startY: number, endX: number, endY: number) => {
        // Erase a rectangle from the start coordinates to the end coordinates
        const minX = Math.min(startX, endX);
        const minY = Math.min(startY, endY);
        const maxX = Math.max(startX, endX);
        const maxY = Math.max(startY, endY);
        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                eraseCell(i, j);
            }
        }
    }

    const updateRectanglePreview = (startX: number, startY: number, endX: number, endY: number) => {
        // Update the rectangle preview coordinates
        setRectanglePreview({
            startX: startX * cellSize,
            startY: startY * cellSize,
            endX: endX * cellSize,
            endY: endY * cellSize,
            show: true,
        });
    }


 

    const handleMouseMove = (event: React.MouseEvent) => {
        const { clientX, clientY } = event;
        const mouseX = clientX + gridRef.current.scrollLeft;
        const mouseY = clientY + gridRef.current.scrollTop;
        if (isDrawingRectangle) {
            const { gridX, gridY } = getCellFromCursorPosition(mouseX, mouseY);
            updateRectanglePreview(rectangleStart.x, rectangleStart.y, gridX, gridY);

        }
        else if (tool === 'paintbrush' && painting) {
            const { gridX, gridY } = getCellFromCursorPosition(mouseX, mouseY);
            const cellKey = `${gridX}-${gridY}`;
            if (painting && (!layers[selectedLayer].cells[cellKey] || layers[selectedLayer].cells[cellKey].color !== selectedColor)) {
                paintCell(gridX, gridY);
            }
        }
        else if (tool === 'erase' && isDrawingRectangle) {
            const { gridX, gridY } = getCellFromCursorPosition(mouseX, mouseY);
            updateRectanglePreview(rectangleStart.x, rectangleStart.y, gridX, gridY);
        }
        else if (tool === 'erase' && erasing) {
            const { gridX, gridY } = getCellFromCursorPosition(mouseX, mouseY);
            const cellKey = `${gridX}-${gridY}`;
            if (erasing && layers[selectedLayer].cells[cellKey]) {
                eraseCell(gridX, gridY);
            }
        }
    };
    const handleMouseUp = (event) => {

        if (isDrawingRectangle) {
            const { clientX, clientY } = event;
            const mouseX = clientX + gridRef.current.scrollLeft;
            const mouseY = clientY + gridRef.current.scrollTop;
            const { gridX, gridY } = getCellFromCursorPosition(mouseX, mouseY);
            setRectanglePreview({ startX: 0, startY: 0, endX: 0, endY: 0, show: false });
            if (tool === 'paintbrush') {
            paintRectangle(rectangleStart.x, rectangleStart.y, gridX, gridY);
            setPainting(false);
            }
            else if (tool === 'erase') {
            eraseRectangle(rectangleStart.x, rectangleStart.y, gridX, gridY);
            setErasing(false);
            }
            setIsDrawingRectangle(false);

        }
        else if (erasing === true) {
            setErasing(false);
        }
        else if (painting === true) {
            setPainting(false);
        }
        
       
    }

    const renderRectanglePreview = () => {
        if (!rectanglePreview.show) return null;
        const { startX, startY, endX, endY } = rectanglePreview;
        const minX = Math.min(startX, endX);
        const minY = Math.min(startY, endY);
        const width = Math.abs(startX - endX) + cellSize;
        const height = Math.abs(startY - endY) + cellSize;
        return (
            <div
                style={{
                    position: 'absolute',
                    top: minY,
                    left: minX,
                    width: width,
                    height: height,
                    border: '1px dashed #000',
                    background: tool === 'paintbrush' ? selectedColor : 'transparent',
                    opacity: 0.5,
                    pointerEvents: 'none',
                }}
            />
        );
    };
    

    const handleMouseDown = (event) => {
        const { clientX, clientY } = event;
        console.log(clientX, clientY);
        // update click positions depending on how much we've scrolled
        const mouseX = clientX + gridRef.current.scrollLeft;
        const mouseY = clientY + gridRef.current.scrollTop;
        console.log(mouseX, mouseY);
        if (tool === 'paintbrush') {
        const { gridX, gridY } = getCellFromCursorPosition(mouseX, mouseY);
        console.log("cell", gridX, gridY);

        if (event.shiftKey) {
            // start drawing a rectangle
            setIsDrawingRectangle(true);
            setRectangleStart({ x: gridX, y: gridY });
            
        }
        else {
        const cellKey = `${gridX}-${gridY}`;

        if (!layers[selectedLayer].cells[cellKey] || layers[selectedLayer].cells[cellKey].color !== selectedColor) {
            paintCell(gridX, gridY);
        }
        }
        setPainting(true);
        }
        else if (tool === 'token') {
            const { DotX, DotY } = getDotFromCursorPosition(mouseX, mouseY);
            console.log("dot", DotX, DotY);
            addToken(DotY, DotX,  { 
                id: tokens.length,
                color: selectedColor,
                layer: selectedLayer,
             });
        }
        else if (tool === 'pan') {
        }
        else if (tool === 'erase') {
            const { gridX, gridY } = getCellFromCursorPosition(mouseX, mouseY);
            console.log("cell", gridX, gridY);
            if (event.shiftKey) {
                // start drawing a rectangle
                setIsDrawingRectangle(true);
                setRectangleStart({ x: gridX, y: gridY });
            }
            else{
            const cellKey = `${gridX}-${gridY}`;
            if (layers[selectedLayer].cells[cellKey]) {
                eraseCell(gridX, gridY);
            }}
            setErasing(true);
        }
        else if (tool === 'fill') {
            const { gridX, gridY } = getCellFromCursorPosition(mouseX, mouseY);
            const cellKey = `${gridX}-${gridY}`;
            const targetColor = layers[selectedLayer].cells[cellKey]?.color;
            floodFill(gridX, gridY, targetColor);
        }
        
        
        
        
        
    };
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

    
    // Adjust the grid size on window resize
    useEffect(() => {
        
        

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
    }, [cellSize, tokens]);

    // Rendering the grid
    return (
        <>

            {/* Toolbar */}
            <div className="toolbar">
                <button onClick={() => setTool('paintbrush')}>Paintbrush</button>
                <button onClick={() => setTool('pan')}>Pan</button>
                <button onClick={() => setTool('token')}>Token</button>
                <button onClick={() => setTool('erase')}>Erase</button>
                <button onClick={() => setTool('fill')}>Fill</button>
                <input type="color" value={selectedColor} onChange={(e) => handleColorChange(e.target.value)} />
                {colorPalette.map((color, index) => (
                    <button key={index} style={{ backgroundColor: color }} onClick={() => handlePaletteColorClick(index)} />
                ))}
                <button onClick={() => setDisplayBorders(!displayBorders)}>Toggle Borders</button>
            </div>

            <div className="layers-bar">
            <button onClick={addLayer}>Add Layer</button>
                <div className='layers-button-container'>
                    {layers.map((_, index) => (
                        <div key={index}>
                            <button 
                                className={index === selectedLayer ? 'selected-layer-button' : 'layer-button'}
                                onClick={() => selectLayer(index)}>Layer {index + 1}</button>
                            <button 
                                className={layerVisibility[index] ? 'visible-button' : 'hidden-button'}
                                onClick={() => toggleLayerVisibility(index)}>
                            </button>
                            <button 
                                className={'remove-button'}
                            onClick={() => removeLayer(index)}>X</button>
                            <input 
                                type="range" 
                                min={0} 
                                max={1} 
                                step={0.1} 
                                value={layers[index].opacity}
                                onChange={(e) => updateLayerOpacity(index, Number(e.target.value))}
                            />
                        </div>
                    ))}
                </div>
            </div>



            {/* Grid */}
            <div
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ 
                    width: '100%', 
                    height: '100%',
                    backgroundColor: `${initialColor}`,
                    zIndex: -10,
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
                {renderedLayersAndTokens}
                {dots}
                {renderRectanglePreview()}
                
       
    </div>
</div>

            </div>
        </>
    );
};

export default Grid;

