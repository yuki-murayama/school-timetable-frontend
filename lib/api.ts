/**
 * APIクライアント設定
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://school-timetable-backend.grundhunter.workers.dev'

export interface Constraint {
  id: string
  name: string
  description: string
  type: 'teacher_conflict' | 'classroom_conflict' | 'subject_distribution' | 'time_slot_preference'
  enabled: boolean
  parameters?: Record<string, any>
}

export interface TimetableSlot {
  id: string
  classId: string
  subjectId: string
  teacherId: string
  classroomId: string
  day: number
  period: number
  duration: number
}

export interface TimetableGenerationRequest {
  constraints: string[]
  parameters?: Record<string, any>
}

export interface TimetableValidationResult {
  valid: boolean
  violations: Array<{
    constraintId: string
    message: string
    severity: 'error' | 'warning'
  }>
}

export interface BulkGenerationRequest {
  classIds: string[]
  constraints: string[]
  parameters?: Record<string, any>
}

export interface BulkGenerationResult {
  success: boolean
  results: Array<{
    classId: string
    success: boolean
    slots?: TimetableSlot[]
    errors?: string[]
  }>
}

interface ApiOptions {
  token?: string
}

const createHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

export const apiClient = {
  baseURL: API_BASE_URL,
  
  async get<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    console.log(`Making GET request to: ${API_BASE_URL}${endpoint}`)
    console.log('Headers:', createHeaders(options?.token))
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: createHeaders(options?.token)
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Response error text:', errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }
    
    const responseData = await response.json()
    console.log('Response data:', responseData)
    
    // バックエンドが {success: true, data: {...}} 形式で返す場合の処理
    if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
      if (responseData.success) {
        return responseData.data
      } else {
        throw new Error(responseData.message || 'API request failed')
      }
    }
    
    // 直接データが返される場合はそのまま返す
    return responseData
  },
  
  async post<T>(endpoint: string, data?: any, options?: ApiOptions): Promise<T> {
    console.log(`Making POST request to: ${API_BASE_URL}${endpoint}`)
    console.log('Request data:', data)
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: createHeaders(options?.token),
      body: data ? JSON.stringify(data) : undefined,
    })
    
    console.log('POST Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('POST Response error text:', errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }
    
    const responseData = await response.json()
    console.log('POST Response data:', responseData)
    
    // バックエンドが {success: true, data: {...}} 形式で返す場合の処理
    if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
      if (responseData.success) {
        return responseData.data
      } else {
        throw new Error(responseData.message || 'API request failed')
      }
    }
    
    // 直接データが返される場合はそのまま返す
    return responseData
  },
  
  async put<T>(endpoint: string, data?: any, options?: ApiOptions): Promise<T> {
    console.log(`Making PUT request to: ${API_BASE_URL}${endpoint}`)
    console.log('Request data:', data)
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: createHeaders(options?.token),
      body: data ? JSON.stringify(data) : undefined,
    })
    
    console.log('PUT Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('PUT Response error text:', errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }
    
    const responseData = await response.json()
    console.log('PUT Response data:', responseData)
    
    // バックエンドが {success: true, data: {...}} 形式で返す場合の処理
    if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
      if (responseData.success) {
        return responseData.data
      } else {
        throw new Error(responseData.message || 'API request failed')
      }
    }
    
    // 直接データが返される場合はそのまま返す
    return responseData
  },
  
  async delete<T>(endpoint: string, options?: ApiOptions): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: createHeaders(options?.token)
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },
}

export const constraintsApi = {
  async getConstraints(options?: ApiOptions): Promise<Constraint[]> {
    return apiClient.get<Constraint[]>('/api/constraints', options)
  },

  async validateConstraints(timetableId: string, constraints: string[], options?: ApiOptions): Promise<TimetableValidationResult> {
    return apiClient.post<TimetableValidationResult>(`/api/constraints/validate/${timetableId}`, { constraints }, options)
  },
}

export interface SchoolSettings {
  grade1Classes: number
  grade2Classes: number
  grade3Classes: number
  dailyPeriods: number
  saturdayPeriods: number
}

export interface Teacher {
  id?: string
  name: string
  subjects: string[]
  grades: string[]
}

export interface Subject {
  id?: string
  name: string
  specialClassroom?: string
  description?: string
}

export interface Classroom {
  id?: string
  name: string
  type: string
  count: number
}

export interface CustomCondition {
  id?: string
  description: string
  type: string
}

export const schoolApi = {
  async getSettings(options?: ApiOptions): Promise<SchoolSettings> {
    return apiClient.get<SchoolSettings>('/api/frontend/school/settings', options)
  },

  async updateSettings(settings: SchoolSettings, options?: ApiOptions): Promise<SchoolSettings> {
    return apiClient.put<SchoolSettings>('/api/frontend/school/settings', settings, options)
  },
}

export const teacherApi = {
  async getTeachers(options?: ApiOptions): Promise<Teacher[]> {
    return apiClient.get<Teacher[]>('/api/frontend/school/teachers', options)
  },

  async createTeacher(teacher: Omit<Teacher, 'id'>, options?: ApiOptions): Promise<Teacher> {
    return apiClient.post<Teacher>('/api/frontend/school/teachers', teacher, options)
  },

  async updateTeacher(id: string, teacher: Partial<Teacher>, options?: ApiOptions): Promise<Teacher> {
    return apiClient.put<Teacher>(`/api/frontend/school/teachers/${id}`, teacher, options)
  },

  async deleteTeacher(id: string, options?: ApiOptions): Promise<void> {
    return apiClient.delete<void>(`/api/frontend/school/teachers/${id}`, options)
  },

  async saveTeachers(teachers: Teacher[], options?: ApiOptions): Promise<Teacher[]> {
    return apiClient.put<Teacher[]>('/api/frontend/school/teachers', teachers, options)
  },
}

export const subjectApi = {
  async getSubjects(options?: ApiOptions): Promise<Subject[]> {
    return apiClient.get<Subject[]>('/api/frontend/school/subjects', options)
  },

  async createSubject(subject: Omit<Subject, 'id'>, options?: ApiOptions): Promise<Subject> {
    return apiClient.post<Subject>('/api/frontend/school/subjects', subject, options)
  },

  async updateSubject(id: string, subject: Partial<Subject>, options?: ApiOptions): Promise<Subject> {
    return apiClient.put<Subject>(`/api/frontend/school/subjects/${id}`, subject, options)
  },

  async deleteSubject(id: string, options?: ApiOptions): Promise<void> {
    return apiClient.delete<void>(`/api/frontend/school/subjects/${id}`, options)
  },

  async saveSubjects(subjects: Subject[], options?: ApiOptions): Promise<Subject[]> {
    return apiClient.put<Subject[]>('/api/frontend/school/subjects', subjects, options)
  },
}

export const classroomApi = {
  async getClassrooms(options?: ApiOptions): Promise<Classroom[]> {
    return apiClient.get<Classroom[]>('/api/frontend/school/classrooms', options)
  },

  async createClassroom(classroom: Omit<Classroom, 'id'>, options?: ApiOptions): Promise<Classroom> {
    return apiClient.post<Classroom>('/api/frontend/school/classrooms', classroom, options)
  },

  async updateClassroom(id: string, classroom: Partial<Classroom>, options?: ApiOptions): Promise<Classroom> {
    return apiClient.put<Classroom>(`/api/frontend/school/classrooms/${id}`, classroom, options)
  },

  async deleteClassroom(id: string, options?: ApiOptions): Promise<void> {
    return apiClient.delete<void>(`/api/frontend/school/classrooms/${id}`, options)
  },

  async saveClassrooms(classrooms: Classroom[], options?: ApiOptions): Promise<Classroom[]> {
    return apiClient.put<Classroom[]>('/api/frontend/school/classrooms', classrooms, options)
  },
}

export const teachersApi = {
  async getTeachers(options?: ApiOptions): Promise<Teacher[]> {
    return apiClient.get<Teacher[]>('/api/teachers', options)
  },

  async createTeacher(teacher: Omit<Teacher, 'id'>, options?: ApiOptions): Promise<Teacher> {
    return apiClient.post<Teacher>('/api/teachers', teacher, options)
  },

  async updateTeacher(id: string, teacher: Partial<Teacher>, options?: ApiOptions): Promise<Teacher> {
    return apiClient.put<Teacher>(`/api/teachers/${id}`, teacher, options)
  },

  async deleteTeacher(id: string, options?: ApiOptions): Promise<void> {
    return apiClient.delete(`/api/teachers/${id}`, options)
  },
}

export const classroomsApi = {
  async getClassrooms(options?: ApiOptions): Promise<Classroom[]> {
    return apiClient.get<Classroom[]>('/api/classrooms', options)
  },

  async createClassroom(classroom: Omit<Classroom, 'id'>, options?: ApiOptions): Promise<Classroom> {
    return apiClient.post<Classroom>('/api/classrooms', classroom, options)
  },

  async updateClassroom(id: string, classroom: Partial<Classroom>, options?: ApiOptions): Promise<Classroom> {
    return apiClient.put<Classroom>(`/api/classrooms/${id}`, classroom, options)
  },

  async deleteClassroom(id: string, options?: ApiOptions): Promise<void> {
    return apiClient.delete(`/api/classrooms/${id}`, options)
  },
}

export const conditionsApi = {
  async getConditions(options?: ApiOptions): Promise<CustomCondition[]> {
    return apiClient.get<CustomCondition[]>('/api/conditions', options)
  },

  async createCondition(condition: Omit<CustomCondition, 'id'>, options?: ApiOptions): Promise<CustomCondition> {
    return apiClient.post<CustomCondition>('/api/conditions', condition, options)
  },

  async updateCondition(id: string, condition: Partial<CustomCondition>, options?: ApiOptions): Promise<CustomCondition> {
    return apiClient.put<CustomCondition>(`/api/conditions/${id}`, condition, options)
  },

  async deleteCondition(id: string, options?: ApiOptions): Promise<void> {
    return apiClient.delete(`/api/conditions/${id}`, options)
  },
}

export const timetableApi = {
  async bulkGenerate(id: string, request: BulkGenerationRequest, options?: ApiOptions): Promise<BulkGenerationResult> {
    return apiClient.post<BulkGenerationResult>(`/api/timetables/${id}/bulk-generate`, request, options)
  },

  async getClassSlots(timetableId: string, classId: string, options?: ApiOptions): Promise<TimetableSlot[]> {
    return apiClient.get<TimetableSlot[]>(`/api/timetables/${timetableId}/slots/${classId}`, options)
  },
}