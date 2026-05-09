# Development Workflow

## 1. 開発環境の準備
- `npm install` で依存関係をインストールする。
- `npm run dev` (もしあれば) または Webpack の watch モードでビルドを開始する。

## 2. 実装プロセス
- 新機能の追加やバグ修正を行う際は、`src/` 配下の TypeScript ファイルを編集する。
- UI の変更は `KetchupTimer/popup.html` および `KetchupTimer/popup.css` を編集する。

## 3. ビルドと検証
- `npm run build` を実行して、最新のコードを `KetchupTimer/js/` にバンドルする。
- 必要に応じて `node scripts/generate-icons.js` を実行し、アイコンアセットを更新する。
- Chrome の `chrome://extensions/` で「パッケージ化されていない拡張機能を読み込む」を選択し、`KetchupTimer` フォルダを選択して動作確認を行う。

## 4. リリース準備
- `manifest.json` のバージョン番号を更新する。
- 変更内容をコミットし、必要に応じてタグを打つ。
