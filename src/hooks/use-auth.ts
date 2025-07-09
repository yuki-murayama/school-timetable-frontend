import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'

export interface AuthUser {
  sub: string
  email: string
  name: string
  picture?: string
  roles: string[]
  permissions: string[]
}

export function useAuth() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { getToken } = useClerkAuth()
  const { signOut } = useClerk()

  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (isSignedIn && user) {
        try {
          const accessToken = await getToken()
          setToken(accessToken)

          // Get roles from Clerk metadata or default to school_admin
          const clerkRoles = user.publicMetadata?.roles as string[] || ['school_admin']
          
          const userInfo: AuthUser = {
            sub: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            name: user.fullName || user.firstName || '',
            picture: user.imageUrl,
            roles: clerkRoles,
            permissions: [
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
          
          setAuthUser(userInfo)
          
          console.log('Auth user loaded:', { roles: clerkRoles, permissions: userInfo.permissions.slice(0, 3) })
        } catch (error) {
          console.error('Failed to load user data:', error)
        }
      }
    }

    loadUserData()
  }, [isSignedIn, user, getToken])

  const login = () => {
    window.location.href = '/sign-in'
  }

  const logout = async () => {
    try {
      await signOut({ redirectUrl: '/' })
    } catch (error) {
      console.error('ログアウトに失敗しました:', error)
      window.location.href = '/'
    }
  }

  return {
    isAuthenticated: isSignedIn,
    isLoading: !isLoaded,
    user: authUser,
    token,
    login,
    logout
  }
}