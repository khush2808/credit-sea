'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  Bell,
  MessageCircle,
  User,
  PieChart
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  adminOnly?: boolean
  verifierOnly?: boolean
  customerOnly?: boolean
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Applications', href: '/applications', icon: FileText },
  { name: 'Loans', href: '/loans', icon: DollarSign, adminOnly: false, customerOnly: true },
  { name: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
  { name: 'Statistics', href: '/admin/statistics', icon: PieChart, adminOnly: true },
  { name: 'Profile', href: '/profile', icon: User },
]

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout, isAdmin, isVerifier, isCustomer } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly && !isAdmin) return false
    if (item.verifierOnly && !isVerifier) return false
    if (item.customerOnly && !isCustomer && !isAdmin) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-sm">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-2xl font-bold text-primary">CREDIT APP</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          pathname === item.href
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )}
                      >
                        <item.icon
                          className={cn(
                            pathname === item.href ? 'text-white' : 'text-gray-400',
                            'h-6 w-6 shrink-0'
                          )}
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              
              {}
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.name}</span>
                    <span className="text-xs text-gray-500 capitalize">{user?.role.toLowerCase()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-700 hover:bg-gray-50"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {}
      <div className="lg:pl-72">
        {}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {}
          <div className="flex-1 lg:hidden">
            <h1 className="text-xl font-semibold text-gray-900">CREDIT APP</h1>
          </div>

          {}
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>

              {}
              <Button variant="ghost" size="icon">
                <MessageCircle className="h-6 w-6" />
              </Button>

              {}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-4">
                <span className="hidden lg:flex lg:items-center">
                  <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                    {user?.role === 'SUPER_ADMIN' ? 'Admin' : 'User'}
                  </span>
                </span>
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center">
                  <h1 className="text-2xl font-bold text-primary">CREDIT APP</h1>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {filteredNavigation.map((item) => (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                pathname === item.href
                                  ? 'bg-primary text-white'
                                  : 'text-gray-700 hover:bg-gray-50',
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                              )}
                            >
                              <item.icon
                                className={cn(
                                  pathname === item.href ? 'text-white' : 'text-gray-400',
                                  'h-6 w-6 shrink-0'
                                )}
                              />
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 