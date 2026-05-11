---
name: typescript
description: TypeScriptに関するガイドラインとベストプラクティスを提供するスキル。
---

# TypeScript Skill

## コーディング標準

- **厳密な型定義:** `any` の使用を避け、インターフェースや型エイリアスを適切に定義する。
- **非同期処理:** `async/await` を基本とし、エラーハンドリング（`try/catch`）を徹底する。
- **モジュール化:** Webpack でのバンドルを前提とし、機能ごとにファイルを分割して `import/export` を使用する。

## ビルド環境

- **Webpack:** `webpack.config.js` を通じて `ts-loader` を使用し、`src/` 配下のファイルを `KetchupTimer/js/` に出力する。
- **tsconfig:** `tsconfig.json` の設定に従い、型チェックを厳格に行う。

## 注意事項

- ブラウザ拡張機能のコンテキスト（Popup, Background）で共有される型定義は `src/types.ts` 等に集約することを推奨する。
