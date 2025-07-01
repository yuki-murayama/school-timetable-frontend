"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Plus, Edit, Trash2, Save } from "lucide-react"

export function DataRegistration() {
  const [teachers, setTeachers] = useState([
    { id: 1, name: "田中先生", subjects: ["数学"], grades: ["1年", "2年"] },
    { id: 2, name: "佐藤先生", subjects: ["英語"], grades: ["1年", "3年"] },
  ])

  const [classSettings, setClassSettings] = useState({
    grade1: 4,
    grade2: 4,
    grade3: 3,
    dailyPeriods: 6,
    saturdayPeriods: 4,
  })

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">基本設定</TabsTrigger>
          <TabsTrigger value="teachers">教師情報</TabsTrigger>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="grade1">1年生クラス数</Label>
                  <Input
                    id="grade1"
                    type="number"
                    value={classSettings.grade1}
                    onChange={(e) => setClassSettings((prev) => ({ ...prev, grade1: Number.parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="grade2">2年生クラス数</Label>
                  <Input
                    id="grade2"
                    type="number"
                    value={classSettings.grade2}
                    onChange={(e) => setClassSettings((prev) => ({ ...prev, grade2: Number.parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="grade3">3年生クラス数</Label>
                  <Input
                    id="grade3"
                    type="number"
                    value={classSettings.grade3}
                    onChange={(e) => setClassSettings((prev) => ({ ...prev, grade3: Number.parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="daily">1日の授業数</Label>
                  <Input
                    id="daily"
                    type="number"
                    value={classSettings.dailyPeriods}
                    onChange={(e) =>
                      setClassSettings((prev) => ({ ...prev, dailyPeriods: Number.parseInt(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="saturday">土曜の授業数</Label>
                  <Input
                    id="saturday"
                    type="number"
                    value={classSettings.saturdayPeriods}
                    onChange={(e) =>
                      setClassSettings((prev) => ({ ...prev, saturdayPeriods: Number.parseInt(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <Button className="w-full">
                <Save className="w-4 h-4 mr-2" />
                設定を保存
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
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                教師を追加
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>教師名</TableHead>
                    <TableHead>担当科目</TableHead>
                    <TableHead>担当学年</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {teacher.subjects.map((subject, index) => (
                            <Badge key={index} variant="secondary">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {teacher.grades.map((grade, index) => (
                            <Badge key={index} variant="outline">
                              {grade}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>専用教室管理</CardTitle>
                <CardDescription>専用教室の種類と数を管理します</CardDescription>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                教室を追加
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Label className="w-24">理科室</Label>
                    <Input type="number" defaultValue="2" className="w-20" />
                    <span className="text-sm text-muted-foreground">室</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Label className="w-24">音楽室</Label>
                    <Input type="number" defaultValue="1" className="w-20" />
                    <span className="text-sm text-muted-foreground">室</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Label className="w-24">美術室</Label>
                    <Input type="number" defaultValue="1" className="w-20" />
                    <span className="text-sm text-muted-foreground">室</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Label className="w-24">体育館</Label>
                    <Input type="number" defaultValue="1" className="w-20" />
                    <span className="text-sm text-muted-foreground">室</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Label className="w-24">技術室</Label>
                    <Input type="number" defaultValue="1" className="w-20" />
                    <span className="text-sm text-muted-foreground">室</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Label className="w-24">家庭科室</Label>
                    <Input type="number" defaultValue="1" className="w-20" />
                    <span className="text-sm text-muted-foreground">室</span>
                  </div>
                </div>
              </div>
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
              <Textarea placeholder="例：体育は午後に配置、数学は1時間目を避ける..." rows={6} />
              <Button className="mt-4">
                <Save className="w-4 h-4 mr-2" />
                条件を保存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
