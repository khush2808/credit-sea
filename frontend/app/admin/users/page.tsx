'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Search, 
  Plus,
  Edit,
  Ban,
  CheckCircle,
  UserCheck,
  MoreHorizontal,
  Eye,
  UserPlus
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { adminAPI, type User } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [hasUsers, setHasUsers] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'USER'
  })

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }
    loadUsers()
  }, [isAdmin, router, currentPage, roleFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 10
      }

      if (roleFilter !== 'all') {
        params.role = roleFilter
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      console.log('🔄 Loading users with params:', params)
      const response = await adminAPI.getUsers(params)
      
      
      const usersArray = response.data?.data?.data || []
      
      console.log('✅ Users loaded:', usersArray.length, 'items')
      
      setUsers(usersArray)
      setHasUsers(usersArray.length > 0)
      setDataLoaded(true)
      setTotalPages(response.data?.data?.totalPages || 1)
    } catch (error: any) {
      console.error('❌ Error loading users:', error)
      console.error('❌ Error response data:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      
      let errorMessage = 'Failed to load users'
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to access user management'
      } else if (error.response?.status === 401) {
        errorMessage = 'Please login to access user management'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast.error(errorMessage)
      setUsers([])
      setHasUsers(false)
      setDataLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadUsers()
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await adminAPI.createUser(formData)
      toast.success('User created successfully')
      setShowCreateForm(false)
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'USER'
      })
      loadUsers()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create user'
      toast.error(message)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await adminAPI.updateUserRole(userId, { role: newRole })
      toast.success('User role updated successfully')
      loadUsers()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update user role'
      toast.error(message)
    }
  }

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await adminAPI.toggleUserStatus(userId, { isActive: !isActive })
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'} successfully`)
      loadUsers()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update user status'
      toast.error(message)
    }
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      SUPER_ADMIN: 'destructive',
      ADMIN: 'approved',
      VERIFIER: 'verified',
      USER: 'secondary'
    }
    return <Badge variant={variants[role] || 'secondary'}>{role}</Badge>
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="approved">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="rejected">
        <Ban className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    )
  }

  const getFilteredUsers = () => {
    
    if (!dataLoaded) {
      return []
    }

    
    if (users.length === 0) {
      return []
    }

    
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      
      return matchesSearch && matchesRole
    })
  }

  const renderUsersContent = () => {
    console.log('🎨 renderUsersContent called with:', {
      loading,
      dataLoaded,
      hasUsers,
      usersLength: users.length,
      searchTerm,
      roleFilter
    })
    
    
    if (loading && !dataLoaded) {
      console.log('🔄 Showing loading state')
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      )
    }

    
    if (dataLoaded && users.length === 0) {
      console.log('📝 Showing no users state')
      const isSearching = searchTerm.length > 0 || roleFilter !== 'all'
      return (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isSearching ? 'No Matching Users' : 'No Users Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {isSearching 
                ? 'No users match your current search or filter criteria.'
                : 'No users have been created in the system yet.'
              }
            </p>
            {isSearching ? (
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setRoleFilter('all')
                  loadUsers()
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => setShowCreateForm(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create First User
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    
    if (dataLoaded && users.length > 0) {
      console.log('✅ Rendering users list')
      return (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-lg font-medium text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.isActive)}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <p>Created: {formatDate(user.createdAt)}</p>
                    <p>Updated: {formatDate(user.updatedAt)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleStatus(user._id, user.isActive)}
                    >
                      {user.isActive ? (
                        <>
                          <Ban className="w-4 h-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
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
            Debug: dataLoaded={dataLoaded.toString()}, users.length={users.length}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading && users.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage system users and their permissions</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-1" />
            Create User
          </Button>
        </div>

        {}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="USER">Users</option>
                  <option value="VERIFIER">Verifiers</option>
                  <option value="ADMIN">Admins</option>
                  <option value="SUPER_ADMIN">Super Admins</option>
                </select>
                <Button onClick={handleSearch} variant="outline">
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {renderUsersContent()}

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

        {}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="USER">User</option>
                      <option value="VERIFIER">Verifier</option>
                      <option value="ADMIN">Admin</option>
                      {user?.role === 'SUPER_ADMIN' && (
                        <option value="SUPER_ADMIN">Super Admin</option>
                      )}
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" className="flex-1">Create User</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
} 