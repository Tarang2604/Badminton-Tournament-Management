// src/store/slices/uiSlice.js — Global UI State (sidebar, modals)
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    activeModal: null,   // 'createTournament' | 'editTournament' | null
    darkMode: localStorage.getItem('darkMode') === 'true',
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    closeSidebar: (state) => { state.sidebarOpen = false; },
    openModal: (state, action) => { state.activeModal = action.payload; },
    closeModal: (state) => { state.activeModal = null; },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
    },
  },
});

export const { toggleSidebar, closeSidebar, openModal, closeModal, toggleDarkMode } = uiSlice.actions;
export default uiSlice.reducer;
