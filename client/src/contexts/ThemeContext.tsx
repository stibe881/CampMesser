import React, { createContext, useContext, useEffect, useState } from "react";
import {
  isThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/themePreference";

interface ThemeContextType {
  /** Tatsächlich angewendetes Design (bei "auto" aufgelöst). */
  theme: ResolvedTheme;
  /** Gewählte Präferenz inkl. "auto" (folgt dem System). */
  preference: ThemePreference;
  /** Zyklisch weiterschalten: hell → dunkel → auto. */
  toggleTheme?: () => void;
  /** Präferenz direkt setzen (z. B. aus dem Profil). */
  setPreference?: (pref: ThemePreference) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
  switchable?: boolean;
}

/** Liest die System-Einstellung (prefers-color-scheme) sicher aus. */
function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return isThemePreference(stored) ? stored : defaultTheme;
    }
    return defaultTheme;
  });
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // Bei "auto" der System-Einstellung live folgen
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const theme = resolveTheme(preference, systemDark);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (switchable) {
      localStorage.setItem("theme", preference);
    }
  }, [preference, switchable]);

  const toggleTheme = switchable
    ? () => {
        setPreferenceState(prev =>
          prev === "light" ? "dark" : prev === "dark" ? "auto" : "light"
        );
      }
    : undefined;

  const setPreference = switchable
    ? (pref: ThemePreference) => setPreferenceState(pref)
    : undefined;

  return (
    <ThemeContext.Provider
      value={{ theme, preference, toggleTheme, setPreference, switchable }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
