import { createSlice } from "@reduxjs/toolkit";
import type { RootState, NoteType } from '../store';

interface NotesState {
    notes: NoteType[];
    selectedNotes: NoteType[];
}
const initialState: NotesState = {
    notes: [],
    selectedNotes: [],
    };

const notesSlice = createSlice({
    name: 'notes',
    initialState,
    reducers: {
        noteAdded: (state, action) => {
            state.notes.push(action.payload);
        },
        noteRemoved: (state, action) => {
            const { id } = action.payload;
            state.notes = state.notes.filter(note => note.id !== id);
        },
        noteSelected: (state, action) => {
            state.selectedNotes = action.payload;
        },
        noteMoved: (state, action) => {
            state.notes = state.notes.map(note => {
            if (note.id === action.payload.id) {
                return {
                ...note,
                x: action.payload.x,
                y: action.payload.y,
                };
            }
            return note;
            });
        },
        selectedNotesMoved: (state, action) => {
            state.notes = state.notes.map(note => {
            if (state.selectedNotes.some(selectedNote => selectedNote.id === note.id)) {
                return {
                ...note,
                x: note.x + action.payload.x,
                y: note.y + action.payload.y,
                };
            }
            return note;
            });
        },
        selectedNotesResized: (state, action) => {
            state.notes = state.notes.map(note => {
            if (state.selectedNotes.some(selectedNote => selectedNote.id === note.id)) {
                return {
                ...note,
                width: action.payload.width,
                height: action.payload.height,
                };
            }
            return note;
            });
        },
        selectedNotesUpdated: (state, action) => {
            state.notes = state.notes.map(note => {
            if (state.selectedNotes.some(selectedNote => selectedNote.id === note.id)) {
                return {
                ...note,
                ...action.payload,
                };
            }
            return note;
            });
        },
        noteTextUpdated: (state, action) => {
            state.notes = state.notes.map(note => {
            if (note.id === action.payload.id) {
                return {
                ...note,
                text: action.payload.text,
                };
            }
            return note;
            });
        },
        noteVisibilityToggled: (state, action) => {
            state.notes = state.notes.map(note => {
            if (note.id === action.payload) {
                return {
                ...note,
                visibility: !note.visibility,
                };
            }
            return note;
            });
        },
        noteResized: (state, action) => {
            state.notes = state.notes.map(note => {
            if (note.id === action.payload.id) {
                return {
                ...note,
                width: action.payload.width,
                height: action.payload.height,
                };
            }
            return note;
            });
        },
        noteSynced: (state, action) => {
            state.notes = action.payload;
        },
    },

});

export const { 
    noteAdded, 
    noteRemoved,
    noteSelected,
    noteMoved,
    selectedNotesMoved,
    selectedNotesResized,
    selectedNotesUpdated,
    noteTextUpdated,
    noteVisibilityToggled,
    noteResized,
    noteSynced,
 } = notesSlice.actions;

export default notesSlice.reducer;

export const selectNotes = (state: RootState) => state.notes.notes;
export const selectSelectedNotes = (state: RootState) => state.notes.selectedNotes;