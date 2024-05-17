import layersReducer, { layerSynced } from './layers/layersSlice';
import tokensReducer, { tokenSynced } from './tokens/tokensSlice';
import inventoryReducer, { inventorySynced } from './inventory/inventorySlice';
import currentToolReducer from './currentTool/currentToolSlice';
import colorsReducer, { colorSynced } from './colors/colorsSlice';
import notesReducer, { noteSynced } from './notes/notesSlice';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import { debounce } from 'lodash';

const BACKEND_URL = 'https://ricepaper-backend.adaptable.app';

export interface RootState {
  layers: ReturnType<typeof layersReducer>;
  tokens: ReturnType<typeof tokensReducer>;
  inventory: ReturnType<typeof inventoryReducer>;
  currentTool: ReturnType<typeof currentToolReducer>;
  colors: ReturnType<typeof colorsReducer>;
  notes: ReturnType<typeof notesReducer>;
}

let updatingFromServer = false; // Flag to track the source of updates

// Load state from the backend
const loadState = async (mapId: string): Promise<RootState | undefined> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/state/${mapId}`);
    console.log('Loaded state from server', response.data);
    const formattedState = {
      layers: {
        layers: response.data.layers,
        selectedLayer: response.data.layers[0].id,
      },
      tokens: {
        tokens: response.data.tokens,
        selectedTokens: [],
        draggingTokens: [],
      },
      inventory: { inventoryItems: response.data.inventory },
      colors: {
        colors: response.data.colors,
        selectedColor: {
          color: response.data.colors[0],
          index: 0,
        },
      },
      currentTool: { pressingShift: false },
      notes: {
        notes: response.data.notes || [],
        selectedNotes: [],
      },
    };
    return formattedState;
  } catch (error) {
    console.error('Could not load state', error);
    return undefined;
  }
};

// Save state to the backend
const saveState = async (mapId: string, state: RootState) => {
  try {
    const relevantState = {
      layers: state.layers.layers,
      tokens: state.tokens.tokens,
      inventory: state.inventory.inventoryItems,
      colors: state.colors.colors,
      notes: state.notes.notes,
    };
    console.log('Saving state to server', state);
    await axios.post(`${BACKEND_URL}/api/state/${mapId}`, { state: relevantState });
  } catch (error) {
    console.error('Could not save state', error);
  }
};

// Initialize store with preloaded state
export const initializeStore = async (mapId: string) => {
  const preloadedState = await loadState(mapId);

  const store = configureStore({
    reducer: {
      layers: layersReducer,
      tokens: tokensReducer,
      inventory: inventoryReducer,
      currentTool: currentToolReducer,
      colors: colorsReducer,
      notes: notesReducer,
    },
    preloadedState,
  });

  // Debounce saveState to avoid saving state too often
  const debouncedSaveState = debounce(saveState, 1000);

  store.subscribe(() => {
    if (!updatingFromServer) {
      const currentState = store.getState();
      console.log('State updated', currentState);
      debouncedSaveState(mapId, currentState);
    }
  });

  const fetchStatePeriodically = async () => {
    try {
      const state = await loadState(mapId);
      if (state) {
        updatingFromServer = true; // Set the flag before applying the update

        const currentState = store.getState();
        if (JSON.stringify(currentState.layers.layers) !== JSON.stringify(state.layers)) {
          store.dispatch(layerSynced(state.layers));
        }
        if (JSON.stringify(currentState.tokens.tokens) !== JSON.stringify(state.tokens)) {
          store.dispatch(tokenSynced(state.tokens));
        }
        if (JSON.stringify(currentState.inventory.inventoryItems) !== JSON.stringify(state.inventory)) {
          store.dispatch(inventorySynced(state.inventory));
        }
        if (JSON.stringify(currentState.colors.colors) !== JSON.stringify(state.colors)) {
          store.dispatch(colorSynced(state.colors));
        }
        if (JSON.stringify(currentState.notes.notes) !== JSON.stringify(state.notes)) {
          store.dispatch(noteSynced(state.notes));
        }

        updatingFromServer = false; // Reset the flag after applying the update
      }
    } catch (error) {
      console.error('Could not fetch state', error);
      // Show a message to the user
      document.getElementById('connectivity-warning')!.style.display = 'block';
    }
  };

  // Fetch state every 5 seconds
  setInterval(fetchStatePeriodically, 5000);

  return store;
};

// Add connectivity warning element to the DOM
const connectivityWarning = document.createElement('div');
connectivityWarning.id = 'connectivity-warning';
connectivityWarning.innerText = 'Please connect to the internet to use this app.';
connectivityWarning.style.display = 'none'; // Initially hidden
connectivityWarning.style.position = 'fixed';
connectivityWarning.style.top = '0';
connectivityWarning.style.width = '100%';
connectivityWarning.style.backgroundColor = 'red';
connectivityWarning.style.color = 'white';
connectivityWarning.style.textAlign = 'center';
connectivityWarning.style.padding = '10px';
document.body.appendChild(connectivityWarning);

const typeStore = configureStore({
  reducer: {
    layers: layersReducer,
    tokens: tokensReducer,
    inventory: inventoryReducer,
    currentTool: currentToolReducer,
    colors: colorsReducer,
    notes: notesReducer,
  },
});

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof typeStore.dispatch;

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
  label: string;
  cells: { [key: string]: string };
  opacity: number;
  background: string;
  visibility: boolean;
}

export interface NoteType {
  id: string;
  x: number;
  y: number;
  text: string;
  visibility: boolean;
  width: number;
  height: number;
  layer: string;
}
