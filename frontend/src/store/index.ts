import { configureStore } from '@reduxjs/toolkit';
import diagnosticReducer from './slices/diagnosticSlice';

export const store = configureStore({
  reducer: {
    diagnostic: diagnosticReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable for tests - Date objects in timestamps
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;