import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Instituto do Sono Jundiaí',
  description: 'Instituto do Sono Jundiaí — polissonografia e diagnóstico do sono em Jundiaí.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
