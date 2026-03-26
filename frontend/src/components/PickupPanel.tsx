"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Download,
  Copy,
  Check,
  FileText,
  Package,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { getShare, verifyPassword, getDownloadUrl, getDownloadAllUrl, ShareInfo } from "@/lib/api";
import PasswordModal from "./PasswordModal";
import { formatBytes, formatDuration, getFileIcon } from "@/lib/utils";

interface PickupPanelProps {
  initialCode?: string;
}

export default function PickupPanel({ initialCode = "" }: PickupPanelProps) {
  const { t } = useTheme();
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);

  // Auto-lookup when opened with a pre-filled code (e.g., direct link /{code})
  useEffect(() => {
    if (initialCode && initialCode.length >= 4) {
      lookup(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [error, setError] = useState("");
  const [share, setShare] = useState<ShareInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [textCopied, setTextCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lookup = async (targetCode?: string) => {
    const c = (targetCode || code).trim().toUpperCase();
    if (!c) return;
    setError("");
    setShare(null);
    setLoading(true);
    try {
      const data = await getShare(c);
      if (data.has_password) {
        setShare(data);
        setShowPassword(true);
      } else {
        setShare(data);
      }
    } catch (e: any) {
      setError(e.message || t.notFound);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordConfirm = async (pwd: string) => {
    if (!share) return;
    setPasswordError("");
    try {
      const { share: fullShare } = await verifyPassword(share.code, pwd);
      setEnteredPassword(pwd);
      setShare(fullShare);
      setShowPassword(false);
    } catch (e: any) {
      setPasswordError(t.wrongPassword);
    }
  };

  const copyText = async () => {
    if (!share?.text_content) return;
    await navigator.clipboard.writeText(share.text_content);
    setTextCopied(true);
    setTimeout(() => setTextCopied(false), 1500);
  };

  const downloadFile = (fileId: number) => {
    if (!share) return;
    const url = getDownloadUrl(share.code, fileId);
    const a = document.createElement("a");
    a.href = enteredPassword
      ? url
      : url;
    if (enteredPassword) {
      // Use fetch with header for password-protected downloads
      fetch(url, { headers: { "X-Share-Password": enteredPassword } })
        .then((r) => r.blob())
        .then((blob) => {
          const file = share.files.find((f) => f.id === fileId);
          const burl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = burl;
          link.download = file?.filename || "file";
          link.click();
          URL.revokeObjectURL(burl);
        });
    } else {
      a.target = "_blank";
      a.click();
    }
  };

  const downloadAll = () => {
    if (!share) return;
    if (enteredPassword) {
      const url = getDownloadAllUrl(share.code);
      fetch(url, { headers: { "X-Share-Password": enteredPassword } })
        .then((r) => r.blob())
        .then((blob) => {
          const burl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = burl;
          link.download = `snapsend_${share.code}.zip`;
          link.click();
          URL.revokeObjectURL(burl);
        });
    } else {
      const a = document.createElement("a");
      a.href = getDownloadAllUrl(share.code);
      a.target = "_blank";
      a.click();
    }
  };

  return (
    <div className="space-y-5">
      {/* Code input */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">{t.pickupCodeInput}</label>
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20))
            }
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder={t.pickupPlaceholder}
            maxLength={20}
            className="flex-1 px-5 py-3 rounded-xl text-lg font-mono font-bold tracking-[0.25em] text-center
              bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
              border border-dark-border dark:border-dark-border light:border-light-border
              text-white dark:text-white light:text-gray-900 placeholder-gray-600 placeholder:tracking-normal placeholder:text-base placeholder:font-normal
              focus:outline-none focus:border-brand-blue
              transition-colors duration-200"
          />
          <button
            onClick={() => lookup()}
            disabled={!code.trim() || loading}
            className="px-6 py-3 rounded-xl text-sm font-semibold
              bg-brand-blue hover:bg-brand-blue-dark text-white
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center gap-2 flex-shrink-0
              shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={16} />
            )}
            <span className="hidden sm:inline">{loading ? t.querying : t.pickupBtn}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg
          bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Share content */}
      {share && !showPassword && (
        <div className="space-y-4 animate-slide-up">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg
            bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
            border border-dark-border dark:border-dark-border light:border-light-border">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock size={12} />
              {t.remainingTime} {formatDuration(share.remaining_seconds)}
            </div>
            {share.max_downloads > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Download size={12} />
                {t.downloadLimit(share.download_count, share.max_downloads)}
              </div>
            )}
            <span className="ml-auto text-xs text-gray-600 font-mono">{share.code}</span>
          </div>

          {/* Text content */}
          {share.text_content && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <FileText size={14} />
                  文本内容
                </div>
                <button
                  onClick={copyText}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all duration-200
                    ${
                      textCopied
                        ? "bg-green-500/20 text-green-400"
                        : "bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated border border-dark-border dark:border-dark-border light:border-light-border text-gray-400 hover:text-white dark:hover:text-white light:hover:text-gray-900"
                    }`}
                >
                  {textCopied ? <Check size={12} /> : <Copy size={12} />}
                  {textCopied ? t.textCopied : t.copyText}
                </button>
              </div>
              <pre className="px-4 py-3 rounded-lg text-sm font-mono text-gray-300 dark:text-gray-300 light:text-gray-700
                bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
                border border-dark-border dark:border-dark-border light:border-light-border
                overflow-auto max-h-64 whitespace-pre-wrap break-words">
                {share.text_content}
              </pre>
            </div>
          )}

          {/* Files */}
          {share.files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Package size={14} />
                  {t.fileCount(share.files.length)}
                </div>
                {share.files.length > 1 && (
                  <button
                    onClick={downloadAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-brand-blue hover:bg-brand-blue-dark text-white
                      transition-all duration-200"
                  >
                    <Download size={12} />
                    {t.downloadAll}
                  </button>
                )}
              </div>
              {share.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg
                    bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
                    border border-dark-border dark:border-dark-border light:border-light-border
                    hover:border-brand-blue/30 transition-all duration-200 group"
                >
                  <span className="text-lg flex-shrink-0">{getFileIcon(file.mime_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white dark:text-white light:text-gray-900 truncate">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    onClick={() => downloadFile(file.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                      bg-dark-surface dark:bg-dark-surface light:bg-white
                      border border-dark-border dark:border-dark-border light:border-light-border
                      text-gray-400 hover:text-brand-blue hover:border-brand-blue/40
                      transition-all duration-200"
                  >
                    <Download size={12} />
                    {t.downloadFile}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Password modal */}
      {showPassword && (
        <PasswordModal
          onConfirm={handlePasswordConfirm}
          onCancel={() => {
            setShowPassword(false);
            setShare(null);
          }}
          error={passwordError}
        />
      )}
    </div>
  );
}
