'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CreditCard,
  Calendar,
  DollarSign,
  Search,
  AlertCircle,
  CheckCircle,
  Eye,
  PlusCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { loanAPI, type Loan } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function LoansPage() {
  const { user, isAdmin, isCustomer, isVerifier } = useAuth()
  const router = useRouter()
  const [loans, setLoans] = useState<Loan[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [hasLoans, setHasLoans] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  
  useEffect(() => {
    if (user && isVerifier && !isAdmin && !isCustomer) {
      router.push('/dashboard')
      return
    }
  }, [user, isVerifier, isAdmin, isCustomer, router])

  useEffect(() => {
    
    if (user && (isCustomer || isAdmin)) {
      loadLoans()
    }
  }, [currentPage, filter, user, isCustomer, isAdmin])

  const loadLoans = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 10
      }
      
      if (filter === 'paid') {
        params.isPaid = true
      } else if (filter === 'active') {
        params.isPaid = false
      }

      console.log('🔄 Loading loans with params:', params)
      const response = await loanAPI.getAll(params)
      
      
      const loansArray = response.data?.data?.data || []
      
      console.log('✅ Loans loaded:', loansArray.length, 'items')
      
      setLoans(loansArray)
      setHasLoans(loansArray.length > 0)
      setDataLoaded(true)
      setTotalPages(response.data?.data?.totalPages || 1)
    } catch (error: any) {
      console.error('❌ Error loading loans:', error)
      console.error('❌ Error response data:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      
      let errorMessage = 'Failed to load loans'
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to access loans'
      } else if (error.response?.status === 401) {
        errorMessage = 'Please login to access loans'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast.error(errorMessage)
      setLoans([])
      setHasLoans(false)
      setDataLoaded(true)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredLoans = () => {
    
    if (!dataLoaded) {
      return []
    }

    
    if (loans.length === 0) {
      return []
    }

    
    return loans.filter(loan => {
      const matchesSearch = !searchTerm || 
        loan.emi.toString().includes(searchTerm) ||
        loan.principalLeft.toString().includes(searchTerm)
      
      const matchesFilter = filter === 'all' || 
        (filter === 'paid' && loan.isPaid) ||
        (filter === 'active' && !loan.isPaid)
      
      return matchesSearch && matchesFilter
    })
  }

  const filteredLoans = getFilteredLoans()
  const hasFilteredResults = filteredLoans.length > 0
  const isSearchingOrFiltering = searchTerm.length > 0 || filter !== 'all'

  const getStatusBadge = (loan: Loan) => {
    if (loan.isPaid) {
      return <Badge variant="approved"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>
    }
    
    const isOverdue = new Date() > new Date(loan.nextPaymentDate)
    if (isOverdue) {
      return <Badge variant="rejected"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>
    }
    
    return <Badge variant="pending"><CreditCard className="w-3 h-3 mr-1" />Active</Badge>
  }

  const renderLoansContent = () => {
    console.log('🎨 renderLoansContent called with:', {
      loading,
      dataLoaded,
      hasLoans,
      loansLength: loans.length,
      hasFilteredResults,
      filteredLoansLength: filteredLoans.length
    })
    
    
    if (loading && !dataLoaded) {
      console.log('🔄 Showing loading state')
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading loans...</p>
          </div>
        </div>
      )
    }

    
    if (dataLoaded && loans.length === 0) {
      console.log('📝 Showing no loans state')
      return (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Loans Found</h3>
            <p className="text-gray-600 mb-6">
              {isCustomer 
                ? "You don't have any loans yet. Apply for a loan to get started." 
                : "No loans have been disbursed in the system yet."
              }
            </p>
            {isCustomer && (
              <Link href="/applications">
                <Button className="bg-green-600 hover:bg-green-700">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Apply for a Loan
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )
    }

    
    if (dataLoaded && loans.length > 0 && filteredLoans.length === 0 && isSearchingOrFiltering) {
      console.log('🔍 Showing no search results state')
      return (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Loans</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' ? 'No loans match your search criteria' : `No ${filter} loans found`}
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )
    }

    
    if (dataLoaded && filteredLoans.length > 0) {
      console.log('✅ Rendering loans list')
      return (
        <div className="space-y-4">
          {filteredLoans.map((loan) => (
            <Card key={loan._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Loan #{loan._id.slice(-6)}</h3>
                      <p className="text-sm text-gray-600">
                        Approved on {formatDate(loan.approvalDate)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(loan)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div>
                    <p className="text-sm text-gray-600">Monthly EMI</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(loan.emi)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining Balance</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(loan.principalLeft)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="text-xl font-bold">{loan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Next Payment</p>
                    <p className="text-lg font-semibold">
                      {loan.isPaid ? 'Completed' : formatDate(loan.nextPaymentDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {loan.tenureMonths} months tenure
                      </span>
                    </div>
                    {!loan.isPaid && new Date() > new Date(loan.nextPaymentDate) && (
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Payment Overdue</span>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Link href={`/loans/${loan._id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                    {isCustomer && !loan.isPaid && (
                      <Link href={`/loans/payment?loanId=${loan._id}`}>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <DollarSign className="w-4 h-4 mr-1" />
                          Pay EMI
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    console.log('❓ No condition matched, showing fallback')
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-600">
            Debug: dataLoaded={dataLoaded.toString()}, loans.length={loans.length}, 
            filteredLoans.length={filteredLoans.length}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isCustomer ? 'My Loans' : 'All Loans'}
            </h1>
            <p className="text-gray-600">
              {isCustomer ? 'Manage your active loans and payment history' : 'Manage customer loans and payments'}
            </p>
          </div>
          {isCustomer && (
            <Link href="/loans/payment">
              <Button className="bg-green-600 hover:bg-green-700">
                Make Payment
              </Button>
            </Link>
          )}
        </div>

        {}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by EMI amount or remaining balance..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                >
                  All Loans
                </Button>
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  onClick={() => setFilter('active')}
                  size="sm"
                >
                  Active
                </Button>
                <Button
                  variant={filter === 'paid' ? 'default' : 'outline'}
                  onClick={() => setFilter('paid')}
                  size="sm"
                >
                  Paid
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {}
        {renderLoansContent()}

        {}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  )
} 