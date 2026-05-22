/// <reference types="chrome" />

export type Phase = 'focus' | 'break' | 'longBreak';
export type State = 'running' | 'paused' | 'stopped';

export interface TimerState {
  phase: Phase;
  state: State;
  remainingTime: number;
  endTime: number;
  cycle: number;
  settings: {
    focus: number;
    break: number;
    longBreak: number;
    cycles: number;
  };
}

const ALARM_NAME = 'ketchupTimerAlarm';
const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

let isCreatingOffscreen = false;

// メッセージハンドラ
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startAlarm') {
    chrome.alarms.create(ALARM_NAME, { when: message.endTime });
    updateIcon();
  } else if (message.action === 'clearAlarm') {
    chrome.alarms.clear(ALARM_NAME);
    updateIcon();
  } else if (message.action === 'heartbeat') {
    // Offscreen からの心拍を受けて描画更新
    updateIcon();
  } else if (message.action === 'offscreenReady') {
    updateIcon();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await handlePhaseEnd();
  }
});

async function handlePhaseEnd() {
  const data = await chrome.storage.local.get('timerState');
  if (!data.timerState) return;
  
  let state = data.timerState as TimerState;
  state.state = 'stopped';
  
  let notificationTitle = '';
  let notificationMessage = '';
  let notificationIcon = 'images/icon-128.png';

  if (state.phase === 'focus') {
    state.cycle += 1;
    if (state.cycle >= state.settings.cycles) {
      state.phase = 'longBreak';
      state.remainingTime = state.settings.longBreak * 60 * 1000;
      notificationTitle = 'Focus Complete!';
      notificationMessage = 'Time for a long break. Ketchup bottle is refilling...';
      notificationIcon = 'images/icon-empty-128.png';
    } else {
      state.phase = 'break';
      state.remainingTime = state.settings.break * 60 * 1000;
      notificationTitle = 'Focus Complete!';
      notificationMessage = 'Take a short break. Ketchup bottle is refilling...';
      notificationIcon = 'images/icon-empty-128.png';
    }
  } else {
    const wasLongBreak = state.phase === 'longBreak';
    state.phase = 'focus';
    state.remainingTime = state.settings.focus * 60 * 1000;
    if (wasLongBreak) {
        state.cycle = 0;
    }
    notificationTitle = 'Break Complete!';
    notificationMessage = 'Ready to focus? The ketchup is full!';
    notificationIcon = 'images/icon-128.png';
  }

  await chrome.storage.local.set({ timerState: state });
  
  chrome.notifications.create('', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL(notificationIcon),
    title: notificationTitle,
    message: notificationMessage,
    buttons: [{ title: 'OK - Start Next Phase' }],
    requireInteraction: true
  });
  
  chrome.runtime.sendMessage({ action: 'stateUpdated' }).catch(() => {});
  await updateIcon();
}

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    const data = await chrome.storage.local.get('timerState');
    if (!data.timerState) return;
    
    let state = data.timerState as TimerState;
    state.state = 'running';
    state.endTime = Date.now() + state.remainingTime;
    
    await chrome.storage.local.set({ timerState: state });
    chrome.alarms.create(ALARM_NAME, { when: state.endTime });
    chrome.runtime.sendMessage({ action: 'stateUpdated' }).catch(() => {});
    await updateIcon();
  }
});

/**
 * Offscreen Document を作成または取得します。
 */
async function setupOffscreenDocument() {
  if (isCreatingOffscreen) return;
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
  });
  if (existingContexts.length > 0) return;

  isCreatingOffscreen = true;
  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.DOM_SCRAPING],
      justification: 'Keep Service Worker alive for smooth icon animations'
    });
  } catch (e) {
    console.error(e);
  } finally {
    isCreatingOffscreen = false;
  }
}

/**
 * アイコンを描画して更新します。
 */
