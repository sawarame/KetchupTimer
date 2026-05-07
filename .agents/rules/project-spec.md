# Ketchup Timer - Project Specification

## 1. 概要 (Overview)
「Ketchup Timer」は、ポモドーロ・テクニックを用いたブラウザ拡張機能（Manifest V3対応）です。
最大のコンセプトは「ケチャップボトル」であり、作業中（Focus）はケチャップが減っていき、休憩中（Break）はケチャップが補充されていくというユニークな視覚的フィードバックを提供します。

## 2. 機能要件 (Features)
- **タイマー機能:**
  - 集中（Focus）フェーズ：デフォルト25分
  - 短い休憩（Break）フェーズ：デフォルト5分
  - 長い休憩（Long Break）フェーズ：デフォルト15分
  - サイクル：指定回数（デフォルト4回）の集中フェーズを終えると、長い休憩に移行する。
- **UI (Popup):**
  - 現在のフェーズ、残り時間、サイクル数を表示。
  - Start, Pause, Reset コントロールボタン。
  - 各フェーズの時間設定とサイクル数のカスタマイズフォーム。
- **通知 (Notifications):**
  - フェーズ終了時にChromeのシステム通知を表示。
  - 通知内のボタン（OK）をクリックすることで、次のフェーズへシームレスに移行。
- **動的アイコン演出:**
  - タイマーの残り時間に応じて、ブラウザツールバーのアイコンを動的に更新。
  - ケチャップの液面が変化するようなアニメーションをプログラマティックに描画。

## 3. ディレクトリ構成 (Directory Structure)
```
/
├── src/                    # TypeScriptソースコード
│   ├── popup.ts            # UI・設定管理ロジック
│   ├── background.ts       # アラーム、通知、アイコン描画ロジック
│   └── icon.svg            # アイコンのマスターSVG
├── KetchupTimer/           # 配布用（ビルド済み）ディレクトリ
│   ├── manifest.json       # 拡張機能のマニフェスト
│   ├── popup.html          # ポップアップUI
│   ├── popup.css           # ポップアップ用スタイル
│   ├── js/                 # Webpackビルド出力先
│   └── images/             # 生成された静的アイコンPNG
├── scripts/                # ビルド等に使用するスクリプト
│   └── generate-icons.js   # SVGからPNGを生成するスクリプト
├── package.json            # 依存関係
├── tsconfig.json           # TypeScript設定
└── webpack.config.js       # Webpack設定
```