
import layersReducer from './layers/layersSlice';
import tokensReducer from './tokens/tokensSlice';
import inventoryReducer from './inventory/inventorySlice';
import currentToolReducer from './currentTool/currentToolSlice';
import colorsReducer from './colors/colorsSlice';
import { configureStore } from '@reduxjs/toolkit'
// import { loadState, saveState } from '../utils/localStorage';
import axios from 'axios';

const BACKEND_URL = 'https://rice-paper-backend.vercel.app';

// Load state from the backend
const loadState = async (mapId : string) => {
  try {
    const response = await axios.get(BACKEND_URL + `/api/state/${mapId}`);
    console.log('response', response);
    return response.data || undefined;
  } catch (error) {
    console.error('Could not load state', error);
    return undefined;
  }
};
// Save state to the backend
const saveState = async (mapId : string, state : any) => {
  try {
    await axios.post(BACKEND_URL + `/api/state/${mapId}`,
     { state });
  } catch (error) {
    console.error('Could not save state', error);
  }
};

// Initialize store with preloaded state
export const initializeStore = async (mapId : string) => {
  const preloadedState = await loadState(mapId);

  const store = configureStore({
    reducer: {
      layers: layersReducer,
      tokens: tokensReducer,
      inventory: inventoryReducer,
      currentTool: currentToolReducer,
      colors: colorsReducer,
    },
    preloadedState,
  });

  store.subscribe(() => {
    saveState(mapId, store.getState());
  });

  return store;
};

const typeStore = configureStore({
  reducer: {
    layers: layersReducer,
    tokens: tokensReducer,
    inventory: inventoryReducer,
    currentTool: currentToolReducer,
    colors: colorsReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof typeStore.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof typeStore.dispatch

export interface TokenType {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  labelVisibility: boolean;
  layer: string;
  image: string;
}

export interface LayerType {
  id: string;
  cells: { [key: string]: string };
  opacity: number;
  background: string;
  visibility: boolean;
}
