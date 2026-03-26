"use client";

import { useState } from "react";
import { Send, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import FileDropzone from "./FileDropzone";
import UploadProgress from "./UploadProgress";
import ShareResult from "./ShareResult";
import { uploadFiles, UploadFileProgress } from "@/lib/upload";
import { createShare, CreateShareResponse } from "@/lib/api";

const EXPIRE_OPTIONS = [
  { value: 3600, label: "expire1h" },
  { value: 21600, label: "expire6h" },
  { value: 86400, label: "expire1d" },
  { value: 259200, label: "expire3d" },
  { value: 604800, label: "expire7d" },
] as const;

const MAX_DOWNLOAD_OPTIONS = [0, 1, 5, 10, 20, 50];

export default function SendPanel() {
  const { t } = useTheme();
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [expireSeconds, setExpireSeconds] = useState(86400);
  const [password, setPassword] = useState("");
  const [maxDownloads, setMaxDownloads] = useState(0);
  const [customCode, setCustomCode] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progresses, setProgresses] = useState<UploadFileProgress[]>([]);
  const [result, setResult] = useState<CreateShareResponse | null>(null);
  const [error, setError] = useState("");

  const canSubmit = (files.length > 0 || text.trim().length > 0) && !uploading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError("");
    setUploading(true);
    setProgresses([]);

    try {
      let uploadIds: string[] = [];

      if (files.length > 0) {
        // Initialize progress for all files
        const initial: UploadFileProgress[] = files.map((f) => ({
          filename: f.name,
          totalSize: f.size,
          uploadedBytes: 0,
          percentage: 0,
          speed: 0,
          remainingSeconds: 0,
          status: "pending",
        }));
        setProgresses(initial);

        uploadIds = await uploadFiles(files, (fileIndex, progress) => {
          setProgresses((prev) => {
            const updated = [...prev];
            updated[fileIndex] = progress;
            return updated;
          });
        });
      }

      const shareResult = await createShare({
        upload_ids: uploadIds,
        text_content: text.trim() || undefined,
        expire_seconds: expireSeconds,
        password: password.trim() || undefined,
        max_downloads: maxDownloads,
        custom_code: customCode.trim() || undefined,
      });

      setResult(shareResult);
    } catch (e: any) {
      setError(e.message || t.networkError);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFiles([]);
    setText("");
    setPassword("");
    setCustomCode("");
    setMaxDownloads(0);
    setExpireSeconds(86400);
    setProgresses([]);
    setError("");
  };

  if (result) {
    return (
      <div>
        <ShareResult result={result} onDelete={handleReset} />
        <button
          onClick={handleReset}
          className="mt-6 w-full py-2.5 rounded-lg text-sm
            border border-dark-border dark:border-dark-border light:border-light-border
            text-gray-400 hover:text-white dark:hover:text-white light:hover:text-gray-700
            hover:border-gray-500 transition-all duration-200"
        >
          再次发送
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FileDropzone files={files} onFilesChange={setFiles} disabled={uploading} />

      {/* Text area */}
      <div>
        <p className="text-xs text-gray-500 mb-2">{t.orPasteText}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={uploading}
          placeholder={t.textPlaceholder}
          rows={4}
          className="w-full px-4 py-3 rounded-xl text-sm font-mono resize-y
            bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
            border border-dark-border dark:border-dark-border light:border-light-border
            text-white dark:text-white light:text-gray-900
            placeholder-gray-600
            focus:outline-none focus:border-brand-blue/60
            transition-colors duration-200 disabled:opacity-50"
        />
      </div>

      {/* Expire selector */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">{t.expireLabel}</label>
        <div className="flex flex-wrap gap-2">
          {EXPIRE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setExpireSeconds(opt.value)}
              disabled={uploading}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all duration-200
                ${
                  expireSeconds === opt.value
                    ? "bg-brand-blue text-white"
                    : "bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated border border-dark-border dark:border-dark-border light:border-light-border text-gray-400 hover:border-brand-blue/60 hover:text-white dark:hover:text-white light:hover:text-gray-900"
                }`}
            >
              {t[opt.label as keyof typeof t] as string}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced options toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <Settings2 size={14} />
        高级选项
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showAdvanced && (
        <div className="space-y-4 animate-slide-up pt-1">
          {/* Password */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">{t.passwordLabel}</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={uploading}
              placeholder={t.passwordPlaceholder}
              className="w-full px-4 py-2.5 rounded-lg text-sm
                bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
                border border-dark-border dark:border-dark-border light:border-light-border
                text-white dark:text-white light:text-gray-900 placeholder-gray-600
                focus:outline-none focus:border-brand-blue/60 transition-colors"
            />
          </div>

          {/* Max downloads */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">{t.maxDownloadsLabel}</label>
            <div className="flex flex-wrap gap-2">
              {MAX_DOWNLOAD_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxDownloads(n)}
                  disabled={uploading}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200
                    ${
                      maxDownloads === n
                        ? "bg-brand-blue text-white"
                        : "bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated border border-dark-border dark:border-dark-border light:border-light-border text-gray-400 hover:border-brand-blue/60 hover:text-white dark:hover:text-white light:hover:text-gray-900"
                    }`}
                >
                  {n === 0 ? t.maxDownloadsUnlimited : `${n} 次`}
                </button>
              ))}
            </div>
          </div>

          {/* Custom code */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">{t.customCodeLabel}</label>
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              disabled={uploading}
              placeholder={t.customCodePlaceholder}
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-mono uppercase
                bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
                border border-dark-border dark:border-dark-border light:border-light-border
                text-white dark:text-white light:text-gray-900 placeholder-gray-600
                focus:outline-none focus:border-brand-blue/60 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && <UploadProgress progresses={progresses} />}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 animate-fade-in">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-xl text-sm font-semibold
          bg-brand-blue hover:bg-brand-blue-dark text-white
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-200 flex items-center justify-center gap-2
          shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
      >
        {uploading ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            {t.submitting}
          </>
        ) : (
          <>
            <Send size={16} />
            {t.submitBtn}
          </>
        )}
      </button>
    </div>
  );
}
