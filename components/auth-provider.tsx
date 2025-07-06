'use client'

import { Auth0Provider } from '@auth0/auth0-react'
import { auth0Config } from '@/lib/auth-config'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
        audience: auth0Config.audience,
        scope: 'openid profile email'
      }}
    >
      {children}
    </Auth0Provider>
  )
}