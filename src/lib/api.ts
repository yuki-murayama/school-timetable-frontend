/**
 * APIクライアント設定
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://school-timetable-backend.grundhunter.workers.dev'

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
  options?: Record<string, any>
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
  order?: number
}

export interface Subject {
  id?: string
  name: string
  specialClassroom?: string
  weeklyLessons: number
  targetGrades?: number[]
  order?: number
}

export interface Classroom {
  id?: string
  name: string
  type: string
  count: number
  order?: number
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

export interface SchoolConditions {
  conditions: string
}

export const conditionsApi = {
  async getConditions(options?: ApiOptions): Promise<SchoolConditions> {
    return apiClient.get<SchoolConditions>('/api/frontend/school/conditions', options)
  },

  async saveConditions(conditions: SchoolConditions, options?: ApiOptions): Promise<SchoolConditions> {
    return apiClient.put<SchoolConditions>('/api/frontend/school/conditions', conditions, options)
  },
}

// 時間割生成関連の型定義
export interface TimetableClass {
  grade: number
  class: number
  subject: string
  teacher: string
  classroom: string
}

export interface TimetablePeriod {
  period: number
  classes: TimetableClass[]
}

export interface GeneratedTimetable {
  monday: TimetablePeriod[]
  tuesday: TimetablePeriod[]
  wednesday: TimetablePeriod[]
  thursday: TimetablePeriod[]
  friday: TimetablePeriod[]
  saturday: TimetablePeriod[]
}

export interface TimetableData {
  id: string
  timetable: GeneratedTimetable
  createdAt: string
}

export interface TimetableMetadata {
  generatedAt: string
  dataUsed: {
    teachersCount: number
    subjectsCount: number
    classroomsCount: number
  }
}

export interface TimetableGenerationResponse {
  timetable: TimetableData
  metadata: TimetableMetadata
}

// 時間割参照用の型定義
export interface TimetableListItem {
  id: string
  name: string
  createdAt: string
  status: 'active' | 'draft'
}

export interface TimetableDetail {
  id: string
  name: string
  createdAt: string
  status: 'active' | 'draft'
  timetable: {
    timetable?: GeneratedTimetable
  } & GeneratedTimetable
}

export interface TeacherSchedule {
  teacherName: string
  timetableId: string
  schedule: {
    monday: Array<{
      period: number
      grade: number
      class: number
      subject: string
      classroom: string
    }>
    tuesday: Array<{
      period: number
      grade: number
      class: number
      subject: string
      classroom: string
    }>
    wednesday: Array<{
      period: number
      grade: number
      class: number
      subject: string
      classroom: string
    }>
    thursday: Array<{
      period: number
      grade: number
      class: number
      subject: string
      classroom: string
    }>
    friday: Array<{
      period: number
      grade: number
      class: number
      subject: string
      classroom: string
    }>
    saturday: Array<{
      period: number
      grade: number
      class: number
      subject: string
      classroom: string
    }>
  }
}

export interface TimetableUpdateRequest {
  name?: string
  status?: 'active' | 'draft'
  timetable?: GeneratedTimetable
}

// データ変換用ユーティリティ関数
export const timetableUtils = {
  // バックエンドの時間割データを表示用の形式に変換
  convertToDisplayFormat(timetableData: GeneratedTimetable, grade: number, classNum: number) {
    console.log("convertToDisplayFormat開始:", {
      grade: grade,
      classNum: classNum,
      timetableDataType: typeof timetableData,
      timetableDataKeys: timetableData ? Object.keys(timetableData) : null,
      mondayExists: !!timetableData?.monday,
      mondayLength: timetableData?.monday?.length
    })
    
    const displayData = []
    
    // 安全性チェック
    if (!timetableData || typeof timetableData !== 'object') {
      console.log("時間割データが無効です")
      return []
    }
    
    const maxPeriods = Math.max(
      timetableData.monday?.length || 0,
      timetableData.tuesday?.length || 0,
      timetableData.wednesday?.length || 0,
      timetableData.thursday?.length || 0,
      timetableData.friday?.length || 0,
      timetableData.saturday?.length || 0
    )

    for (let period = 1; period <= Math.max(maxPeriods, 6); period++) {
      const rowData: any = {
        period: period.toString(),
        mon: null,
        tue: null,
        wed: null,
        thu: null,
        fri: null,
        sat: null,
      }

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
      const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

      days.forEach((day, index) => {
        const dayData = timetableData[day] || []
        const periodData = dayData.find((p: any) => Number(p.period) === Number(period))
        
        if (period === 1 && day === 'monday') {
          console.log(`${day}曜日${period}時限のデータ検索:`, {
            dayData: dayData,
            periodData: periodData,
            searchingForPeriod: period,
            foundPeriod: periodData?.period,
            classesCount: periodData?.classes?.length
          })
        }
        
        if (periodData && periodData.classes) {
          const classData = periodData.classes.find((c: any) => 
            Number(c.grade) === Number(grade) && Number(c.class) === Number(classNum)
          )
          
          if (period === 1 && day === 'monday') {
            console.log(`${day}曜日${period}時限のクラスデータ検索:`, {
              searchingForGrade: grade,
              searchingForClass: classNum,
              allClasses: periodData.classes,
              foundClassData: classData
            })
          }
          
          if (classData) {
            rowData[dayKeys[index]] = {
              subject: classData.subject,
              teacher: classData.teacher,
            }
            
            if (period === 1 && day === 'monday') {
              console.log(`${day}曜日${period}時限に授業を設定:`, classData)
            }
          }
        }
      })

      displayData.push(rowData)
    }
    
    // 結果のサマリーを出力
    const nonEmptyRows = displayData.filter(row => 
      Object.values(row).some(cell => cell !== null && cell !== row.period)
    )
    
    console.log("変換結果サマリー:", {
      totalRows: displayData.length,
      nonEmptyRows: nonEmptyRows.length,
      maxPeriods: maxPeriods,
      sampleRow: displayData[0]
    })

    return displayData
  },

  // 表示用の形式をバックエンドの時間割データに変換
  convertToBackendFormat(displayData: any[], originalData: GeneratedTimetable, grade: number, classNum: number): GeneratedTimetable {
    const result = JSON.parse(JSON.stringify(originalData)) // Deep copy

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

    displayData.forEach((row) => {
      const period = parseInt(row.period)
      
      days.forEach((day, index) => {
        const dayKey = dayKeys[index]
        let periodData = result[day].find((p: any) => p.period === period)
        
        if (!periodData) {
          periodData = { period, classes: [] }
          result[day].push(periodData)
        }

        // 該当する学年・クラスのデータを更新
        const classIndex = periodData.classes.findIndex((c: any) => c.grade === grade && c.class === classNum)
        
        if (row[dayKey]) {
          const classData = {
            grade,
            class: classNum,
            subject: row[dayKey].subject,
            teacher: row[dayKey].teacher,
            classroom: `${grade}-${classNum}教室`, // デフォルト値
          }
          
          if (classIndex >= 0) {
            periodData.classes[classIndex] = classData
          } else {
            periodData.classes.push(classData)
          }
        } else {
          // データが削除された場合
          if (classIndex >= 0) {
            periodData.classes.splice(classIndex, 1)
          }
        }
      })
    })

    return result
  },
}

export const timetableApi = {
  async generateTimetable(request: TimetableGenerationRequest, options?: ApiOptions): Promise<TimetableGenerationResponse> {
    return apiClient.post<TimetableGenerationResponse>('/api/frontend/school/timetable/generate', request, options)
  },

  async getTimetables(options?: ApiOptions): Promise<TimetableListItem[]> {
    return apiClient.get<TimetableListItem[]>('/api/frontend/school/timetables', options)
  },

  async getTimetableDetail(timetableId: string, options?: ApiOptions): Promise<TimetableDetail> {
    return apiClient.get<TimetableDetail>(`/api/frontend/school/timetables/${timetableId}`, options)
  },

  async updateTimetable(timetableId: string, request: TimetableUpdateRequest, options?: ApiOptions): Promise<TimetableDetail> {
    return apiClient.put<TimetableDetail>(`/api/frontend/school/timetables/${timetableId}`, request, options)
  },

  async getTeacherSchedule(timetableId: string, teacherName: string, options?: ApiOptions): Promise<TeacherSchedule> {
    return apiClient.get<TeacherSchedule>(`/api/frontend/school/timetables/${timetableId}/teachers/${encodeURIComponent(teacherName)}`, options)
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

