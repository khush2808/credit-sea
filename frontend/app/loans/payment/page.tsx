'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams, useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  CreditCard, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { loanAPI, type Loan } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

function PaymentPageContent() {
  const { user, isCustomer } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const loanId = searchParams.get('loanId')

  const [loans, setLoans] = useState<Loan[]>([])
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Online'
  })

  useEffect(() => {
    if (!isCustomer) {
      router.push('/dashboard')
      return
    }
    loadLoans()
  }, [isCustomer, router])

  useEffect(() => {
    if (loanId && loans.length > 0) {
      const loan = loans.find(l => l._id === loanId)
      if (loan) {
        setSelectedLoan(loan)
        setPaymentData(prev => ({ ...prev, amount: loan.emi.toString() }))
      }
    }
  }, [loanId, loans])

  const loadLoans = async () => {
    try {
      setLoading(true)
      const response = await loanAPI.getAll({ isPaid: false })
      
      // Get loans array from correct response structure
      const loansArray = response.data?.data?.data || []
      console.log('✅ Active loans loaded for payment:', loansArray.length, 'items')
      
      setLoans(loansArray)
      
      if (!loanId && loansArray.length > 0) {
        const firstLoan = loansArray[0]
        setSelectedLoan(firstLoan)
        setPaymentData(prev => ({ ...prev, amount: firstLoan.emi.toString() }))
      }
    } catch (error: any) {
      console.error('Failed to load loans:', error)
      toast.error('Failed to load loans')
      setLoans([])
    } finally {
      setLoading(false)
    }
  }

  const handleLoanSelect = (loan: Loan) => {
    setSelectedLoan(loan)
    setPaymentData(prev => ({ ...prev, amount: loan.emi.toString() }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedLoan) {
      toast.error('Please select a loan')
      return
    }

    const amount = parseFloat(paymentData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount > selectedLoan.principalLeft) {
      toast.error('Payment amount cannot exceed remaining balance')
      return
    }

    try {
      setSubmitting(true)
      await loanAPI.makePayment({
        loanId: selectedLoan._id,
        amount,
        paymentMethod: paymentData.paymentMethod
      })

      toast.success('Payment successful!')
      router.push('/loans')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Payment failed'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const isOverdue = (loan: Loan) => new Date() > new Date(loan.nextPaymentDate)

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment page...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (loans.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Loans</h3>
              <p className="text-gray-600 mb-4">
                You don't have any active loans requiring payment.
              </p>
              <Link href="/applications">
                <Button>Apply for a Loan</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {}
        <div className="flex items-center space-x-4">
          <Link href="/loans">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Loans
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Make Payment</h1>
            <p className="text-gray-600">Pay your loan EMI or make additional payments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Loan</h2>
            {loans.map((loan) => (
              <Card 
                key={loan._id} 
                className={`cursor-pointer transition-all ${
                  selectedLoan?._id === loan._id 
                    ? 'ring-2 ring-green-500 bg-green-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleLoanSelect(loan)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Loan #{loan._id.slice(-6)}</h3>
                    {isOverdue(loan) ? (
                      <Badge variant="rejected">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Overdue
                      </Badge>
                    ) : (
                      <Badge variant="pending">
                        <CreditCard className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Monthly EMI</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(loan.emi)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Remaining</p>
                      <p className="font-semibold">
                        {formatCurrency(loan.principalLeft)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Next Due</p>
                      <p className="font-semibold">
                        {formatDate(loan.nextPaymentDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Interest Rate</p>
                      <p className="font-semibold">{loan.interestRate}%</p>
                    </div>
                  </div>

                  {isOverdue(loan) && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <AlertCircle className="inline w-4 h-4 mr-1" />
                        Payment overdue. Please pay immediately to avoid penalties.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedLoan ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Selected Loan</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        Loan #{selectedLoan._id.slice(-6)}
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        EMI: {formatCurrency(selectedLoan.emi)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Remaining: {formatCurrency(selectedLoan.principalLeft)}
                      </p>
                    </div>

                    {}
                    <div className="space-y-2">
                      <Label htmlFor="amount">Payment Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="1"
                        max={selectedLoan.principalLeft}
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData(prev => ({ 
                          ...prev, 
                          amount: e.target.value 
                        }))}
                        placeholder="Enter payment amount"
                        required
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentData(prev => ({ 
                            ...prev, 
                            amount: selectedLoan.emi.toString() 
                          }))}
                        >
                          EMI Amount
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentData(prev => ({ 
                            ...prev, 
                            amount: selectedLoan.principalLeft.toString() 
                          }))}
                        >
                          Full Payment
                        </Button>
                      </div>
                    </div>

                    {}
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <select
                        id="paymentMethod"
                        value={paymentData.paymentMethod}
                        onChange={(e) => setPaymentData(prev => ({ 
                          ...prev, 
                          paymentMethod: e.target.value 
                        }))}
                        className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="Online">Online Payment</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="UPI">UPI</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Credit Card">Credit Card</option>
                      </select>
                    </div>

                    {}
                    {paymentData.amount && !isNaN(parseFloat(paymentData.amount)) && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Payment Summary</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Payment Amount:</span>
                            <span className="font-semibold">
                              {formatCurrency(parseFloat(paymentData.amount))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Remaining after payment:</span>
                            <span className="font-semibold">
                              {formatCurrency(
                                selectedLoan.principalLeft - parseFloat(paymentData.amount)
                              )}
                            </span>
                          </div>
                          {parseFloat(paymentData.amount) >= selectedLoan.principalLeft && (
                            <div className="flex items-center text-green-600 mt-2">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              <span className="font-semibold">This will complete your loan!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {}
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Make Payment
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Please select a loan to make payment
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment page...</p>
          </div>
        </div>
      </MainLayout>
    }>
      <PaymentPageContent />
    </Suspense>
  )
} 