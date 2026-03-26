"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  Share2,
  HardDrive,
  FileIcon,
  RefreshCw,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import { getAdminStats, triggerCleanup, AdminStats } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";

export default function AdminPage() {
  const { t } = useTheme();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanMsg, setCleanMsg] = useState("");
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (e: any) {
      setError(e.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanMsg("");
    try {
      const { message } = await triggerCleanup();
      setCleanMsg(message);
      await fetchStats();
    } catch (e: any) {
      setCleanMsg(e.message || "Cleanup failed");
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg dark:bg-dark-bg light:bg-light-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md
        border-b border-dark-border dark:border-dark-border light:border-light-border
        bg-dark-bg/80 dark:bg-dark-bg/80 light:bg-light-bg/80">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-brand-blue flex items-center justify-center">
                <Zap size={12} className="text-white" />
              </div>
              <span className="font-bold tracking-tight text-white dark:text-white light:text-gray-900">
                SnapSend
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
              title="刷新"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-xl font-bold text-white dark:text-white light:text-gray-900">
              {t.adminStats}
            </h1>
            <p className="text-sm text-gray-500 mt-1">系统运行状态与数据管理</p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Share2,
                  label: t.activeShares,
                  value: stats.active_shares.toLocaleString(),
                  color: "text-brand-blue",
                },
                {
                  icon: FileIcon,
                  label: t.totalFiles,
                  value: stats.total_files.toLocaleString(),
                  color: "text-purple-400",
                },
                {
                  icon: HardDrive,
                  label: t.storageUsed,
                  value: stats.storage_used_human,
                  color: "text-emerald-400",
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <div
                  key={label}
                  className="px-5 py-4 rounded-xl
                    bg-dark-surface dark:bg-dark-surface light:bg-white
                    border border-dark-border dark:border-dark-border light:border-light-border"
                >
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                    <Icon size={13} className={color} />
                    {label}
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {loading && !stats && (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <RefreshCw size={20} className="animate-spin mr-2" />
              加载中...
            </div>
          )}

          {/* Cleanup button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleCleanup}
              disabled={cleaning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40
                text-red-400 hover:text-red-300 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={15} />
              {cleaning ? "清理中..." : t.triggerCleanup}
            </button>
            {cleanMsg && (
              <div className="flex items-center gap-1.5 text-sm text-green-400 animate-fade-in">
                <CheckCircle size={14} />
                {cleanMsg}
              </div>
            )}
          </div>

          {/* Recent shares */}
          {stats && stats.recent_shares.length > 0 && (
            <div className="rounded-xl overflow-hidden
              bg-dark-surface dark:bg-dark-surface light:bg-white
              border border-dark-border dark:border-dark-border light:border-light-border">
              <div className="px-5 py-3 border-b border-dark-border dark:border-dark-border light:border-light-border">
                <h3 className="text-sm font-semibold text-white dark:text-white light:text-gray-900">
                  {t.recentShares}
                </h3>
              </div>
              <div className="divide-y divide-dark-border dark:divide-dark-border light:divide-light-border">
                {stats.recent_shares.map((s) => (
                  <div key={s.code} className="flex items-center gap-4 px-5 py-3">
                    <span className="font-mono text-sm font-bold text-brand-blue w-20 flex-shrink-0">
                      {s.code}
                    </span>
                    <span className="text-xs text-gray-500 w-12 flex-shrink-0">{s.type}</span>
                    <span className="text-xs text-gray-400 flex-1">
                      {formatDate(s.created_at)}
                    </span>
                    <span className="text-xs text-gray-500">{s.download_count} 次取件</span>
                    <span className="text-xs text-gray-600">
                      到期 {formatDate(s.expire_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
