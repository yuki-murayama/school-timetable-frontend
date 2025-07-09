# バックエンド調査要請 - 時間割生成ロジックの問題

フロントエンド側のデバッグ結果から、バックエンドの時間割生成ロジックに問題があることが判明しました。

## 🔍 判明した問題

### 現在の生成結果
- **1年生**: 6時限中4時限のみ授業が配置
- **2年生**: 6時限中3時限のみ授業が配置  
- **3年生**: 6時限中4時限のみ授業が配置

### クラス数の問題
**設定**: 1年4クラス、2年3クラス、3年3クラス
**現在**: 1組のみにデータが生成され、2組～4組は空白

### 期待される結果
- **平日**: 最終時限を除いて原則的に全て埋まる（5-6時限中5時限）
- **土曜**: 指定時限まで埋まる（例：4時限まで）
- **全クラス**: 各学年の全クラスに時間割が生成される

## 📋 調査すべき項目

### 1. クラス生成ロジック
```javascript
// 時間割生成時に全クラスが生成されているかチェック
function generateTimetableForAllClasses(settings) {
  for (let grade = 1; grade <= 3; grade++) {
    const classCount = settings[`grade${grade}Classes`] // 例: grade1Classes = 4
    
    for (let classNum = 1; classNum <= classCount; classNum++) {
      console.log(`Generating timetable for Grade ${grade}, Class ${classNum}`)
      // 各クラスの時間割を生成
      generateClassTimetable(grade, classNum, subjects, teachers, classrooms)
    }
  }
}
```

### 2. 授業数の計算ロジック
```javascript
// 各教科の週授業数の合計が時間割の枠数と一致しているか確認
const totalWeeklyLessons = subjects.reduce((sum, subject) => sum + subject.weeklyLessons, 0)
const totalTimeSlots = (dailyPeriods * 5) + saturdayPeriods // 例: (6*5) + 4 = 34
```

### 2. 教科の学年制約チェック
現在の教科データ例：
```json
{
  "name": "国語A",
  "targetGrades": [1],
  "weeklyLessons": 4
}
```

以下を確認：
- 各学年で利用可能な教科の週授業数合計
- 必要な時間割枠数との比較
- 不足している場合の処理

### 3. 時間割生成アルゴリズムの問題

#### a. 制約の厳しすぎる設定
```javascript
// 例：同一教科の連続制限が厳しすぎる
if (previousSubject === currentSubject) {
  continue; // これが原因で配置できない可能性
}
```

#### b. 教師の重複制約
```javascript
// 例：教師の同時刻重複チェックが厳しすぎる
if (teacherSchedule[time] !== null) {
  continue; // 教師不足で配置できない可能性
}
```

#### c. 教室の重複制約
```javascript
// 例：専用教室の制約が厳しすぎる
if (classroom && classroomSchedule[time] !== null) {
  continue; // 教室不足で配置できない可能性
}
```

### 4. 具体的な調査コード例

```javascript
// バックエンドに追加すべきデバッグコード
function debugTimetableGeneration(grade, subjects, teachers, settings) {
  // 1. 利用可能教科の確認
  const availableSubjects = subjects.filter(s => 
    !s.targetGrades || s.targetGrades.length === 0 || s.targetGrades.includes(grade)
  )
  
  // 2. 必要授業数の計算
  const requiredLessons = availableSubjects.reduce((sum, s) => sum + s.weeklyLessons, 0)
  const availableSlots = settings.dailyPeriods * 5 + settings.saturdayPeriods
  
  console.log(`Grade ${grade} analysis:`, {
    availableSubjects: availableSubjects.length,
    requiredLessons: requiredLessons,
    availableSlots: availableSlots,
    utilizationRate: (requiredLessons / availableSlots * 100).toFixed(1) + '%'
  })
  
  // 3. 教師の確認
  const availableTeachers = teachers.filter(t => 
    t.grades.includes(grade.toString()) || t.grades.length === 0
  )
  
  console.log(`Grade ${grade} teachers:`, {
    total: availableTeachers.length,
    subjects: availableTeachers.map(t => t.subjects).flat()
  })
  
  // 4. 制約チェック
  if (requiredLessons > availableSlots) {
    console.warn(`Grade ${grade}: Too many lessons required (${requiredLessons} > ${availableSlots})`)
  }
  
  if (requiredLessons < availableSlots * 0.8) {
    console.warn(`Grade ${grade}: Too few lessons (${requiredLessons} < ${availableSlots * 0.8})`)
  }
}
```

## 🎯 修正すべき点

### 1. 授業数の不足対応
```javascript
// 授業数が不足している場合の補完処理
function fillEmptySlots(timetable, grade, availableSubjects) {
  const emptySlots = findEmptySlots(timetable, grade)
  
  // 週授業数の多い教科から優先的に配置
  const subjectsByLessons = availableSubjects.sort((a, b) => b.weeklyLessons - a.weeklyLessons)
  
  for (const slot of emptySlots) {
    const subject = findBestSubjectForSlot(slot, subjectsByLessons, timetable)
    if (subject) {
      assignSubjectToSlot(timetable, slot, subject, grade)
    }
  }
}
```

### 2. 制約の緩和
```javascript
// 必要に応じて制約を緩和
function relaxConstraints(timetable, grade) {
  // 1. 同一教科連続制限の緩和
  // 2. 教師重複の部分許可
  // 3. 専用教室以外での授業許可
}
```

### 3. エラーレポート機能
```javascript
function generateTimetableReport(result) {
  const report = {
    totalSlots: 0,
    filledSlots: 0,
    emptySlots: 0,
    utilizationRate: 0,
    issues: []
  }
  
  // 各学年・クラスの充填率を計算
  // 問題のある箇所を特定
  
  return report
}
```

## 🚨 緊急度

**最高優先**: この問題により実用的な時間割が生成できない状態です。

1. **即座の対応**: デバッグログの追加
2. **短期的対応**: 制約の調整と授業数の補完
3. **長期的対応**: 時間割生成アルゴリズムの最適化

## 📤 期待される結果

修正後の時間割は以下のようになる必要があります：

### 理想的な充填率
- **平日1-5時限**: 90%以上（ほぼ全て埋まる）
- **平日6時限**: 50-70%（選択的に配置）
- **土曜1-4時限**: 80%以上（指定時限まで）

### 実際のログで確認すべき数値
- **1年生**: `nonEmptyRows: 5-6` (現在4)
- **2年生**: `nonEmptyRows: 5-6` (現在3)
- **3年生**: `nonEmptyRows: 5-6` (現在4)

フロントエンド側は正常に動作していることが確認されているため、バックエンドの修正により問題は解決されます。