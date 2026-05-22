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
- **実績記録・統計機能 (Achievement Tracking & Statistics):**
  - 集中（Focus）フェーズ終了時に、その日の合計集中時間を自動的に記録（分単位）。
  - タイムゾーン：ユーザーの実行環境のローカルタイムに基づいて日付を判定・記録。
- **動的アイコン演出:**
  - タイマーの残り時間に応じて、ブラウザツールバーのアイコンを動的に更新。
  - ケチャップの液面が変化するようなアニメーションをプログラマティックに描画。
  - **実装方式 (Heartbeat方式):** Manifest V3 の Service Worker 休止制限および Windows Chrome での描画制限を回避するため、Offscreen API を使用。
    - **Offscreen Document:** 100msごとに「ハートビート（描画信号）」を Service Worker に送信し、Service Worker の稼働を維持。
    - **Service Worker:** 信号を受信するたびに `OffscreenCanvas` を用いてアイコンを再描画し、`chrome.action.setIcon` を実行。
  - 集中（Focus）フェーズの実行中には、ボトルが反転し、キャップからケチャップが滴り落ちるアニメーションを表示。
  - 休憩（Break/Long Break）フェーズの実行中には、ボトルが正位置に戻り、上からケチャップのしずくが補充されるアニメーションを表示。

## 3. ディレクトリ構成 (Directory Structure)
```
/
├── src/                    # TypeScriptソースコード
│   ├── popup.ts            # UI・設定管理ロジック
│   ├── background.ts       # アラーム、通知、アイコン描画主ロジック
│   ├── offscreen.ts        # ハートビート送信ロジック (Offscreen Document用)
│   └── icon.svg            # アイコンのマスターSVG
├── KetchupTimer/           # 配布用（ビルド済み）ディレクトリ
│   ├── manifest.json       # 拡張機能のマニフェスト
│   ├── popup.html          # ポップアップUI
│   ├── popup.css           # ポップアップ用スタイル
│   ├── offscreen.html      # ハートビート用非表示ドキュメント
│   ├── js/                 # Webpackビルド出力先 (popup.js, background.js, offscreen.js)
│   └── images/             # 生成された静的アイコンPNG
```
│   └── generate-icons.js   # SVGからPNGを生成するスクリプト
├── package.json            # 依存関係
├── tsconfig.json           # TypeScript設定
└── webpack.config.js       # Webpack設定
```

## 4. UI仕様 (UI Specification)
- **Popup:**
  - **メイン画面:** タイマー表示、フェーズ表示、操作ボタン、設定項目。
  - **統計画面:**
    - 期間切り替えタブ（Daily/Weekly/Monthly）。
    - **期間ナビゲーション:** 「戻る」「進む」ボタンにより表示期間を移動可能。
      - 日間：7日間表示、1日ずつ移動。
      - 週間：4週間表示、1週間ずつ移動。
      - 月間：6ヶ月間表示、1ヶ月ずつ移動。
    - **期間表示ラベル:** 現在表示されている範囲を日付（MM-DD または YYYY-MM）で表示。
    - **未来制限:** 本日・今週・今月より先の期間へは移動できないよう制御。
    - 集中時間の棒グラフ、メイン画面への戻るボタン。
- **Notification:**
  - フェーズ終了の通知、次のフェーズ開始ボタン。