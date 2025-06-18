'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  PlusCircle, 
  Search, 
  Filter, 
  MoreHorizontal,
  DollarSign,
  Eye,
  Edit,
  CheckCircle,
  X
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { applicationAPI, type Application } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ApplicationsPage() {
  const { user, isAdmin, isVerifier, isCustomer } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [verificationNotes, setVerificationNotes] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [dataLoaded, setDataLoaded] = useState(false)
  const [hasApplications, setHasApplications] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    tenure: '',
    empStatus: 'EMPLOYED',
    reason: '',
    empAddress: ''
  })

  useEffect(() => {
    loadApplications()
  }, [currentPage, statusFilter])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 10,
        sortBy: 'dateTime',
        sortOrder: 'desc'
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      console.log('🔄 Loading applications with params:', params)
      
      const response = await applicationAPI.getAll(params)
      
      
      const applicationsArray = response.data?.data?.data || []
      
      console.log('✅ Applications loaded:', applicationsArray.length, 'items')
      
      setApplications(applicationsArray)
      setHasApplications(applicationsArray.length > 0)
      setDataLoaded(true)
      setTotalPages(response.data?.data?.totalPages || 1)
      setTotalItems(applicationsArray.length)
    } catch (error: any) {
      console.error('❌ Error loading applications:', error)
      console.error('❌ Error response data:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      
      let errorMessage = 'Failed to load applications'
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to access applications'
      } else if (error.response?.status === 401) {
        errorMessage = 'Please login to access applications'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast.error(errorMessage)
      setApplications([])
      setHasApplications(false)
      setDataLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await applicationAPI.create({
        amount: Number(formData.amount),
        tenure: Number(formData.tenure),
        empStatus: formData.empStatus,
        reason: formData.reason,
        empAddress: formData.empAddress
      })
      
      toast.success('Application submitted successfully!')
      setShowForm(false)
      setFormData({
        amount: '',
        tenure: '',
        empStatus: 'EMPLOYED',
        reason: '',
        empAddress: ''
      })
      loadApplications() // Refresh the list
    } catch (error: any) {
      console.error('Error submitting application:', error)
      const message = error.response?.data?.message || 'Failed to submit application'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (applicationId: string, status: string) => {
    try {
      await applicationAPI.verify(applicationId, {
        status,
        notes: verificationNotes
      })
      
      toast.success(`Application ${status.toLowerCase()} successfully!`)
      setSelectedApplication(null)
      setVerificationNotes('')
      loadApplications()
    } catch (error: any) {
      console.error('Error verifying application:', error)
      const message = error.response?.data?.message || 'Failed to verify application'
      toast.error(message)
    }
  }

  const handleApprove = async (applicationId: string, status: string) => {
    try {
      await applicationAPI.approve(applicationId, {
        status,
        interestRate: Number(interestRate)
      })
      
      toast.success(`Application ${status.toLowerCase()} successfully!`)
      setSelectedApplication(null)
      setInterestRate('')
      loadApplications()
    } catch (error: any) {
      console.error('Error processing application:', error)
      const message = error.response?.data?.message || 'Failed to process application'
      toast.error(message)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'pending'
      case 'VERIFIED': return 'verified'
      case 'APPROVED': return 'approved'
      case 'REJECTED': return 'rejected'
      default: return 'pending'
    }
  }

  const getFilteredApplications = () => {
    
    if (!dataLoaded) {
      return []
    }

    
    if (applications.length === 0) {
      return []
    }

    
    return applications.filter(app => {
      const matchesSearch = !searchTerm || 
        app.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatCurrency(app.amount).includes(searchTerm) ||
        app.empStatus.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }

  const filteredApplications = getFilteredApplications()
  const hasFilteredResults = filteredApplications.length > 0
  const isSearching = searchTerm.length > 0 || statusFilter !== 'all'

  const renderApplicationsList = () => {
    if (loading && !dataLoaded) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        </div>
      )
    }

    
    if (dataLoaded && applications.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <PlusCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600 mb-6">
              {isCustomer 
                ? "You haven't submitted any loan applications yet. Start by creating your first application."
                : "No applications have been submitted to the system yet."
              }
            </p>
            {isCustomer && (
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Apply for Your First Loan
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    
    if (dataLoaded && applications.length > 0 && filteredApplications.length === 0 && isSearching) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <PlusCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Applications</h3>
            <p className="text-gray-600 mb-4">
              No applications match your current search criteria or filters.
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )
    }

    
    if (dataLoaded && filteredApplications.length > 0) {
      console.log('✅ Rendering', filteredApplications.length, 'applications')
      return (
        <div className="grid gap-4">
          {filteredApplications.map((application) => (
            <Card key={application._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{formatCurrency(application.amount)}</h3>
                        <p className="text-sm text-gray-600">{application.tenure} months • {application.empStatus}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Purpose</p>
                        <p className="font-medium">{application.reason}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Applied Date</p>
                        <p className="font-medium">{formatDate(application.dateTime)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <Badge variant={getStatusVariant(application.status)}>
                          {application.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link href={`/applications/${application._id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    
                    {canVerify(application) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedApplication(application)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Verify
                      </Button>
                    )}
                    
                    {canApprove(application) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedApplication(application)}
                        className="border-green-200 text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    return null
  }

  const canVerify = (application: Application) => {
    return (isVerifier || isAdmin) && application.status === 'PENDING'
  }

  const canApprove = (application: Application) => {
    return isAdmin && application.status === 'VERIFIED'
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {showForm ? 'APPLY FOR A LOAN' : 'Applications'}
            </h1>
            <p className="text-gray-600">
              {showForm 
                ? 'Fill out the form below to apply for a loan' 
                : isAdmin 
                  ? `Manage all loan applications (${totalItems} total)`
                  : 'Manage your loan applications'
              }
            </p>
          </div>
          
          {!showForm && isCustomer && (
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Get A Loan
            </Button>
          )}
          
          {showForm && (
            <Button 
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              View Applications
            </Button>
          )}
        </div>

        {showForm ? (
          
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">
                  APPLY FOR A LOAN
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="amount" className="text-sm font-medium text-gray-700">
                        Loan Amount (₹)
                      </label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        required
                        min="1000"
                        max="10000000"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="Enter loan amount"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="tenure" className="text-sm font-medium text-gray-700">
                        Tenure (Months)
                      </label>
                      <Input
                        id="tenure"
                        name="tenure"
                        type="number"
                        required
                        min="1"
                        max="120"
                        value={formData.tenure}
                        onChange={handleChange}
                        placeholder="Enter tenure in months"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="empStatus" className="text-sm font-medium text-gray-700">
                      Employment Status
                    </label>
                    <select
                      id="empStatus"
                      name="empStatus"
                      value={formData.empStatus}
                      onChange={handleChange}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="EMPLOYED">Employed</option>
                      <option value="SELF_EMPLOYED">Self Employed</option>
                      <option value="UNEMPLOYED">Unemployed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="reason" className="text-sm font-medium text-gray-700">
                      Loan Purpose
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      required
                      rows={3}
                      value={formData.reason}
                      onChange={handleChange}
                      placeholder="Explain the purpose of this loan..."
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="empAddress" className="text-sm font-medium text-gray-700">
                      Employment Address
                    </label>
                    <textarea
                      id="empAddress"
                      name="empAddress"
                      required
                      rows={2}
                      value={formData.empAddress}
                      onChange={handleChange}
                      placeholder="Enter your employment address..."
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          
          <div className="space-y-6">
            {}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 px-3 py-2 border border-input bg-background rounded-md text-sm min-w-[120px]"
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {renderApplicationsList()}

            {}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} applications
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {canVerify(selectedApplication) ? 'Verify Application' : 'Approve Application'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedApplication(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm"><strong>Amount:</strong> {formatCurrency(selectedApplication.amount)}</p>
                  <p className="text-sm"><strong>Purpose:</strong> {selectedApplication.reason}</p>
                  <p className="text-sm"><strong>Employment:</strong> {selectedApplication.empStatus}</p>
                </div>

                {canVerify(selectedApplication) && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Verification Notes</label>
                      <textarea
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        placeholder="Add verification notes..."
                        className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleVerify(selectedApplication._id, 'VERIFIED')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Verify
                      </Button>
                      <Button
                        onClick={() => handleVerify(selectedApplication._id, 'REJECTED')}
                        variant="destructive"
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {canApprove(selectedApplication) && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Interest Rate (%)</label>
                      <Input
                        type="number"
                        step="0.1"
                        min="1"
                        max="50"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        placeholder="Enter interest rate"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(selectedApplication._id, 'APPROVED')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={!interestRate}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleApprove(selectedApplication._id, 'REJECTED')}
                        variant="destructive"
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
}