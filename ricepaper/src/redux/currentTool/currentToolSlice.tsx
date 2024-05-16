import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from '../store';

interface CurrentToolState {
    pressingShift: boolean;
}

const initialState: CurrentToolState = {
    pressingShift: false,
};

const currentToolSlice = createSlice({
    name: 'currentTool',
    initialState,
    reducers: {
        shiftPressed: (state) => {
            state.pressingShift = true;
        },

        shiftReleased: (state) => {
            state.pressingShift = false;
        },


    },
});

export const { shiftPressed, shiftReleased } = currentToolSlice.actions;
export default currentToolSlice.reducer;

export const selectPressingShift = (state: RootState) => state.currentTool.pressingShift;
