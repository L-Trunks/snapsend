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

  const overallPct = progresses.reduce((s, p) => s + p.percentage, 0) / progresses.length;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">{t.uploadProgress}</span>
        <span className="text-brand-blue font-mono font-medium">{Math.round(overallPct)}%</span>
      </div>

      <div className="h-1.5 rounded-full bg-light-elevated dark:bg-dark-elevated overflow-hidden">
        <div className="h-full bg-brand-blue rounded-full transition-all duration-300"
          style={{ width: `${overallPct}%` }} />
      </div>

      {progresses.map((p, i) => (
        <div key={`${p.filename}-${i}`}
          className="px-4 py-3 rounded-lg
            bg-light-elevated dark:bg-dark-elevated
            border border-light-border dark:border-dark-border"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{getFileIcon()}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-900 dark:text-white truncate max-w-[60%]">{p.filename}</span>
                <div className="flex items-center gap-2">
                  {p.status === "uploading" && (
                    <span className="text-xs text-gray-400">{formatSpeed(p.speed)}</span>
                  )}
                  {p.status === "uploading" && <Loader2 size={14} className="text-brand-blue animate-spin" />}
                  {p.status === "done" && <CheckCircle size={14} className="text-green-500" />}
                  {p.status === "error" && <XCircle size={14} className="text-red-500" />}
                </div>
              </div>
              <div className="h-1 rounded-full bg-light-muted dark:bg-dark-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${
                  p.status === "done" ? "bg-green-500"
                  : p.status === "error" ? "bg-red-500"
                  : "bg-brand-blue"
                }`} style={{ width: `${p.percentage}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">
                  {formatBytes(p.uploadedBytes)} / {formatBytes(p.totalSize)}
                </span>
                {p.status === "uploading" && p.remainingSeconds > 0 && (
                  <span className="text-xs text-gray-400">剩余 ~{Math.ceil(p.remainingSeconds)}s</span>
                )}
                {p.status === "error" && (
                  <span className="text-xs text-red-500">{p.error}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
