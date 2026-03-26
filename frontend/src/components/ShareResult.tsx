"use client";

import { useState } from "react";
import { Copy, Check, Link, Trash2, QrCode, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { CreateShareResponse } from "@/lib/api";
import { deleteShare } from "@/lib/api";

interface ShareResultProps {
  result: CreateShareResponse;
  onDelete?: () => void;
}

export default function ShareResult({ result, onDelete }: ShareResultProps) {
  const { t } = useTheme();
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(result.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(result.link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  };

  const handleDelete = async () => {
    if (!confirm("确认删除此分享？此操作不可撤销。")) return;
    setDeleting(true);
    try {
      await deleteShare(result.code, result.delete_token);
      // Store deletion in localStorage
      const saved = JSON.parse(localStorage.getItem("snapsend_tokens") || "{}");
      delete saved[result.code];
      localStorage.setItem("snapsend_tokens", JSON.stringify(saved));
      onDelete?.();
    } catch (e) {
      alert("删除失败");
    } finally {
      setDeleting(false);
    }
  };

  // Persist delete token
  if (typeof window !== "undefined") {
    const saved = JSON.parse(localStorage.getItem("snapsend_tokens") || "{}");
    saved[result.code] = result.delete_token;
    localStorage.setItem("snapsend_tokens", JSON.stringify(saved));
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Code display */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-500 uppercase tracking-widest">{t.pickupCodeLabel}</p>
        <div className="flex items-center justify-center gap-3">
          <span
            className="font-mono text-5xl font-bold tracking-[0.3em] text-white dark:text-white light:text-gray-900
              select-all"
          >
            {result.code}
          </span>
        </div>
        <button
          onClick={copyCode}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-200
            ${
              codeCopied
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-brand-blue hover:bg-brand-blue-dark text-white"
            }`}
        >
          {codeCopied ? <Check size={16} /> : <Copy size={16} />}
          {codeCopied ? t.copied : t.copyCode}
        </button>
      </div>

      {/* Actions row */}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => setShowQr(!showQr)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
            bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
            border border-dark-border dark:border-dark-border light:border-light-border
            text-gray-300 dark:text-gray-300 light:text-gray-700
            hover:border-brand-blue/60 hover:text-white dark:hover:text-white light:hover:text-gray-900
            transition-all duration-200"
        >
          <QrCode size={16} />
          {t.scanQr}
        </button>

        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
            bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
            border border-dark-border dark:border-dark-border light:border-light-border
            text-gray-300 dark:text-gray-300 light:text-gray-700
            hover:border-brand-blue/60 hover:text-white dark:hover:text-white light:hover:text-gray-900
            transition-all duration-200"
        >
          {linkCopied ? <Check size={16} className="text-green-400" /> : <Link size={16} />}
          {linkCopied ? t.copied : t.copyLink}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
            bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
            border border-dark-border dark:border-dark-border light:border-light-border
            text-gray-400 hover:text-red-400 hover:border-red-500/40
            transition-all duration-200 disabled:opacity-50"
        >
          <Trash2 size={16} />
          {t.deleteShare}
        </button>
      </div>

      {/* QR Code */}
      {showQr && (
        <div className="flex justify-center animate-fade-in">
          <div className="relative p-4 bg-white rounded-xl shadow-lg">
            <button
              onClick={() => setShowQr(false)}
              className="absolute -top-2 -right-2 p-1 bg-gray-800 rounded-full text-gray-300 hover:text-white"
            >
              <X size={12} />
            </button>
            <img
              src={`data:image/png;base64,${result.qr_code_base64}`}
              alt="QR Code"
              className="w-40 h-40"
            />
            <p className="text-center text-xs text-gray-500 mt-2">{result.code}</p>
          </div>
        </div>
      )}

      {/* Direct link */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg
        bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
        border border-dark-border dark:border-dark-border light:border-light-border">
        <Link size={14} className="text-gray-500 flex-shrink-0" />
        <span className="text-sm text-gray-400 truncate flex-1">{result.link}</span>
      </div>

      {/* Expiry */}
      <p className="text-center text-xs text-gray-500">
        {t.expires}: {new Date(result.expire_at).toLocaleString("zh-CN")}
      </p>
    </div>
  );
}
