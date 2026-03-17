import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JSON Tools - 在线JSON处理工具",
  description: "JSON格式化、校验、压缩、转义、转换工具 - 支持XML、YAML、CSV格式转换",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}