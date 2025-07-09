import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Switch } from "./ui/switch"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Separator } from "./ui/separator"
import { Wand2, Settings, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { timetableApi, type TimetableGenerationResponse } from "../lib/api"
import { useAuth } from "../hooks/use-auth"
import { useToast } from "../hooks/use-toast"

export function TimetableGenerate() {
  const { token } = useAuth()
  const { toast } = useToast()
  
  const [isDetailMode, setIsDetailMode] = useState(false)
  const [simpleCondition, setSimpleCondition] = useState("")
  const [detailConditions, setDetailConditions] = useState({
    noConsecutive: true,
    jointClasses: "",
    customConditions: "",
  })

  // 時間割生成の状態管理
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<TimetableGenerationResponse | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!token) {
      toast({
        title: "認証エラー",
        description: "ログインが必要です",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGenerationError(null)
    setGenerationResult(null)

    try {
      console.log("時間割生成開始...")
      
      // 生成オプションを準備
      const options: Record<string, any> = {}
      
      if (isDetailMode) {
        options.noConsecutive = detailConditions.noConsecutive
        options.customConditions = detailConditions.customConditions
      } else {
        options.simpleCondition = simpleCondition
      }

      console.log("送信するリクエストデータ:", { options })

      const result = await timetableApi.generateTimetable({ options }, { token })
      
      setGenerationResult(result)
      toast({
        title: "生成完了",
        description: "時間割が正常に生成されました",
      })
      
      console.log("時間割生成完了:", result)
      
    } catch (error: any) {
      console.error("時間割生成エラー:", error)
      
      const errorMessage = error.message || "時間割生成に失敗しました"
      setGenerationError(errorMessage)
      
      toast({
        title: "生成エラー",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
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
                    onCheckedChange={(checked: boolean) => setDetailConditions((prev) => ({ ...prev, noConsecutive: checked }))}
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
            <Button variant="outline" disabled={isGenerating}>条件をリセット</Button>
            <Button onClick={handleGenerate} size="lg" className="px-8" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  時間割を生成
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 生成結果の表示 */}
      {(generationResult || generationError) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {generationResult ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>生成完了</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span>生成エラー</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generationResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">教師数</p>
                    <p className="text-2xl font-bold">{generationResult.metadata.dataUsed.teachersCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">教科数</p>
                    <p className="text-2xl font-bold">{generationResult.metadata.dataUsed.subjectsCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">教室数</p>
                    <p className="text-2xl font-bold">{generationResult.metadata.dataUsed.classroomsCount}</p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>時間割ID:</strong> {generationResult.timetable.id}
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>生成日時:</strong> {new Date(generationResult.timetable.createdAt).toLocaleString('ja-JP')}
                  </p>
                  <p className="text-sm text-green-800 mt-2">
                    時間割が正常に生成されました。「時間割参照」画面で詳細を確認できます。
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-800">
                  {generationError}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 生成中の進行状況 */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <div>
                <p className="text-sm font-medium">時間割を生成中...</p>
                <p className="text-xs text-muted-foreground">
                  この処理には10-30秒かかる場合があります
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}