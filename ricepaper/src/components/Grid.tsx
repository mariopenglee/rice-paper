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
import { HexColorPicker, HexColorInput } from "react-colorful";
import { v4 as uuidv4 } from 'uuid';
import LayerPreview from './LayerPreview';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import Inventory from './Inventory';
import { 
    roundToNearestDot, 
    getCellFromCursorPosition, 
    accountForScroll, 
    cellSize,
    gridWidth,
    gridHeight,
 } from '../utils';
import { useSelector, useDispatch } from 'react-redux';
import { 
    layerAdded,
    layerBackgroundUpdated, 
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

import {
    shiftPressed,
    shiftReleased,
} from '../redux/currentTool/currentToolSlice';

import {
    colorAdded, 
    colorSelected,
    selectedColorUpdated,
    selectColors,
    selectSelectedColor,
    selectBackgroundColor,
} from '../redux/colors/colorsSlice';



interface TokenType {
    id: string;
    x: number;
    y: number;
    color: string;
    layer: string;
    label: string;
    labelVisibility: boolean;
    width: number;
    height: number;
}


const Grid: React.FC = () => {
    const [painting, setPainting] = useState(false);
    const [erasing, setErasing] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null); // Ref for the grid container
    const [layerPanelOpen, setLayerPanelOpen] = useState(false); // Whether the layer panel is open
    const dispatch = useDispatch();
    const [tool, setTool] = useState('paintbrush'); // Current tool
    
    // color states
    const initialColor = useSelector(selectBackgroundColor);
    const colorPalette = useSelector(selectColors);
    const selectedColor = useSelector(selectSelectedColor);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);

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
        if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return;
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
        if (targetColor === selectedColor.color) return; // Avoid redundant painting
    
        const tempPaintPreview = new Set<string>();
        floodFill(x, y, targetColor, selectedColor.color, tempPaintPreview);
    
        // Dispatch the action to paint all cells collected during the flood fill
        if (tempPaintPreview.size > 0) {
            dispatch(layerCellsPainted(
                {
                    id: selectedLayer,
                    cells: Array.from(tempPaintPreview),
                    color: selectedColor.color,
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
            if (i < 0 || i >= gridWidth || j < 0 || j >= gridHeight) {
                return true;
            }
            if (layers[lookupLayerIndex(selectedLayer)].cells[`${i}-${j}`] === targetColor && !visited[`${i}-${j}`]) {
                visited[`${i}-${j}`] = true;
                queue.push([i-1, j], [i+1, j], [i, j-1], [i, j+1]);
            }
        }
        return false;
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


    const handleUpdateLayerBackground = (id: string, color: string) => {
        dispatch(layerBackgroundUpdated({ id, background: color }));
    };





    const dotSize = 2; // Size of the dots
    const dots = [];
    for (let i = 0; i <= gridWidth; i++) {
        for (let j = 0; j <= gridHeight; j++) {
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
                zIndex: 15-layerIndex,
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
                    zIndex: 15-layerIndex,
                    pointerEvents: 'none',
                }}
            />
        );
    }
    );

    

    






    // Event handlers
    const handlePaletteColorClick = (index: number) => {
        setColorPickerOpen((selectedColor.index !== index));
        dispatch(colorSelected({ color: colorPalette[index], index }));
    };

    // Function to update color in palette
    const handleColorChange = (color: string) => {
        dispatch(selectedColorUpdated(color));
    };

    const handleAddColor = (color: string) => {
        dispatch(colorAdded(color));
        dispatch(colorSelected({ color, index: colorPalette.length }));
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
        dispatch(layerCellsPainted({ id: selectedLayer, cells, color: selectedColor.color }));

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
            dispatch(layerCellsPainted({ id: selectedLayer, cells: Array.from(paintPreview), color: selectedColor.color }));
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
                color={selectedColor.color}
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
                    background: tool === 'paintbrush' ? selectedColor.color : 'transparent',
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

        if (!selectedLayer) {
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
            const newToken: TokenType = {
                id: uuidv4(),
                x,
                y,
                color: selectedColor.color,
                layer: selectedLayer,
                label: '',
                labelVisibility: true,
                width: cellSize,
                height: cellSize,
            };
            dispatch(tokenAdded(newToken));
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
                handleUpdateLayerBackground(selectedLayer, selectedColor.color);
                
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
                case 'e':
                    setTool('erase');
                    break;
                case 'f':
                    setTool('fill');
                    break;
                case 's':
                    setTool('select');
                    break;
                case 'Shift':
                    dispatch(shiftPressed());
                    break;
                default:
                    break;
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'Shift':
                    dispatch(shiftReleased());
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);


        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
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
                {colorPalette.map((color, index) => (
                    <div 
                    className="colors-container"
                    key={index}
                    >
                     {index === selectedColor.index && colorPickerOpen &&
                        <div 
                className='color-picker'
                style={
                    {
                        backgroundColor: selectedColor.color,
                    }
                }
                >
                <HexColorPicker
                    className='color-gradient'
                    color={selectedColor.color}
                    onChange={(color) => handleColorChange(color)}
                />
                <HexColorInput
                    className='color-input'
                    color={selectedColor.color}
                    onChange={(color) => handleColorChange(color)}
                />
                </div>}
                <motion.button 
                    key={index} 
                    className='palette-color-button'
                    style={{ backgroundColor: color }} 
                    animate={{ 
                    scale: [1, 1.1, 1], // Optional: if you want a hover effect
                    borderRadius: index === selectedColor.index ? '50%' : '0%',
                    }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300, borderRadius: { duration: 0.2 } }} // Add borderRadius transition
                    
                    onClick={() => handlePaletteColorClick(index)}
                     />
                </div>
                ))}
                { colorPalette.length < 25 &&
                    <button 
                className='add-color-button'
                onClick={() => handleAddColor(selectedColor.color)}
                    >
                    <AddBoxIcon />
                </button>}


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
                // add the tokens to the layer
                const tokensForLayer = tokens.filter(token => token.layer === layerId);

                if (!layer) return null; // Handle if layer is not found
                return (
                    <LayerPreview
                        key={layer.id}
                        layer={layer}
                        tokens={tokensForLayer}
                        selected={layer.id === selectedLayer}
                    />
                );
            })}

</AnimatePresence>
</Reorder.Group>
<Inventory 
innerRef={inventoryRef} 
gridRef={gridRef}
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

