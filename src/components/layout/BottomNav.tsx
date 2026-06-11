import { NavLink } from 'react-router-dom'
import { ClipboardList, TrendingUp, BookOpen, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: '面试记录', Icon: ClipboardList },
  { path: '/dashboard', label: '成长', Icon: TrendingUp },
  { path: '/questions', label: '题库', Icon: BookOpen },
  { path: '/profile', label: '我的', Icon: User },
]

export default function BottomNav() {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'h-20 glass-effect border-t border-neutral-200/50',
        'pb-[env(safe-area-inset-bottom)]'
      )}
    >
      <ul className="grid h-full grid-cols-4">
        {navItems.map(({ path, label, Icon }) => (
          <li key={path} className="flex items-center justify-center">
            <NavLink
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-row items-center justify-center gap-2 px-3 py-2',
                  'transition-all duration-200',
                  isActive
                    ? 'text-primary-500'
                    : 'text-neutral-400 hover:text-neutral-600'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      isActive && 'scale-110'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium transition-all duration-200',
                      isActive && 'font-semibold'
                    )}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
