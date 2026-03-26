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
          text-gray-400 hover:text-white dark:text-gray-400 dark:hover:text-white
          light:text-gray-500 light:hover:text-gray-900
          bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
          border border-dark-border dark:border-dark-border light:border-light-border
          hover:border-brand-blue transition-all duration-200"
        title={t.langSwitch}
      >
        <Globe size={14} />
        <span>{t.langSwitch}</span>
      </button>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg
          text-gray-400 hover:text-white dark:text-gray-400 dark:hover:text-white
          bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
          border border-dark-border dark:border-dark-border light:border-light-border
          hover:border-brand-blue transition-all duration-200"
        title={t.theme}
        aria-label={t.theme}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}
