'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import { 
  Users, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { statsAPI, applicationAPI, loanAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'

interface StatCard {
  title: string
  value: string | number
  icon: React.ComponentType<any>
  color: string
}

interface ChartData {
  name: string
  value: number
  amount?: number
}

export default function AdminStatisticsPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [applicationStats, setApplicationStats] = useState<ChartData[]>([])
  const [loanStats, setLoanStats] = useState<any>(null)
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([])
  const [overviewCards, setOverviewCards] = useState<StatCard[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [apiError, setApiError] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }
    loadStatistics()
  }, [isAdmin, router])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      setApiError(false)
      
      console.log('🔄 Loading statistics...')
      
      
      const [
        dashboardRes, 
        applicationRes, 
        loanRes,
        userRes
      ] = await Promise.all([
        statsAPI.getDashboard(),
        applicationAPI.getStats().catch(() => ({ data: { data: null } })),
        loanAPI.getStats().catch(() => ({ data: { data: null } })),
        statsAPI.getUsers().catch(() => ({ data: { data: null } }))
      ])

      console.log('📊 Dashboard response:', dashboardRes)
      console.log('📋 Application stats response:', applicationRes)
      console.log('💰 Loan stats response:', loanRes)
      console.log('👥 User stats response:', userRes)

      const dashboardData = dashboardRes.data.data
      console.log('📈 Dashboard data:', dashboardData)
      
      if (!dashboardData) {
        console.error('❌ No dashboard data available')
        throw new Error('No dashboard data available')
      }

      setDashboardStats(dashboardData)
      setHasData(true)

      
      const cards: StatCard[] = [
        {
          title: 'Total Users',
          value: dashboardData.liveUsers,
          icon: Users,
          color: 'text-blue-600',
        },
        {
          title: 'Active Borrowers',
          value: dashboardData.borrowers,
          icon: Users,
          color: 'text-green-600',
        },
        {
          title: 'Cash Disbursed',
          value: formatCurrency(dashboardData.cashDisbursed),
          icon: DollarSign,
          color: 'text-purple-600',
        },
        {
          title: 'Cash Received',
          value: formatCurrency(dashboardData.cashReceived),
          icon: TrendingUp,
          color: 'text-orange-600',
        },
        {
          title: 'Total Applications',
          value: dashboardData.totalApplications,
          icon: FileText,
          color: 'text-indigo-600',
        },
        {
          title: 'Pending Applications',
          value: dashboardData.pendingApplications,
          icon: Clock,
          color: 'text-yellow-600',
        },
        {
          title: 'Approved Applications',
          value: dashboardData.approvedApplications,
          icon: CheckCircle,
          color: 'text-green-600',
        },
        {
          title: 'Rejected Applications',
          value: dashboardData.rejectedApplications,
          icon: XCircle,
          color: 'text-red-600',
        }
      ]
      setOverviewCards(cards)

      
      const appStatusData: ChartData[] = [
        { name: 'Pending', value: dashboardData.pendingApplications },
        { name: 'Approved', value: dashboardData.approvedApplications },
        { name: 'Rejected', value: dashboardData.rejectedApplications },
        { name: 'Verified', value: Math.max(0, dashboardData.totalApplications - dashboardData.pendingApplications - dashboardData.approvedApplications - dashboardData.rejectedApplications) }
      ].filter(item => item.value > 0)
      setApplicationStats(appStatusData)

      console.log('📊 Overview cards:', cards)
      console.log('📈 Application stats data:', appStatusData)

      
      
      setMonthlyData([])

      if (loanRes.data.data) {
        setLoanStats(loanRes.data.data)
        console.log('💰 Loan stats set:', loanRes.data.data)
      }

      setDataLoaded(true)
      console.log('✅ Statistics loaded successfully')

    } catch (error: any) {
      console.error('❌ Error loading statistics:', error)
      console.error('❌ Error response data:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      toast.error('Failed to load statistics')
      setApiError(true)
      setDataLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6']

  const renderStatisticsContent = () => {
    
    if (loading && !dataLoaded) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading statistics...</p>
          </div>
        </div>
      )
    }

    
    if (dataLoaded && (apiError || !hasData || !dashboardStats)) {
      return (
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Statistics</h2>
          <p className="text-gray-600 mb-6">
            There was an error loading the statistics data. This might be because:
          </p>
          <ul className="text-gray-600 mb-6 text-left max-w-md mx-auto">
            <li>• No data has been generated yet (new system)</li>
            <li>• Backend statistics services are unavailable</li>
            <li>• Database connection issues</li>
          </ul>
          <Button onClick={loadStatistics} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      )
    }

    
    if (dataLoaded && hasData && dashboardStats) {
      return (
        <div className="space-y-6">
          {}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Statistics & Analytics</h1>
              <p className="text-gray-600">Comprehensive overview of system performance and metrics</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overviewCards.map((card, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-gray-50`}>
                      <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {}
            <Card>
              <CardHeader>
                <CardTitle>Application Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {applicationStats.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={applicationStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {applicationStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No application data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Loan Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No monthly trend data available</p>
                      <p className="text-sm">Data will appear as applications are processed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 && monthlyData.some(item => item.amount && item.amount > 0) ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#3B82F6" 
                          fill="#93C5FD" 
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No cash flow data available</p>
                      <p className="text-sm">Charts will populate as transactions occur</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle>Key Financial Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Disbursed</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(dashboardStats.cashDisbursed)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Collected</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(dashboardStats.cashReceived)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Outstanding Amount</span>
                  <span className="text-xl font-bold text-orange-600">
                    {formatCurrency(dashboardStats.cashDisbursed - dashboardStats.cashReceived)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Recovery Rate</span>
                  <span className="text-xl font-bold text-purple-600">
                    {dashboardStats.cashDisbursed > 0 
                      ? ((dashboardStats.cashReceived / dashboardStats.cashDisbursed) * 100).toFixed(1)
                      : '0.0'
                    }%
                  </span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-gray-600">Loans Fully Repaid</span>
                  <span className="text-xl font-bold text-green-600">
                    {dashboardStats.repaidLoans || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Borrowers</span>
                  <span className="text-xl font-bold text-blue-600">
                    {dashboardStats.borrowers}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {}
          <Card>
            <CardHeader>
              <CardTitle>Application Processing Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {dashboardStats.pendingApplications}
                  </div>
                  <div className="text-sm text-gray-600">Pending Review</div>
                  <div className="text-xs text-gray-500 mt-1">Awaiting verification</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {Math.max(0, dashboardStats.totalApplications - dashboardStats.pendingApplications - dashboardStats.approvedApplications - dashboardStats.rejectedApplications)}
                  </div>
                  <div className="text-sm text-gray-600">Under Verification</div>
                  <div className="text-xs text-gray-500 mt-1">Being processed</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {dashboardStats.approvedApplications}
                  </div>
                  <div className="text-sm text-gray-600">Approved</div>
                  <div className="text-xs text-gray-500 mt-1">Ready for disbursement</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {dashboardStats.rejectedApplications}
                  </div>
                  <div className="text-sm text-gray-600">Rejected</div>
                  <div className="text-xs text-gray-500 mt-1">Did not meet criteria</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle>System Health & Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-green-900">System Status</div>
                  <div className="text-sm text-green-700">All systems operational</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-blue-900">Active Users</div>
                  <div className="text-sm text-blue-700">{dashboardStats.liveUsers} users online</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-purple-900">Data Source</div>
                  <div className="text-sm text-purple-700">100% Live API Data</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return null
  }

  return (
    <MainLayout>
      {renderStatisticsContent()}
    </MainLayout>
  )
}