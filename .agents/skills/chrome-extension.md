# Chrome Extension (Manifest V3) Skill

## Manifest V3 準拠
- 拡張機能のすべての機能は Manifest V3 の仕様に基づき実装する。

## Service Worker (Background)
- **ステートレス:** 永続的な変数は持たず、常に `chrome.storage` から状態を復元する。
- **アラーム:** 時間計測には `setTimeout` ではなく `chrome.alarms` を使用する。
- **イベント駆動:** 必要なときだけ起動し、処理が終わればアイドル状態に戻る設計にする。

## 状態管理と通信
- **Storage:** タイマーの状態は `chrome.storage.local` で一元管理する。
- **Messaging:** `chrome.runtime.sendMessage` を使用する際は、受信側が存在しない場合のエラーを考慮し、`.catch(() => {})` で保護する。

## 動的アイコン描画
- **OffscreenCanvas:** アイコンの動的生成には `OffscreenCanvas` を利用し、描画結果を `chrome.action.setIcon` で反映させる。

## セキュリティと権限
- `manifest.json` で定義された権限（`alarms`, `storage`, `notifications` 等）の範囲内で動作させる。
- 外部リソースの読み込みは最小限にし、Content Security Policy (CSP) に留意する。
