'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { 
  Users, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { statsAPI, applicationAPI, loanAPI, type DashboardStats, type Application, type Loan } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, isAdmin, isCustomer } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [recentLoans, setRecentLoans] = useState<Loan[]>([])
  const [activeLoan, setActiveLoan] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      if (isAdmin) {
        // Admin dashboard
        const [dashboardRes, applicationsRes, loansRes] = await Promise.all([
          statsAPI.getDashboard(),
          applicationAPI.getAll({ page: 1, limit: 5, sortBy: 'dateTime', sortOrder: 'desc' }),
          loanAPI.getAll({ page: 1, limit: 5 })
        ])
        
        setStats(dashboardRes.data.data)
        
        // Extract applications from correct response structure
        const applicationsArray = applicationsRes.data?.data?.data || []
        setRecentApplications(applicationsArray)
        
        // Extract loans from correct response structure
        const loansArray = loansRes.data?.data?.data || []
        setRecentLoans(loansArray)
        
        console.log('✅ Admin dashboard loaded:', {
          stats: dashboardRes.data.data,
          applications: applicationsArray.length,
          loans: loansArray.length
        })
      } else if (isCustomer) {
        // Customer dashboard
        const [applicationsRes, activeLoanRes] = await Promise.all([
          applicationAPI.getAll({ page: 1, limit: 5 }),
          loanAPI.getActive().catch(() => ({ data: { data: null } }))
        ])
        
        // Extract applications from correct response structure
        const applicationsArray = applicationsRes.data?.data?.data || []
        setRecentApplications(applicationsArray)
        
        // Extract active loan (if any)
        const activeLoanData = activeLoanRes.data?.data || null
        setActiveLoan(activeLoanData)
        
        console.log('✅ Customer dashboard loaded:', {
          applications: applicationsArray.length,
          activeLoan: !!activeLoanData
        })
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}!</p>
          </div>
          {isCustomer && (
            <Link href="/applications">
              <Button className="bg-green-600 hover:bg-green-700">
                Apply for Loan
              </Button>
            </Link>
          )}
        </div>

        {}
        {isAdmin && stats && (
          <>
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-green-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white/80 text-sm font-medium">ACTIVE USERS</p>
                      <p className="text-2xl font-bold text-white">{stats.liveUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white/80 text-sm font-medium">BORROWERS</p>
                      <p className="text-2xl font-bold text-white">{stats.borrowers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white/80 text-sm font-medium">CASH DISBURSED</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(stats.cashDisbursed)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white/80 text-sm font-medium">CASH RECEIVED</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(stats.cashReceived)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-green-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white/80 text-sm font-medium">SAVINGS</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(stats.cashReceived - stats.cashDisbursed)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white/80 text-sm font-medium">REPAID LOANS</p>
                      <p className="text-2xl font-bold text-white">{stats.repaidLoans}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white/80 text-sm font-medium">TOTAL APPLICATIONS</p>
                      <p className="text-2xl font-bold text-white">{stats.totalApplications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-white/80 text-sm font-medium">PENDING APPS</p>
                      <p className="text-2xl font-bold text-white">{stats.pendingApplications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg font-semibold">Recent Applications</CardTitle>
                  <Link href="/applications">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentApplications.length > 0 ? (
                      recentApplications.map((application) => (
                        <div key={application._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{formatCurrency(application.amount)}</p>
                            <p className="text-sm text-gray-600">{application.tenure} months • {application.empStatus}</p>
                          </div>
                          <Badge variant={
                            application.status === 'APPROVED' ? 'approved' :
                            application.status === 'VERIFIED' ? 'verified' :
                            application.status === 'REJECTED' ? 'rejected' : 'pending'
                          }>
                            {application.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No applications found</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg font-semibold">Recent Loans</CardTitle>
                  <Link href="/loans">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentLoans.length > 0 ? (
                      recentLoans.map((loan) => (
                        <div key={loan._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">EMI: {formatCurrency(loan.emi)}</p>
                            <p className="text-sm text-gray-600">Remaining: {formatCurrency(loan.principalLeft)}</p>
                          </div>
                          <Badge variant={loan.isPaid ? 'approved' : 'pending'}>
                            {loan.isPaid ? 'PAID' : 'ACTIVE'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No loans found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {}
        {isCustomer && (
          <>
            {/* Active Loan Section */}
            {activeLoan && (
              <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Active Loan</span>
                    <div className="flex space-x-2">
                      <Link href={`/loans/payment?loanId=${activeLoan._id}`}>
                        <Button variant="outline" className="text-green-700 bg-white hover:bg-gray-100">
                          <DollarSign className="w-4 h-4 mr-1" />
                          Pay EMI
                        </Button>
                      </Link>
                      <Link href={`/loans/${activeLoan._id}`}>
                        <Button variant="outline" className="text-green-700 bg-white hover:bg-gray-100">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-green-100 text-sm">Monthly EMI</p>
                      <p className="text-2xl font-bold">{formatCurrency(activeLoan.emi)}</p>
                    </div>
                    <div>
                      <p className="text-green-100 text-sm">Remaining Amount</p>
                      <p className="text-2xl font-bold">{formatCurrency(activeLoan.principalLeft)}</p>
                    </div>
                    <div>
                      <p className="text-green-100 text-sm">Next Payment</p>
                      <p className="text-xl font-bold">
                        {new Date(activeLoan.nextPaymentDate).toLocaleDateString()}
                      </p>
                      {new Date() > new Date(activeLoan.nextPaymentDate) && (
                        <p className="text-red-200 text-sm mt-1">
                          <AlertCircle className="inline w-4 h-4 mr-1" />
                          Payment Overdue
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-500/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-green-100">Interest Rate: {activeLoan.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-green-100">Tenure: {activeLoan.tenureMonths} months</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Active Loan - Show Quick Actions */}
            {!activeLoan && (
              <Card className="bg-gradient-to-r from-gray-100 to-gray-200">
                <CardContent className="text-center py-8">
                  <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Loans</h3>
                  <p className="text-gray-600 mb-4">Ready to apply for a loan?</p>
                  <Link href="/applications">
                    <Button className="bg-green-600 hover:bg-green-700">
                      Apply for Loan
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Your Applications</CardTitle>
                <Link href="/applications">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentApplications.length > 0 ? (
                    recentApplications.map((application) => (
                      <div key={application._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{formatCurrency(application.amount)}</p>
                          <p className="text-sm text-gray-600">{application.tenure} months • {application.reason}</p>
                          <p className="text-xs text-gray-500">{new Date(application.dateTime).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={
                          application.status === 'APPROVED' ? 'approved' :
                          application.status === 'VERIFIED' ? 'verified' :
                          application.status === 'REJECTED' ? 'rejected' : 'pending'
                        }>
                          {application.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No applications yet</p>
                      <Link href="/applications">
                        <Button>Apply for Your First Loan</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  )
} 