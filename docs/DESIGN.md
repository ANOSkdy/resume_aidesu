# DESIGN CONTRACT — resume_aidesu

`resume_aidesu` の UI を継続的に改善するための **実装連動型デザイン契約書**。

- 対象: Next.js App Router の Web UI（入力フロー / AI補助 / プレビュー導線）
- 非対象: PDF レンダリング固有レイアウト（印刷最適化は別責務）
- 原則: **機能・データフローを変えず、見た目と操作一貫性を最小差分で整える**

---

## 1. プロダクトの見た目方針（Theme & Atmosphere）

- キーワード: **trustworthy / clean / calm / modern / form-centric**
- 体験目標:
  1. 入力時の迷いを減らす
  2. ステップ進行の安心感を高める
  3. AI補助やPDF出力を“過剰演出”せず自然に導く
- 雰囲気:
  - 背景は紙面に近い落ち着いた明度
  - アクセントは青系を主軸（行動誘導）
  - 警告/エラーは強すぎない赤で明確に示す

---

## 2. デザイントークン運用（Single Source of Truth）

- **唯一のトークンソース**: `tokens/design-tokens.json`
- 生成先:
  - `styles/tokens.css`
  - 本ファイルのトークン一覧 / CSS変数リファレンス
- 反映コマンド: `pnpm tokens:build`
- UI変更で色・余白・半径・影を増やす場合、**先にトークン定義**してから利用する

<!-- TOKENS:START -->
- **colors**: `sumi-black`, `nezumi-gray`, `kinari-off-white`, `akane-red`, `ai-blue`, `background`, `foreground`, `surface`, `surface-muted`, `border`, `ring`, `success`, `danger`, `muted-foreground`
- **spacing**: `xs`, `sm`, `md`, `lg`, `xl`
- **radii**: `sm`, `md`, `lg`
- **typography**: `size-sm`, `size-base`, `size-lg`, `line-tight`, `line-normal`
- **elevation**: `surface`, `lift`
- **motion**: `dur-fast`, `dur-normal`, `dur-reduced-fast`, `dur-reduced-normal`, `ease-standard`, `ease-spring-ui`, `ease-spring-enter`, `ease-spring-exit`
<!-- TOKENS:END -->

---

## 3. カラー役割（Semantic Color Roles）

- `background`: ページ全体の土台
- `surface`: カード/フォーム面
- `surface-muted`: 補助面（説明、注釈、一覧背景）
- `foreground`: 主要テキスト
- `muted-foreground`: 補助テキスト
- `border`: 標準境界
- `ring`: フォーカスリング
- `ai-blue`: 主CTA・進行中・リンク系アクセント
- `success`: 成功メッセージ
- `danger` / `akane-red`: バリデーション・警告・破壊的操作

---

## 4. タイポグラフィ

- 基本文字: `size-base` / 行間 `line-normal`
- 見出し:
  - ページ見出し: 太字、`text-xl` 相当
  - セクション見出し: `text-base` + 太字
- 補助文: `size-sm` + `muted-foreground`
- ルール: 太字の乱用禁止。情報階層はサイズ差より「余白と配置」で表現

---

## 5. 余白・角丸・境界・影

- 余白スケール: `xs/sm/md/lg/xl`
- 角丸:
  - 入力要素: `radii.sm`
  - カード/パネル: `radii.md`
  - 大きいサーフェス: `radii.lg`
- 境界: 1px `border` が基本
- 影:
  - 面の成立: `elevation.surface`
  - ホバー/浮上: `elevation.lift`

---

## 6. コンポーネント規約

### 6.1 Button
- Primary は `ai-blue` 系で1画面1主導線
- Secondary/Outline/Ghost は補助導線
- 最小タップ領域: 高さ 44px
- `focus-visible` で `wa-focus` を適用

### 6.2 Input / Select / Textarea
- `wa-form` スコープ配下で統一スタイル適用
- エラー時は `danger` 系境界と文言を併用（色のみで伝えない）
- placeholder は説明的かつ短く

