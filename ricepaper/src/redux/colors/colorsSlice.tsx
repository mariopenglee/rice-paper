import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from '../store';

const initialState = {

    colors:[
        '#0D0D0D', 
        '#4D4D4D', 
        '#B3B3B3', 
        '#5C4033', 
        '#8B1A1A', 
        '#D0F0C0',
        '#789EC6', 
        '#FFF8DC'],
    selectedColor: {
        color: '#0D0D0D',
        index: 0
    },
    backgroundColor: '#FFF8DC'
};

const colorsSlice = createSlice({
    name: 'colors',
    initialState,
    reducers: {
        colorAdded: (state, action) => {
            state.colors.push(action.payload);

        },
        colorRemoved: (state, action) => {
            state.colors = state.colors.filter(color => color !== action.payload);
        },
        selectedColorUpdated: (state, action) => {
            state.colors[state.selectedColor.index] = action.payload;
            state.selectedColor.color = action.payload;
        },
        colorSelected: (state, action) => {
            state.selectedColor = action.payload;
        },
        fullUpdate: (_, action) => {
            return action.payload.colors;
        }

    },
});

export const { 
    colorAdded, 
    colorRemoved,
    colorSelected,
    selectedColorUpdated,
    fullUpdate
 } = colorsSlice.actions;

export default colorsSlice.reducer;

export const selectColors = (state: RootState) => state.colors.colors;
export const selectSelectedColor = (state: RootState) => state.colors.selectedColor;
export const selectBackgroundColor = (state: RootState) => state.colors.backgroundColor;

