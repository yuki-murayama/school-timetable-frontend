"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Wand2, Settings } from "lucide-react"

export function TimetableGenerate() {
  const [isDetailMode, setIsDetailMode] = useState(false)
  const [simpleCondition, setSimpleCondition] = useState("")
  const [detailConditions, setDetailConditions] = useState({
    noConsecutive: true,
    jointClasses: "",
    customConditions: "",
  })

  const handleGenerate = () => {
    console.log("時間割生成処理")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">時間割生成</h1>
          <p className="text-muted-foreground mt-2">条件を指定して新しい時間割を生成します</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Wand2 className="w-5 h-5" />
                <span>生成モード</span>
              </CardTitle>
              <CardDescription>簡易モードまたは詳細モードを選択してください</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="mode-toggle" className="text-sm">
                {isDetailMode ? "詳細モード" : "簡易モード"}
              </Label>
              <Switch id="mode-toggle" checked={isDetailMode} onCheckedChange={setIsDetailMode} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isDetailMode ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="simple-condition">生成条件</Label>
                <Textarea
                  id="simple-condition"
                  placeholder="例：数学は午前中に配置、体育は連続2時間で設定..."
                  value={simpleCondition}
                  onChange={(e) => setSimpleCondition(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>詳細条件設定</span>
                </h3>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">同一科目の連続配置制限</Label>
                    <p className="text-sm text-muted-foreground">同一科目を連続した時間に配置しない</p>
                  </div>
                  <Switch
                    checked={detailConditions.noConsecutive}
                    onCheckedChange={(checked) => setDetailConditions((prev) => ({ ...prev, noConsecutive: checked }))}
                  />
                </div>

                <div className="space-y-3">
                  <Label>合同授業設定</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="科目を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="math">数学</SelectItem>
                        <SelectItem value="english">英語</SelectItem>
                        <SelectItem value="science">理科</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="学年を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1年生</SelectItem>
                        <SelectItem value="2">2年生</SelectItem>
                        <SelectItem value="3">3年生</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="クラス数" type="number" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>授業時間設定</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="daily-periods" className="text-sm">
                        1日の授業数
                      </Label>
                      <Input id="daily-periods" type="number" defaultValue="6" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="saturday-periods" className="text-sm">
                        土曜の授業数
                      </Label>
                      <Input id="saturday-periods" type="number" defaultValue="4" className="mt-1" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="custom-conditions">任意条件</Label>
                  <Textarea
                    id="custom-conditions"
                    placeholder="その他の特別な条件があれば記入してください..."
                    value={detailConditions.customConditions}
                    onChange={(e) => setDetailConditions((prev) => ({ ...prev, customConditions: e.target.value }))}
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline">条件をリセット</Button>
            <Button onClick={handleGenerate} size="lg" className="px-8">
              <Wand2 className="w-4 h-4 mr-2" />
              時間割を生成
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
