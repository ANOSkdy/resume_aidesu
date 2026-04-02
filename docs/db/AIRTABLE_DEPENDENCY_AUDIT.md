# AIRTABLE DEPENDENCY AUDIT

## Executive Summary

このリポジトリのデータ永続化は `lib/db/airtable.ts` を起点に Airtable SDK へ強く結合しており、`Users` / `Resumes` / `Educations` / `Works` / `Lookups` の5テーブル前提でアプリ全体が動作している。特に `resume_id`（業務ID）と Airtable `record.id`（物理ID）の二重ID運用、`filterByFormula` 依存クエリ、`typecast: true` 前提の作成/更新、Attachment の可変型（配列 or 文字列）吸収ロジックが移行の主要論点。Neon/Postgres への移行では、まず **ID・リレーション・配列/lookup値・添付ファイル表現** を明示的なスキーマへ固定し、アプリ層の Airtable 特有処理（formula・フィールド名変換・SDK戻り値の整形）を切り離す必要がある。

---

## Airtable Dependency Inventory

### 1) Airtable クライアント・接続

- `lib/db/airtable.ts`
  - `new Airtable({ apiKey }).base(baseId)` で接続生成。
  - 環境変数 `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` を必須化。
  - テーブル名を文字列固定で参照: `Users`, `Resumes`, `Educations`, `Works`, `Lookups`。
  - `checkConnection()` は `lookups.select().firstPage()` で接続検証。

### 2) Airtable レコード形状に依存する変換層

- `lib/db/resume.ts`
  - 入出力で `Airtable.Record<Airtable.FieldSet>` を直接使用。
  - `mapAirtableResume()` が `{ id, fields }` をアプリ `Resume` 型へマップ。
  - `contactAddress/contactPhone/contactEmail` ↔ `contact_address/contact_phone/contact_email` の双方向変換。
  - `profilePhoto` が `Attachment[] | string | null` で来る前提を吸収。
  - `resume_id`, `user_id`, `title` が string / string[] / `{id}`[] の混在前提。

### 3) Airtable クエリ/更新フロー依存

- `app/api/data/resume/route.ts`
  - `POST` で `resume_id` の存在有無により作成/更新を分岐。
  - 更新対象探索を `filterByFormula: "{resume_id} = '...'"` で実施。
  - create/update とも `typecast: true` 前提。
- `app/api/data/education/route.ts`, `app/api/data/work/route.ts`
  - `resume_id` Link フィールドへ文字列投入を想定し `typecast: true` 利用。
- `lib/db/resume.ts#getResumeBundle`
  - `res_...`（業務ID）だけでなく `rec...`（Airtable record id）も許容。
  - `find(recordId)` と formula 検索のハイブリッド。
- `lib/db/resume.ts#listResumes`
  - 非公開 `_listRecords` API + `offset` ページング使用。
  - sort フィールド `updated_at` 不在時のエラーフォールバック実装。

### 4) Airtable 前提のUI/契約

- `app/resume/*`, `app/cv/*`
  - `/api/data/resume` GET 結果を再 POST する前に `id`, `createdTime`, `fields` を削除。
  - `localStorage.carrimy_resume_id` を永続IDとして各ステップで利用。
- `app/cv/3/page.tsx`
  - 写真アップロード API へ `resumeId` を送信し、結果の `profilePhotoUrl` を画面状態へ反映。
- `components/ui/TagSelector.tsx`
  - `/api/data/lookups` の `category/name` 形状に固定依存。
- `components/pdf/*`
  - `profilePhotoUrl` と `profilePhoto`（配列/JSON文字列）両対応ロジック。

### 5) 関連環境変数

- Airtable 直接依存:
  - `AIRTABLE_API_KEY`
  - `AIRTABLE_BASE_ID`
- Airtable運用と同一データフロー上で利用:
  - `BLOB_READ_WRITE_TOKEN`（プロフィール画像URL生成）
  - `CRM_ACCESS_TOKEN`（CRM API/Page ゲート）

---

## File-by-File Findings

