"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchShareFileBlob, getDownloadUrl, type FileInfo } from "@/lib/api";
import { getPreviewKind } from "@/lib/utils";

interface MediaPreviewModalProps {
  file: FileInfo;
  shareCode: string;
  password: string | null;
  onClose: () => void;
}

export default function MediaPreviewModal({
  file,
  shareCode,
  password,
  onClose,
}: MediaPreviewModalProps) {
  const { t } = useTheme();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const blobUrlRef = useRef<string | null>(null);
  const mediaRef = useRef<HTMLMediaElement | null>(null);

  const kind = getPreviewKind(file.mime_type);

  useEffect(() => {
    if (!kind) return;

    let cancelled = false;

    const revoke = () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };

    if (password) {
      setLoading(true);
      setError("");
      setUrl(null);
      revoke();

      fetchShareFileBlob(shareCode, file.id, password)
        .then((blob) => {
          if (cancelled) return;
          const u = URL.createObjectURL(blob);
          blobUrlRef.current = u;
          setUrl(u);
        })
        .catch(() => {
          if (!cancelled) setError(t.previewLoadFailed);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      revoke();
      setUrl(getDownloadUrl(shareCode, file.id));
      setLoading(false);
      setError("");
    }

    return () => {
      cancelled = true;
      revoke();
      mediaRef.current = null;
    };
    // 仅随文件与鉴权变化重新拉取；语言切换不应重复请求
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t.previewLoadFailed 随语言更新即可
  }, [file.id, shareCode, password, kind]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!kind) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.preview}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl
          bg-white dark:bg-dark-surface
          border border-light-border dark:border-dark-border
          shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-light-border dark:border-dark-border flex-shrink-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate min-w-0" title={file.filename}>
            {file.filename}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-light-elevated dark:hover:bg-dark-elevated transition-colors"
            aria-label={t.cancel}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4 flex items-center justify-center bg-light-elevated/50 dark:bg-dark-elevated/30">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-500 text-sm">
              <span className="w-8 h-8 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
              {t.loadingShare}
            </div>
          )}
          {error && !loading && (
            <p className="text-sm text-red-500 text-center px-4">{error}</p>
          )}
          {url && !loading && !error && kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={file.filename} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
          )}
          {url && !loading && !error && kind === "video" && (
            <video
              ref={(el) => {
                mediaRef.current = el;
              }}
              src={url}
              controls
              playsInline
              className="max-w-full max-h-[70vh] rounded-lg bg-black"
              preload="metadata"
            >
              {t.previewLoadFailed}
            </video>
          )}
          {url && !loading && !error && kind === "audio" && (
            <audio
              ref={(el) => {
                mediaRef.current = el;
              }}
              src={url}
              controls
              className="w-full max-w-md"
              preload="metadata"
            >
              {t.previewLoadFailed}
            </audio>
          )}
          {url && !loading && !error && kind === "pdf" && (
            <iframe
              title={file.filename}
              src={url}
              className="w-full min-h-[70vh] h-[70vh] rounded-lg border border-light-border dark:border-dark-border bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}
