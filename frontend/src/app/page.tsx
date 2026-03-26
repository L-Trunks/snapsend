"use client";

import { useState } from "react";
import { Upload, Download, Zap, Shield, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import SendPanel from "@/components/SendPanel";
import PickupPanel from "@/components/PickupPanel";

type Tab = "send" | "receive";

export default function HomePage() {
  const { t } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("send");

  return (
    <div className="min-h-screen flex flex-col
      bg-dark-bg dark:bg-dark-bg light:bg-light-bg">

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md
        border-b border-dark-border dark:border-dark-border light:border-light-border
        bg-dark-bg/80 dark:bg-dark-bg/80 light:bg-light-bg/80">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-blue flex items-center justify-center flex-shrink-0">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white dark:text-white light:text-gray-900 tracking-tight">
              SnapSend
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="p-2 rounded-lg text-gray-500 hover:text-gray-300 dark:hover:text-gray-300 light:hover:text-gray-700 transition-colors"
              title={t.admin}
            >
              <LayoutDashboard size={16} />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="text-center py-10 px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-white dark:text-white light:text-gray-900 tracking-tight">
          {t.appName}
        </h1>
        <p className="mt-2 text-gray-400 dark:text-gray-400 light:text-gray-500 text-base">
          {t.tagline}
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          {[
            { icon: Shield, label: "匿名传输" },
            { icon: Zap, label: "即传即取" },
            { icon: Upload, label: "最大 1GB" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs
                bg-dark-elevated dark:bg-dark-elevated light:bg-light-elevated
                border border-dark-border dark:border-dark-border light:border-light-border
                text-gray-400"
            >
              <Icon size={11} className="text-brand-blue" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Main card */}
      <main className="flex-1 px-4 pb-16">
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl overflow-hidden
            bg-dark-surface dark:bg-dark-surface light:bg-white
            border border-dark-border dark:border-dark-border light:border-light-border
            shadow-2xl shadow-black/40">

            {/* Tabs */}
            <div className="flex border-b border-dark-border dark:border-dark-border light:border-light-border">
              <button
                onClick={() => setActiveTab("send")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-200
                  ${
                    activeTab === "send"
                      ? "text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5"
                      : "text-gray-500 hover:text-gray-300 dark:hover:text-gray-300 light:hover:text-gray-700"
                  }`}
              >
                <Upload size={16} />
                {t.send}
              </button>
              <button
                onClick={() => setActiveTab("receive")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-200
                  ${
                    activeTab === "receive"
                      ? "text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5"
                      : "text-gray-500 hover:text-gray-300 dark:hover:text-gray-300 light:hover:text-gray-700"
                  }`}
              >
                <Download size={16} />
                {t.receive}
              </button>
            </div>

            {/* Panel content */}
            <div className="p-6">
              {activeTab === "send" ? <SendPanel /> : <PickupPanel />}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center
        border-t border-dark-border dark:border-dark-border light:border-light-border">
        <p className="text-xs text-gray-600">
          {t.footer}
        </p>
      </footer>
    </div>
  );
}
