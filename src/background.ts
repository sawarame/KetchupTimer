/// <reference types="chrome" />

type Phase = 'focus' | 'break' | 'longBreak';
type State = 'running' | 'paused' | 'stopped';

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
const ICON_UPDATE_ALARM = 'ketchupIconUpdate';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startAlarm') {
    chrome.alarms.create(ALARM_NAME, { when: message.endTime });
    chrome.alarms.create(ICON_UPDATE_ALARM, { periodInMinutes: 0.1 }); // Update icon every 6 seconds
    updateIcon();
  } else if (message.action === 'clearAlarm') {
    chrome.alarms.clear(ALARM_NAME);
    chrome.alarms.clear(ICON_UPDATE_ALARM);
    updateIcon();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    chrome.alarms.clear(ICON_UPDATE_ALARM);
    await handlePhaseEnd();
  } else if (alarm.name === ICON_UPDATE_ALARM) {
    await updateIcon();
  }
});

async function handlePhaseEnd() {
  const data = await chrome.storage.local.get('timerState');
  if (!data.timerState) return;
  
  let state = data.timerState as TimerState;
  state.state = 'stopped';
  
  let notificationTitle = '';
  let notificationMessage = '';

  if (state.phase === 'focus') {
    state.cycle += 1;
    if (state.cycle >= state.settings.cycles) {
      state.phase = 'longBreak';
      state.remainingTime = state.settings.longBreak * 60 * 1000;
      notificationTitle = 'Focus Complete!';
      notificationMessage = 'Time for a long break. Ketchup bottle is refilling...';
    } else {
      state.phase = 'break';
      state.remainingTime = state.settings.break * 60 * 1000;
      notificationTitle = 'Focus Complete!';
      notificationMessage = 'Take a short break. Ketchup bottle is refilling...';
    }
  } else {
    // Break finished
    const wasLongBreak = state.phase === 'longBreak';
    state.phase = 'focus';
    state.remainingTime = state.settings.focus * 60 * 1000;
    if (wasLongBreak) {
        state.cycle = 0;
    }
    notificationTitle = 'Break Complete!';
    notificationMessage = 'Ready to focus? The ketchup is full!';
  }

  await chrome.storage.local.set({ timerState: state });
  
  chrome.notifications.create(
    '',
    {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('images/icon-128.png'),
      title: notificationTitle,
      message: notificationMessage,
      buttons: [{ title: 'OK - Start Next Phase' }],
      requireInteraction: true
    },
    (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error('Notification error:', chrome.runtime.lastError);
      } else {
        console.log('Notification shown:', notificationId);
      }
    }
  );
  
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
    chrome.alarms.create(ICON_UPDATE_ALARM, { periodInMinutes: 0.1 });
    chrome.runtime.sendMessage({ action: 'stateUpdated' }).catch(() => {});
    await updateIcon();
  }
});

// Dynamic Icon Rendering Logic
async function updateIcon() {
  const data = await chrome.storage.local.get('timerState');
  if (!data.timerState) return;
  const state = data.timerState as TimerState;
  
  let ratio = 1.0; // 1.0 means full ketchup

  if (state.state === 'running') {
    const totalMs = state.phase === 'focus' ? state.settings.focus * 60 * 1000 
                  : state.phase === 'break' ? state.settings.break * 60 * 1000 
                  : state.settings.longBreak * 60 * 1000;
                  
    const remainingMs = Math.max(0, state.endTime - Date.now());
    
    if (state.phase === 'focus') {
      ratio = remainingMs / totalMs; // Decrease during focus
    } else {
      ratio = 1 - (remainingMs / totalMs); // Increase (refill) during break
    }
  } else {
    if (state.phase === 'focus') {
      ratio = 1.0;
    } else {
      ratio = 0.0;
    }
  }

  // Ensure ratio is between 0 and 1
  ratio = Math.max(0, Math.min(1, ratio));

  await drawIcon(ratio);
}

async function drawIcon(ratio: number) {
  const canvas = new OffscreenCanvas(16, 16);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, 16, 16);

  // Draw bottle silhouette (white/gray border)
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Simplified path for 16x16 icon
  // top cap
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(6, 1, 4, 3);
  
  // bottle body
  ctx.beginPath();
  ctx.moveTo(7, 4);
  ctx.lineTo(9, 4);
  ctx.lineTo(13, 8);
  ctx.lineTo(13, 15);
  ctx.lineTo(3, 15);
  ctx.lineTo(3, 8);
  ctx.closePath();
  
  // clipping region for liquid
  ctx.save();
  ctx.clip();
  
  // draw liquid
  const fillHeight = Math.floor(11 * ratio); // max height of liquid is roughly 11px
  const fillY = 15 - fillHeight;
  
  ctx.fillStyle = '#ff4d4d';
  ctx.fillRect(2, fillY, 12, 11);
  ctx.restore();
  
  // draw bottle border again over liquid
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, 16, 16);
  chrome.action.setIcon({ imageData });
}

// Initial icon setup
updateIcon();