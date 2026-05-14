// src/store/slices/tournamentSlice.js — Tournament State
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tournamentAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ─── Async Thunks ─────────────────────────────────────────────────────────────
export const fetchTournaments = createAsyncThunk('tournaments/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await tournamentAPI.getAll(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch tournaments');
  }
});

export const fetchTournamentById = createAsyncThunk('tournaments/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await tournamentAPI.getById(id);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Tournament not found');
  }
});

export const createTournament = createAsyncThunk('tournaments/create', async (data, { rejectWithValue }) => {
  try {
    const res = await tournamentAPI.create(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create tournament');
  }
});

export const updateTournament = createAsyncThunk('tournaments/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await tournamentAPI.update(id, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update tournament');
  }
});

export const deleteTournament = createAsyncThunk('tournaments/delete', async (id, { rejectWithValue }) => {
  try {
    await tournamentAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete tournament');
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────
const tournamentSlice = createSlice({
  name: 'tournaments',
  initialState: {
    tournaments: [],
    currentTournament: null,
    total: 0,
    pages: 1,
    currentPage: 1,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearCurrentTournament: (state) => { state.currentTournament = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTournaments.pending, (state) => { state.isLoading = true; })
      .addCase(fetchTournaments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tournaments = action.payload.tournaments;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchTournaments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchTournamentById.pending, (state) => { state.isLoading = true; })
      .addCase(fetchTournamentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTournament = action.payload.tournament;
      })
      .addCase(fetchTournamentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(createTournament.fulfilled, (state, action) => {
        state.tournaments.unshift(action.payload.tournament);
        toast.success('Tournament created successfully! 🏆');
      })
      .addCase(createTournament.rejected, (state, action) => {
        toast.error(action.payload);
      });

    builder
      .addCase(updateTournament.fulfilled, (state, action) => {
        const idx = state.tournaments.findIndex((t) => t._id === action.payload.tournament._id);
        if (idx !== -1) state.tournaments[idx] = action.payload.tournament;
        state.currentTournament = action.payload.tournament;
        toast.success('Tournament updated!');
      })
      .addCase(updateTournament.rejected, (state, action) => {
        toast.error(action.payload);
      });

    builder
      .addCase(deleteTournament.fulfilled, (state, action) => {
        state.tournaments = state.tournaments.filter((t) => t._id !== action.payload);
        toast.success('Tournament deleted');
      })
      .addCase(deleteTournament.rejected, (state, action) => {
        toast.error(action.payload);
      });
  },
});

export const { clearCurrentTournament, clearError } = tournamentSlice.actions;
export default tournamentSlice.reducer;

export const selectTournaments = (state) => state.tournaments.tournaments;
export const selectCurrentTournament = (state) => state.tournaments.currentTournament;
export const selectTournamentsLoading = (state) => state.tournaments.isLoading;
