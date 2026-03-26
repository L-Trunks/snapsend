import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "SnapSend — 无需登录，即传即取",
  description: "匿名临时文件与文本分享平台。无需注册，上传即取，隐私优先。",
  keywords: ["文件分享", "临时分享", "匿名上传", "取件码", "SnapSend"],
  openGraph: {
    title: "SnapSend — 无需登录，即传即取",
    description: "匿名临时文件与文本分享平台",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