async function updateIcon() {
  const data = await chrome.storage.local.get('timerState');
  if (!data.timerState) return;
  const state = data.timerState as TimerState;

  // タイマーが動いている時だけ Offscreen Document を確実に作成
  if (state.state === 'running') {
    await setupOffscreenDocument();
  }

  let ratio = 1.0;
  if (state.state === 'running' || state.state === 'paused') {
    const totalMs = state.phase === 'focus' ? state.settings.focus * 60 * 1000 
                  : state.phase === 'break' ? state.settings.break * 60 * 1000 
                  : state.settings.longBreak * 60 * 1000;
    const remainingMs = state.state === 'running' ? Math.max(0, state.endTime - Date.now()) : state.remainingTime;
    ratio = (state.phase === 'focus') ? remainingMs / totalMs : 1 - (remainingMs / totalMs);
  } else {
    ratio = (state.phase === 'focus') ? 1.0 : 0.0;
  }
  ratio = Math.max(0, Math.min(1, ratio));

  const inverted = state.phase === 'focus' && (state.state === 'running' || state.state === 'paused');
  const isAnimating = state.state === 'running';
  
  const imageData16 = renderIconInSW(ratio, 16, inverted, isAnimating);
  const imageData32 = renderIconInSW(ratio, 32, inverted, isAnimating);

  if (imageData16 && imageData32) {
    chrome.action.setIcon({
      imageData: { "16": imageData16, "32": imageData32 }
    });
  }
}

/**
 * Service Worker 内で OffscreenCanvas を使って描画します。
 */
function renderIconInSW(ratio: number, size: number, inverted: boolean = false, isAnimating: boolean = false): ImageData | null {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  const s = size / 16;
  ctx.scale(s, s);
  ctx.save();
  ctx.translate(8, 8); 
  if (inverted) {
    ctx.rotate(Math.PI);
    if (isAnimating) ctx.translate(0, 3);
  }
  ctx.scale(1.05, 1.05);
  ctx.translate(-8, -8);

  const path = new Path2D('M 5.5 6 C 5.5 6, 4 7.5, 4 10 C 4 12.5, 4 14.5, 4 14.5 C 4 15, 4.5 15.5, 5 15.5 L 11 15.5 C 11.5 15.5, 12 15, 12 14.5 C 12 14.5, 12 12.5, 12 10 C 12 7.5, 10.5 6, 10.5 6 L 9.5 4 L 6.5 4 Z');
  ctx.fillStyle = '#ffffff';
  ctx.fill(path);

  ctx.save();
  ctx.clip(path);
  const time = Date.now();
  let currentRatio = ratio;
  if (isAnimating && !inverted) {
    const wave = Math.sin(time / 200) * 0.02;
    currentRatio = Math.max(0, Math.min(1, ratio + wave));
  }
  const fillHeight = 11.5 * currentRatio;
  const liquidGrad = ctx.createLinearGradient(0, 0, 16, 0);
  liquidGrad.addColorStop(0, '#ff8585');
  liquidGrad.addColorStop(1, '#ff4d4d');
  ctx.fillStyle = liquidGrad;

  if (inverted) {
    ctx.fillRect(0, 4, 16, fillHeight);
  } else {
    const fillY = 15.5 - fillHeight;
    ctx.fillRect(0, fillY, 16, 12);
    if (isAnimating && ratio < 0.98) {
      ctx.fillStyle = '#ff4d4d';
      const cycle = 1200;
      const progress = (time % cycle) / cycle;
      const d1y = -2 + (progress * (fillY + 2)); 
      if (d1y < fillY) {
        ctx.beginPath(); ctx.arc(8, d1y, 0.8, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.restore();

  ctx.fillStyle = '#ffd700';
  ctx.fillRect(6.25, 2, 3.5, 2);
  ctx.fillRect(7, 0.5, 2, 1.5);

  if (isAnimating) {
    const cycle = 1300;
    const progress = (time % cycle) / cycle;
    ctx.fillStyle = '#ff4d4d';
    const d1y = 0.5 - (progress * 7);
    if (d1y < 0.4 && d1y > -6.5) {
      ctx.beginPath(); ctx.arc(8, d1y, 0.9, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();

  return ctx.getImageData(0, 0, size, size);
}

// 初期化
updateIcon();
