
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
import { isEqual, cloneDeep } from 'lodash';

// Keep track of the previous state
let previousState: RelevantState | null = null;
let myversion = 0;


const calculateStateDiff = (prevState: RelevantState, currentState: RelevantState) => {
  const diff: Partial<RelevantState> = {};
  if (!isEqual(prevState.layers, currentState.layers)) {
    diff.layers = currentState.layers;
  }
  if (!isEqual(prevState.tokens, currentState.tokens)) {
    diff.tokens = currentState.tokens;
  }
  if (!isEqual(prevState.inventory, currentState.inventory)) {
    diff.inventory = currentState.inventory;
  }
  if (!isEqual(prevState.colors, currentState.colors)) {
    diff.colors = currentState.colors;
  }
  if (!isEqual(prevState.notes, currentState.notes)) {
    diff.notes = currentState.notes;
  }
  return diff;
};



//const BACKEND_URL = 'http://0.0.0.0:3000';
//const BACKEND_URL = 'https://ricepaper-backend.adaptable.app';
const BACKEND_URL = 'https://starfish-app-qe9pj.ondigitalocean.app';
export interface RootState {
  layers: ReturnType<typeof layersReducer>;
  tokens: ReturnType<typeof tokensReducer>;
  inventory: ReturnType<typeof inventoryReducer>;
  currentTool: ReturnType<typeof currentToolReducer>;
  colors: ReturnType<typeof colorsReducer>;
  notes: ReturnType<typeof notesReducer>;
}

export interface RelevantState {
  layers: LayerType[];
  tokens: TokenType[];
  inventory: TokenType[];
  colors: string[];
  notes: NoteType[];
}


let socket: Socket;
let updatingFromServer = false;

let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 10;
let isConnected = false

// Load state from the backend
const loadState = async (mapId: string): Promise<RootState | undefined> => {
  try {
    
    const response = await axios.get(`${BACKEND_URL}/api/state/${mapId}`);
    console.log('Loaded state from server', response.data);
    myversion = response.data.version;
    const state = response.data.state;
    const formattedState = {
      layers: { 
        layers: state.layers || [],
        selectedLayer: state.layers[0].id || '',
       },
      tokens: { 
        tokens: state.tokens || [],
        selectedTokens: [],
        draggingTokens: [],

       },
      inventory: { inventoryItems: state.inventory || [] },
      colors: { 
        colors: state.colors || [],
        selectedColor: {
          color: state.colors ? state.colors[0] : '#000000',
          index: 0,
        },
       },
       currentTool: { pressingShift: false },
      notes: { 
        notes: state.notes || [],
        selectedNotes: [],
        },
    };
    console.log('formattedState', formattedState);
    return formattedState;

  } catch (error) {
    console.error('Could not load state', error);
    return undefined;
  }
};

// Save state to the backend
const saveState = async (mapId : string, relevantState: RelevantState) => {
  if (!isConnected) {
    alert('Cannot save state: Disconnected from server');
    // reload page to reconnect
    // window.location.reload();
    return;
  }



  try {

    let diff = {};

    if (!previousState) {
      previousState = cloneDeep(relevantState);
      diff = relevantState;
    }
    else {
      diff = calculateStateDiff(previousState, relevantState);
    }

    if (Object.keys(diff).length === 0) {
      console.log('No state changes detected');
      return;
    }

    // update the previous state
    previousState = cloneDeep(relevantState);
    // update the version so that we can ignore our own updates
    myversion++;

    console.log('Saving state to server', diff);
    await axios.patch(BACKEND_URL + `/api/state/${mapId}`,
     { state: diff, version: myversion - 1 });

     socket.emit('stateUpdated', diff, myversion);
    console.log('State saved to server');

    
    
  } catch (error) {
    console.error('Could not save state', error);
    if (error.response && error.response.status === 409) {
      console.error('Conflict detected. Reloading state...');
      fetchAndUpdateState(typeStore, mapId);
    }
  }
};