### 6.3 Card / Panel / Callout
- 情報まとまり: `wa-card`
- 補助コンテナ: `wa-panel`
- ヒント/案内: `wa-callout`
- 装飾は最小限（内容優先）

### 6.4 状態表示
- エラー: `wa-danger`
- 成功: `wa-success`
- 補助: `wa-muted`

---

## 7. レイアウト原則

- モバイルファースト（単一カラム優先）
- ウィザード画面:
  - 現在ステップ
  - 入力領域
  - 次アクション
  が縦方向で自然に追えること
- 固定フッターCTAはキーボード表示時に操作不能領域を作らない

---

## 8. レスポンシブ規約

- 小画面: フォーム要素を詰め込みすぎない（縦積み優先）
- 中画面以上: 2カラム化は入力理解を損なわない範囲のみ
- タッチターゲット: 44px 以上

---

## 9. アクセシビリティ規約

- すべての入力に視認可能な `focus-visible`
- 十分なコントラスト（主要本文と背景）
- エラー文言は具体的に
- `prefers-reduced-motion` 時はモーションを縮退

---

## 10. Do / Don’t

### Do
- 既存トークンと `wa-*` ユーティリティを優先再利用
- 画面ごとの入力目的が瞬時に分かる構造にする
- UI刷新時は `docs/DESIGN.md` とトークンを同時更新

### Don’t
- 画面単位で独自色・独自半径を増殖させる
- PDF向け表現（高密度/固定寸法）を Web フォームに持ち込む
- 目的のない装飾アニメーションを追加する

---

## 11. Agent Prompt Guide（AI/Codex 向け）

1. 変更前に「利用トークン」と「既存再利用クラス」を宣言する
2. 新規ハードコード色より、まず `tokens/design-tokens.json` を検討する
3. ビジネスロジック/API仕様は変更しない（見た目中心）
4. 変更後は `pnpm tokens:build`・`pnpm lint`・`pnpm build` を実行して契約整合性を確認する
5. 追加コンポーネントには以下を必須適用:
   - 44px 以上の操作領域
   - `focus-visible`
   - モバイルでの崩れ防止

---

## 12. Web UI と PDF の責務分離

- Web UI: 入力成功率と編集効率を最優先
- PDF: 提出物としての整列性・可読性を最優先
- 同一ドメインでも見た目要件は分けて管理する

---

## Generated CSS Variable Reference
<!-- CSS_REF:START -->
```css
:root {
  --wa-colors-sumi-black: ...;
  --wa-colors-nezumi-gray: ...;
  --wa-colors-kinari-off-white: ...;
  --wa-colors-akane-red: ...;
  --wa-colors-ai-blue: ...;
  --wa-colors-background: ...;
  --wa-colors-foreground: ...;
  --wa-colors-surface: ...;
  --wa-colors-surface-muted: ...;
  --wa-colors-border: ...;
  --wa-colors-ring: ...;
  --wa-colors-success: ...;
  --wa-colors-danger: ...;
  --wa-colors-muted-foreground: ...;
  --wa-spacing-xs: ...;
  --wa-spacing-sm: ...;
  --wa-spacing-md: ...;
  --wa-spacing-lg: ...;
  --wa-spacing-xl: ...;
  --wa-radii-sm: ...;
  --wa-radii-md: ...;
  --wa-radii-lg: ...;
  --wa-typography-size-sm: ...;
  --wa-typography-size-base: ...;
  --wa-typography-size-lg: ...;
  --wa-typography-line-tight: ...;
  --wa-typography-line-normal: ...;
  --wa-elevation-surface: ...;
  --wa-elevation-lift: ...;
  --wa-motion-dur-fast: ...;
  --wa-motion-dur-normal: ...;
  --wa-motion-dur-reduced-fast: ...;
  --wa-motion-dur-reduced-normal: ...;
  --wa-motion-ease-standard: ...;
  --wa-motion-ease-spring-ui: ...;
  --wa-motion-ease-spring-enter: ...;
  --wa-motion-ease-spring-exit: ...;
}
```
<!-- CSS_REF:END -->
