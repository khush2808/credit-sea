'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  Settings
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { statsAPI, applicationAPI, loanAPI, adminAPI, type Application, type Loan } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalApplications: number
  pendingApplications: number
  verifiedApplications: number
  approvedApplications: number
  rejectedApplications: number
  totalLoans: number
  activeLoans: number
  overdueLoans: number
  totalDisbursed: number
  totalReceived: number
  monthlyData: Array<{
    month: string
    applications: number
    disbursed: number
    collections: number
  }>
}

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [overdueLoans, setOverdueLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }
    loadAdminData()
  }, [isAdmin, router])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      const [dashboardRes, applicationsRes, overdueRes] = await Promise.all([
        statsAPI.getDashboard(),
        applicationAPI.getAll({ page: 1, limit: 5, status: 'PENDING' }),
        loanAPI.getOverdue({ page: 1, limit: 5 })
      ])
      
      const dashboardData = dashboardRes.data.data
      setStats({
        totalUsers: dashboardData.liveUsers,
        activeUsers: dashboardData.liveUsers,
        totalApplications: dashboardData.totalApplications,
        pendingApplications: dashboardData.pendingApplications,
        verifiedApplications: dashboardData.verifiedApplications || 0,
        approvedApplications: dashboardData.approvedApplications,
        rejectedApplications: dashboardData.rejectedApplications,
        totalLoans: dashboardData.totalLoans || 0,
        activeLoans: dashboardData.activeLoans || 0,
        overdueLoans: dashboardData.overdueLoans || 0,
        totalDisbursed: dashboardData.cashDisbursed,
        totalReceived: dashboardData.cashReceived,
        monthlyData: []
      })
      
      setRecentApplications(applicationsRes.data.data)
      setOverdueLoans(overdueRes.data.data || [])
    } catch (error: any) {
      console.error('Failed to load admin data:', error)
      toast.error('Failed to load admin dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Create, edit, and manage user accounts',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Review Applications',
      description: 'Review and approve loan applications',
      icon: FileText,
      href: '/applications',
      color: 'bg-green-500'
    },
    {
      title: 'Loan Management',
      description: 'Monitor loans and payments',
      icon: CreditCard,
      href: '/loans',
      color: 'bg-purple-500'
    },
    {
      title: 'System Settings',
      description: 'Configure system parameters',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500'
    }
  ]

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Comprehensive system overview and management</p>
          </div>
          <div className="flex space-x-2">
            <Link href="/admin/users">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-1" />
                Create User
              </Button>
            </Link>
          </div>
        </div>

        {}
        {stats && (
          <>
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white/80 text-sm font-medium">TOTAL DISBURSED</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.totalDisbursed)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white/80 text-sm font-medium">TOTAL COLLECTED</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.totalReceived)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white/80 text-sm font-medium">ACTIVE USERS</p>
                      <p className="text-2xl font-bold">{stats.activeUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white/80 text-sm font-medium">ACTIVE LOANS</p>
                      <p className="text-2xl font-bold">{stats.activeLoans}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-gray-600 text-sm font-medium">PENDING REVIEW</p>
                      <p className="text-2xl font-bold">{stats.pendingApplications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-gray-600 text-sm font-medium">VERIFIED</p>
                      <p className="text-2xl font-bold">{stats.verifiedApplications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-gray-600 text-sm font-medium">APPROVED</p>
                      <p className="text-2xl font-bold">{stats.approvedApplications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-gray-600 text-sm font-medium">OVERDUE LOANS</p>
                      <p className="text-2xl font-bold">{stats.overdueLoans}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 ${action.color} rounded-lg`}>
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{action.title}</h3>
                          <p className="text-xs text-gray-600">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-semibold">Applications Requiring Review</CardTitle>
              <Link href="/applications?status=PENDING">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentApplications.length > 0 ? (
                  recentApplications.slice(0, 5).map((application) => (
                    <div key={application._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{formatCurrency(application.amount)}</p>
                        <p className="text-sm text-gray-600">{application.tenure} months • {application.empStatus}</p>
                        <p className="text-xs text-gray-500">{formatDate(application.dateTime)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="pending">PENDING</Badge>
                        <Link href={`/applications/${application._id}`}>
                          <Button variant="outline" size="sm">Review</Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No pending applications</p>
                )}
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-semibold">Overdue Loans</CardTitle>
              <Link href="/loans?filter=overdue">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overdueLoans.length > 0 ? (
                  overdueLoans.slice(0, 5).map((loan) => (
                    <div key={loan._id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <p className="font-medium">Loan #{loan._id.slice(-6)}</p>
                        <p className="text-sm text-gray-600">EMI: {formatCurrency(loan.emi)}</p>
                        <p className="text-xs text-red-600">Due: {formatDate(loan.nextPaymentDate)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="rejected">OVERDUE</Badge>
                        <Link href={`/loans/${loan._id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No overdue loans</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
} 