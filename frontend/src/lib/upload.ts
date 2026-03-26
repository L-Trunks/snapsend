import { initUpload, uploadChunk } from "./api";
import { CHUNK_SIZE } from "./utils";

export interface UploadFileProgress {
  filename: string;
  totalSize: number;
  uploadedBytes: number;
  percentage: number;
  speed: number; // bytes/sec
  remainingSeconds: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  uploadId?: string;
}

export type ProgressCallback = (progress: UploadFileProgress) => void;

export async function uploadFile(
  file: File,
  onProgress: ProgressCallback
): Promise<string> {
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  const mimeType = file.type || null;

  const { upload_id } = await initUpload(file.name, file.size, mimeType, totalChunks);

  let uploadedBytes = 0;
  let startTime = Date.now();

  onProgress({
    filename: file.name,
    totalSize: file.size,
    uploadedBytes: 0,
    percentage: 0,
    speed: 0,
    remainingSeconds: 0,
    status: "uploading",
    uploadId: upload_id,
  });

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const buffer = await chunk.arrayBuffer();

    await uploadChunk(upload_id, i, buffer);

    uploadedBytes += end - start;
    const elapsed = (Date.now() - startTime) / 1000;
    const speed = elapsed > 0 ? uploadedBytes / elapsed : 0;
    const remaining = speed > 0 ? (file.size - uploadedBytes) / speed : 0;

    onProgress({
      filename: file.name,
      totalSize: file.size,
      uploadedBytes,
      percentage: Math.round((uploadedBytes / file.size) * 100),
      speed,
      remainingSeconds: remaining,
      status: i === totalChunks - 1 ? "done" : "uploading",
      uploadId: upload_id,
    });
  }

  return upload_id;
}

export async function uploadFiles(
  files: File[],
  onProgress: (fileIndex: number, progress: UploadFileProgress) => void
): Promise<string[]> {
  const uploadIds: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const uploadId = await uploadFile(files[i], (p) => onProgress(i, p));
    uploadIds.push(uploadId);
  }
  return uploadIds;
}
