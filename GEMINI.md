# KetchupTimer - プロジェクトコンテキスト

## プロジェクト概要
**KetchupTimer** は、ポモドーロ・テクニックを活用したブラウザ拡張機能（Manifest V3）です。「ケチャップボトル」をコンセプトにしたユニークな視覚的フィードバックが特徴で、作業中（Focus）はケチャップが減り、休憩中（Break）はケチャップが補充される演出を提供します。

詳細な機能要件や画面遷移については、[仕様書 (.context/spec.md)](.context/spec.md) を参照してください。

### 主要技術スタック
- **言語:** TypeScript (Strict Mode)
- **ビルドツール:** Webpack, ts-loader
- **スタイリング:** Vanilla CSS (外部フレームワーク不使用)
- **プラットフォーム:** Chrome Extension API (alarms, notifications, storage)

## ディレクトリ構成
- `src/`: TypeScript ソースコード
  - `background.ts`: アラーム管理、通知、動的アイコン描画ロジック。
  - `popup.ts`: ポップアップ UI の制御、設定保存。
- `KetchupTimer/`: 配布・ビルド済み資材
  - `manifest.json`: 拡張機能の設定。
  - `popup.html` / `popup.css`: ユーザーインターフェース。
  - `js/`: Webpack によってビルドされた JavaScript。
  - `images/`: 静的アイコンアセット。
- `scripts/`: ユーティリティスクリプト（`generate-icons.js` など）。
- `.context/`: 役割別の詳細ドキュメント。
  - `spec.md`: 機能要件、ディレクトリ構成の詳細、UI 仕様。
  - `development.md`: 環境構築、ビルド、検証、リリース手順。
  - `typescript.md`: TypeScript コーディングガイドライン。

## 開発・ビルド手順
環境構築からビルド、Chrome への読み込み、リリースまでの詳細な手順は、[開発・リリース手順 (.context/development.md)](.context/development.md) を参照してください。

## 開発規約
一貫したコード品質を維持するためのガイドラインは、[TypeScript コーディングガイドライン (.context/typescript.md)](.context/typescript.md) にまとめられています。

- **TypeScript:** `any` の禁止、厳格な型定義、`async/await` による非同期処理。
- **CSS:** [DESIGN.md](DESIGN.md) に基づく Vanilla CSS での実装。

## 設計思想
- **直感的なフィードバック:** タイマーの残り時間を数字だけでなく、アイコンの「ケチャップの量」で視覚的に伝える。
- **最小限の摩擦:** 通知のクリックだけで次のフェーズへ移行できるなど、ユーザーの集中を妨げない UX を目指す。
