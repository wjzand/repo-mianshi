import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="relative flex min-h-screen justify-center">
      <div className="relative flex w-full min-h-screen max-w-[414px] flex-col bg-gradient-bg">
        <main className="flex-1 pt-[env(safe-area-inset-top)] safe-bottom">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
