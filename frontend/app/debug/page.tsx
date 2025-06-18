'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { authAPI, applicationAPI, loanAPI, adminAPI, statsAPI } from '@/lib/api'
import Cookies from 'js-cookie'

export default function DebugPage() {
  const { user, isAuthenticated } = useAuth()
  const [testResults, setTestResults] = useState<any>({})
  const [testing, setTesting] = useState(false)

  const testAPI = async (name: string, apiCall: () => Promise<any>) => {
    console.log(`🧪 Testing ${name}...`)
    try {
      const response = await apiCall()
      console.log(`✅ ${name} success:`, response.data)
      
      
      let dataArray = []
      let dataLocation = 'none'
      
      if (Array.isArray(response.data)) {
        dataArray = response.data
        dataLocation = 'response.data (direct array)'
      } else if (response.data && Array.isArray(response.data.data)) {
        dataArray = response.data.data
        dataLocation = 'response.data.data'
      } else if (response.data && Array.isArray(response.data.applications)) {
        dataArray = response.data.applications
        dataLocation = 'response.data.applications'
      } else if (response.data && Array.isArray(response.data.loans)) {
        dataArray = response.data.loans
        dataLocation = 'response.data.loans'
      } else if (response.data && Array.isArray(response.data.users)) {
        dataArray = response.data.users
        dataLocation = 'response.data.users'
      }
      
      return { 
        success: true, 
        data: response.data, 
        status: response.status,
        dataArray,
        dataLocation,
        arrayLength: dataArray.length,
        sampleItem: dataArray[0] || null
      }
    } catch (error: any) {
      console.error(`❌ ${name} failed:`, error)
      return { 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status,
        dataArray: [],
        dataLocation: 'error',
        arrayLength: 0,
        sampleItem: null
      }
    }
  }

  const runAllTests = async () => {
    setTesting(true)
    const results: any = {}

    
    results.profile = await testAPI('Profile', () => authAPI.getProfile())

    
    results.applications = await testAPI('Applications', () => applicationAPI.getAll({ page: 1, limit: 5 }))

    
    if (user?.role !== 'VERIFIER') {
      results.loans = await testAPI('Loans', () => loanAPI.getAll({ page: 1, limit: 5 }))
    }

    
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      results.users = await testAPI('Users', () => adminAPI.getUsers({ page: 1, limit: 5 }))
      results.stats = await testAPI('Dashboard Stats', () => statsAPI.getDashboard())
    }

    setTestResults(results)
    setTesting(false)
  }

  const token = Cookies.get('auth_token')

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Debug Page</h1>
          <p className="text-gray-600">Test API connectivity and debug issues</p>
        </div>

        {}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user) : 'None'}</p>
            <p><strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}</p>
            <p><strong>Role:</strong> {user?.role || 'Unknown'}</p>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle>API Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runAllTests} 
              disabled={testing || !isAuthenticated}
              className="mb-4"
            >
              {testing ? 'Testing...' : 'Run API Tests'}
            </Button>

            {Object.keys(testResults).length > 0 && (
              <div className="space-y-4">
                {Object.entries(testResults).map(([key, result]: [string, any]) => (
                  <div key={key} className="border rounded p-4">
                    <h3 className="font-semibold mb-2">
                      {result.success ? '✅' : '❌'} {key}
                    </h3>
                    <p><strong>Status:</strong> {result.status}</p>
                    
                    {result.success ? (
                      <div>
                        <p><strong>Array Location:</strong> {result.dataLocation}</p>
                        <p><strong>Array Length:</strong> {result.arrayLength}</p>
                        
                        {result.sampleItem && (
                          <div>
                            <p><strong>Sample Item:</strong></p>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-20">
                              {JSON.stringify(result.sampleItem, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        <p><strong>Full Response Preview:</strong></p>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div>
                        <p><strong>Error:</strong></p>
                        <pre className="bg-red-100 p-2 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(result.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle>Debug Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. Open browser Developer Tools (F12)</p>
              <p>2. Go to Console tab</p>
              <p>3. Navigate to Applications, Loans, or Statistics pages</p>
              <p>4. Check console for detailed API logs (🔄, ✅, ❌ emojis)</p>
              <p>5. Look for any error messages or failed API calls</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
} 