"use client";

import { useState, KeyboardEvent } from "react";
import { Lock, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface PasswordModalProps {
  onConfirm: (password: string) => void;
  onCancel: () => void;
  error?: string;
}

export default function PasswordModal({ onConfirm, onCancel, error }: PasswordModalProps) {
  const { t } = useTheme();
  const [password, setPassword] = useState("");

  const handleConfirm = () => { if (password.trim()) onConfirm(password.trim()); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm mx-4 p-6 rounded-2xl
        bg-white dark:bg-dark-surface
        border border-light-border dark:border-dark-border
        shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Lock size={18} className="text-brand-blue" />
            <h3 className="font-semibold">{t.enterPassword}</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <input autoFocus type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} onKeyDown={onKey}
          placeholder={t.passwordInput}
          className="w-full px-4 py-3 rounded-lg text-sm
            bg-light-elevated dark:bg-dark-elevated
            border border-light-border dark:border-dark-border
            text-gray-900 dark:text-white placeholder-gray-400
            focus:outline-none focus:border-brand-blue
            transition-colors duration-200"
        />

        {error && <p className="mt-2 text-xs text-red-500 animate-fade-in">{error}</p>}

        <div className="flex gap-3 mt-4">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm
              border border-light-border dark:border-dark-border
              text-gray-500 hover:text-gray-900 dark:hover:text-white
              hover:border-gray-400 dark:hover:border-gray-500
              transition-all duration-200">
            {t.cancel}
          </button>
          <button onClick={handleConfirm} disabled={!password.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium
              bg-brand-blue hover:bg-brand-blue-dark text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200">
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
