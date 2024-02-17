// src/components/Grid.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './Grid.css';
import Token from './Token';
import Cell from './Cell';
import Dot from './Dot';
import { AnimatePresence, Reorder, motion } from 'framer-motion';
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
import LayerPreview from './LayerPreview';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import Inventory from './Inventory';
import { roundToNearestDot, getCellFromCursorPosition, accountForScroll } from '../utils';
import { useSelector, useDispatch } from 'react-redux';

import { 
    layerAdded,
    layerRemoved,
    layerSelected,
    layerOpacityUpdated,
    layerBackgroundUpdated, 
    layerVisibilityToggled, 
    layerCellsPainted,
    layerCellErased,
    selectLayers,
    selectSelectedLayer,
} from '../redux/layers/layersSlice';

import {
    tokenAdded,
    tokenSelected,
    selectTokens,
} from '../redux/tokens/tokensSlice';



interface LayerData {
    id: string; 
    cells: { [key: string]: string }; // Key is the cell position, value is the color
    opacity: number;
    background: string;
    visibility: boolean;
}

interface TokenType {
    id: string;
    x: number;
    y: number;
    color: string;
    layer: string;
    label: string;
    labelVisibility: boolean;
}




const Grid: React.FC = () => {
    const initialGridSize = 100; // Initial grid size
    const cellSize = 30; // Assuming each cell
    const initialColor = '#FFF8DC'; // Default color: rice paper
    const [gridSize] = useState(initialGridSize);
    const [painting, setPainting] = useState(false);
    const [erasing, setErasing] = useState(false);
    const [selectedColor, setSelectedColor] = useState('black');
    const [tool, setTool] = useState('paintbrush'); // 'paintbrush' or 'pan'
    const gridRef = useRef<HTMLDivElement>(null); // Ref for the grid container
    const [layerPanelOpen, setLayerPanelOpen] = useState(false); // Whether the layer panel is open
    const dispatch = useDispatch();
    // Layer states
    const layers = useSelector(selectLayers);
    const selectedLayer = useSelector(selectSelectedLayer);
    const [layerOrder, setLayerOrder] = useState(layers.map(layer => layer.id));

    // Inventory states
    const inventoryRef = useRef<HTMLDivElement>(null); // Ref for the inventory container
    const [isDrawingRectangle, setIsDrawingRectangle] = useState(false);
    const [rectanglePreview, setRectanglePreview] = useState({ startX: 0, startY: 0, endX: 0, endY: 0, show: false });

    const [rectangleStart, setRectangleStart] = useState({ x: 0, y: 0 });
    const [paintPreview, setPaintPreview] = useState<Set<string>>(new Set());

    // Token states
    const tokens = useSelector(selectTokens);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionPreview, setSelectionPreview] = useState({ startX: 0, startY: 0, endX: 0, endY: 0, show: false });


    const lookupLayerIndex = useCallback((id: string) => {
        return layers.findIndex(layer => layer.id === id);
    }
    , [layers]);




    const floodFill = (x: number, y: number, targetColor: string, newColor: string, tempPaintPreview: Set<string>) => {
        // Base cases to stop recursion
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
        const cellKey = `${x}-${y}`;
        const cellColor = layers[lookupLayerIndex(selectedLayer)].cells[cellKey];
    
        // Check if cell should be filled
        if (cellColor !== targetColor || tempPaintPreview.has(cellKey)) return;
    
        // Add cell to temporary paint preview set
        tempPaintPreview.add(cellKey);
    
        // Recur for adjacent cells
        floodFill(x + 1, y, targetColor, newColor, tempPaintPreview);
        floodFill(x - 1, y, targetColor, newColor, tempPaintPreview);
        floodFill(x, y + 1, targetColor, newColor, tempPaintPreview);
        floodFill(x, y - 1, targetColor, newColor, tempPaintPreview);
    };
    
    const handleFloodFill = (x: number, y: number) => {
        const cellKey = `${x}-${y}`;
        const targetColor = layers[lookupLayerIndex(selectedLayer)].cells[cellKey];
        if (targetColor === selectedColor) return; // Avoid redundant painting
    
        const tempPaintPreview = new Set<string>();
        floodFill(x, y, targetColor, selectedColor, tempPaintPreview);
    
        // Dispatch the action to paint all cells collected during the flood fill
        if (tempPaintPreview.size > 0) {
            dispatch(layerCellsPainted(
                {
                    id: selectedLayer,
                    cells: Array.from(tempPaintPreview),
                    color: selectedColor,
                }
            ));
        }
    };
    
    // function to check if flood filling this empty cell will reach the border
    const willFloodFillReachBorder = (x: number, y: number, targetColor: string) => {
        const visited: Record<string, boolean> = {};
        const queue: [number, number][] = [];
        queue.push([x, y]);
        while (queue.length > 0) {
            const point = queue.shift();
            if (!point) continue;
            const [i, j] = point;
            if (i < 0 || i >= gridSize || j < 0 || j >= gridSize) {
                return true;
            }
            if (layers[lookupLayerIndex(selectedLayer)].cells[`${i}-${j}`] === targetColor && !visited[`${i}-${j}`]) {
                visited[`${i}-${j}`] = true;
                queue.push([i-1, j], [i+1, j], [i, j-1], [i, j+1]);
            }
        }
        return false;
    };
 

    const handleSelectLayer = (id: string) => {
        dispatch(layerSelected({ id }));
    };

    const handleAddLayer = () => {
        const newLayer = {
            id: uuidv4(),
            name: 'New Layer',
            cells: {},
            opacity: 1,
            background: 'transparent',
            visibility: true,
        };
        dispatch(layerAdded({ layer: newLayer }));
        setLayerOrder([...layerOrder, newLayer.id]);
    };

    const handleRemoveLayer = (id: string) => {
        if (selectedLayer === id) {
            dispatch(layerSelected({ id: 'none' }));
        }
        dispatch(layerRemoved({ id }));
    };

    const handleUpdateLayerOpacity = (id: string, opacity: number) => {
        dispatch(layerOpacityUpdated({ id, opacity }));
    };

    const handleUpdateLayerBackground = (id: string, color: string) => {
        dispatch(layerBackgroundUpdated({ id, background: color }));
    };

    const handleToggleLayerVisibility = (id: string) => {

        dispatch(layerVisibilityToggled({ id }));
    }


    const calculateLayerBounds = (layer: LayerData) => {
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
            const cellStyle: React.CSSProperties = {
                position: 'absolute',
                left: `${(gridX - bounds.minX) * scale}px`,
                top: `${(gridY - bounds.minY) * scale}px`,
                width: `${scale}px`,
                height: `${scale}px`,
                backgroundColor: value,
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


    // Token related functions

    const handleAddToken = (token: TokenType) => {
        dispatch(tokenAdded({ token }));
    }

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







    const renderedLayersAndTokens = layerOrder.map((layerId, layerIndex) => {
        const layer = layers.find(layer => layer.id === layerId);
        if (!layer) return null; // Handle if layer is not found

        const efficientOpacity = layer.opacity * Number(layer.visibility);
        const pointerEvents = selectedLayer === layer.id ? 'auto' : 'none';
        // Render cells for the current layer
        const renderedCells = Object.entries(layer.cells).map(([key, value]) => {
            const [gridX, gridY] = key.split('-').map(Number);
            return (
                <Cell
                    key={key}
                    x={gridX * cellSize}
                    y={gridY * cellSize}
                    size={cellSize}
                    color={value}
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
                    inventoryRef= {inventoryRef}
                    gridRef={gridRef}
                />
            ));

        return (
            <div
            key={layerIndex}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: gridRef.current?.scrollWidth,
                height: gridRef.current?.scrollHeight,
                overflow: 'visible',
                zIndex: layerIndex,
                opacity: efficientOpacity,
                pointerEvents: pointerEvents,
            }}

            >
                {renderedCells}
                {renderedTokensForLayer}
            </div>
        );
    });

    const renderedLayerBackgrounds = layerOrder.map((layerId, layerIndex) => {
        const layer = layers.find(layer => layer.id === layerId);
        if (!layer) return null;
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

    const eraseCell = (gridX: number, gridY: number) => {
        // Erase the cell at the given coordinates on the selected layer
        const cellKey = `${gridX}-${gridY}`;
        dispatch(layerCellErased({ layerId: selectedLayer, cellKey }));
    }

    const paintRectangle = (startX: number, startY: number, endX: number, endY: number) => {
        // Paint a rectangle from the start coordinates to the end coordinates
        const minX = Math.min(startX, endX);
        const minY = Math.min(startY, endY);
        const maxX = Math.max(startX, endX);
        const maxY = Math.max(startY, endY);
        const cells = [];
        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                cells.push(`${i}-${j}`);
            }
        }
        dispatch(layerCellsPainted({ id: selectedLayer, cells, color: selectedColor }));

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
        const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY, gridRef);
        
        if (isDrawingRectangle) {
            
            updateRectanglePreview(rectangleStart.x, rectangleStart.y, gridX, gridY);

        }
        else if (tool === 'paintbrush' && painting) {
            const cellKey = `${gridX}-${gridY}`;
            if (paintPreview.has(cellKey)) return;
            setPaintPreview(new Set([...paintPreview, cellKey]));

        }
        else if (tool === 'erase' && erasing) {
            const cellKey = `${gridX}-${gridY}`;
            if (erasing && layers[lookupLayerIndex(selectedLayer)].cells[cellKey]) {
                eraseCell(gridX, gridY);
            }
        }
        else if (tool === 'select' && isSelecting) {
            const { startX, startY, endX, endY } = selectionPreview;
            const { x: gridX, y: gridY} = accountForScroll(clientX, clientY, gridRef);
            if (endX !== gridX || endY !== gridY) {
                setSelectionPreview({ startX, startY, endX: gridX, endY: gridY, show: true });
            }
        }
    };
    const handleMouseUp = (event: React.MouseEvent) => {

        if (isDrawingRectangle) {
            const { clientX, clientY } = event;
            const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY, gridRef);
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
            setPaintPreview(new Set());
            dispatch(layerCellsPainted({ id: selectedLayer, cells: Array.from(paintPreview), color: selectedColor }));
        }
        else if (isSelecting) {
            setIsSelecting(false);
            const rect = {
                left: Math.min(selectionPreview.startX, selectionPreview.endX),
                right: Math.max(selectionPreview.startX, selectionPreview.endX),
                top: Math.min(selectionPreview.startY, selectionPreview.endY),
                bottom: Math.max(selectionPreview.startY, selectionPreview.endY),
            };
    
            const selected = tokens.filter(token => {
                const { x, y } = token;
                return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
            });
    
            dispatch(tokenSelected(selected));

            // Hide the selection preview
            setSelectionPreview({ startX: 0, startY: 0, endX: 0, endY: 0, show: false });
        }
        
        
       
    }

    const renderedPaintPreview = Array.from(paintPreview).map((cellKey, index) => {
        const [gridX, gridY] = cellKey.split('-').map(Number);
        return (
            <Cell
                key={index}
                x={gridX * cellSize}
                y={gridY * cellSize}
                size={cellSize}
                color={selectedColor}
                opacity={0.5}
            />
        );
    }
    );
    

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
                    background: tool === 'paintbrush' ? selectedColor : 'transparent',
                    opacity: 0.5,
                    pointerEvents: 'none',
                }}
            />
        );
    };

    const renderSelectionPreview = () => {
        if (!selectionPreview.show) return null;
        const { startX, startY, endX, endY } = selectionPreview;
        const minX = Math.min(startX, endX);
        const minY = Math.min(startY, endY);
        const width = Math.abs(startX - endX);
        const height = Math.abs(startY - endY);
        return (
            <div
                style={{
                    position: 'absolute',
                    top: minY,
                    left: minX,
                    width: width,
                    height: height,
                    border: '2px dashed blue',
                    pointerEvents: 'none',
                }}
            />
        );
    };
    
    

    const handleMouseDown = (event: React.MouseEvent) => {

        if (selectedLayer === 'none'){
            alert('Please select a layer to draw on');
            return;
        }
        const { clientX, clientY } = event;

        if (tool === 'paintbrush') {
        const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY, gridRef);


        if (event.shiftKey) {
            // start drawing a rectangle
            setIsDrawingRectangle(true);
            setRectangleStart({ x: gridX, y: gridY });
            
        }
        else {
            setPaintPreview(new Set([`${gridX}-${gridY}`]));
        }
        setPainting(true);
        }
        else if (tool === 'token') {
            const { x, y } = roundToNearestDot(clientX, clientY, gridRef);
            handleAddToken({
                id: uuidv4(),
                color: selectedColor,
                x: x,
                y: y,
                label: '',
                layer: selectedLayer,
                labelVisibility: true,
             });
        }
        else if (tool === 'erase') {
            const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY, gridRef);
            
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
            const { gridX, gridY } = getCellFromCursorPosition(clientX, clientY, gridRef);
            const cellKey = `${gridX}-${gridY}`;
            const targetColor = layers[lookupLayerIndex(selectedLayer)].cells[cellKey];
            const bounded = !willFloodFillReachBorder(gridX, gridY, targetColor);
            
            if (bounded) {
                
                handleFloodFill(gridX, gridY);
            } else {
                alert('Flood fill will reach the border, changing the layer background instead');
                handleUpdateLayerBackground(selectedLayer, selectedColor);
                
            }
        }
        else if (tool === 'select') {
            const { x: gridX, y: gridY } = accountForScroll(clientX, clientY, gridRef);
            setIsSelecting(true);
            setSelectionPreview({ 
                startX: gridX,
                startY: gridY,
                endX: gridX,
                endY: gridY,
                show: true });
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
                case 't':
                    setTool('token');
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);


        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [cellSize, tokens, layers]);



      
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
                <button onClick={() => setTool('select')}><HighlightAltIcon /></button>

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
                >
                
                <div className='layers-panel-header'>
                    <button 
                    className='add-layer-button'
                    disabled={layers.length >= 10}
                    onClick={handleAddLayer}>
                        <LibraryAddIcon />
                    </button>

                    <button
                    className='minimize-button'
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
                onReorder={setLayerOrder} // Update the layer order state
                values={layerOrder}

                >
                    <AnimatePresence>
                {layerOrder.map((layerId) => {
                const layer = layers.find(layer => layer.id === layerId);
                if (!layer) return null; // Handle if layer is not found
                return (
                    <LayerPreview
                        key={layer.id}
                        layer={layer}
                        selected={layer.id === selectedLayer}
                        selectLayer={handleSelectLayer}
                        updateLayerOpacity={handleUpdateLayerOpacity}
                        toggleLayerVisibility={handleToggleLayerVisibility}
                        removeLayer={handleRemoveLayer}
                        renderLayerPreview={renderLayerPreview}
                    />
                );
            })}

</AnimatePresence>
</Reorder.Group>
<Inventory 
innerRef={inventoryRef} 
gridRef={gridRef}
selectedColor={selectedColor}   
/>
              
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
                {renderSelectionPreview()}
                {renderedPaintPreview}

                
       
</div>

            </div>
        </>
    );
};

export default Grid;

