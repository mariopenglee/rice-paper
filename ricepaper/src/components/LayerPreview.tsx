import React, {useState} from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Alpha from '@uiw/react-color-alpha';

import { 
    gridWidth,
    gridHeight,
 } from '../utils';

import { 
    layerRemoved,
    layerSelected,
    layerOpacityUpdated,
    layerVisibilityToggled, 
} from '../redux/layers/layersSlice';


import { useDispatch } from 'react-redux';

import './LayerPreview.css';
interface LayerPreviewProps {
    layer: LayerData;
    selected: boolean;
}


interface LayerData {
    id: string; 
    cells: { [key: string]: string }; // Key is the cell position, value is the color
    opacity: number;
    background: string;
    visibility: boolean;
}

const LayerPreview = ({ layer, selected }: LayerPreviewProps) => {
    const [renaming, setRenaming] = useState(false);
    const [layerName, setLayerName] = useState('New Layer');
    const controls = useDragControls();
    const dispatch = useDispatch();
    const calculateLayerBounds = (layer: LayerData) => {
        let minX = gridWidth;
        let maxX = 0;
        let minY = gridHeight;
        let maxY = 0;
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
                border: `${ selected ? '2px solid black' : '1px solid lightgray'}`,
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

    
    return (
        <Reorder.Item 
        key={layer.id} 
        id={layer.id}
        value={layer.id}
        className={'layer-row'}
        dragListener={false}
        dragControls={controls}


        style={{ backgroundColor: selected ? 'lightgray' : 'white' }}
        onClick={() => dispatch(layerSelected(layer.id))}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        layout
        >

            <div 
            className={'drag-handle'}
            onPointerDown={(e) => { e.stopPropagation(); controls.start(e) }}
            ><DragIndicatorIcon /></div>
            <div className={'left-controls'}>
            <div className={'visibility'}>
             <button 
                onClick={() => dispatch(layerVisibilityToggled(layer.id))}
                    >
                    {layer.visibility ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </button>

            <button 
                onClick={() => {}}
                >
                    <LockPersonIcon />
            </button>

                

            </div>
            <Alpha
                    hsva={{ h: 0, s: 0, v: 0, a: layer.opacity }}
                    onChange={(color) => dispatch(layerOpacityUpdated({ id: layer.id, opacity: color.a }))}
                    width={50}
                    height={16}
                    direction='horizontal'

                />
            </div>
            <div>
                {renderLayerPreview(layer)}
            </div>
            {renaming ? (
                <>
                <input 
                
                className='layer-name-input'
                value={layerName}
                onChange={(e) => setLayerName(e.target.value)}
                onBlur={() => setRenaming(false)}
                />
                <button
                onClick={() => setRenaming(false)}
                className='rename-button'
                ><CheckIcon /></button>

                </>
            ) : (
                <>
                <span 
                className='layer-name'
                >{layerName}</span>
                <button 
                className={'rename-button'}
                onClick={() => setRenaming(true)}
                >
                    
                    <EditIcon />
            </button>
            </>
            )}

              
            
            <button 
                className={'remove-button'}
            onClick={(e) => {
                e.stopPropagation();
                if (selected) {
                    dispatch(layerSelected(null));
                }
                dispatch(layerRemoved(layer.id));
            }
            }
            >
                
                <DeleteIcon />
            </button>
    
        </Reorder.Item>
    );
    }


const MemoizedLayerPreview = React.memo(LayerPreview, (prevProps, nextProps) => {
    const shouldRerender = prevProps.layer.id !== nextProps.layer.id ||
    prevProps.layer.opacity !== nextProps.layer.opacity ||
    prevProps.layer.background !== nextProps.layer.background ||
    prevProps.layer.visibility !== nextProps.layer.visibility ||
    prevProps.selected !== nextProps.selected ||
    prevProps.layer.cells !== nextProps.layer.cells ||
    prevProps.layer.visibility !== nextProps.layer.visibility;

    if (shouldRerender) {
        // console.log('Re-rendering due to change in props:', { prevProps, nextProps });
    }
    return !shouldRerender;
  }
    );
export default MemoizedLayerPreview;
