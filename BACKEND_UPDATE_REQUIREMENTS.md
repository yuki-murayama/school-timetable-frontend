# バックエンド対応要項 - 教科学年対象機能

フロントエンド側で教科の学年対象機能を実装完了しました。バックエンド側での対応が必要です。

## フロントエンド実装済み機能

### 1. Subject インターフェース変更
```typescript
export interface Subject {
  id?: string
  name: string
  specialClassroom?: string
  weeklyLessons: number
  targetGrades?: number[]  // 新規追加
  order?: number
}
```

### 2. targetGrades フィールド仕様
- **型**: `number[]` (数値配列)
- **値の範囲**: `[1, 2, 3]` のいずれかの組み合わせ
- **例**:
  - `[1]` → 1年生のみ
  - `[1, 2]` → 1年生と2年生
  - `[2, 3]` → 2年生と3年生
  - `[]` → 全学年対象（従来通り）
- **送信形式**: 常に配列として送信（`undefined`や`null`は送信しない）

### 3. 実際のデータ例
```json
{
  "id": "subject-123",
  "name": "数学A",
  "specialClassroom": null,
  "weeklyLessons": 4,
  "targetGrades": [1],
  "order": 0
}
```

```json
{
  "id": "subject-456", 
  "name": "体育",
  "specialClassroom": "体育館",
  "weeklyLessons": 3,
  "targetGrades": [],
  "order": 1
}
```

## バックエンドで必要な対応

### 1. データベーススキーマ更新
```sql
-- subjects テーブルに targetGrades カラム追加
ALTER TABLE subjects ADD COLUMN targetGrades TEXT; -- JSON配列として保存
```

### 2. Subject モデル更新
- `targetGrades` フィールドを追加
- JSON配列として保存/読み込み処理
- バリデーション追加（1,2,3の数値のみ許可）

### 3. API エンドポイント対応
**影響を受けるエンドポイント:**
- `GET /api/frontend/school/subjects`
- `POST /api/frontend/school/subjects`
- `PUT /api/frontend/school/subjects/{id}`
- `PUT /api/frontend/school/subjects` (一括保存)

**レスポンス例:**
```json
[
  {
    "id": "subject-1",
    "name": "数学A", 
    "specialClassroom": null,
    "weeklyLessons": 4,
    "targetGrades": [1],
    "order": 0
  },
  {
    "id": "subject-2",
    "name": "数学B",
    "specialClassroom": null, 
    "weeklyLessons": 4,
    "targetGrades": [2],
    "order": 1
  },
  {
    "id": "subject-3",
    "name": "体育",
    "specialClassroom": "体育館",
    "weeklyLessons": 3,
    "targetGrades": [],
    "order": 2
  }
]
```

### 4. 時間割生成ロジック修正 ⭐ 重要

**現在の問題:** 
時間割生成時に教科の学年制約を考慮していないため、対象外の学年に教科が配置される可能性があります。

**必要な修正:**

1. **教科フィルタリング**
   ```javascript
   // 各学年・クラスの時間割生成時
   function getAvailableSubjectsForGrade(grade, allSubjects) {
     return allSubjects.filter(subject => {
       // targetGrades が空配列 = 全学年対象
       if (!subject.targetGrades || subject.targetGrades.length === 0) {
         return true
       }
       // 指定学年が含まれているかチェック
       return subject.targetGrades.includes(grade)
     })
   }
   ```

2. **時間割生成アルゴリズム更新**
   ```javascript
   // 時間割生成時の例
   for (const grade of [1, 2, 3]) {
     for (const classNum of getClassesForGrade(grade)) {
       // この学年で利用可能な教科のみを取得
       const availableSubjects = getAvailableSubjectsForGrade(grade, allSubjects)
       
       // 利用可能な教科から時間割を生成
       generateTimetableForClass(grade, classNum, availableSubjects)
     }
   }
   ```

3. **エラーハンドリング**
   - 特定の学年で利用可能な教科が不足している場合の警告
   - 必要な授業数を満たせない場合のエラーメッセージ

### 5. バリデーション追加

1. **入力データバリデーション**
   ```javascript
   function validateSubject(subject) {
     if (subject.targetGrades) {
       // 配列かチェック
       if (!Array.isArray(subject.targetGrades)) {
         throw new Error('targetGrades must be an array')
       }
       
       // 有効な学年のみかチェック
       const validGrades = [1, 2, 3]
       const invalidGrades = subject.targetGrades.filter(grade => !validGrades.includes(grade))
       if (invalidGrades.length > 0) {
         throw new Error(`Invalid grades: ${invalidGrades.join(', ')}`)
       }
     }
   }
   ```

2. **時間割生成前チェック**
   ```javascript
   function validateTimetableGeneration(subjects, settings) {
     for (const grade of [1, 2, 3]) {
       const availableSubjects = getAvailableSubjectsForGrade(grade, subjects)
       const requiredLessons = calculateRequiredLessons(grade, settings)
       const availableLessons = calculateAvailableLessons(availableSubjects)
       
       if (availableLessons < requiredLessons) {
         throw new Error(`Grade ${grade}: Not enough subjects available`)
       }
     }
   }
   ```

### 6. 既存データの移行

**移行処理が必要:**
```javascript
// 既存の教科データに targetGrades フィールドを追加
UPDATE subjects SET targetGrades = '[]' WHERE targetGrades IS NULL;
```

## 緊急度

**高:** 時間割生成ロジックの修正
- 現在、学年制約を無視して時間割が生成される可能性
- データ整合性の問題が発生する可能性

**中:** API対応とデータベーススキーマ更新
- フロントエンドは後方互換性を考慮済み
- 段階的な対応が可能

## テストケース

以下のケースでテストが必要：

1. **基本ケース**
   - 数学A（1年のみ）→ 1年生クラスにのみ配置
   - 体育（全学年）→ 全学年のクラスに配置

2. **複数学年ケース** 
   - 英語（1,2年）→ 1,2年生クラスに配置、3年生には配置されない

3. **エラーケース**
   - 特定学年の教科が不足している場合の適切なエラー

4. **移行ケース**
   - 既存の教科データ（targetGrades なし）が全学年として扱われる

## フロントエンド側の現在の状態

✅ UI実装完了
✅ API送信データ正規化完了  
✅ 表示機能完了
✅ バリデーション完了
✅ デプロイ完了

次はバックエンド側の対応をお願いします。