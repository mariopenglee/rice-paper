import { createSlice } from "@reduxjs/toolkit";
import type { RootState, TokenType } from '../store';

interface TokensState {
    tokens: TokenType[];
    selectedTokens: TokenType[];
    draggingTokens: TokenType[];
}
const initialState: TokensState = {
    tokens: [],
    selectedTokens: [],
    draggingTokens: [],
    };

const tokensSlice = createSlice({
    name: 'tokens',
    initialState,
    reducers: {
        tokenAdded: (state, action) => {
            console.log('tokenAdded');
            const { token } = action.payload;
            state.tokens.push(token);
        },
        tokenRemoved: (state, action) => {
            const { id } = action.payload;
            state.tokens = state.tokens.filter(token => token.id !== id);
        },
        tokenSelected: (state, action) => {
            state.selectedTokens = action.payload;
        },
        tokenMoved: (state, action) => {
            state.tokens = state.tokens.map(token => {
            if (token.id === action.payload.id) {
                return {
                ...token,
                x: action.payload.x,
                y: action.payload.y,
                };
            }
            return token;
            });
        },
        tokenLabelUpdated: (state, action) => {
            state.tokens = state.tokens.map(token => {
            if (token.id === action.payload.id) {
                return {
                ...token,
                label: action.payload.label,
                };
            }
            return token;
            });
        },
        tokenLabelVisibilityToggled: (state, action) => {
            state.tokens = state.tokens.map(token => {
            if (token.id === action.payload.id) {
                return {
                ...token,
                labelVisible: !token.labelVisible,
                };
            }
            return token;
            });
        },
        tokenDraggingStarted: (state, action) => {
            state.draggingTokens = action.payload;
        },
    },

});

export const { tokenAdded, tokenRemoved, tokenSelected, tokenMoved, tokenLabelUpdated, tokenLabelVisibilityToggled, tokenDraggingStarted } = tokensSlice.actions;

export default tokensSlice.reducer;

export const selectTokens = (state: RootState) => state.tokens.tokens;
export const selectSelectedTokens = (state: RootState) => state.tokens.selectedTokens;
export const selectDraggingTokens = (state: RootState) => state.tokens.draggingTokens;
