'use client'

import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { UserRole, Permission, userRoles } from '@/lib/auth-config'
import { authApi, UserInfo } from '@/lib/auth-api'

export interface AuthUser extends UserInfo {
  roles: UserRole[]
  permissions: Permission[]
}

export function useAuth() {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently
  } = useAuth0()

  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated && user) {
        try {
          const accessToken = await getAccessTokenSilently()
          setToken(accessToken)

          let userInfo: UserInfo
          let permissions: string[]

          try {
            userInfo = await authApi.getUserInfo({ token: accessToken })
            permissions = await authApi.getPermissions({ token: accessToken })
          } catch (apiError) {
            console.warn('Backend API not available, using fallback auth:', apiError)
            
            userInfo = {
              sub: user.sub || '',
              email: user.email || '',
              name: user.name || '',
              picture: user.picture,
              roles: ['school_admin'],
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
  }, [isAuthenticated, user, getAccessTokenSilently])

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
    loginWithRedirect()
  }

  const logoutUser = () => {
    logout({ 
      logoutParams: { 
        returnTo: window.location.origin 
      } 
    })
  }

  return {
    isAuthenticated,
    isLoading,
    user: authUser,
    token,
    login,
    logout: logoutUser,
    hasPermission,
    hasRole
  }
}