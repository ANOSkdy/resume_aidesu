# /crm ページ構築に向けたリポジトリ解析レポート

## 目的
- `/crm` ページを新規追加し、Airtable の `Resumes` テーブルのレコードを参照・一覧表示するために必要な既存コード・設計情報を整理する。
- デザイン/レイアウトは現行の UI 構成を踏襲する前提で、再利用可能な UI/データ層を特定する。

## 現行アーキテクチャ概要
- **Next.js App Router** 構成。
- UI ベースレイアウトは `components/layout/AppShell.tsx` を使用。
- Tailwind CSS で統一スタイル (既存ページのカード/ボタンも同系統)。

## Airtable 連携の現状
### 接続/テーブル定義
- **接続実装**: `lib/db/airtable.ts`
  - 環境変数: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` を使用。
  - 接続先テーブル: `Users`, `Resumes`, `Educations`, `Works`, `Lookups` を返却。

### Resumes の型/マッピング
- **型/マッピング**: `lib/db/resume.ts`
  - `ResumeSchema` (zod) を基点とし、Airtable レコードをアプリ内型へ変換。
  - `contact_address`, `contact_phone`, `contact_email` の Airtable フィールド名を内部で `contactAddress`, `contactPhone`, `contactEmail` にマップ。
  - `profilePhoto` は Attachments/文字列に対応し、`profilePhotoUrl` を抽出。

### 既存 API
- **GET `/api/data/resume?id=...`**: `app/api/data/resume/route.ts`
  - `resume_id` 指定で Resumes を 1 件取得。
  - 付随して `Educations`, `Works` を同じ `resume_id` で取得。
- **POST `/api/data/resume`**: Resumes の作成/更新。
- **POST `/api/data/education`**, **POST/DELETE `/api/data/work`** も存在。

> **注意**: Resumes の一覧取得 API は未実装。`/crm` で複数レコード表示が必要なら、新規 API 追加が必須。

## /crm に関係する既存 UI/レイアウト
### レイアウトの再利用候補
- `components/layout/AppShell.tsx`
  - 全ページ共通ヘッダー/コンテンツ枠。
  - `/resume` 系もこのレイアウトを使用。

### UI コンポーネント
- `components/ui/Button.tsx` など基本 UI。
- テーブル系/一覧系コンポーネントは既存なし。

### 画面構成の参考
- `app/page.tsx` (ホーム)
  - カード、見出し、説明テキストなどのスタイルを踏襲できる。
- `app/resume/*`
  - `AppShell` + `WizardNav` + `カード` レイアウト。

## Resumes の想定表示データ
`ResumeSchema` をベースに、以下が CRM で使いやすい候補。
- `resume_id` (業務 ID)
- `title` (任意)
- 氏名 (`last_name_kanji`, `first_name_kanji`)
- 連絡先 (`contactEmail`, `contactPhone`, `contactAddress`)
- プロフィール画像 (`profilePhotoUrl`)
- `current_status`, `desired_occupations`, `desired_locations` など

> フィールドは Airtable 上の列名との対応を `lib/db/resume.ts` で確認可能。

## /crm 実装に向けたギャップ
1. **一覧取得 API がない**
   - `Resumes` をまとめて取得する API が現状未実装。
2. **テーブル UI コンポーネントが存在しない**
   - `/crm` で一覧表示する場合は、新規 UI を構成する必要あり。
3. **パフォーマンス/ページング考慮**
   - Airtable 取得は `select().all()` でページングが必要。

## 実装方針の草案（現行デザイン踏襲）
> 以下は **必要な情報整理のみ**。実装案としては最低限の構成を想定。

- **/crm ページ**: `app/crm/page.tsx`
  - `AppShell` を利用し、カード枠内に一覧を表示。
  - 既存のテキスト/カード・ボタンスタイルに合わせる。

- **API**: `app/api/data/resumes/route.ts` (新規)
  - Airtable `Resumes` テーブルを取得。
  - `mapAirtableResume` で整形。
  - 必要最小限のフィールドに絞ったレスポンスを返却。

## 環境変数 (既存)
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`

> `.env` はローカルのみ、Vercel には環境変数として登録する前提。

## 参照ファイル一覧
- `lib/db/airtable.ts` (Airtable 接続)
- `lib/db/resume.ts` (Resumes 型/マッピング)
- `lib/validation/schemas.ts` (ResumeSchema)
- `app/api/data/resume/route.ts` (Resumes GET/POST)
- `components/layout/AppShell.tsx` (共通レイアウト)
- `app/page.tsx` (デザイン参照)

---

以上を踏まえ、/crm 構築時は **一覧 API の追加** と **一覧 UI の構築** が主要タスクになります。
