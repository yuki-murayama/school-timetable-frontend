import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Input } from "./ui/input"
import { Calendar, Edit, Eye, ArrowLeft, User, Loader2 } from "lucide-react"
import { timetableApi, timetableUtils, type TimetableListItem, type TimetableDetail } from "../lib/api"
import { useToast } from "../hooks/use-toast"

interface TeacherSchedule {
  period: string
  mon: { grade: string; class: string; subject: string } | null
  tue: { grade: string; class: string; subject: string } | null
  wed: { grade: string; class: string; subject: string } | null
  thu: { grade: string; class: string; subject: string } | null
  fri: { grade: string; class: string; subject: string } | null
  sat: { grade: string; class: string; subject: string } | null
}

export function TimetableView() {
  const { toast } = useToast()
  
  const [currentView, setCurrentView] = useState<"list" | "detail" | "edit" | "teacher">("list")
  const [selectedTimetable, setSelectedTimetable] = useState<TimetableListItem | null>(null)
  const [selectedTimetableDetail, setSelectedTimetableDetail] = useState<TimetableDetail | null>(null)
  const [selectedGrade, setSelectedGrade] = useState("1")
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState("")
  const [draggedItem, setDraggedItem] = useState<{
    subject: string
    teacher: string
    period: string
    day: string
  } | null>(null)
  
  // API統合のためのローディング状態
  const [isLoadingTimetables, setIsLoadingTimetables] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // モックデータ（フォールバック用）
  const mockTimetableData = [
    {
      period: "1",
      mon: { subject: "数学", teacher: "田中" },
      tue: { subject: "英語", teacher: "佐藤" },
      wed: { subject: "理科", teacher: "鈴木" },
      thu: { subject: "国語", teacher: "高橋" },
      fri: { subject: "社会", teacher: "伊藤" },
      sat: { subject: "体育", teacher: "山田" },
    },
    {
      period: "2",
      mon: { subject: "英語", teacher: "佐藤" },
      tue: { subject: "数学", teacher: "田中" },
      wed: { subject: "国語", teacher: "高橋" },
      thu: { subject: "理科", teacher: "鈴木" },
      fri: { subject: "音楽", teacher: "渡辺" },
      sat: { subject: "美術", teacher: "中村" },
    },
    {
      period: "3",
      mon: { subject: "理科", teacher: "鈴木" },
      tue: { subject: "国語", teacher: "高橋" },
      wed: { subject: "数学", teacher: "田中" },
      thu: { subject: "英語", teacher: "佐藤" },
      fri: { subject: "体育", teacher: "山田" },
      sat: null,
    },
    {
      period: "4",
      mon: { subject: "国語", teacher: "高橋" },
      tue: { subject: "理科", teacher: "鈴木" },
      wed: { subject: "英語", teacher: "佐藤" },
      thu: { subject: "数学", teacher: "田中" },
      fri: { subject: "技術", teacher: "小林" },
      sat: null,
    },
    {
      period: "5",
      mon: { subject: "社会", teacher: "伊藤" },
      tue: { subject: "体育", teacher: "山田" },
      wed: { subject: "音楽", teacher: "渡辺" },
      thu: { subject: "美術", teacher: "中村" },
      fri: { subject: "家庭", teacher: "加藤" },
      sat: null,
    },
    {
      period: "6",
      mon: { subject: "体育", teacher: "山田" },
      tue: { subject: "社会", teacher: "伊藤" },
      wed: { subject: "家庭", teacher: "加藤" },
      thu: { subject: "技術", teacher: "小林" },
      fri: { subject: "道徳", teacher: "高橋" },
      sat: null,
    },
  ]

  const mockTimetables: TimetableListItem[] = [
    { id: "1", name: "2024年度 第1学期", createdAt: "2024-03-15", status: "active" },
    { id: "2", name: "2024年度 第2学期", createdAt: "2024-08-20", status: "draft" },
    { id: "3", name: "2024年度 第3学期", createdAt: "2024-12-10", status: "draft" },
  ]

  const [timetableData, setTimetableData] = useState(mockTimetableData)
  const [timetables, setTimetables] = useState<TimetableListItem[]>(mockTimetables)

  // API統合のロジック
  const loadTimetables = async () => {
    setIsLoadingTimetables(true)
    try {
      // 認証不要のため、tokenを削除
      const result = await timetableApi.getTimetables()
      setTimetables(result)
    } catch (error) {
      console.error("時間割一覧の取得に失敗しました:", error)
      // モックデータにフォールバック
      setTimetables(mockTimetables)
      toast({
        title: "注意",
        description: "サーバーからデータを取得できませんでした。デモデータを表示しています。",
        variant: "destructive",
      })
    } finally {
      setIsLoadingTimetables(false)
    }
  }

  const loadTimetableDetail = async (timetableId: string) => {
    setIsLoadingDetail(true)
    try {
      // 認証不要のため、tokenを削除
      const result = await timetableApi.getTimetableDetail(timetableId)
      setSelectedTimetableDetail(result)
      
      // 時間割データを表示用に変換（二重ネスト対応）
      const timetableData = result.timetable?.timetable || result.timetable
      
      // デバッグ情報を出力
      console.log("時間割詳細データ:", {
        rawResult: result,
        timetableData: timetableData,
        selectedGrade: selectedGrade,
        mondayData: timetableData?.monday,
        mondayLength: timetableData?.monday?.length
      })
      
      const displayData = timetableUtils.convertToDisplayFormat(
        timetableData, 
        parseInt(selectedGrade), 
        1
      )
      
      console.log("変換後の表示データ:", displayData)
      setTimetableData(displayData)
      
    } catch (error) {
      console.error("時間割詳細の取得に失敗しました:", error)
      // モックデータにフォールバック
      setTimetableData(mockTimetableData)
      toast({
        title: "注意",
        description: "サーバーから時間割データを取得できませんでした。デモデータを表示しています。",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // 初期化時に時間割一覧を取得
  useEffect(() => {
    loadTimetables()
  }, [])

  // 学年が変更された時に時間割データを更新
  useEffect(() => {
    if (selectedTimetableDetail) {
      // 時間割データを表示用に変換（二重ネスト対応）
      const timetableData = selectedTimetableDetail.timetable?.timetable || selectedTimetableDetail.timetable
      
      console.log("学年変更時のデータ変換:", {
        selectedGrade: selectedGrade,
        gradeAsNumber: parseInt(selectedGrade),
        timetableData: timetableData,
        mondayFirstPeriod: timetableData?.monday?.[0]
      })
      
      const displayData = timetableUtils.convertToDisplayFormat(
        timetableData, 
        parseInt(selectedGrade), 
        1
      )
      
      console.log("学年変更後の表示データ:", displayData)
      setTimetableData(displayData)
    }
  }, [selectedGrade, selectedTimetableDetail])

  // 教師ごとの時間割データを生成する関数
  const generateTeacherSchedule = (teacherName: string): TeacherSchedule[] => {
    const schedule: TeacherSchedule[] = []

    for (let period = 1; period <= 6; period++) {
      const periodData: TeacherSchedule = {
        period: period.toString(),
        mon: null,
        tue: null,
        wed: null,
        thu: null,
        fri: null,
        sat: null,
      }

      // 各曜日をチェックして、該当教師の授業を探す
      const days = ["mon", "tue", "wed", "thu", "fri", "sat"] as const
      days.forEach((day) => {
        const periodRow = timetableData.find((row) => row.period === period.toString())
        if (periodRow) {
          const cellData = periodRow[day] as { subject: string; teacher: string } | null
          if (cellData && cellData.teacher === teacherName) {
            // 現在は1年1組固定だが、実際は複数学年・クラスに対応
            periodData[day] = {
              grade: selectedGrade,
              class: "1",
              subject: cellData.subject,
            }
          }
        }
      })

      schedule.push(periodData)
    }

    return schedule
  }

  const handleDragStart = (e: React.DragEvent, subject: string, teacher: string, period: string, day: string) => {
    setDraggedItem({ subject, teacher, period, day })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetPeriod: string, targetDay: string) => {
    e.preventDefault()

    if (!draggedItem) return

    const newTimetableData = [...timetableData]

    // ドラッグ元とドロップ先のインデックスを取得
    const draggedPeriodIndex = newTimetableData.findIndex((row) => row.period === draggedItem.period)
    const targetPeriodIndex = newTimetableData.findIndex((row) => row.period === targetPeriod)

    if (draggedPeriodIndex === -1 || targetPeriodIndex === -1) return

    // ドラッグ元とドロップ先の値を取得
    const draggedValue = newTimetableData[draggedPeriodIndex][draggedItem.day as keyof (typeof newTimetableData)[0]]
    const targetValue = newTimetableData[targetPeriodIndex][targetDay as keyof (typeof newTimetableData)[0]]

    // 値を入れ替え
    newTimetableData[draggedPeriodIndex] = {
      ...newTimetableData[draggedPeriodIndex],
      [draggedItem.day]: targetValue,
    }

    newTimetableData[targetPeriodIndex] = {
      ...newTimetableData[targetPeriodIndex],
      [targetDay]: draggedValue,
    }

    setTimetableData(newTimetableData)
    setDraggedItem(null)
  }

  const handleTeacherClick = (teacherName: string) => {
    setSelectedTeacher(teacherName)
    setCurrentView("teacher")
  }

  const handleViewTimetable = (timetable: TimetableListItem) => {
    setSelectedTimetable(timetable)
    setCurrentView("detail")
    loadTimetableDetail(timetable.id)
  }

  const handleEditTimetable = () => {
    setCurrentView("edit")
    setTempTitle(selectedTimetable?.name || "")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedTimetable(null)
    setSelectedTeacher(null)
  }

  const handleBackToDetail = () => {
    setCurrentView("detail")
    setSelectedTeacher(null)
  }

  const handleTitleEdit = () => {
    setEditingTitle(true)
    setTempTitle(selectedTimetable?.name || "")
  }

  const handleTitleSave = async () => {
    if (!selectedTimetable || !tempTitle.trim()) {
      setEditingTitle(false)
      return
    }
    
    setIsSaving(true)
    try {
      // 認証不要のため、tokenを削除
      await timetableApi.updateTimetable(
        selectedTimetable.id,
        { name: tempTitle.trim() }
      )
      
      // 時間割一覧を更新
      const updatedTimetables = timetables.map((t) =>
        t.id === selectedTimetable.id ? { ...t, name: tempTitle.trim() } : t,
      )
      setTimetables(updatedTimetables)
      setSelectedTimetable({ ...selectedTimetable, name: tempTitle.trim() })
      
      toast({
        title: "保存完了",
        description: "時間割名が正常に更新されました。",
      })
      
    } catch (error) {
      console.error("時間割の更新に失敗しました:", error)
      toast({
        title: "保存エラー",
        description: "時間割名の更新に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setEditingTitle(false)
    }
  }

  const handleTitleCancel = () => {
    setEditingTitle(false)
    setTempTitle(selectedTimetable?.name || "")
  }

  if (currentView === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">時間割参照</h1>
            <p className="text-muted-foreground mt-2">生成済みの時間割を参照・編集できます</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>生成済み時間割一覧</span>
            </CardTitle>
            <CardDescription>時間割を選択して詳細を確認できます</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTimetables ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>時間割一覧を読み込んでいます...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {timetables.map((timetable) => (
                  <div
                    key={timetable.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold">{timetable.name}</h3>
                        <p className="text-sm text-muted-foreground">作成日: {timetable.createdAt}</p>
                      </div>
                      <Badge variant={timetable.status === "active" ? "default" : "secondary"}>
                        {timetable.status === "active" ? "運用中" : "下書き"}
                      </Badge>
                    </div>
                    <Button onClick={() => handleViewTimetable(timetable)} disabled={isLoadingDetail}>
                      <Eye className="w-4 h-4 mr-2" />
                      詳細を見る
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentView === "teacher") {
    const teacherSchedule = generateTeacherSchedule(selectedTeacher!)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleBackToDetail}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              時間割に戻る
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <User className="w-8 h-8" />
                <span>{selectedTeacher}の時間割</span>
              </h1>
              <p className="text-muted-foreground mt-2">{selectedTimetable?.name}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>担当授業一覧</CardTitle>
            <CardDescription>各時限での担当クラスと科目を表示しています</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">時限</TableHead>
                    <TableHead className="w-32">月</TableHead>
                    <TableHead className="w-32">火</TableHead>
                    <TableHead className="w-32">水</TableHead>
                    <TableHead className="w-32">木</TableHead>
                    <TableHead className="w-32">金</TableHead>
                    <TableHead className="w-32">土</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherSchedule.map((row) => (
                    <TableRow key={row.period}>
                      <TableCell className="font-medium">{row.period}</TableCell>
                      {["mon", "tue", "wed", "thu", "fri", "sat"].map((day) => {
                        const cellData = row[day as keyof typeof row] as {
                          grade: string
                          class: string
                          subject: string
                        } | null
                        return (
                          <TableCell key={day}>
                            {cellData ? (
                              <div className="flex flex-col p-2 bg-blue-50 rounded">
                                <div className="font-medium text-sm">{cellData.subject}</div>
                                <div className="text-xs text-muted-foreground">
                                  {cellData.grade}年{cellData.class}組
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-gray-400 text-sm">空き時間</div>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentView === "detail" || currentView === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleBackToList}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              一覧に戻る
            </Button>
            <div>
              {currentView === "edit" && editingTitle ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="text-2xl font-bold h-auto py-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave()
                      if (e.key === "Escape") handleTitleCancel()
                    }}
                  />
                  <Button size="sm" onClick={handleTitleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      "保存"
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleTitleCancel}>
                    キャンセル
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-bold">{selectedTimetable?.name}</h1>
                  {currentView === "edit" && (
                    <Button variant="ghost" size="sm" onClick={handleTitleEdit}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
              <p className="text-muted-foreground mt-2">
                {currentView === "edit" ? "時間割を編集中" : "時間割の詳細表示"}
              </p>
            </div>
          </div>
          {currentView === "detail" && (
            <Button onClick={handleEditTimetable}>
              <Edit className="w-4 h-4 mr-2" />
              編集する
            </Button>
          )}
          {currentView === "edit" && (
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setCurrentView("detail")}>
                キャンセル
              </Button>
              <Button>保存</Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <Tabs value={selectedGrade} onValueChange={setSelectedGrade}>
              <TabsList>
                <TabsTrigger value="1">1年生</TabsTrigger>
                <TabsTrigger value="2">2年生</TabsTrigger>
                <TabsTrigger value="3">3年生</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>時間割詳細を読み込んでいます...</span>
              </div>
            ) : (
              <Tabs defaultValue="class1">
                <TabsList className="mb-4">
                  <TabsTrigger value="class1">1組</TabsTrigger>
                  <TabsTrigger value="class2">2組</TabsTrigger>
                  <TabsTrigger value="class3">3組</TabsTrigger>
                  <TabsTrigger value="class4">4組</TabsTrigger>
                </TabsList>

                <TabsContent value="class1">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">時限</TableHead>
                          <TableHead className="w-32">月</TableHead>
                          <TableHead className="w-32">火</TableHead>
                          <TableHead className="w-32">水</TableHead>
                          <TableHead className="w-32">木</TableHead>
                          <TableHead className="w-32">金</TableHead>
                          <TableHead className="w-32">土</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timetableData.map((row) => (
                          <TableRow key={row.period}>
                            <TableCell className="font-medium">{row.period}</TableCell>
                            {["mon", "tue", "wed", "thu", "fri", "sat"].map((day) => {
                              const cellData = row[day as keyof typeof row] as { subject: string; teacher: string } | null
                              return (
                                <TableCell key={day}>
                                  {cellData ? (
                                    currentView === "edit" ? (
                                      <div
                                        className="p-3 border border-dashed border-gray-300 rounded cursor-move hover:bg-gray-50 transition-colors min-h-[60px] flex flex-col justify-center"
                                        draggable
                                        onDragStart={(e) =>
                                          handleDragStart(e, cellData.subject, cellData.teacher, row.period, day)
                                        }
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, row.period, day)}
                                      >
                                        <div className="font-medium text-sm">{cellData.subject}</div>
                                        <div className="text-xs text-muted-foreground">{cellData.teacher}</div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col">
                                        <div className="font-medium">{cellData.subject}</div>
                                        <button
                                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left"
                                          onClick={() => handleTeacherClick(cellData.teacher)}
                                        >
                                          {cellData.teacher}
                                        </button>
                                      </div>
                                    )
                                  ) : (
                                    currentView === "edit" && (
                                      <div
                                        className="p-3 border border-dashed border-gray-200 rounded min-h-[60px] hover:bg-gray-50 transition-colors"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, row.period, day)}
                                      >
                                        <div className="text-xs text-gray-400 text-center">空き時間</div>
                                      </div>
                                    )
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {currentView === "edit" && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 科目をドラッグ&ドロップで移動できます。問題がある場合は自動的にエラーメッセージが表示されます。
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}