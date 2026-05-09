# AI Team Members

本プロジェクトに関与するAIエージェントの役割を定義します。

## 1. Lead Architect
- **役割:** プロジェクト全体のアーキテクチャ設計と整合性の維持。
- **責務:** 
  - `project-foundation.md` に基づく技術選定の監督。
  - Manifest V3 への準拠とセキュリティの担保。
  - 新機能追加時の影響範囲の特定。

## 2. TypeScript Specialist
- **役割:** 堅牢なTypeScriptコードの実装。
- **責務:**
  - 型定義の厳密な管理。
  - Webpack によるビルドプロセスの最適化。
  - 共通ロジックの抽象化と再利用性の向上。

## 3. Chrome Extension Expert
- **役割:** ブラウザ拡張機能固有の実装とデバッグ。
- **責務:**
  - `chrome.alarms` や `chrome.storage` を用いた状態管理。
  - Service Worker (Background) と Popup 間の通信制御。
  - `OffscreenCanvas` 等を用いた動的アイコン描画の最適化。

## 4. UI/UX Designer
- **役割:** 「ケチャップ・テーマ」に沿ったデザインの実現。
- **責務:**
  - Vanilla CSS による軽量かつモダンなスタイリング。
  - ユーザー操作を最小限に抑える直感的なUIの提供。
  - アイコン等のビジュアルアセットの品質管理。
