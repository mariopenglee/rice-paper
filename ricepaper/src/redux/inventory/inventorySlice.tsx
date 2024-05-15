import { createSlice } from "@reduxjs/toolkit";
import type { RootState, TokenType } from '../store';

interface InventoryState {
    inventoryItems: TokenType[];
}

const initialState: InventoryState = {
    inventoryItems: [],
  };

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        inventoryItemAdded: (state, action) => {
            state.inventoryItems.push(action.payload);
        },
        inventoryItemRemoved: (state, action) => {
            state.inventoryItems = state.inventoryItems.filter(item => item.id !== action.payload);
        },
        inventoryItemLabelUpdated: (state, action) => {
            state.inventoryItems = state.inventoryItems.map(item => {
                if (item.id === action.payload.id) {
                    return {
                        ...item,
                        label: action.payload.label,
                    };
                }
                return item;
            });
        },
        inventoryItemsSet: (state, action) => {
            state.inventoryItems = action.payload;
        },
        fullUpdate: (_, action) => {
            return action.payload.inventoryItems;
        }
    },
});

export const { 
    inventoryItemAdded, 
    inventoryItemRemoved,
    inventoryItemLabelUpdated,
    inventoryItemsSet,
    fullUpdate
 } = inventorySlice.actions;
export default inventorySlice.reducer;

export const selectInventoryItems = (state: RootState) => state.inventory.inventoryItems;