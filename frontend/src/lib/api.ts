const API_BASE = "/api";

export interface ShareInfo {
  code: string;
  type: "file" | "text" | "mixed";
  text_content: string | null;
  has_password: boolean;
  max_downloads: number;
  download_count: number;
  expire_at: string;
  created_at: string;
  files: FileInfo[];
  remaining_seconds: number;
}

export interface FileInfo {
  id: number;
  filename: string;
  size: number;
  mime_type: string | null;
  created_at: string;
}

export interface CreateShareResponse {
  code: string;
  delete_token: string;
  expire_at: string;
  link: string;
  qr_code_base64: string;
}

export interface InitUploadResponse {
  upload_id: string;
}

export interface AdminStats {
  active_shares: number;
  total_files: number;
  storage_used_bytes: number;
  storage_used_human: string;
  recent_shares: RecentShare[];
}

export interface RecentShare {
  code: string;
  type: string;
  expire_at: string;
  download_count: number;
  created_at: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(data.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function initUpload(
  filename: string,
  size: number,
  mimeType: string | null,
  totalChunks: number
): Promise<InitUploadResponse> {
  const res = await fetch(`${API_BASE}/upload/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename,
      size,
      mime_type: mimeType,
      total_chunks: totalChunks,
    }),
  });
  return handleResponse<InitUploadResponse>(res);
}

export async function uploadChunk(
  uploadId: string,
  chunkIndex: number,
  data: ArrayBuffer
): Promise<void> {
  const res = await fetch(`${API_BASE}/upload/chunk/${uploadId}/${chunkIndex}`, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: data,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Chunk upload failed: HTTP ${res.status}`);
  }
}

export async function createShare(body: {
  upload_ids: string[];
  text_content?: string;
  expire_seconds: number;
  password?: string;
  max_downloads: number;
  custom_code?: string;
}): Promise<CreateShareResponse> {
  const res = await fetch(`${API_BASE}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<CreateShareResponse>(res);
}

export async function getShare(code: string): Promise<ShareInfo> {
  const res = await fetch(`${API_BASE}/share/${code.toUpperCase()}`);
  return handleResponse<ShareInfo>(res);
}

export async function verifyPassword(
  code: string,
  password: string
): Promise<{ valid: boolean; share: ShareInfo }> {
  const res = await fetch(`${API_BASE}/share/${code.toUpperCase()}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return handleResponse(res);
}

export function getDownloadUrl(code: string, fileId: number): string {
  return `${API_BASE}/share/${code}/download/${fileId}`;
}

/** 用于带密码分享的内嵌预览（媒体元素无法附带自定义 Header） */
export async function fetchShareFileBlob(
  code: string,
  fileId: number,
  password: string
): Promise<Blob> {
  const res = await fetch(getDownloadUrl(code, fileId), {
    headers: { "X-Share-Password": password },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof data.detail === "string" ? data.detail : `HTTP ${res.status}`);
  }
  return res.blob();
}

export function getDownloadAllUrl(code: string): string {
  return `${API_BASE}/share/${code}/download-all`;
}

export async function deleteShare(code: string, deleteToken: string): Promise<void> {
  const res = await fetch(`${API_BASE}/share/${code}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delete_token: deleteToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail);
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/admin/stats`);
  return handleResponse<AdminStats>(res);
}

export async function triggerCleanup(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/admin/cleanup`, { method: "POST" });
  return handleResponse(res);
}
