import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { Upload, Plus, Edit, Trash2, Save, Loader2, GripVertical } from "lucide-react"
import { schoolApi, teacherApi, subjectApi, classroomApi, conditionsApi, type SchoolSettings, type Teacher, type Subject, type Classroom } from "../lib/api"
import { useAuth } from "../hooks/use-auth"
import { useToast } from "../hooks/use-toast"

interface SortableRowProps {
  id: string
  children: React.ReactNode
}

function SortableRow({ id, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "bg-gray-50" : ""}
    >
      <TableCell className="w-8">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      </TableCell>
      {children}
    </TableRow>
  )
}

export function DataRegistration() {
  const { token } = useAuth()
  const { toast } = useToast()
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false)
  const [isTeachersLoading, setIsTeachersLoading] = useState(true)
  const [isTeachersSaving, setIsTeachersSaving] = useState(false)
  
  // 教師フォーム用のstate
  const [teacherFormData, setTeacherFormData] = useState({
    name: "",
    subjects: [] as string[],
    grades: [] as string[]
  })
  const [newSubject, setNewSubject] = useState("")
  const [newGrade, setNewGrade] = useState("")

  // 教科情報用のstate
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(true)
  const [isSubjectsSaving, setIsSubjectsSaving] = useState(false)
  
  // 教科フォーム用のstate
  const [subjectFormData, setSubjectFormData] = useState({
    name: "",
    specialClassroom: "",
    weeklyLessons: 1,
    targetGrades: [] as number[]
  })

  // 教室情報用のstate
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [isClassroomsLoading, setIsClassroomsLoading] = useState(true)
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null)
  const [isClassroomDialogOpen, setIsClassroomDialogOpen] = useState(false)
  const [isClassroomsSaving, setIsClassroomsSaving] = useState(false)
  
  // 教室フォーム用のstate
  const [classroomFormData, setClassroomFormData] = useState({
    name: "",
    type: "",
    count: 1
  })

  // 条件設定用のstate
  const [conditions, setConditions] = useState("")
  const [isConditionsLoading, setIsConditionsLoading] = useState(true)
  const [isConditionsSaving, setIsConditionsSaving] = useState(false)

  const [classSettings, setClassSettings] = useState<SchoolSettings>({
    grade1Classes: 0,
    grade2Classes: 0,
    grade3Classes: 0,
    dailyPeriods: 0,
    saturdayPeriods: 0,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showOfflineButton, setShowOfflineButton] = useState(false)
  const [hasShownTimeoutError, setHasShownTimeoutError] = useState(false)

  // Helper function to format target grades for display
  const formatGrades = (targetGrades?: number[]) => {
    if (!targetGrades || targetGrades.length === 0) {
      return "全学年"
    }
    return targetGrades.map(grade => `${grade}年`).join(", ")
  }

  // Validation function for subject data
  const validateSubject = (subject: typeof subjectFormData) => {
    const errors = []
    
    if (!subject.name || !subject.name.trim()) {
      errors.push("教科名を入力してください")
    }
    
    if (subject.weeklyLessons < 1 || subject.weeklyLessons > 10) {
      errors.push("週の授業数は1から10の範囲で入力してください")
    }
    
    if (subject.targetGrades && Array.isArray(subject.targetGrades)) {
      const validGrades = [1, 2, 3]
      const invalidGrades = subject.targetGrades.filter(
        (grade: number) => !validGrades.includes(grade)
      )
      if (invalidGrades.length > 0) {
        errors.push("対象学年は1、2、3のいずれかを指定してください")
      }
    }
    
    return errors
  }

  // 学校設定を読み込み
  useEffect(() => {
    const loadSettings = async () => {
      console.log('loadSettings called, token:', !!token)
      
      if (!token) {
        console.log('No token available, skipping API call')
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      setShowOfflineButton(false)
      
      // 5秒後にオフラインボタンを表示
      const offlineButtonTimer = setTimeout(() => {
        setShowOfflineButton(true)
      }, 5000)
      
      // 10秒のタイムアウトを設定（一度だけ実行）
      const timeoutId = setTimeout(() => {
        console.warn('API call timeout after 10 seconds')
        setIsLoading(false)
        setShowOfflineButton(false)
        if (!hasShownTimeoutError) {
          setHasShownTimeoutError(true)
          toast({
            title: "接続タイムアウト",
            description: "デフォルト設定を使用します",
            variant: "destructive",
          })
        }
      }, 10000)
      
      try {
        console.log('Calling schoolApi.getSettings...')
        console.log('API Base URL:', 'https://school-timetable-backend.grundhunter.workers.dev')
        console.log('Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'null')
        
        const settings = await Promise.race([
          schoolApi.getSettings({ token }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 8000)
          )
        ]) as any
        
        clearTimeout(timeoutId)
        clearTimeout(offlineButtonTimer)
        setClassSettings(settings)
        console.log('Settings loaded successfully:', settings)
      } catch (error: any) {
        clearTimeout(timeoutId)
        clearTimeout(offlineButtonTimer)
        console.error('Failed to load settings:', error)
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
        
        let errorDescription = "デフォルト設定を使用します。"
        if (error.message.includes('timeout')) {
          errorDescription += " バックエンドAPIがタイムアウトしました。"
        } else if (error.message.includes('500')) {
          errorDescription += " バックエンドAPIが500エラーを返しました。"
        } else if (error.message.includes('CORS')) {
          errorDescription += " CORS設定に問題があります。"
        } else {
          errorDescription += ` エラー: ${error.message}`
        }
        
        if (!hasShownTimeoutError) {
          setHasShownTimeoutError(true)
          toast({
            title: "設定読み込みエラー",
            description: errorDescription,
            variant: "destructive",
          })
        }
        
        // エラー時はデフォルト値を設定
        setClassSettings({
          grade1Classes: 4,
          grade2Classes: 4,
          grade3Classes: 3,
          dailyPeriods: 6,
          saturdayPeriods: 4,
        })
      } finally {
        setIsLoading(false)
        setShowOfflineButton(false)
      }
    }

    loadSettings()
  }, [token])

  // 教師情報を読み込み
  useEffect(() => {
    const loadTeachers = async () => {
      if (!token) {
        setIsTeachersLoading(false)
        return
      }
      
      setIsTeachersLoading(true)
      
      try {
        const teachersData = await teacherApi.getTeachers({ token })
        // Sort by order field, then by name if no order
        const sortedTeachers = teachersData.sort((a, b) => {
          if (a.order != null && b.order != null) {
            return a.order - b.order
          }
          if (a.order != null) return -1
          if (b.order != null) return 1
          return a.name.localeCompare(b.name)
        })
        setTeachers(sortedTeachers)
      } catch (error) {
        console.error('Error loading teachers:', error)
        toast({
          title: "教師情報の読み込みエラー",
          description: "教師情報の読み込みに失敗しました",
          variant: "destructive",
        })
      } finally {
        setIsTeachersLoading(false)
      }
    }

    loadTeachers()
  }, [token])

  // 教科情報を読み込み
  useEffect(() => {
    const loadSubjects = async () => {
      if (!token) {
        setIsSubjectsLoading(false)
        return
      }
      
      setIsSubjectsLoading(true)
      
      try {
        const subjectsData = await subjectApi.getSubjects({ token })
        // Sort by order field, then by name if no order
        // Also ensure targetGrades field exists
        const sortedSubjects = subjectsData.map(subject => ({
          ...subject,
          targetGrades: subject.targetGrades || []
        })).sort((a, b) => {
          if (a.order != null && b.order != null) {
            return a.order - b.order
          }
          if (a.order != null) return -1
          if (b.order != null) return 1
          return a.name.localeCompare(b.name)
        })
        console.log("読み込んだ教科データ:", sortedSubjects)
        setSubjects(sortedSubjects)
      } catch (error) {
        console.error('Error loading subjects:', error)
        toast({
          title: "教科情報の読み込みエラー",
          description: "教科情報の読み込みに失敗しました",
          variant: "destructive",
        })
      } finally {
        setIsSubjectsLoading(false)
      }
    }

    loadSubjects()
  }, [token])

  // 教室情報を読み込み
  useEffect(() => {
    const loadClassrooms = async () => {
      if (!token) {
        setIsClassroomsLoading(false)
        return
      }
      
      setIsClassroomsLoading(true)
      
      try {
        const classroomsData = await classroomApi.getClassrooms({ token })
        // Sort by order field, then by name if no order
        const sortedClassrooms = classroomsData.sort((a, b) => {
          if (a.order != null && b.order != null) {
            return a.order - b.order
          }
          if (a.order != null) return -1
          if (b.order != null) return 1
          return a.name.localeCompare(b.name)
        })
        setClassrooms(sortedClassrooms)
      } catch (error) {
        console.error('Error loading classrooms:', error)
        // 教室データの読み込みエラーは重要ではないので、無視してフォールバック
      } finally {
        setIsClassroomsLoading(false)
      }
    }

    loadClassrooms()
  }, [token])

  // 条件設定を読み込み
  useEffect(() => {
    const loadConditions = async () => {
      if (!token) {
        setIsConditionsLoading(false)
        return
      }
      
      setIsConditionsLoading(true)
      
      try {
        const conditionsData = await conditionsApi.getConditions({ token })
        setConditions(conditionsData.conditions)
      } catch (error) {
        console.error('Error loading conditions:', error)
        // 条件設定の読み込みエラーは無視して空文字列で継続
        setConditions("")
      } finally {
        setIsConditionsLoading(false)
      }
    }

    loadConditions()
  }, [token])

  // 学校設定を保存
  const handleSaveSettings = async () => {
    if (!token) {
      toast({
        title: "認証エラー",
        description: "ログインが必要です",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const updatedSettings = await schoolApi.updateSettings(classSettings, { token })
      setClassSettings(updatedSettings)
      toast({
        title: "保存完了",
        description: "学校設定が正常に保存されました",
      })
      
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: "保存エラー",
        description: "設定の保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 教師情報のCRUD機能
  const handleAddTeacher = () => {
    setEditingTeacher(null)
    setTeacherFormData({ name: "", subjects: [], grades: [] })
    setIsTeacherDialogOpen(true)
  }

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setTeacherFormData({
      name: teacher.name,
      subjects: [...teacher.subjects],
      grades: [...teacher.grades]
    })
    setIsTeacherDialogOpen(true)
  }

  const handleDeleteTeacher = async (id: string) => {
    if (!token) return
    
    try {
      await teacherApi.deleteTeacher(id, { token })
      setTeachers(teachers.filter(t => t.id !== id))
      toast({
        title: "削除完了",
        description: "教師情報を削除しました",
      })
    } catch (error) {
      toast({
        title: "削除エラー",
        description: "教師情報の削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleSaveTeacher = async () => {
    if (!token || !teacherFormData.name.trim()) return
    
    try {
      if (editingTeacher?.id) {
        // 更新
        const updatedTeacher = await teacherApi.updateTeacher(editingTeacher.id, teacherFormData, { token })
        setTeachers(teachers.map(t => t.id === editingTeacher.id ? updatedTeacher : t))
        toast({
          title: "更新完了",
          description: "教師情報を更新しました",
        })
      } else {
        // 新規作成
        const newTeacher = await teacherApi.createTeacher(teacherFormData, { token })
        setTeachers([...teachers, newTeacher])
        toast({
          title: "追加完了",
          description: "教師情報を追加しました",
        })
      }
      setIsTeacherDialogOpen(false)
      setEditingTeacher(null)
      setTeacherFormData({ name: "", subjects: [], grades: [] })
    } catch (error) {
      toast({
        title: "保存エラー",
        description: "教師情報の保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  // フォーム操作関数
  const handleAddSubjectToTeacher = () => {
    if (newSubject.trim() && !teacherFormData.subjects.includes(newSubject.trim())) {
      setTeacherFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject.trim()]
      }))
      setNewSubject("")
    }
  }

  const handleRemoveSubject = (subject: string) => {
    setTeacherFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject)
    }))
  }

  const handleAddGrade = () => {
    if (newGrade && !teacherFormData.grades.includes(newGrade)) {
      setTeacherFormData(prev => ({
        ...prev,
        grades: [...prev.grades, newGrade]
      }))
      setNewGrade("")
    }
  }

  const handleRemoveGrade = (grade: string) => {
    setTeacherFormData(prev => ({
      ...prev,
      grades: prev.grades.filter(g => g !== grade)
    }))
  }

  const handleSaveAllTeachers = async () => {
    if (!token) return
    
    setIsTeachersSaving(true)
    try {
      await teacherApi.saveTeachers(teachers, { token })
      toast({
        title: "保存完了",
        description: "全ての教師情報を保存しました",
      })
    } catch (error) {
      toast({
        title: "保存エラー",
        description: "教師情報の保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsTeachersSaving(false)
    }
  }

  // 教科情報のCRUD機能
  const handleAddSubject = () => {
    setEditingSubject(null)
    setSubjectFormData({ name: "", specialClassroom: "", weeklyLessons: 1, targetGrades: [] })
    setIsSubjectDialogOpen(true)
  }

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject)
    setSubjectFormData({
      name: subject.name,
      specialClassroom: subject.specialClassroom || "",
      weeklyLessons: subject.weeklyLessons || 1,
      targetGrades: subject.targetGrades || []
    })
    setIsSubjectDialogOpen(true)
  }

  const handleDeleteSubject = async (id: string) => {
    if (!token) return
    
    try {
      await subjectApi.deleteSubject(id, { token })
      setSubjects(subjects.filter(s => s.id !== id))
      toast({
        title: "削除完了",
        description: "教科情報を削除しました",
      })
    } catch (error) {
      toast({
        title: "削除エラー",
        description: "教科情報の削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleSaveSubject = async () => {
    if (!token) return
    
    // Validate subject data
    const validationErrors = validateSubject(subjectFormData)
    if (validationErrors.length > 0) {
      toast({
        title: "入力エラー",
        description: validationErrors.join("\n"),
        variant: "destructive",
      })
      return
    }
    
    try {
      // Prepare data for API - normalize targetGrades
      const apiData = {
        ...subjectFormData,
        // Send empty targetGrades as empty array, not undefined
        targetGrades: subjectFormData.targetGrades.length > 0 ? subjectFormData.targetGrades : []
      }
      
      console.log("送信する教科データ:", apiData)
      
      if (editingSubject?.id) {
        // 更新
        const updatedSubject = await subjectApi.updateSubject(editingSubject.id, apiData, { token })
        setSubjects(subjects.map(s => s.id === editingSubject.id ? updatedSubject : s))
        toast({
          title: "更新完了",
          description: "教科情報を更新しました",
        })
      } else {
        // 新規作成
        const newSubject = await subjectApi.createSubject(apiData, { token })
        setSubjects([...subjects, newSubject])
        toast({
          title: "追加完了",
          description: "教科情報を追加しました",
        })
      }
      setIsSubjectDialogOpen(false)
      setEditingSubject(null)
      setSubjectFormData({ name: "", specialClassroom: "", weeklyLessons: 1, targetGrades: [] })
    } catch (error) {
      console.error("教科保存エラー:", error)
      toast({
        title: "保存エラー",
        description: "教科情報の保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleSaveAllSubjects = async () => {
    if (!token) return
    
    setIsSubjectsSaving(true)
    try {
      // Normalize all subjects data before sending
      const normalizedSubjects = subjects.map(subject => ({
        ...subject,
        targetGrades: subject.targetGrades || []
      }))
      
      console.log("一括保存する教科データ:", normalizedSubjects)
      
      await subjectApi.saveSubjects(normalizedSubjects, { token })
      toast({
        title: "保存完了",
        description: "全ての教科情報を保存しました",
      })
    } catch (error) {
      console.error("教科一括保存エラー:", error)
      toast({
        title: "保存エラー",
        description: "教科情報の保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSubjectsSaving(false)
    }
  }

  // 教室情報のCRUD機能
  const handleAddClassroom = () => {
    setEditingClassroom(null)
    setClassroomFormData({ name: "", type: "", count: 1 })
    setIsClassroomDialogOpen(true)
  }

  const handleEditClassroom = (classroom: Classroom) => {
    setEditingClassroom(classroom)
    setClassroomFormData({
      name: classroom.name,
      type: classroom.type,
      count: classroom.count
    })
    setIsClassroomDialogOpen(true)
  }

  const handleDeleteClassroom = async (id: string) => {
    if (!token) return
    
    try {
      await classroomApi.deleteClassroom(id, { token })
      setClassrooms(classrooms.filter(c => c.id !== id))
      toast({
        title: "削除完了",
        description: "教室情報を削除しました",
      })
    } catch (error) {
      toast({
        title: "削除エラー",
        description: "教室情報の削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleSaveClassroom = async () => {
    if (!token || !classroomFormData.name.trim()) return
    
    try {
      if (editingClassroom?.id) {
        // 更新
        const updatedClassroom = await classroomApi.updateClassroom(editingClassroom.id, classroomFormData, { token })
        setClassrooms(classrooms.map(c => c.id === editingClassroom.id ? updatedClassroom : c))
        toast({
          title: "更新完了",
          description: "教室情報を更新しました",
        })
      } else {
        // 新規作成
        const newClassroom = await classroomApi.createClassroom(classroomFormData, { token })
        setClassrooms([...classrooms, newClassroom])
        toast({
          title: "追加完了",
          description: "教室情報を追加しました",
        })
      }
      setIsClassroomDialogOpen(false)
      setEditingClassroom(null)
      setClassroomFormData({ name: "", type: "", count: 1 })
    } catch (error) {
      toast({
        title: "保存エラー",
        description: "教室情報の保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleSaveAllClassrooms = async () => {
    if (!token) return
    
    setIsClassroomsSaving(true)
    try {
      await classroomApi.saveClassrooms(classrooms, { token })
      toast({
        title: "保存完了",
        description: "全ての教室情報を保存しました",
      })
    } catch (error) {
      toast({
        title: "保存エラー",
        description: "教室情報の保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsClassroomsSaving(false)
    }
  }

  // 条件設定の保存機能
  const handleSaveConditions = async () => {
    if (!token) {
      toast({
        title: "認証エラー",
        description: "ログインが必要です",
        variant: "destructive",
      })
      return
    }

    setIsConditionsSaving(true)
    try {
      await conditionsApi.saveConditions({ conditions }, { token })
      toast({
        title: "保存完了",
        description: "条件設定を保存しました",
      })
    } catch (error) {
      toast({
        title: "保存エラー",
        description: "条件設定の保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsConditionsSaving(false)
    }
  }

  // Drag and drop handlers
  const handleTeacherDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setTeachers((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update order fields and save to backend
        const itemsWithOrder = newItems.map((item, index) => ({
          ...item,
          order: index,
        }))
        
        // Save order changes to backend
        if (token) {
          teacherApi.saveTeachers(itemsWithOrder, { token }).catch((error) => {
            console.error('Failed to save teacher order:', error)
            toast({
              title: "順序保存エラー",
              description: "教師の順序保存に失敗しました",
              variant: "destructive",
            })
          })
        }
        
        return itemsWithOrder
      })
    }
  }

  const handleSubjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setSubjects((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update order fields and save to backend
        const itemsWithOrder = newItems.map((item, index) => ({
          ...item,
          order: index,
          targetGrades: item.targetGrades || [] // Ensure targetGrades field exists
        }))
        
        // Save order changes to backend
        if (token) {
          subjectApi.saveSubjects(itemsWithOrder, { token }).catch((error) => {
            console.error('Failed to save subject order:', error)
            toast({
              title: "順序保存エラー",
              description: "教科の順序保存に失敗しました",
              variant: "destructive",
            })
          })
        }
        
        return itemsWithOrder
      })
    }
  }

  const handleClassroomDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setClassrooms((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update order fields and save to backend
        const itemsWithOrder = newItems.map((item, index) => ({
          ...item,
          order: index,
        }))
        
        // Save order changes to backend
        if (token) {
          classroomApi.saveClassrooms(itemsWithOrder, { token }).catch((error) => {
            console.error('Failed to save classroom order:', error)
            toast({
              title: "順序保存エラー",
              description: "教室の順序保存に失敗しました",
              variant: "destructive",
            })
          })
        }
        
        return itemsWithOrder
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">データ登録</h1>
          <p className="text-muted-foreground mt-2">学校の基本データを登録・管理します</p>
        </div>
        <Button className="flex items-center space-x-2">
          <Upload className="w-4 h-4" />
          <span>Excelから一括登録</span>
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">基本設定</TabsTrigger>
          <TabsTrigger value="teachers">教師情報</TabsTrigger>
          <TabsTrigger value="subjects">教科情報</TabsTrigger>
          <TabsTrigger value="rooms">教室情報</TabsTrigger>
          <TabsTrigger value="conditions">条件設定</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>クラス数・授業時間設定</CardTitle>
              <CardDescription>各学年のクラス数と授業時間を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* オフラインモード（長時間読み込み時のフォールバック） */}
              {isLoading && showOfflineButton && (
                <div className="p-3 bg-gray-100 rounded text-sm">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setIsLoading(false)
                      setShowOfflineButton(false)
                      toast({
                        title: "オフラインモード",
                        description: "手動入力モードに切り替えました",
                      })
                    }}
                  >
                    オフラインモードで続行
                  </Button>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="grade1">1年生クラス数</Label>
                  <Input
                    id="grade1"
                    type="number"
                    value={isLoading ? "" : classSettings.grade1Classes}
                    placeholder={isLoading ? "読み込み中..." : "クラス数を入力"}
                    onChange={(e) => setClassSettings((prev) => ({ ...prev, grade1Classes: Number.parseInt(e.target.value) || 0 }))}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="grade2">2年生クラス数</Label>
                  <Input
                    id="grade2"
                    type="number"
                    value={isLoading ? "" : classSettings.grade2Classes}
                    placeholder={isLoading ? "読み込み中..." : "クラス数を入力"}
                    onChange={(e) => setClassSettings((prev) => ({ ...prev, grade2Classes: Number.parseInt(e.target.value) || 0 }))}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="grade3">3年生クラス数</Label>
                  <Input
                    id="grade3"
                    type="number"
                    value={isLoading ? "" : classSettings.grade3Classes}
                    placeholder={isLoading ? "読み込み中..." : "クラス数を入力"}
                    onChange={(e) => setClassSettings((prev) => ({ ...prev, grade3Classes: Number.parseInt(e.target.value) || 0 }))}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="daily">1日の授業数</Label>
                  <Input
                    id="daily"
                    type="number"
                    value={isLoading ? "" : classSettings.dailyPeriods}
                    placeholder={isLoading ? "読み込み中..." : "授業数を入力"}
                    onChange={(e) =>
                      setClassSettings((prev) => ({ ...prev, dailyPeriods: Number.parseInt(e.target.value) || 0 }))
                    }
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="saturday">土曜の授業数</Label>
                  <Input
                    id="saturday"
                    type="number"
                    value={isLoading ? "" : classSettings.saturdayPeriods}
                    placeholder={isLoading ? "読み込み中..." : "授業数を入力"}
                    onChange={(e) =>
                      setClassSettings((prev) => ({ ...prev, saturdayPeriods: Number.parseInt(e.target.value) || 0 }))
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleSaveSettings}
                disabled={isLoading || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSaving ? "保存中..." : "設定を保存"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>教師情報管理</CardTitle>
                <CardDescription>教師の担当科目と学年を管理します</CardDescription>
              </div>
              <Button onClick={handleAddTeacher} disabled={isTeachersLoading}>
                <Plus className="w-4 h-4 mr-2" />
                教師を追加
              </Button>
            </CardHeader>
            <CardContent>
              {isTeachersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>読み込み中...</span>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleTeacherDragEnd}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>教師名</TableHead>
                        <TableHead>担当科目</TableHead>
                        <TableHead>担当学年</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            教師情報が登録されていません
                          </TableCell>
                        </TableRow>
                      ) : (
                        <SortableContext items={teachers.map(t => t.id || '')} strategy={verticalListSortingStrategy}>
                          {teachers.map((teacher) => (
                            <SortableRow key={teacher.id} id={teacher.id || ''}>
                              <TableCell className="font-medium">{teacher.name}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {teacher.subjects.map((subject, index) => (
                                    <Badge key={index} variant="secondary">
                                      {subject}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {teacher.grades.map((grade, index) => (
                                    <Badge key={index} variant="outline">
                                      {grade}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEditTeacher(teacher)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => teacher.id && handleDeleteTeacher(teacher.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </SortableRow>
                          ))}
                        </SortableContext>
                      )}
                    </TableBody>
                  </Table>
                </DndContext>
              )}
              
              <Button 
                className="w-full mt-6" 
                onClick={handleSaveAllTeachers}
                disabled={isTeachersLoading || isTeachersSaving}
              >
                {isTeachersSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isTeachersSaving ? "保存中..." : "教師情報を保存"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>教科情報管理</CardTitle>
                <CardDescription>教科名と専用教室の紐づけを管理します</CardDescription>
              </div>
              <Button onClick={handleAddSubject} disabled={isSubjectsLoading}>
                <Plus className="w-4 h-4 mr-2" />
                教科を追加
              </Button>
            </CardHeader>
            <CardContent>
              {isSubjectsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>読み込み中...</span>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSubjectDragEnd}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>教科名</TableHead>
                        <TableHead>対象学年</TableHead>
                        <TableHead>専用教室</TableHead>
                        <TableHead>1週間の授業数</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            教科情報が登録されていません
                          </TableCell>
                        </TableRow>
                      ) : (
                        <SortableContext items={subjects.map(s => s.id || '')} strategy={verticalListSortingStrategy}>
                          {subjects.map((subject) => (
                            <SortableRow key={subject.id} id={subject.id || ''}>
                              <TableCell className="font-medium">{subject.name}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{formatGrades(subject.targetGrades)}</Badge>
                              </TableCell>
                              <TableCell>
                                {subject.specialClassroom ? (
                                  <Badge variant="outline">{subject.specialClassroom}</Badge>
                                ) : (
                                  <span className="text-gray-400">なし</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-semibold">
                                  週{subject.weeklyLessons || 1}回
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEditSubject(subject)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => subject.id && handleDeleteSubject(subject.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </SortableRow>
                          ))}
                        </SortableContext>
                      )}
                    </TableBody>
                  </Table>
                </DndContext>
              )}
              
              <Button 
                className="w-full mt-6" 
                onClick={handleSaveAllSubjects}
                disabled={isSubjectsLoading || isSubjectsSaving}
              >
                {isSubjectsSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSubjectsSaving ? "保存中..." : "教科情報を保存"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>教室情報管理</CardTitle>
                <CardDescription>教室の種類と数を管理します</CardDescription>
              </div>
              <Button onClick={handleAddClassroom} disabled={isClassroomsLoading}>
                <Plus className="w-4 h-4 mr-2" />
                教室を追加
              </Button>
            </CardHeader>
            <CardContent>
              {isClassroomsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>読み込み中...</span>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleClassroomDragEnd}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>教室名</TableHead>
                        <TableHead>教室タイプ</TableHead>
                        <TableHead>数</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classrooms.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            教室情報が登録されていません
                          </TableCell>
                        </TableRow>
                      ) : (
                        <SortableContext items={classrooms.map(c => c.id || '')} strategy={verticalListSortingStrategy}>
                          {classrooms.map((classroom) => (
                            <SortableRow key={classroom.id} id={classroom.id || ''}>
                              <TableCell className="font-medium">{classroom.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{classroom.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{classroom.count}室</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEditClassroom(classroom)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => classroom.id && handleDeleteClassroom(classroom.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </SortableRow>
                          ))}
                        </SortableContext>
                      )}
                    </TableBody>
                  </Table>
                </DndContext>
              )}
              
              <Button 
                className="w-full mt-6" 
                onClick={handleSaveAllClassrooms}
                disabled={isClassroomsLoading || isClassroomsSaving}
              >
                {isClassroomsSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isClassroomsSaving ? "保存中..." : "教室情報を保存"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>任意条件設定</CardTitle>
              <CardDescription>時間割生成時の特別な条件を設定します</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder={isConditionsLoading ? "読み込み中..." : "例：体育は午後に配置、数学は1時間目を避ける..."} 
                rows={6}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                disabled={isConditionsLoading}
              />
              
              <Button 
                className="w-full mt-6"
                onClick={handleSaveConditions}
                disabled={isConditionsLoading || isConditionsSaving}
              >
                {isConditionsSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isConditionsSaving ? "保存中..." : "条件設定を保存"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 教師編集ダイアログ */}
      <Dialog open={isTeacherDialogOpen} onOpenChange={setIsTeacherDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTeacher ? "教師情報を編集" : "新しい教師を追加"}
            </DialogTitle>
            <DialogDescription>
              教師の基本情報と担当科目・学年を設定してください
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 教師名 */}
            <div>
              <Label htmlFor="teacher-name">教師名</Label>
              <Input
                id="teacher-name"
                value={teacherFormData.name}
                onChange={(e) => setTeacherFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="教師名を入力"
              />
            </div>

            {/* 担当科目 */}
            <div>
              <Label>担当科目</Label>
              <div className="flex gap-2 mb-2">
                {subjects.length > 0 ? (
                  <Select value={newSubject} onValueChange={setNewSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="教科を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.filter(s => !teacherFormData.subjects.includes(s.name)).map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                          {subject.specialClassroom && (
                            <span className="text-gray-500 ml-1">({subject.specialClassroom})</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="科目名を入力"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubjectToTeacher()}
                  />
                )}
                <Button onClick={handleAddSubjectToTeacher} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {teacherFormData.subjects.map((subject, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer">
                    {subject}
                    <button
                      onClick={() => handleRemoveSubject(subject)}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* 担当学年 */}
            <div>
              <Label>担当学年</Label>
              <div className="flex gap-2 mb-2">
                <Select value={newGrade} onValueChange={setNewGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="学年を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1年">1年</SelectItem>
                    <SelectItem value="2年">2年</SelectItem>
                    <SelectItem value="3年">3年</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddGrade} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {teacherFormData.grades.map((grade, index) => (
                  <Badge key={index} variant="outline" className="cursor-pointer">
                    {grade}
                    <button
                      onClick={() => handleRemoveGrade(grade)}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsTeacherDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleSaveTeacher}
              disabled={!teacherFormData.name.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingTeacher ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 教科編集ダイアログ */}
      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "教科情報を編集" : "新しい教科を追加"}
            </DialogTitle>
            <DialogDescription>
              教科名、対象学年、専用教室、1週間の授業数を設定してください
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 教科名 */}
            <div>
              <Label htmlFor="subject-name">教科名</Label>
              <Input
                id="subject-name"
                value={subjectFormData.name}
                onChange={(e) => setSubjectFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="教科名を入力"
              />
            </div>

            {/* 対象学年 */}
            <div>
              <Label>対象学年</Label>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="grade-1"
                    checked={subjectFormData.targetGrades.includes(1)}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSubjectFormData(prev => ({
                          ...prev,
                          targetGrades: [...prev.targetGrades, 1].sort()
                        }))
                      } else {
                        setSubjectFormData(prev => ({
                          ...prev,
                          targetGrades: prev.targetGrades.filter(g => g !== 1)
                        }))
                      }
                    }}
                  />
                  <Label htmlFor="grade-1">1年生</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="grade-2"
                    checked={subjectFormData.targetGrades.includes(2)}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSubjectFormData(prev => ({
                          ...prev,
                          targetGrades: [...prev.targetGrades, 2].sort()
                        }))
                      } else {
                        setSubjectFormData(prev => ({
                          ...prev,
                          targetGrades: prev.targetGrades.filter(g => g !== 2)
                        }))
                      }
                    }}
                  />
                  <Label htmlFor="grade-2">2年生</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="grade-3"
                    checked={subjectFormData.targetGrades.includes(3)}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setSubjectFormData(prev => ({
                          ...prev,
                          targetGrades: [...prev.targetGrades, 3].sort()
                        }))
                      } else {
                        setSubjectFormData(prev => ({
                          ...prev,
                          targetGrades: prev.targetGrades.filter(g => g !== 3)
                        }))
                      }
                    }}
                  />
                  <Label htmlFor="grade-3">3年生</Label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  選択しない場合は全学年が対象となります
                </p>
              </div>
            </div>

            {/* 専用教室 */}
            <div>
              <Label htmlFor="special-classroom">専用教室（任意）</Label>
              {classrooms.length > 0 && !isClassroomsLoading ? (
                <Select 
                  value={subjectFormData.specialClassroom || "none"} 
                  onValueChange={(value) => setSubjectFormData(prev => ({ 
                    ...prev, 
                    specialClassroom: value === "none" ? "" : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="教室を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">選択なし</SelectItem>
                    {classrooms.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.name}>
                        {classroom.name}
                        {classroom.type && (
                          <span className="text-gray-500 ml-1">({classroom.type})</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="special-classroom"
                  value={subjectFormData.specialClassroom}
                  onChange={(e) => setSubjectFormData(prev => ({ ...prev, specialClassroom: e.target.value }))}
                  placeholder={isClassroomsLoading ? "教室情報を読み込み中..." : "例：理科室、音楽室、体育館"}
                  disabled={isClassroomsLoading}
                />
              )}
            </div>

            {/* 1週間の授業数 */}
            <div>
              <Label htmlFor="weekly-lessons">1週間の授業数</Label>
              <Input
                id="weekly-lessons"
                type="number"
                min="1"
                max="10"
                value={subjectFormData.weeklyLessons}
                onChange={(e) => setSubjectFormData(prev => ({ ...prev, weeklyLessons: Number.parseInt(e.target.value) || 1 }))}
                placeholder="週に何回授業を行うか"
              />
              <p className="text-xs text-muted-foreground mt-1">
                例：数学=6回、英語=4回、音楽=1回、体育=3回
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSubjectDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleSaveSubject}
              disabled={validateSubject(subjectFormData).length > 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingSubject ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 教室編集ダイアログ */}
      <Dialog open={isClassroomDialogOpen} onOpenChange={setIsClassroomDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingClassroom ? "教室情報を編集" : "新しい教室を追加"}
            </DialogTitle>
            <DialogDescription>
              教室名、タイプ、数を設定してください
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 教室名 */}
            <div>
              <Label htmlFor="classroom-name">教室名</Label>
              <Input
                id="classroom-name"
                value={classroomFormData.name}
                onChange={(e) => setClassroomFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例：理科室、音楽室、体育館"
              />
            </div>

            {/* 教室タイプ */}
            <div>
              <Label htmlFor="classroom-type">教室タイプ</Label>
              <Select 
                value={classroomFormData.type} 
                onValueChange={(value) => setClassroomFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="タイプを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="特別教室">特別教室</SelectItem>
                  <SelectItem value="普通教室">普通教室</SelectItem>
                  <SelectItem value="実験室">実験室</SelectItem>
                  <SelectItem value="実習室">実習室</SelectItem>
                  <SelectItem value="体育施設">体育施設</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 教室数 */}
            <div>
              <Label htmlFor="classroom-count">教室数</Label>
              <Input
                id="classroom-count"
                type="number"
                min="1"
                value={classroomFormData.count}
                onChange={(e) => setClassroomFormData(prev => ({ ...prev, count: Number.parseInt(e.target.value) || 1 }))}
                placeholder="教室の数"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsClassroomDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleSaveClassroom}
              disabled={!classroomFormData.name.trim() || !classroomFormData.type}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingClassroom ? "更新" : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}