'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  User, 
  FileText, 
  Building, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { applicationAPI, type Application } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ApplicationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAdmin, isVerifier } = useAuth()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadApplication()
    }
  }, [params.id])

  const loadApplication = async () => {
    try {
      setLoading(true)
      const response = await applicationAPI.getById(params.id as string)
      setApplication(response.data.data)
    } catch (error: any) {
      console.error('Error loading application:', error)
      toast.error('Failed to load application details')
      router.push('/applications')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'VERIFIED':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'VERIFIED': return 'bg-blue-100 text-blue-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Your application is waiting for verification by our team.'
      case 'VERIFIED':
        return 'Your application has been verified and is pending final approval.'
      case 'APPROVED':
        return 'Congratulations! Your loan application has been approved.'
      case 'REJECTED':
        return 'Unfortunately, your loan application has been rejected.'
      default:
        return 'Unknown status'
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading application details...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!application) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h2>
          <p className="text-gray-600 mb-6">The application you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/applications">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Applications
            </Button>
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
            <Link href="/applications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
              <p className="text-gray-600">Application ID: {application._id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(application.status)}
            <Badge className={getStatusColor(application.status)}>
              {application.status}
            </Badge>
          </div>
        </div>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Application Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              {getStatusIcon(application.status)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{application.status}</h3>
                <p className="text-gray-600">{getStatusDescription(application.status)}</p>
              </div>
            </div>

            {}
            <div className="flex items-center justify-between mt-6">
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['PENDING', 'VERIFIED', 'APPROVED', 'REJECTED'].includes(application.status) 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">Submitted</p>
                  <p className="text-xs text-gray-500">{formatDate(application.dateTime)}</p>
                </div>
              </div>

              <div className={`flex-1 h-1 mx-4 ${
                ['VERIFIED', 'APPROVED'].includes(application.status) 
                  ? 'bg-green-500' 
                  : application.status === 'REJECTED' 
                    ? 'bg-red-500' 
                    : 'bg-gray-300'
              }`} />

              <div className="flex flex-col items-center space-y-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['VERIFIED', 'APPROVED'].includes(application.status) 
                    ? 'bg-green-500 text-white'
                    : application.status === 'REJECTED'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  <Eye className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">Verified</p>
                  <p className="text-xs text-gray-500">
                    {['VERIFIED', 'APPROVED'].includes(application.status) ? 'Completed' : 'Pending'}
                  </p>
                </div>
              </div>

              <div className={`flex-1 h-1 mx-4 ${
                application.status === 'APPROVED' 
                  ? 'bg-green-500' 
                  : application.status === 'REJECTED' 
                    ? 'bg-red-500' 
                    : 'bg-gray-300'
              }`} />

              <div className="flex flex-col items-center space-y-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  application.status === 'APPROVED' 
                    ? 'bg-green-500 text-white'
                    : application.status === 'REJECTED'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  {application.status === 'APPROVED' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : application.status === 'REJECTED' ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">
                    {application.status === 'APPROVED' ? 'Approved' : 
                     application.status === 'REJECTED' ? 'Rejected' : 'Final Decision'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {application.status === 'APPROVED' || application.status === 'REJECTED' ? 'Completed' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Loan Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Loan Amount</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(application.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tenure</p>
                  <p className="text-lg font-semibold">{application.tenure} months</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Employment Status</p>
                <p className="text-lg font-semibold">{application.empStatus}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Loan Purpose</p>
                <p className="text-lg">{application.reason}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Employment Address</p>
                <p className="text-lg">{application.empAddress}</p>
              </div>

              {}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-green-900">Estimated Monthly EMI</p>
                </div>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(Math.round((application.amount * 1.12) / application.tenure))}
                </p>
                <p className="text-xs text-green-600">*Assuming 12% annual interest rate</p>
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Application Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-gray-500">Application ID</p>
                <p className="text-lg font-mono">{application._id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Applied Date</p>
                <p className="text-lg">{formatDate(application.dateTime)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-lg">{formatDate(application.updatedAt)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Current Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon(application.status)}
                  <Badge className={getStatusColor(application.status)}>
                    {application.status}
                  </Badge>
                </div>
              </div>

              {}
              {(isAdmin || isVerifier) && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-900">Admin Information</h4>
                  
                  {application.verifierId && (
                    <div>
                      <p className="text-sm text-gray-500">Verified By</p>
                      <p className="text-lg">{application.verifierId}</p>
                    </div>
                  )}
                  
                  {application.adminId && (
                    <div>
                      <p className="text-sm text-gray-500">Approved By</p>
                      <p className="text-lg">{application.adminId}</p>
                    </div>
                  )}
                </div>
              )}

              {}
              {application.status === 'APPROVED' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-2">What's Next?</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Your loan has been approved! You can now view your loan details and make payments.
                  </p>
                  <Link href="/loans">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      View Loan Details
                    </Button>
                  </Link>
                </div>
              )}

              {application.status === 'PENDING' && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">Application Under Review</h4>
                  <p className="text-sm text-yellow-700">
                    Your application is currently being reviewed by our verification team. 
                    We'll notify you once the verification is complete.
                  </p>
                </div>
              )}

              {application.status === 'VERIFIED' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Verification Complete</h4>
                  <p className="text-sm text-blue-700">
                    Your application has been verified and is pending final approval from our admin team.
                  </p>
                </div>
              )}

              {application.status === 'REJECTED' && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="text-sm font-medium text-red-900 mb-2">Application Rejected</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Unfortunately, your loan application has been rejected. You can submit a new application with updated information.
                  </p>
                  <Link href="/applications">
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                      Apply Again
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}