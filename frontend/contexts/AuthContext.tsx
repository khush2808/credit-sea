'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { authAPI, type User } from '@/lib/api'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (data: {
    name: string
    email: string
    phone: string
    password: string
  }) => Promise<boolean>
  logout: () => void
  fetchProfile: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
  isVerifier: boolean
  isSuperAdmin: boolean
  isCustomer: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('auth_token')
    if (token) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile()
      setUser(response.data.data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      Cookies.remove('auth_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login({ email, password })
      const { user: userData, token } = response.data.data

      Cookies.set('auth_token', token, { expires: 7 })
      setUser(userData)
      toast.success('Login successful!')
      return true
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return false
    }
  }

  const signup = async (data: {
    name: string
    email: string
    phone: string
    password: string
  }): Promise<boolean> => {
    try {
      const response = await authAPI.signup(data)
      const { user: userData, token } = response.data.data

      Cookies.set('auth_token', token, { expires: 7 })
      setUser(userData)
      toast.success('Account created successfully!')
      return true
    } catch (error: any) {
      const message = error.response?.data?.message || 'Signup failed'
      toast.error(message)
      return false
    }
  }

  const logout = () => {
    Cookies.remove('auth_token')
    setUser(null)
    toast.success('Logged out successfully')
    window.location.href = '/login'
  }

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const isVerifier = user?.role === 'VERIFIER' || isAdmin
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isCustomer = user?.role === 'USER'

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        fetchProfile,
        isAuthenticated,
        isAdmin,
        isVerifier,
        isSuperAdmin,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 