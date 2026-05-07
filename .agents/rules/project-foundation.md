# Ketchup Timer - Project Foundation

本プロジェクトにおける技術的基盤と、開発時の基本原則を定義します。

## 1. 技術スタック (Technology Stack)
- **言語:** TypeScript
- **ビルドツール:** Webpack (TypeScriptをJavaScriptへバンドル)
- **UI:** HTML5, CSS3 (Vanilla CSS, フレームワーク不使用)
- **画像処理:** Sharp (Node.js環境でのSVGからPNGへの変換)

## 2. アーキテクチャ原則 (Architecture Principles)
- **Manifest V3の遵守:** 拡張機能は最新の Manifest V3 の仕様に準拠する。
- **Service Worker (`background.ts`):** 
  - 永続的な状態を持たず、イベント駆動で動作する。
  - 時間の計測には `setTimeout` や `setInterval` ではなく、必ず `chrome.alarms` を使用する。
- **状態管理:**
  - タイマーの状態（残り時間、フェーズ、設定）はすべて `chrome.storage.local` に保存し、PopupとBackgroundで共有・同期する。
- **動的描画:**
  - ツールバーアイコンの動的な変化は、`OffscreenCanvas` APIを用いてバックグラウンドで描画し、`chrome.action.setIcon` で更新する。

## 3. エラーハンドリングと堅牢性
- **メッセージングのPromiseエラー:**
  - `chrome.runtime.sendMessage` を送信する際、Popupが閉じていると `Receiving end does not exist` エラーが発生する。これは Manifest V3 の仕様であるため、必ず `.catch(() => {})` を付与して安全に握りつぶし、バックグラウンド処理が停止しないようにする。
- **絶対パスの利用:**
  - `chrome.notifications` 等でアイコンを指定する場合は、コンテキストによるパスの解釈ズレを防ぐため、`chrome.runtime.getURL()` を使用する。

## 4. デザイン原則
- **ケチャップ・テーマ:** `#ff4d4d`（赤）をベースカラーとし、丸みを帯びたポップなデザイン（フラットデザイン）を心掛ける。
- **ユーザー体験 (UX):** 通知をクリックするだけで次のフェーズへ進めるなど、ユーザーの操作ステップを最小限に抑える設計とする。