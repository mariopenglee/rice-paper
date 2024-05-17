
import layersReducer, { layerSynced } from './layers/layersSlice';
import tokensReducer,  { tokenSynced } from './tokens/tokensSlice';
import inventoryReducer, {inventorySynced} from './inventory/inventorySlice';
import currentToolReducer from './currentTool/currentToolSlice';
import colorsReducer, {colorSynced} from './colors/colorsSlice';
import notesReducer, {noteSynced} from './notes/notesSlice';
import { configureStore } from '@reduxjs/toolkit'
// import { loadState, saveState } from '../utils/localStorage';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { debounce } from 'lodash';


//const BACKEND_URL = 'https://rice-paper-backend.vercel.app';
//const BACKEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'https://ricepaper-backend.adaptable.app';
export interface RootState {
  layers: ReturnType<typeof layersReducer>;
  tokens: ReturnType<typeof tokensReducer>;
  inventory: ReturnType<typeof inventoryReducer>;
  currentTool: ReturnType<typeof currentToolReducer>;
  colors: ReturnType<typeof colorsReducer>;
  notes: ReturnType<typeof notesReducer>;
}
let socket: Socket;
let updatingFromServer = false;


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
const saveState = async (mapId : string, state : RootState) => {
  
  try {
    const relevantState = {
      layers: state.layers.layers,
      tokens: state.tokens.tokens,
      inventory: state.inventory.inventoryItems,
      colors: state.colors.colors,
      notes: state.notes.notes,
    };
    console.log('Saving state to server', state);
    await axios.post(BACKEND_URL + `/api/state/${mapId}`,
     { state: relevantState });
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


  const connectSocket = () => {
    socket = io(BACKEND_URL);
    socket.emit('joinMap', mapId);
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', (reason) => {
      console.error('Disconnected from server', reason);
      // Try to reconnect after a delay
      setTimeout(() => {
        console.log('Reconnecting to server...');
        connectSocket();
      }, 5000);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error', error);
      // Try to reconnect after a delay
      setTimeout(() => {
        console.log('Reconnecting to server...');
        connectSocket();
      }, 5000);
    });

    socket.on('stateUpdated', (state) => {
      updatingFromServer = true
      console.log('Received state update from server', state);
      const currentState = store.getState();
      if (JSON.stringify(currentState.layers.layers) !== JSON.stringify(state.layers)) {
        console.log('currentState.layers.layers', currentState.layers.layers);
        console.log('state.layers', state.layers);
        store.dispatch(layerSynced(state.layers));
        console.log('Dispatched layers update');
      }
      if (JSON.stringify(currentState.tokens.tokens) !== JSON.stringify(state.tokens)) {
        console.log('currentState.tokens.tokens', currentState.tokens.tokens);
        console.log('state.tokens', state.tokens);
        store.dispatch(tokenSynced(state.tokens));
        console.log('Dispatched tokens update');
      }
      if (JSON.stringify(currentState.inventory.inventoryItems) !== JSON.stringify(state.inventory)) {
        console.log('currentState.inventory.inventoryItems', currentState.inventory.inventoryItems);
        console.log('state.inventory', state.inventory);
        store.dispatch(inventorySynced(state.inventory));
        console.log('Dispatched inventory update');
      }
      if (JSON.stringify(currentState.colors.colors) !== JSON.stringify(state.colors)) {
        console.log('currentState.colors.colors', currentState.colors.colors);
        console.log('state.colors', state.colors);
        store.dispatch(colorSynced(state.colors));
        console.log('Dispatched colors update');
      }
  
      if (JSON.stringify(currentState.notes.notes) !== JSON.stringify(state.notes)) {
        console.log('currentState.notes.notes', currentState.notes.notes);
        console.log('state.notes', state.notes);
        store.dispatch(noteSynced(state.notes));
        console.log('Dispatched notes update');
      }
      updatingFromServer = false;
  
    }
    );
  


  };

  
  connectSocket();

  return store;
};

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