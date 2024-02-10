import React, {useState, useEffect} from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { AlphaPicker  } from 'react-color';

import './LayerPreview.css';
interface LayerPreviewProps {
    layer: any;
    selected: boolean;
    selectLayer: (id: string) => void;
    removeLayer: (id: string) => void;
    updateLayerOpacity: (index: number, opacity: number) => void;
    toggleLayerVisibility: (index: number) => void;
    renderLayerPreview: (layer: any) => React.ReactNode;
}


export default function LayerPreview( { layer, selected, selectLayer, removeLayer, updateLayerOpacity, toggleLayerVisibility, renderLayerPreview }: LayerPreviewProps) {
    const [renaming, setRenaming] = useState(false);
    const [layerName, setLayerName] = useState('New Layer');
    const controls = useDragControls();
    return (
        <Reorder.Item 
        key={layer.id} 
        id={layer.id}
        value={layer.id}
        className={'layer-row'}
        dragListener={false}
        dragControls={controls}


        style={{ backgroundColor: selected ? 'lightgray' : 'white' }}
        onClick={() => selectLayer(layer.id)}
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

            <div className={'visibility'}>
             <button 
                className={'visibility-button'}
                onClick={() => toggleLayerVisibility(layer.id)}>
                    {layer.visibility ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </button>
            <AlphaPicker
            color={{r: 0, g: 0, b: 0, a: layer.opacity}}
            onChange={(color: any) => updateLayerOpacity(layer.id, color.rgb.a)}
            width='3rem'
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
                removeLayer(layer.id);
            }
            }
            >
                
                <DeleteIcon />
            </button>
    
        </Reorder.Item>
    );
    }
