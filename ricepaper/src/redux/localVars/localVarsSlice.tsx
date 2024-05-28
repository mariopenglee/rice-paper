import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from '../store';

interface localVarState {
    zoomLevel: number;
}
const initialState: localVarState = {
    zoomLevel: 2.5,
    };

const localVarSlice = createSlice({
    name: 'localVars',
    initialState,
    reducers: {
        zoomLevelUpdated: (state, action) => {
            state.zoomLevel = action.payload;
        },
    },

});

export const { 
    zoomLevelUpdated,
 } = localVarSlice.actions;

export default localVarSlice.reducer;

export const selectZoomLevel = (state: RootState) => state.localVars.zoomLevel;