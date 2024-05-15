
import layersReducer from './layers/layersSlice';
import tokensReducer from './tokens/tokensSlice';
import inventoryReducer from './inventory/inventorySlice';
import currentToolReducer from './currentTool/currentToolSlice';
import colorsReducer from './colors/colorsSlice';
import { configureStore } from '@reduxjs/toolkit'
// import { loadState, saveState } from '../utils/localStorage';
import axios from 'axios';

const BACKEND_URL = 'https://rice-paper-backend.vercel.app';
export interface RootState {
  layers: ReturnType<typeof layersReducer>;
  tokens: ReturnType<typeof tokensReducer>;
  inventory: ReturnType<typeof inventoryReducer>;
  currentTool: ReturnType<typeof currentToolReducer>;
  colors: ReturnType<typeof colorsReducer>;
}
// Load state from the backend
const loadState = async (mapId: string): Promise<RootState | undefined> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/state/${mapId}`);
    return response.data || undefined;
  } catch (error) {
    console.error('Could not load state', error);
    return undefined;
  }
};

// Save state to the backend
const saveState = async (mapId : string, state : RootState) => {
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
    saveState(mapId, store.getState() as RootState);
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
