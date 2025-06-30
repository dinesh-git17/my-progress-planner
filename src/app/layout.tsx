import '@fontsource/inter/variable.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Progress Planner',
  description: 'A loving, supportive progress tracker',
}

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
