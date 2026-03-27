"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { formatBytes, getFileIcon } from "@/lib/utils";

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export default function FileDropzone({ files, onFilesChange, disabled }: FileDropzoneProps) {
  const { t } = useTheme();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles);
    const merged = [...files];
    for (const f of arr) {
      if (!merged.find((x) => x.name === f.name && x.size === f.size)) {
        merged.push(f);
      }
    }
    onFilesChange(merged);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const onDragOver = (e: DragEvent) => { e.preventDefault(); if (!disabled) setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (!disabled) addFiles(e.dataTransfer.files);
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files); e.target.value = "";
  };

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="space-y-3">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative flex flex-col items-center justify-center gap-3
          border-2 border-dashed rounded-xl p-8 cursor-pointer
          transition-all duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${dragging
            ? "border-brand-blue bg-blue-500/10 scale-[1.01]"
            : "border-light-border dark:border-dark-border hover:border-brand-blue/60 hover:bg-light-elevated dark:hover:bg-dark-elevated/50"
          }
        `}
      >
        <div className={`p-3 rounded-full transition-colors duration-200 ${
          dragging ? "bg-blue-500/20" : "bg-light-elevated dark:bg-dark-elevated"
        }`}>
          <Upload size={24} className={dragging ? "text-brand-blue" : "text-gray-400"} />
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t.dropFiles}{" "}
            <span className="text-brand-blue font-medium">{t.clickToSelect}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">支持所有格式 · 最大 1GB</p>
        </div>
        {/* 不要加 capture：移动端会强制先开相机，无法选相册/文件 */}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onChange}
          disabled={disabled}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{t.fileCount(files.length)}</span>
            <span>{t.totalSize}: {formatBytes(totalSize)}</span>
          </div>
          {files.map((file, i) => (
            <div key={`${file.name}-${file.size}-${i}`}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg
                bg-light-elevated dark:bg-dark-elevated
                border border-light-border dark:border-dark-border
                group animate-slide-up"
            >
              <span className="text-lg flex-shrink-0">{getFileIcon(file.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
              </div>
              {!disabled && (
                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md
                    text-gray-400 hover:text-red-500 hover:bg-red-500/10
                    transition-all duration-150">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
