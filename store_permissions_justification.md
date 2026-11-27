# Chrome Web Store Permissions Justification

## Single Purpose Description

### English
Ketchup Timer provides a Pomodoro timer with a real-time animated ketchup bottle toolbar icon, phase completion notifications, customizable focus/break cycles, and local focus time statistics.

### 日本語
Ketchup Timer は、リアルタイムに変化するケチャップボトルのツールバーアイコン、フェーズ終了通知、カスタマイズ可能な集中・休憩サイクル、およびローカル保存される集中時間統計を提供するポモドーロタイマー拡張機能です。

## Permission Justifications

### `alarms`
#### English
Used in the background service worker (chrome.alarms.create, chrome.alarms.clear, and chrome.alarms.onAlarm) to schedule the exact completion timestamp of the active Focus, Short Break, or Long Break timer phase and to cancel the scheduled alarm when the user pauses or resets the timer. This ensures phase transitions fire reliably even while the popup is closed and the service worker is idle.

#### 日本語
バックグラウンドの Service Worker（chrome.alarms.create、chrome.alarms.clear、chrome.alarms.onAlarm）で、実行中の集中・短い休憩・長い休憩フェーズの終了時刻を正確にスケジュールし、一時停止またはリセット時にアラームを解除するために使用します。これにより、ポップアップを閉じた状態や Service Worker の休止中でも確実にフェーズ終了を検知できます。

### `notifications`
#### English
Used in the background service worker (chrome.notifications.create and chrome.notifications.onButtonClicked) to display a system notification when a Focus, Short Break, or Long Break phase completes, and to let the user start the next phase directly by clicking the action button inside the notification.

#### 日本語
バックグラウンドの Service Worker（chrome.notifications.create、chrome.notifications.onButtonClicked）で、集中・短い休憩・長い休憩の各フェーズ終了時にシステム通知を表示し、通知内のアクションボタンをクリックしてそのまま次のフェーズを開始できるようにするために使用します。

### `storage`
#### English
Used via chrome.storage.local in the popup, background service worker, and localization module to persist the current timer state and user preferences (Focus, Break, and Long Break durations, cycle count, and selected display language) as well as daily aggregated focus time records (minutes per local calendar date) for rendering daily, weekly, and monthly statistics charts. All data remains strictly local to the user's browser and is never transmitted to external servers.

#### 日本語
ポップアップ、Service Worker、および多言語化モジュールから chrome.storage.local を利用し、現在のタイマー状態、ユーザー設定（集中・休憩・長い休憩の時間、サイクル数、表示言語）、および日間・週間・月間グラフ描画用の日別集中時間データ（ローカル日付ごとの合計分数）を永続化するために使用します。すべてのデータはユーザーのブラウザ内にローカル保存され、外部サーバーへ送信されることはありません。

### `offscreen`
#### English
Used in the background service worker (chrome.offscreen.createDocument and chrome.offscreen.closeDocument) to open a lightweight offscreen document (offscreen.html) strictly while a timer phase is actively running. The offscreen document sends a 100ms heartbeat message to the service worker so that the service worker can smoothly render the animated ketchup bottle toolbar icon via OffscreenCanvas and chrome.action.setIcon without being suspended mid-animation. The offscreen document is closed immediately when the timer is paused or stopped, and it does not access web page content or external network resources.

#### 日本語
バックグラウンドの Service Worker（chrome.offscreen.createDocument、chrome.offscreen.closeDocument）で、タイマー稼働中のみ軽量な Offscreen Document（offscreen.html）を作成するために使用します。Offscreen Document は 100ms ごとにハートビートメッセージを Service Worker へ送信し、アニメーション中に Service Worker が休止するのを防ぎながら OffscreenCanvas と chrome.action.setIcon による滑らかなケチャップボトルのツールバーアイコン描画を維持します。タイマーが一時停止または停止されると Offscreen Document は直ちに閉じられ、Web ページの内容や外部ネットワークには一切アクセスしません。

### Host permissions
#### English
This extension does not request any host permissions, optional permissions, optional host permissions, or content script host matches.

#### 日本語
この拡張機能は、ホスト権限、オプショナル権限、オプショナルホスト権限、およびコンテンツスクリプトのホスト一致パターンを一切要求しません。

## Remote Code Usage

### English
This extension does not use remotely hosted code. All executable JavaScript (including bundled Chart.js), stylesheets, icons, and localization JSON files are packaged locally within the extension.

### 日本語
この拡張機能はリモートホストされたコードを使用しません。すべての実行可能 JavaScript（同梱された Chart.js を含む）、スタイルシート、アイコン、および多言語化用 JSON ファイルは拡張機能パッケージ内にローカル同梱されています。
