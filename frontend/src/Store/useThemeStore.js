import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("Streamify-theme") || "Dim", // Default to light theme
  setTheme: (theme) => {
    localStorage.setItem("Streamify-theme", theme);
    set({ theme });
  },
}));
