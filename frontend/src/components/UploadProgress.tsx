"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { UploadFileProgress } from "@/lib/upload";
import { formatBytes, formatSpeed, getFileIcon } from "@/lib/utils";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface UploadProgressProps {
  progresses: UploadFileProgress[];
}

export default function UploadProgress({ progresses }: UploadProgressProps) {
  const { t } = useTheme();
  if (progresses.length === 0) return null;

  const overallPct =
    progresses.reduce((s, p) => s + p.percentage, 0) / progresses.length;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{t.uploadProgress}</span>
        <span className="text-brand-blue font-mono font-medium">
          {Math.round(overallPct)}%
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="h-1.5 rounded-full bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated overflow-hidden">
        <div
          className="h-full bg-brand-blue rounded-full transition-all duration-300"
          style={{ width: `${overallPct}%` }}
        />
      </div>

      {/* Per-file progress */}
      {progresses.map((p, i) => (
        <div
          key={`${p.filename}-${i}`}
          className="px-4 py-3 rounded-lg
            bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
            border border-dark-border dark:border-dark-border light:border-light-border"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{getFileIcon()}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white dark:text-white light:text-gray-900 truncate max-w-[60%]">
                  {p.filename}
                </span>
                <div className="flex items-center gap-2">
                  {p.status === "uploading" && (
                    <span className="text-xs text-gray-500">
                      {formatSpeed(p.speed)}
                    </span>
                  )}
                  {p.status === "uploading" && (
                    <Loader2 size={14} className="text-brand-blue animate-spin" />
                  )}
                  {p.status === "done" && (
                    <CheckCircle size={14} className="text-green-400" />
                  )}
                  {p.status === "error" && (
                    <XCircle size={14} className="text-red-400" />
                  )}
                </div>
              </div>
              <div className="h-1 rounded-full bg-dark-muted dark:bg-dark-muted light:bg-light-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    p.status === "done"
                      ? "bg-green-400"
                      : p.status === "error"
                      ? "bg-red-400"
                      : "bg-brand-blue"
                  }`}
                  style={{ width: `${p.percentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {formatBytes(p.uploadedBytes)} / {formatBytes(p.totalSize)}
                </span>
                {p.status === "uploading" && p.remainingSeconds > 0 && (
                  <span className="text-xs text-gray-500">
                    剩余 ~{Math.ceil(p.remainingSeconds)}s
                  </span>
                )}
                {p.status === "error" && (
                  <span className="text-xs text-red-400">{p.error}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
