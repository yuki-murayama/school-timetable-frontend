'use client'

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { UserRole, Permission, userRoles } from '@/lib/auth-config'
import { authApi, UserInfo } from '@/lib/auth-api'

export interface AuthUser extends UserInfo {
  roles: UserRole[]
  permissions: Permission[]
}

export function useAuth() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { getToken } = useClerkAuth()

  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (isSignedIn && user) {
        try {
          const accessToken = await getToken()
          setToken(accessToken)

          let userInfo: UserInfo
          let permissions: string[]

          try {
            userInfo = await authApi.getUserInfo({ token: accessToken })
            permissions = await authApi.getPermissions({ token: accessToken })
          } catch (apiError) {
            console.warn('Backend API not available, using fallback auth:', apiError)
            
            // Get roles from Clerk metadata
            const clerkRoles = user.publicMetadata?.roles as string[] || ['school_admin']
            
            userInfo = {
              sub: user.id,
              email: user.emailAddresses[0]?.emailAddress || '',
              name: user.fullName || user.firstName || '',
              picture: user.imageUrl,
              roles: clerkRoles,
              permissions: []
            }
            permissions = [
              'schools:read', 'schools:write',
              'classes:read', 'classes:write',
              'teachers:read', 'teachers:write',
              'subjects:read', 'subjects:write',
              'classrooms:read', 'classrooms:write',
              'timetables:read', 'timetables:write', 'timetables:generate',
              'constraints:read', 'constraints:write',
              'users:read', 'users:write'
            ]
          }

          const roles = userInfo.roles || ['school_admin']
          
          setAuthUser({
            ...userInfo,
            roles: roles as UserRole[],
            permissions
          })
          
          console.log('Auth user loaded:', { roles, permissions: Array.isArray(permissions) ? permissions.slice(0, 3) : permissions })
        } catch (error) {
          console.error('Failed to load user data:', error)
        }
      }
    }

    loadUserData()
  }, [isSignedIn, user, getToken])

  const hasPermission = (permission: Permission): boolean => {
    if (!authUser) {
      console.log('hasPermission: No authUser')
      return false
    }
    
    if (authUser.roles.includes('super_admin')) {
      console.log('hasPermission: User is super_admin, granting permission')
      return true
    }
    
    const hasAccess = authUser.permissions.includes(permission)
    console.log(`hasPermission: ${permission} - ${hasAccess}`, { 
      userRoles: authUser.roles, 
      userPermissions: authUser.permissions.slice(0, 5) 
    })
    
    return hasAccess
  }

  const hasRole = (role: UserRole): boolean => {
    if (!authUser) return false
    return authUser.roles.includes(role)
  }

  const login = () => {
    window.location.href = '/sign-in'
  }

  const logoutUser = () => {
    window.location.href = '/sign-out'
  }

  return {
    isAuthenticated: isSignedIn,
    isLoading: !isLoaded,
    user: authUser,
    token,
    login,
    logout: logoutUser,
    hasPermission,
    hasRole
  }
}