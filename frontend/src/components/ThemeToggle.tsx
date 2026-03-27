"use client";

import { Sun, Moon, Globe } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme, t, toggleLang } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleLang}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
          text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white
          bg-light-elevated dark:bg-dark-elevated
          border border-light-border dark:border-dark-border
          hover:border-brand-blue transition-all duration-200"
        title={t.langSwitch}
      >
        <Globe size={14} />
        <span>{t.langSwitch}</span>
      </button>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg
          text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white
          bg-light-elevated dark:bg-dark-elevated
          border border-light-border dark:border-dark-border
          hover:border-brand-blue transition-all duration-200"
        title={t.theme}
        aria-label={t.theme}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}
