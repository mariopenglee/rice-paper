import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from '../store';
interface Layer {
    id: string;
    cells: { [key: string]: string };
    opacity: number;
    background: string;
    visibility: boolean;
}

interface LayersState {
    layers: Layer[];
    selectedLayer: string;
}

const initialState: LayersState = {
    layers: [
      {
      id: 'layer-0',
      cells: {},
      opacity: 1,
      background: 'transparent',
      visibility: true,
      }
    ],
    selectedLayer: 'layer-0',
  };

const layersSlice = createSlice({
    name: 'layers',
    initialState,
    reducers: {
        layerAdded: (state, action) => {
            const { layer } = action.payload;
            state.layers.push(layer);
        },
        layerRemoved: (state, action) => {
            const { id } = action.payload;
            state.layers = state.layers.filter(layer => layer.id !== id);
        },
        layerSelected: (state, action) => {
            const { id } = action.payload;
            state.selectedLayer = id;
        },
        layerOpacityUpdated: (state, action) => {
            const { id, opacity } = action.payload;
            const layer = state.layers.find(layer => layer.id === id);
            if (layer) {
                layer.opacity = opacity;
            }
        },
        layerBackgroundUpdated: (state, action) => {
            const { id, background } = action.payload;
            const layer = state.layers.find(layer => layer.id === id);
            if (layer) {
                layer.background = background;
            }
        },
        layerVisibilityToggled: (state, action) => {
            const { id } = action.payload;
            const layer = state.layers.find(layer => layer.id === id);
            if (layer) {
                layer.visibility = !layer.visibility;
            }
        },
        layerCellErased: (state, action) => {
            const { id, cellKey } = action.payload;
            const layer = state.layers.find(layer => layer.id === id);
            if (layer) {
                delete layer.cells[cellKey];
            }
        },
        layerCellsPainted: (state, action) => {
            console.log('layerCellsPainted');
            console.log(action.payload);
            const { id, cells, color } = action.payload;
            const layer = state.layers.find(layer => layer.id === id);
            console.log('painting cells', cells, 'on layer', id, 'with color', color);
            if (layer) {
                cells.forEach((cell: string) => {
                    layer.cells[cell] = color;
                });
            }
        },
    },

        
    });

export const { layerAdded, layerRemoved, layerSelected, layerOpacityUpdated, layerBackgroundUpdated, layerVisibilityToggled, layerCellErased, layerCellsPainted } = layersSlice.actions;
export default layersSlice.reducer;
export const selectLayers = (state: RootState) => state.layers.layers;
export const selectSelectedLayer = (state: RootState) => state.layers.selectedLayer;