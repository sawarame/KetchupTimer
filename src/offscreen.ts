/**
 * Offscreen Document - ハートビート送信専用
 * Service Worker が休止するのを防ぎ、定期的な描画タイミングを通知します。
 */

// 100ms ごとに Service Worker に信号を送信 (10fps)
setInterval(() => {
  chrome.runtime.sendMessage({ action: 'heartbeat' }).catch(() => {
    // Service Worker が一時的に応答しない場合は無視
  });
}, 100);

// 起動時に準備完了を通知
chrome.runtime.sendMessage({ action: 'offscreenReady' }).catch(() => {});
