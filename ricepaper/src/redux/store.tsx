
import layersReducer from './layers/layersSlice';
import tokensReducer from './tokens/tokensSlice';
import inventoryReducer from './inventory/inventorySlice';
import { configureStore } from '@reduxjs/toolkit'

const store = configureStore({
  reducer: {
    layers: layersReducer,
    tokens: tokensReducer,
    inventory: inventoryReducer
  }
})


export default store;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export interface TokenType {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  labelVisible: boolean;
  layer: string;
}
