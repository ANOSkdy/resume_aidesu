# DESIGN CONTRACT — resume_aidesu

このドキュメントは `resume_aidesu` の UI を安全に拡張するための **living contract** です。実装時は `tokens/design-tokens.json` を唯一のトークンソースとして扱い、`pnpm tokens:build` で反映してください。

## Visual Theme & Atmosphere
- トーンは「和モダン / calm / trustworthy」。温かい紙感、控えめな陰影、情報の見やすさを優先。
- ランディング演出より、履歴書作成フロー（入力・確認・修正）を主役にする。
- UI の目的は「迷わせない・急かさない・誤入力を減らす」。

## Color Palette & Roles
- ベース: `sumi / nezumi / kinari / akane / ai`。
- 意味:
  - `background` は紙面の土台
  - `surface` は入力面
  - `surface-muted` は補助面
  - `border` は弱い区切り
  - `ring` は明確なフォーカス表示

<!-- TOKENS:START -->
- **colors**: `sumi-black`, `nezumi-gray`, `kinari-off-white`, `akane-red`, `ai-blue`, `background`, `foreground`, `surface`, `surface-muted`, `border`, `ring`
- **spacing**: `xs`, `sm`, `md`, `lg`, `xl`
- **radii**: `sm`, `md`, `lg`
- **typography**: `size-sm`, `size-base`, `size-lg`, `line-tight`, `line-normal`
- **elevation**: `surface`, `lift`
- **motion**: `dur-fast`, `dur-normal`, `dur-reduced-fast`, `dur-reduced-normal`, `ease-standard`, `ease-spring-ui`, `ease-spring-enter`, `ease-spring-exit`
<!-- TOKENS:END -->

## Typography Rules
- 日本語可読性を優先し、行間は詰めすぎない (`line-normal` 基準)。
- 見出しを過度に装飾せず、フォームラベル・説明文の階層を明確化。

## Component Stylings
- 既存ユーティリティクラス（`wa-surface`, `wa-panel`, `wa-focus`, `wa-lift` など）を再利用し、別名の重複スタイルを増やしすぎない。
- 角丸は中庸、影は短く浅く。境界線は低コントラストを維持。
- 各画面の primary CTA は 1 つを原則にする。

## Layout Principles
- Mobile-first。1 カラム中心で、入力と次アクションの距離を短く保つ。
- フォーム/ウィザード画面では「現在地・次にやること・エラー箇所」が一目で分かる構造にする。

## Motion & Accessibility
- モーションは補助目的のみ。意味のないアニメーションは禁止。
- `prefers-reduced-motion` を尊重し、duration/easing を縮退値へ切り替える。
- フォーカスリングは常に視認可能にする（色・太さ・コントラストを確保）。
- バリデーションは文言を明確にし、色依存の伝達のみで完結させない。

## Do’s and Don’ts
- Do: 入力体験の安定性、可読性、誤操作防止を優先する。
- Do: 既存トークンを組み合わせて調整する。
- Don’t: ブランド風の派手なグラデーションや過度な装飾を追加しない。
- Don’t: PDF/印刷アウトプット向け表現を Web UI と混同しない。

## Responsive Behavior
- スマホを基準に設計し、タブレット/デスクトップでは余白と横幅のみ段階的に拡張。
- 入力要素のタップ領域は十分確保し、固定フッター CTA はキーボード表示時の挙動に注意。

## Web UI vs Printable Output
- Web UI: 操作誘導と状態フィードバックを重視。
- PDF/印刷: 余計な装飾を排し、内容密度と整列性を重視。
- 両者で同じ色名を使っても、目的が違うため視覚最適化は別レイヤーで行う。

## Agent Prompt Guide
- 変更前に「どのトークンを使うか」を宣言し、ハードコード色の追加を避ける。
- 新規 UI は既存クラス優先で構築し、必要最小限の差分で提案する。
- 仕様変更時はこのファイルと `tokens/design-tokens.json` を同時更新する。

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
