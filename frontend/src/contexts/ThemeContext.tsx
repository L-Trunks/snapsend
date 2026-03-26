"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { translations, Lang, T } from "@/i18n";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  toggleLang: () => void;
  t: T;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  lang: "zh",
  toggleLang: () => {},
  t: translations.zh,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>("zh");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial: Theme = saved ?? (prefersDark ? "dark" : "light");
    setTheme(initial);

    const savedLang = localStorage.getItem("lang") as Lang | null;
    if (savedLang && (savedLang === "zh" || savedLang === "en")) {
      setLang(savedLang);
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const toggleLang = () => {
    setLang((prev) => {
      const next: Lang = prev === "zh" ? "en" : "zh";
      localStorage.setItem("lang", next);
      return next;
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-bg dark:bg-dark-bg" suppressHydrationWarning />
    );
  }

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, lang, toggleLang, t: translations[lang] }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