- `lib/db/airtable.ts`
  - Airtable SDK初期化・テーブル名ハードコード。
  - Neon移行時は `getDb()` 契約そのものを差し替え対象にできるが、現状は Airtable 専用戻り値（table instance）依存が強い。

- `lib/db/resume.ts`
  - 最重要依存ファイル。Airtable 固有仕様（formula / offset / record shape / link表現 / attachment表現）を複数内包。
  - `listRecordsWithOffset()` で SDK内部 `_listRecords` に依存しているため、移行時は API 契約から再設計が必要。

- `lib/validation/schemas.ts`
  - スキーマ名は汎用だが、フィールド命名は Airtable 列名（snake_case）が基準。
  - `contactAddress` など一部 camelCase を混在させ、`mapResumeToAirtableFields` で吸収している。

- `app/api/data/resume/route.ts`
  - 新規作成時の `resume_id = "res_" + Date.now()` 生成ロジックが実装済み。
  - 「upsert」ではなく「検索してあれば更新、なければ作成」を Airtable formula 前提で実施。

- `app/api/data/education/route.ts`
  - `resume_id` を link として受け入れる Airtable typecast 前提。

- `app/api/data/work/route.ts`
  - education と同様。`is_current` 時に `end_*` を消す実装があり、DB側 NULL 許容設計が必要。

- `app/api/data/lookups/route.ts`
  - `Lookups` テーブルを `display_order` 昇順で全件取得。カテゴリ辞書のマスタ配信API。

- `app/api/pdf/jis-resume/route.tsx`, `app/api/pdf/job-history/route.tsx`
  - `resume_id` formula で本体/関連レコードを取得し PDF データを構成。

- `app/api/data/resume/profile-photo/route.ts`
  - Blob URL を `updateResumeFields(resumeId, { profilePhoto: [...] })` で保存。
  - ここは `resumeId` を record id として扱っており、他API（business `resume_id`）と意味論がズレる。

- `app/api/data/resumes/route.ts`, `app/crm/page.tsx`, `app/crm/[id]/page.tsx`
  - CRM一覧/詳細は `listResumes`・`getResumeBundle` を利用。Airtable検索式とID正規化に間接依存。

- `lib/crm/resume-id.js`
  - CRMのルーティングIDを `^res_[0-9]{10,}$` に固定。Airtable `rec...` はCRM経路では正規ID扱いしない。

---

## Current Airtable Data Model Inferred From Code

### Resumes

想定列（コードから推定）:

- 主キー系: `id`(Airtable record id), `resume_id`(業務ID), `user_id`
- 氏名/基本: `last_name_kanji`, `first_name_kanji`, `last_name_kana`, `first_name_kana`, `gender`
- 生年月日: `dob_year`, `dob_month`, `dob_day`
- 連絡先/住所: `email`, `phone_number`, `postal_code`, `address_prefecture`, `address_city`, `address_line1`, `address_line2`
- 連絡先（別送先）: `contact_address`, `contact_phone`, `contact_email`（内部では camelCase でも扱う）
- 状態/希望: `job_change_count`, `current_status`, `desired_joining_date`, `desired_occupations[]`, `desired_industries[]`, `desired_locations[]`, `licenses_qualifications[]`
- AI生成: `transferable_skills`, `self_pr`, `summary`
- 画像: `profilePhoto`（Attachment or string）, `profilePhotoUrl`
- 監査系: `created_at`, `updated_at`（存在を仮定してソートに利用）

### Educations

- `id`(Airtable record id), `resume_id`, `school_name`, `department`, `degree`, `start_year`, `start_month`, `end_year`, `end_month`, `is_current`

### Works

- `id`(Airtable record id), `resume_id`, `company_name`, `department`, `position`, `start_year`, `start_month`, `end_year`, `end_month`, `is_current`, `description`

### Lookups

- `id`(Airtable record id), `category`, `name`, `display_order`

### Users

- `lib/db/airtable.ts` では公開されるが、本監査範囲で Users テーブルへの参照実装は未確認（将来用途の可能性）。

