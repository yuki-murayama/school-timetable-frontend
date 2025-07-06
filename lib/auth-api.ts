const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://school-timetable-backend.malah-shunmu.workers.dev'

interface AuthApiOptions {
  token?: string
}

export interface UserInfo {
  sub: string
  email: string
  name: string
  picture?: string
  roles?: string[]
  permissions?: string[]
}

export interface AuthStatus {
  authenticated: boolean
  user?: UserInfo
}

export interface MockTokenResponse {
  success: boolean
  data: {
    token: string
    user: UserInfo
  }
}

const createAuthHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

export const authApi = {
  async getConfig(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/config`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async getStatus(options?: AuthApiOptions): Promise<AuthStatus> {
    const response = await fetch(`${API_BASE_URL}/auth/status`, {
      headers: createAuthHeaders(options?.token)
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async getHealth(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/health`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async getUserInfo(options?: AuthApiOptions): Promise<UserInfo> {
    const response = await fetch(`${API_BASE_URL}/auth/user/me`, {
      headers: createAuthHeaders(options?.token)
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async getPermissions(options?: AuthApiOptions): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/auth/user/permissions`, {
      headers: createAuthHeaders(options?.token)
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async verifyToken(token: string): Promise<UserInfo> {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: createAuthHeaders(token)
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async getMockToken(): Promise<MockTokenResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/mock/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async getMockUser(): Promise<UserInfo> {
    const response = await fetch(`${API_BASE_URL}/auth/mock/user`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }
}