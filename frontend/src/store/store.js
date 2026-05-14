// src/store/store.js — Redux Toolkit Store
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tournamentReducer from './slices/tournamentSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    tournaments: tournamentReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow Date objects in state
    }),
});

export default store;
