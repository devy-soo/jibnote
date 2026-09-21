import { create } from "zustand";
import { api } from "../api/client";
import type { Preferences } from "../types";

const EMPTY_PREFERENCES: Preferences = { requiredOptions: [] };

interface PreferencesStore {
  preferences: Preferences;
  loaded: boolean;
  fetch: () => Promise<void>;
  save: (prefs: Preferences) => Promise<void>;
  reset: () => void;
}

export const usePreferencesStore = create<PreferencesStore>((set) => ({
  preferences: EMPTY_PREFERENCES,
  loaded: false,

  fetch: async () => {
    const res = await api.get("/preferences");
    set({ preferences: { ...EMPTY_PREFERENCES, ...res.data.preferences }, loaded: true });
  },

  save: async (prefs) => {
    const res = await api.put("/preferences", prefs);
    set({ preferences: { ...EMPTY_PREFERENCES, ...res.data.preferences } });
  },

  reset: () => set({ preferences: EMPTY_PREFERENCES, loaded: false }),
}));
