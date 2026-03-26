"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import PickupPanel from "@/components/PickupPanel";

export default function PickupPage() {
  const { t } = useTheme();
  const params = useParams();
  const code = (params?.code as string | undefined) ?? "";

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg dark:bg-dark-bg light:bg-light-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md
        border-b border-dark-border dark:border-dark-border light:border-light-border
        bg-dark-bg/80 dark:bg-dark-bg/80 light:bg-light-bg/80">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white dark:hover:text-white light:hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-brand-blue flex items-center justify-center">
                <Zap size={12} className="text-white" />
              </div>
              <span className="font-bold tracking-tight">SnapSend</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl overflow-hidden
            bg-dark-surface dark:bg-dark-surface light:bg-white
            border border-dark-border dark:border-dark-border light:border-light-border
            shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3 px-6 py-4
              border-b border-dark-border dark:border-dark-border light:border-light-border">
              <h2 className="text-sm font-semibold text-white dark:text-white light:text-gray-900">
                {t.pickupCodeInput}
              </h2>
            </div>
            <div className="p-6">
              <PickupPanel initialCode={code.toUpperCase()} />
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 px-4 text-center border-t border-dark-border dark:border-dark-border light:border-light-border">
        <p className="text-xs text-gray-600">{t.footer}</p>
      </footer>
    </div>
  );
}
