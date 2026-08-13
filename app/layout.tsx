import './globals.css'

export const metadata = {
  title: '基于机器学习的学情诊断系统',
  description: '面向师生的课程管理、学情诊断与 AI 助教平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
