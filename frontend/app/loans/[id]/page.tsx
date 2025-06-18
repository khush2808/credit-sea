'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useParams, useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { loanAPI, type Loan, type Transaction } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface LoanDetails extends Loan {
  user?: {
    name: string
    email: string
    phone: string
  }
  application?: {
    amount: number
    tenure: number
    empStatus: string
    reason: string
  }
  totalAmount?: number
}

interface PaymentScheduleItem {
  installmentNumber: number
  dueDate: string
  emiAmount: number
  principalComponent: number
  interestComponent: number
  remainingPrincipal: number
  status: 'PAID' | 'PENDING'
}

export default function LoanDetailsPage() {
  const { user, isAdmin, isCustomer } = useAuth()
  const params = useParams()
  const router = useRouter()
  const loanId = params.id as string

  const [loan, setLoan] = useState<LoanDetails | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [schedule, setSchedule] = useState<PaymentScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (loanId) {
      loadLoanDetails()
    }
  }, [loanId])

  const loadLoanDetails = async () => {
    try {
      setLoading(true)
      const [loanRes, transactionsRes, scheduleRes] = await Promise.all([
        loanAPI.getById(loanId),
        loanAPI.getTransactions(loanId, { page: 1, limit: 50 }),
        loanAPI.getSchedule(loanId)
      ])

      setLoan(loanRes.data.data)
      setTransactions(transactionsRes.data.data)
      setSchedule(scheduleRes.data.data.schedule)
    } catch (error: any) {
      console.error('Failed to load loan details:', error)
      toast.error('Failed to load loan details')
      router.push('/loans')
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = () => {
    if (!loan || loan.isPaid) return false
    return new Date() > new Date(loan.nextPaymentDate)
  }

  const getCompletionPercentage = () => {
    if (!loan || !loan.totalAmount) return 0
    const totalPaid = loan.totalAmount - loan.principalLeft
    return Math.round((totalPaid / loan.totalAmount) * 100)
  }

  const getRemainingTenure = () => {
    if (!loan || loan.isPaid) return 0
    return Math.ceil(loan.principalLeft / loan.emi)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading loan details...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!loan) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loan Not Found</h2>
          <p className="text-gray-600 mb-4">The requested loan could not be found.</p>
          <Link href="/loans">
            <Button>Back to Loans</Button>
          </Link>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/loans">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Loans
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Loan #{loan._id.slice(-6)}
              </h1>
              <p className="text-gray-600">
                Approved on {formatDate(loan.approvalDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {loan.isPaid ? (
              <Badge variant="approved" className="text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Completed
              </Badge>
            ) : isOverdue() ? (
              <Badge variant="rejected" className="text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                Overdue
              </Badge>
            ) : (
              <Badge variant="pending" className="text-sm">
                <Clock className="w-4 h-4 mr-1" />
                Active
              </Badge>
            )}
            {isCustomer && !loan.isPaid && (
              <Link href={`/loans/payment?loanId=${loan._id}`}>
                <Button className="bg-green-600 hover:bg-green-700">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Make Payment
                </Button>
              </Link>
            )}
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly EMI</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(loan.emi)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Remaining Balance</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(loan.principalLeft)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Interest Rate</p>
                  <p className="text-2xl font-bold">{loan.interestRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {loan.isPaid ? 'Completed' : 'Next Payment'}
                  </p>
                  <p className="text-lg font-bold">
                    {loan.isPaid ? 'Loan Paid' : formatDate(loan.nextPaymentDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {}
        {!loan.isPaid && loan.totalAmount && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Loan Progress</span>
                <span className="text-sm text-gray-600">{getCompletionPercentage()}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getCompletionPercentage()}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Paid: {formatCurrency(loan.totalAmount - loan.principalLeft)}</span>
                <span>Remaining: {formatCurrency(loan.principalLeft)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Payment Schedule</TabsTrigger>
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Loan Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold">{formatCurrency(loan.totalAmount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tenure</p>
                      <p className="font-semibold">{loan.tenureMonths} months</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Remaining Tenure</p>
                      <p className="font-semibold">{getRemainingTenure()} months</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold">
                        {loan.isPaid ? 'Completed' : isOverdue() ? 'Overdue' : 'Active'}
                      </p>
                    </div>
                  </div>
                  
                  {loan.application && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">Application Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Employment Status:</span>
                          <span>{loan.application.empStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Purpose:</span>
                          <span>{loan.application.reason}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {}
              {isAdmin && loan.user && (
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{loan.user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{loan.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{loan.user.phone}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">#</th>
                        <th className="text-left p-2">Due Date</th>
                        <th className="text-left p-2">EMI Amount</th>
                        <th className="text-left p-2">Principal</th>
                        <th className="text-left p-2">Interest</th>
                        <th className="text-left p-2">Balance</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((item) => (
                        <tr key={item.installmentNumber} className="border-b">
                          <td className="p-2">{item.installmentNumber}</td>
                          <td className="p-2">{formatDate(item.dueDate)}</td>
                          <td className="p-2">{formatCurrency(item.emiAmount)}</td>
                          <td className="p-2">{formatCurrency(item.principalComponent)}</td>
                          <td className="p-2">{formatCurrency(item.interestComponent)}</td>
                          <td className="p-2">{formatCurrency(item.remainingPrincipal)}</td>
                          <td className="p-2">
                            <Badge variant={item.status === 'PAID' ? 'approved' : 'pending'}>
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(transaction.date)} • {transaction.paymentMethod}
                            </p>
                          </div>
                        </div>
                        <Badge variant="approved">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No transactions found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
} 