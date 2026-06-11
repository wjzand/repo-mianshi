import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

interface AppLayoutProps {
  children: ReactNode
}

const HIDE_NAV_PATHS = ['/simulation/room']

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const hideNav = HIDE_NAV_PATHS.some((p) => location.pathname.startsWith(p))

  return (
    <div className="relative flex min-h-screen justify-center">
      <div className="relative flex w-full min-h-screen max-w-[414px] flex-col bg-gradient-bg">
        <main className={`flex-1 pt-[env(safe-area-inset-top)] ${hideNav ? '' : 'safe-bottom'}`}>
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  )
}