// Fetch and update state after reconnection
const fetchAndUpdateState = async (store: any, mapId: string) => {
  const state = await loadState(mapId);
  if (state) {
    store.dispatch(layerSynced(state.layers.layers));
    store.dispatch(tokenSynced(state.tokens.tokens));
    store.dispatch(inventorySynced(state.inventory.inventoryItems));
    store.dispatch(colorSynced(state.colors.colors));
    store.dispatch(noteSynced(state.notes.notes));
    console.log('State updated after reconnection');
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
      const relevantState = {
        layers: currentState.layers.layers,
        tokens: currentState.tokens.tokens,
        inventory: currentState.inventory.inventoryItems,
        colors: currentState.colors.colors,
        notes: currentState.notes.notes,
      };
      debouncedSaveState(mapId, relevantState);
    }
  });


  const connectSocket = () => {
    socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS, // Maximum number of reconnection attempts
      reconnectionDelay: 5000, 
      // time out after 10 minutes of inactivity
      timeout: 600000,

    });
  
    socket.emit('joinMap', mapId);
    socket.on('connect', () => {
      console.log('Connected to server');
      isConnected = true; 
      reconnectionAttempts = 0; 
      fetchAndUpdateState(store, mapId); 
    });

    socket.on('disconnect', (reason) => {
      alert('Disconnected from server. Reason: ' + reason);

      

      isConnected = false; 
      // window.location.reload();
      if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
        console.log(`Reconnecting to server (attempt ${reconnectionAttempts + 1})...`);
        reconnectionAttempts++;
      } else {
        console.error('Max reconnection attempts reached. Unable to reconnect.');
      }
  
    });

    socket.on('ping', () => {
      console.log(`got ping from server`);
      socket.emit("pong", {})
    });
  

    socket.on('reconnect_attempt', () => {
      console.log(`Reconnection attempt ${reconnectionAttempts + 1}...`);
    });
  
    socket.on('reconnect_failed', () => {
      console.error('Reconnection failed. Attempting again...');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error', error);
      // Try to reconnect after a delay
      setTimeout(() => {
        console.log('Reconnecting to server...');
        connectSocket();
      }, 5000);
    });

    socket.on('stateUpdated', (state: RelevantState, newVersion: number) => {
      updatingFromServer = true;
      
      console.log('my version', myversion);
      console.log('new version', newVersion);
      if (newVersion === myversion) {
        console.log(`Ignoring state update with version ${newVersion} (my version: ${myversion})`);
        updatingFromServer = false;
        return;
      }
      else {
        myversion = newVersion;
        console.log('Received state update', state);
      }
      
      // if we're the ones who updated the state, we don't need to update it again
      if (state.layers && !isEqual(state.layers, store.getState().layers.layers)) {
        store.dispatch(layerSynced(state.layers));
        console.log('received layers', state.layers);
      }
      if (state.tokens && !isEqual(state.tokens, store.getState().tokens.tokens)) {
        store.dispatch(tokenSynced(state.tokens));
        console.log('received tokens', state.tokens);
      }
      if (state.inventory && !isEqual(state.inventory, store.getState().inventory.inventoryItems)) {
        store.dispatch(inventorySynced(state.inventory));
        console.log('received inventory', state.inventory);
      }
      if (state.colors && !isEqual(state.colors, store.getState().colors.colors)) {
        store.dispatch(colorSynced(state.colors));
        console.log('received colors', state.colors);
      }
      if (state.notes && !isEqual(state.notes, store.getState().notes.notes)) {
        store.dispatch(noteSynced(state.notes));
        console.log('received notes', state.notes);
      }
      updatingFromServer = false;
  }
  );



  };

  
  connectSocket();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !socket.connected) {
      console.log('Tab is visible again. Reconnecting...');
      connectSocket();
    }
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
