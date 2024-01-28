// src/components/Grid.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './Grid.css';
import { VariableSizeGrid as VGrid } from 'react-window';
import Token from './Token';
import Cell from './Cell';
import Dot from './Dot';
import { Token as TokenType } from '../types';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
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
    const [selectedColor, setSelectedColor] = useState<string>('#000000'); // Default painting color: Black
    const [tool, setTool] = useState('paintbrush'); // 'paintbrush' or 'pan'
    const [displayBorders, setDisplayBorders] = useState(false); // Whether to display borders around cells
    const gridRef = useRef<HTMLDivElement>(null); // Ref for the grid container

    const [layers, setLayers] = useState<Array<LayerData>>([{ cells: {}, opacity: 1 }]);
    const [selectedLayer, setSelectedLayer] = useState<number>(0);
    const [layerVisibility, setLayerVisibility] = useState<boolean[]>([true]);

    const addLayer = () => {
        setLayers([...layers, { cells: {}, opacity: 1 }]);
        setLayerVisibility([...layerVisibility, true]);
    };

    const updateLayerOpacity = (index: number, newOpacity: number) => {
        const updatedLayers = [...layers];
        updatedLayers[index].opacity = newOpacity;
        setLayers(updatedLayers);
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


    // Rendering tokens
    const renderedTokens = tokens.map(token => 
       {
        if (!layerVisibility[token.layer]) return null; // Don't render if layer is not visible
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
                            opacity: layers[token.layer].opacity,
                     }}
                     onClick={() => console.log('clicked')}

                    
                />
              );

       }
    );


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

    const renderedLayers = layers.map((layer, index) => {
        if (!layerVisibility[index]) return null;
    
        return Object.entries(layer.cells).map(([key, value]) => {
            const [gridX, gridY] = key.split('-').map(Number);
            return (
                <Cell
                    key={key}
                    x={gridX * cellSize}
                    y={gridY * cellSize}
                    size={cellSize}
                    color={value.color}
                    opacity={layer.opacity}

                />
            );
        });
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


 

    const handleMouseMove = (event: React.MouseEvent) => {
        const { clientX, clientY } = event;
        const mouseX = clientX + gridRef.current.scrollLeft;
        const mouseY = clientY + gridRef.current.scrollTop;
        if (tool === 'paintbrush' && painting) {
            const { gridX, gridY } = getCellFromCursorPosition(mouseX, mouseY);
            const cellKey = `${gridX}-${gridY}`;
            if (painting && (!layers[selectedLayer].cells[cellKey] || layers[selectedLayer].cells[cellKey].color !== selectedColor)) {
                paintCell(gridX, gridY);
            }
        }
    };
    const handleMouseUp = () => {
        if (painting === true) {
        setPainting(false);
        }
    }

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
        const cellKey = `${gridX}-${gridY}`;

        if (!layers[selectedLayer].cells[cellKey] || layers[selectedLayer].cells[cellKey].color !== selectedColor) {
            paintCell(gridX, gridY);
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

    const Controls = () => {
        const { zoomIn, zoomOut, resetTransform } = useControls();
        return (
            <div className="controls">
            <button onClick={() => zoomIn()}>Zoom In</button>
            <button onClick={() => zoomOut()}>Zoom Out</button>
            <button onClick={() => resetTransform()}>Reset</button>
          </div>
        );
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
                {renderedLayers}
                {dots}
                
             
     

    {/* Tokens */}
    {renderedTokens}
    
    </div>
</div>
                    </TransformComponent>
                </TransformWrapper>


            </div>
        </>
    );
};

export default Grid;

