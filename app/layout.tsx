import './globals.css'

export const metadata = {
  title: 'Todo API 测试',
  description: '用于测试 Todo API 的前端页面',
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
