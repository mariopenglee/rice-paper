import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from '../store';

interface CurrentToolState {
    currentTool: string;
    pressingShift: boolean;
}

const initialState: CurrentToolState = {
    currentTool: 'select',
    pressingShift: false,
};

const currentToolSlice = createSlice({
    name: 'currentTool',
    initialState,
    reducers: {
        toolSelected: (state, action) => {
            state.currentTool = action.payload;
        },

        shiftPressed: (state) => {
            state.pressingShift = true;
        },

        shiftReleased: (state) => {
            state.pressingShift = false;
        },


    },
});

export const { toolSelected, shiftPressed, shiftReleased } = currentToolSlice.actions;
export default currentToolSlice.reducer;

export const selectCurrentTool = (state: RootState) => state.currentTool.currentTool;
export const selectPressingShift = (state: RootState) => state.currentTool.pressingShift;
