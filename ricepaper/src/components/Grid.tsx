// src/components/Grid.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './Grid.css';
import Token from './Token';
import Cell from './Cell';
import Dot from './Dot';
import { Token as TokenType } from '../types';
import { AnimatePresence, Reorder, useDragControls, stagger, motion } from 'framer-motion';
import BrushIcon from '@mui/icons-material/Brush';
import PanToolIcon from '@mui/icons-material/PanTool';
import CircleIcon from '@mui/icons-material/Circle';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import LayersIcon from '@mui/icons-material/Layers';
import MinimizeIcon from '@mui/icons-material/Minimize';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { ChromePicker  } from 'react-color';
import { v4 as uuidv4 } from 'uuid';
import { Profiler } from 'react';
import LayerPreview from './LayerPreview';

interface GridCell {
    color: string
  
}


interface LayerData {
    id: string;
    cells: { [key: string]: GridCell };
    opacity: number;
    background: string;
}





const Grid: React.FC = () => {
    const initialGridSize = 100; // Initial grid size
    const cellSize = 30; // Assuming each cell
    const initialColor = '#FFF8DC'; // Default color: rice paper
    const [gridSize, setGridSize] = useState(initialGridSize);
    const [painting, setPainting] = useState(false);
    const [erasing, setErasing] = useState(false);
    const [selectedColor, setSelectedColor] = useState('black');
    const [tool, setTool] = useState('paintbrush'); // 'paintbrush' or 'pan'
    const [displayBorders, setDisplayBorders] = useState(false); // Whether to display borders around cells
    const gridRef = useRef<HTMLDivElement>(null); // Ref for the grid container
    const [layerPanelOpen, setLayerPanelOpen] = useState(false); // Whether the layer panel is open
    const [layers, setLayers] = useState<Array<LayerData>>([{ 
        id: uuidv4(),
        cells: {}, 
        opacity: 1, 
        background: 'transparent'
    }]);



    const [selectedLayer, setSelectedLayer] = useState<string>(layers[0].id);
    const [layerVisibility, setLayerVisibility] = useState<boolean[]>([true]);

    const [isDrawingRectangle, setIsDrawingRectangle] = useState(false);
    const [rectanglePreview, setRectanglePreview] = useState({ startX: 0, startY: 0, endX: 0, endY: 0, show: false });

    const [rectangleStart, setRectangleStart] = useState({ x: 0, y: 0 });
    const [tokens, setTokens] = useState<TokenType[]>([]); // State for tokens



    const updateLayerOpacity = (index: number, newOpacity: number) => {
        const updatedLayers = [...layers];
        updatedLayers[index].opacity = newOpacity;
        setLayers(updatedLayers);
    };

    const lookupLayerIndex = useCallback((id: string) => {
        return layers.findIndex(layer => layer.id === id);
    }
    , [layers]);



    const floodFill = (x, y, targetColor) => {
        // Check if the cell is out of bounds or already the fill color
        if ( x < 0 || x >= gridSize || y < 0 || y >= gridSize || layers[lookupLayerIndex(selectedLayer)].cells[`${x}-${y}`]?.color === selectedColor) {
            return;
        }
    
        // Check if the cell is the target color
        if (layers[lookupLayerIndex(selectedLayer)].cells[`${x}-${y}`]?.color === targetColor) {
            // Fill the cell
            paintCell(x, y);
    
            // Recur for north, east, south, and west
            floodFill(x-1, y, targetColor);
            floodFill(x+1, y, targetColor);
            floodFill(x, y-1, targetColor);
            floodFill(x, y+1, targetColor);
        }
    };
    
    // function to check if flood filling this empty cell will reach the border
    const willFloodFillReachBorder = (x, y, targetColor) => {
        const visited = {};
        const queue = [];
        queue.push([x, y]);
        while (queue.length > 0) {
            const [i, j] = queue.shift();
            if (i < 0 || i >= gridSize || j < 0 || j >= gridSize) {
                return true;
            }
            if (layers[lookupLayerIndex(selectedLayer)].cells[`${i}-${j}`]?.color === targetColor && !visited[`${i}-${j}`]) {
                visited[`${i}-${j}`] = true;
                queue.push([i-1, j], [i+1, j], [i, j-1], [i, j+1]);
            }
        }
        return false;
    };

 



    const addLayer = () => {
        const newLayer = {
            id: uuidv4(),
            name: 'New Layer',
            cells: {},
            opacity: 1,
            background: 'transparent',
        };
        setLayers([...layers, newLayer]);
        setLayerVisibility([...layerVisibility, true]);
    };



    const removeLayer = (id: string) => {
        const index = lookupLayerIndex(id);
        const updatedLayers = [...layers];
        updatedLayers.splice(index, 1);
        setLayers(updatedLayers);
        const updatedVisibility = [...layerVisibility];
        updatedVisibility.splice(index, 1);
        setLayerVisibility(updatedVisibility);
        
        if (selectedLayer === id) {
            console.log('selected layer removed');
            selectLayer('none');
        }

    };

    const selectLayer = (id: string) => {
 
        setSelectedLayer(id);
    };

    const setLayerBackground = (id: string, color: string) => {
        const index = lookupLayerIndex(id);
        const updatedLayers = [...layers];
        updatedLayers[index].background = color;
        setLayers(updatedLayers);
    };


    

    
    const toggleLayerVisibility = (index: number) => {
        const newVisibility = [...layerVisibility];
        newVisibility[index] = !newVisibility[index];
        setLayerVisibility(newVisibility);
    };

    const calculateLayerBounds = (layer) => {
        let minX = gridSize, maxX = 0, minY = gridSize, maxY = 0;
        Object.keys(layer.cells).forEach(key => {
            const [gridX, gridY] = key.split('-').map(Number);
            minX = Math.min(minX, gridX);
            maxX = Math.max(maxX, gridX);
            minY = Math.min(minY, gridY);
            maxY = Math.max(maxY, gridY);
        });
        return { minX, maxX, minY, maxY };
    };

    
    const renderLayerPreview = (layer: LayerData) => {
        const previewSize = 50; // Size of the preview square
        const bounds = calculateLayerBounds(layer);
    
        const layerWidth = bounds.maxX - bounds.minX + 1;
        const layerHeight = bounds.maxY - bounds.minY + 1;
    
        const scale = Math.min(previewSize / layerWidth, previewSize / layerHeight);
        const cells = Object.entries(layer.cells).map(([key, value]) => {
            const [gridX, gridY] = key.split('-').map(Number);
            const cellStyle = {
                position: 'absolute',
                left: `${(gridX - bounds.minX) * scale}px`,
                top: `${(gridY - bounds.minY) * scale}px`,
                width: `${scale}px`,
                height: `${scale}px`,
                backgroundColor: value.color,
            };
            return <div key={key} style={cellStyle}></div>;
        });
    
        // Calculate the offset to center the preview
        const offsetX = (previewSize - layerWidth * scale) / 2;
        const offsetY = (previewSize - layerHeight * scale) / 2;
        return (
            <div style={{
                width: `${previewSize}px`,
                height: `${previewSize}px`,
                position: 'relative',
                border: `${ selectedLayer === layer.id ? '2px solid black' : '1px solid lightgray'}`,
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: layer.background,
                boxSizing: 'border-box',
            }}>
                <div style={{ 
                    position: 'absolute', 
                    left: `${offsetX}px`, 
                    top: `${offsetY}px` }}>
                    {cells}
                </div>
            </div>
        );
    };
    
    
    






    // Initial color palette
    const initialPalette = ['#0D0D0D', '#4D4D4D', '#B3B3B3', '#5C4033', '#8B1A1A', '#D0F0C0',
        '#789EC6', '#FFF8DC'];
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
                    cellSize={cellSize}
                />
            );
        }
    }



    const getCellFromCursorPosition = (x, y) => {
        const {x: adjustedX, y: adjustedY} = accountForScroll(x, y);
        
        const gridX = Math.floor(adjustedX / cellSize);
        const gridY = Math.floor(adjustedY / cellSize);
        return { gridX, gridY };
    };
    
    const accountForScroll = (x, y) => {
        return {
            x: x + gridRef.current.scrollLeft,
            y: y + gridRef.current.scrollTop,
        };
    }


    const getDotFromCursorPosition = (x, y) => {
        const { x: adjustedX, y: adjustedY } = accountForScroll(x, y);
        // get the dot closest to the cursor
        const DotX = Math.round(adjustedX / cellSize);
        const DotY = Math.round(adjustedY / cellSize);
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
            .filter(token => token.layer === layer.id) // Filter tokens by current layer
            .map(token => (
                <Token
                    key={token.id}
                    token={token}
                    cellSize={cellSize}
                    layerIndex={layerIndex}
                    layerOpacity={layer.opacity}
                    getDotFromCursorPosition={getDotFromCursorPosition}
                />
            ));

        return (
            <React.Fragment key={layerIndex}>
                {renderedCells}
                {renderedTokensForLayer}
            </React.Fragment>
        );
    });

    const renderedLayerBackgrounds = layers.map((layer, layerIndex) => {
        if (!layerVisibility[layerIndex]) return null;
        return (
            <div
                key={layerIndex}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: layer.background,
                    opacity: layer.opacity,
                    zIndex: layerIndex,
                    pointerEvents: 'none',
                }}
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

    const handleAddColor = (color: string) => {
            setColorPalette([...colorPalette, color]);
    }

    const paintCell = (gridX: number, gridY: number) => {
        // Paint the cell at the given coordinates on the selected layer
        const cellKey = `${gridX}-${gridY}`;
        const updatedLayers = [...layers];
        updatedLayers[lookupLayerIndex(selectedLayer)].cells[cellKey] = { color: selectedColor };
        setLayers(updatedLayers);
    }

    const eraseCell = (gridX: number, gridY: number) => {
        // Erase the cell at the given coordinates on the selected layer
        const cellKey = `${gridX}-${gridY}`;
        const updatedLayers = [...layers];
        delete updatedLayers[lookupLayerIndex(selectedLayer)].cells[cellKey];
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
        if (isDrawingRectangle) {
            const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY);
            updateRectanglePreview(rectangleStart.x, rectangleStart.y, gridX, gridY);

        }
        else if (tool === 'paintbrush' && painting) {
            const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY);
            const cellKey = `${gridX}-${gridY}`;
            if (painting && (!layers[lookupLayerIndex(selectedLayer)].cells[cellKey] || layers[lookupLayerIndex(selectedLayer)].cells[cellKey].color !== selectedColor) || (!layers[lookupLayerIndex(selectedLayer)].cells[cellKey] && layers[lookupLayerIndex(selectedLayer)].background !== selectedColor)) { 
                paintCell(gridX, gridY);
            }
        }
        else if (tool === 'erase' && isDrawingRectangle) {
            const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY);
            updateRectanglePreview(rectangleStart.x, rectangleStart.y, gridX, gridY);
        }
        else if (tool === 'erase' && erasing) {
            const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY);
            const cellKey = `${gridX}-${gridY}`;
            if (erasing && layers[lookupLayerIndex(selectedLayer)].cells[cellKey]) {
                eraseCell(gridX, gridY);
            }
        }
    };
    const handleMouseUp = (event) => {

        if (isDrawingRectangle) {
            const { clientX, clientY } = event;
            const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY);
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
        console.log('mousedown');

        if (selectedLayer === 'none'){
            alert('Please select a layer to draw on');
            return;
        }
        const { clientX, clientY } = event;

        if (tool === 'paintbrush') {
        const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY);


        if (event.shiftKey) {
            // start drawing a rectangle
            setIsDrawingRectangle(true);
            setRectangleStart({ x: gridX, y: gridY });
            
        }
        else {
        const cellKey = `${gridX}-${gridY}`;

        if (!layers[lookupLayerIndex(selectedLayer)].cells[cellKey] || layers[lookupLayerIndex(selectedLayer)].cells[cellKey].color !== selectedColor) {
            paintCell(gridX, gridY);
        }
        }
        setPainting(true);
        }
        else if (tool === 'token') {
            const { DotX, DotY } = getDotFromCursorPosition(clientX, clientY);
            console.log('adding token at:', DotX, DotY);
            addToken(DotX, DotY, {
                id: tokens.length,
                color: selectedColor,
                layer: selectedLayer,
             });
        }
        else if (tool === 'pan') {
        }
        else if (tool === 'erase') {
            const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY);
            
            if (event.shiftKey) {
                // start drawing a rectangle
                setIsDrawingRectangle(true);
                setRectangleStart({ x: gridX, y: gridY });
            }
            else{
            const cellKey = `${gridX}-${gridY}`;
            if (layers[lookupLayerIndex(selectedLayer)].cells[cellKey]) {
                eraseCell(gridX, gridY);
            }}
            setErasing(true);
        }
        else if (tool === 'fill') {
            const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY);
            const cellKey = `${gridX}-${gridY}`;
            const targetColor = layers[lookupLayerIndex(selectedLayer)].cells[cellKey]?.color;
            const bounded = !willFloodFillReachBorder(gridX, gridY, targetColor);
            
            if (bounded) {
            floodFill(gridX, gridY, targetColor);
            } else {
                setLayerBackground(selectedLayer, selectedColor);
            }
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
                <button onClick={() => setTool('paintbrush')}><BrushIcon /></button>
                <button onClick={() => setTool('pan')}><PanToolIcon /></button>
                <button onClick={() => setTool('token')}><CircleIcon /></button>
                <button onClick={() => setTool('erase')}><CancelPresentationIcon /></button>
                <button onClick={() => setTool('fill')}><FormatColorFillIcon /></button>
            </div>

            <div className="color-palette">
                <ChromePicker
                    color={selectedColor}
                    onChangeComplete={(color) => handleColorChange(color.hex)}
                    disableAlpha={true}
                />
                <div className="colors-container">
                {colorPalette.map((color, index) => (
                    <button 
                    key={index} 
                    className='palette-color-button'
                    style={{ backgroundColor: color }} 
                    onClick={() => handlePaletteColorClick(index)} />
                ))}
                { colorPalette.length < 25 &&
                    <button 
                className='add-color-button'
                onClick={() => handleAddColor(selectedColor)}
                    >
                    <AddBoxIcon />
                </button>}


                </div>
            </div>
            <button 
            className='toggle-layers-button'
            onClick={() => setLayerPanelOpen(!layerPanelOpen)}
            style={
                {
                    display: layerPanelOpen ? 'none' : 'block',
                }
            }
             >
                    <LayersIcon />
            </button>
            {
            layerPanelOpen &&
                <motion.div 
            className='layers-panel' 
            initial={{ x: 300, opacity: 0, pointerEvents: 'none' }}
            animate={{ x: 0, opacity: 0.5, pointerEvents: 'auto' }}
            exit={{ x: 300, opacity: 0, pointerEvents: 'none' }}
            whileHover={{ 
                opacity: 1,
                pointerEvents: 'auto',
             }}
                >
                
                <div className='layers-panel-header'>
                    <button 
                    className='add-layer-button'
                    disabled={layers.length >= 10}
                    onClick={addLayer}>
                        <LibraryAddIcon />
                        </button>
                    <button
                     onClick={() => setLayerPanelOpen(false)}

                     >
                        <MinimizeIcon />
                    </button>
                </div>
                
                <Reorder.Group
                className='layers-container'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition=
                {{
                    staggerChildren: 0.1,
                    delayChildren: 0.3,
                }}
                axis="y"
                onReorder={setLayers}
                values={layers}

                >
                    <AnimatePresence>
                    {layers.map((layer, index) => (
                        <LayerPreview
                        key={layer.id}
                        layer={layer}
                        index={index}
                        selected={layer.id === selectedLayer}
                        selectLayer={selectLayer}
                        toggleLayerVisibility={toggleLayerVisibility}
                        updateLayerOpacity={updateLayerOpacity}
                        removeLayer={removeLayer}
                        layerVisibility={layerVisibility}
                        renderLayerPreview={renderLayerPreview}
                        />

                    ))}
</AnimatePresence>
</Reorder.Group>
                
            </motion.div>}


            {/* Grid */}
            <div
                
                style={{ 
                    width: '100%', 
                    height: '100%',
                    backgroundColor: `${initialColor}`,
                    zIndex: -10,
                 }}
            >
                {renderedLayerBackgrounds}

                    <div 
               className="grid" 
               ref={gridRef}
               onPointerDown={handleMouseDown}
                onPointerUp={handleMouseUp}
                onPointerMove={handleMouseMove}
               >
                
                {renderedLayersAndTokens}
                {dots}
                {renderRectanglePreview()}
                
       
</div>

            </div>
        </>
    );
};

export default Grid;

