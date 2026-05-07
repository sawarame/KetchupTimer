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

  if (state.state === 'running' || state.state === 'paused') {
    const totalMs = state.phase === 'focus' ? state.settings.focus * 60 * 1000 
                  : state.phase === 'break' ? state.settings.break * 60 * 1000 
                  : state.settings.longBreak * 60 * 1000;
                  
    const remainingMs = state.state === 'running'
      ? Math.max(0, state.endTime - Date.now())
      : state.remainingTime;
    
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

  await drawIcon(ratio, state.phase === 'focus' && (state.state === 'running' || state.state === 'paused'));
}

async function drawIcon(ratio: number, inverted: boolean = false) {
  const canvas = new OffscreenCanvas(16, 16);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, 16, 16);

  // Draw Bottle (Maximized)
  ctx.save();
  ctx.translate(8, 8); 
  ctx.scale(1.05, 1.05);
  if (inverted) {
    ctx.rotate(Math.PI);
  }
  ctx.translate(-8, -8);

  // Bottle Body Path
  const path = new Path2D('M 5.5 6 C 5.5 6, 4 7.5, 4 10 C 4 12.5, 4 14.5, 4 14.5 C 4 15, 4.5 15.5, 5 15.5 L 11 15.5 C 11.5 15.5, 12 15, 12 14.5 C 12 14.5, 12 12.5, 12 10 C 12 7.5, 10.5 6, 10.5 6 L 9.5 4 L 6.5 4 Z');
  
  // Bottle interior background (white)
  ctx.fillStyle = '#ffffff';
  ctx.fill(path);

  // Draw liquid with gradient highlight
  ctx.save();
  ctx.clip(path);
  const fillHeight = 11.5 * ratio;
  
  const liquidGrad = ctx.createLinearGradient(0, 0, 16, 0);
  liquidGrad.addColorStop(0, '#ff8585');
  liquidGrad.addColorStop(1, '#ff4d4d');
  ctx.fillStyle = liquidGrad;

  if (inverted) {
    // Fill from near the cap (y=4) downwards in rotated space (which is upwards on screen)
    ctx.fillRect(0, 4, 16, fillHeight);
  } else {
    // Fill from bottom (y=15.5) upwards
    const fillY = 15.5 - fillHeight;
    ctx.fillRect(0, fillY, 16, 12);
  }
  ctx.restore();

  // Draw Cap (flat)
  ctx.fillStyle = '#ffd700';
  
  // Cap parts
  ctx.fillRect(6.25, 2, 3.5, 2);
  ctx.fillRect(7, 0.5, 2, 1.5);

  ctx.restore();

  const imageData = ctx.getImageData(0, 0, 16, 16);
  chrome.action.setIcon({ imageData });
}

// Initial icon setup
updateIcon();