---

## Airtable-Specific Assumptions That Block Neon Migration

1. **record API 形状依存**: `record.id` + `record.fields` 展開前提。
2. **Formula文字列依存**: `filterByFormula` を直接組み立て（SQLへ置換必要）。
3. **Link/Lookupの多態表現**: string / string[] / object[] を normalize している。
4. **Attachment多態表現**: `profilePhoto` が配列・JSON文字列・URL文字列の混在。
5. **typecast 依存**: 文字列投入で Link が解決される Airtable 特性を利用。
6. **SDK内部API依存**: `_listRecords` + `offset` ページング。
7. **二重ID運用の曖昧性**: `resume_id` と `record.id` を用途に応じて混用。
8. **フィールド命名揺れ**: snake_case / camelCase が混在し変換マップで吸収。

---

## Recommended Target Postgres Schema Changes

### P0 (必須)

1. `resumes` テーブルを基準に、`id`(uuid pk) と `resume_id`(text unique) を分離定義。
2. `educations`, `works` は `resume_id` 文字列ではなく `resume_pk`(uuid fk) で正規化。
3. `profile_photo_url` を `text` で単一管理し、Attachment配列列を廃止。
4. `created_at`, `updated_at` をDB側デフォルト/トリガで管理。

### P1 (推奨)

5. `desired_*`, `licenses_qualifications` は `text[]` もしくは中間テーブル化（検索要件で選択）。
6. `contact_*` を snake_case へ統一し、アプリ側も同命名へ寄せる（変換層を削減）。
7. `lookups` に `(category, name)` unique + `display_order` index を追加。

### P2 (運用改善)

8. `users` と `resumes.user_id` の整合制約を追加（必要なら外部Auth IDと連携）。
9. `current_status`, `desired_joining_date` など列の enum 化/正規化を段階導入。

---

## Required Application-Layer Changes

1. `lib/db/airtable.ts` を `lib/db/postgres.ts` 等へ置換し、Airtable SDK呼び出しを排除。
2. `lib/db/resume.ts` の責務分割:
   - Airtable専用 map/formula/helper を削除。
   - SQL Repository（list/get/update）へ差し替え。
3. `app/api/data/resume/route.ts` の upsert ロジックを `resume_id` unique 前提の DB upsert に変更。
4. `education/work` 作成時の `typecast: true` 前提を削除し、FK検証へ変更。
5. `profile-photo` API の引数を `resume_id` or `resume_pk` のどちらか一方に統一。
6. CRM一覧の cursor を Airtable `offset` から keyset/offset SQL ページングへ変更。
7. PDF APIの `filterByFormula` を join query へ移行。
8. UI側の `delete payload.createdTime / fields` を不要化（APIレスポンス契約を固定）。

---

## Risk / Priority (P0/P1/P2)

### P0

- ID意味論の衝突（`resume_id` vs Airtable `record.id`）
- `profile-photo` 更新で record id が必要な現仕様
- `filterByFormula` 依存経路（resume fetch / pdf / crm）

### P1

- 配列項目（希望条件/資格）の保存形式選定
- `contact_*` 命名変換の残存による不整合リスク
- `updated_at` フィールド存在前提ソートの破綻可能性

### P2

- Users テーブルの未使用・関係不明瞭
- Lookupマスタの制約不足による重複データ

---

## Next Actions

1. **ID方針を先に固定**: `resume_id`（外部公開）と `id`（内部PK）の使い分けを設計決定。
2. **Postgres DDL草案を作成**: `resumes/educations/works/lookups` の最小スキーマを定義。
3. **Repository層を先行追加**: 既存API契約を維持したまま実装をAirtable→Postgresへ切替可能にする。
4. **profile-photo APIの入力IDを統一**: 更新失敗を避けるため最優先で仕様明文化。
5. **移行用データマッピング仕様書を別紙化**: Attachment/lookup/link の変換規則を明示。
6. **段階移行計画**: まず read-path（CRM/PDF）をPostgres化し、次に write-path（resume/education/work）を切替。

