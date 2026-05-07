/// <reference types="chrome" />

type Phase = 'focus' | 'break' | 'longBreak';
type State = 'running' | 'paused' | 'stopped';

export interface TimerState {
  phase: Phase;
  state: State;
  remainingTime: number; // in milliseconds
  endTime: number; // in milliseconds (timestamp)
  cycle: number;
  settings: {
    focus: number;
    break: number;
    longBreak: number;
    cycles: number;
  };
}

const defaultSettings = {
  focus: 25,
  break: 5,
  longBreak: 15,
  cycles: 4
};

let displayInterval: number | null = null;

// UI Elements
const timerDisplay = document.getElementById('timerDisplay') as HTMLDivElement;
const phaseDisplay = document.getElementById('phaseDisplay') as HTMLDivElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;

// Settings UI Elements
const focusTimeInput = document.getElementById('focusTime') as HTMLInputElement;
const breakTimeInput = document.getElementById('breakTime') as HTMLInputElement;
const longBreakTimeInput = document.getElementById('longBreakTime') as HTMLInputElement;
const cyclesInput = document.getElementById('cycles') as HTMLInputElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;

function formatTime(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

async function getState(): Promise<TimerState> {
  const data = await chrome.storage.local.get('timerState');
  if (data.timerState) {
    return data.timerState as TimerState;
  }
  return {
    phase: 'focus',
    state: 'stopped',
    remainingTime: defaultSettings.focus * 60 * 1000,
    endTime: 0,
    cycle: 0,
    settings: { ...defaultSettings }
  } as TimerState;
}

async function saveState(state: TimerState) {
  await chrome.storage.local.set({ timerState: state });
}

async function updateDisplay(state: TimerState) {
  let ms = state.remainingTime;
  if (state.state === 'running') {
    ms = state.endTime - Date.now();
  }
  timerDisplay.textContent = formatTime(ms);
  
  let phaseText = 'Focus';
  if (state.phase === 'break') phaseText = 'Break';
  if (state.phase === 'longBreak') phaseText = 'Long Break';
  phaseDisplay.textContent = `${phaseText} (Cycle: ${state.cycle}/${state.settings.cycles})`;

  focusTimeInput.value = state.settings.focus.toString();
  breakTimeInput.value = state.settings.break.toString();
  longBreakTimeInput.value = state.settings.longBreak.toString();
  cyclesInput.value = state.settings.cycles.toString();
}

async function init() {
  const state = await getState();
  await updateDisplay(state);

  if (state.state === 'running') {
    startDisplayLoop();
  }

  startBtn.addEventListener('click', async () => {
    const currentState = await getState();
    if (currentState.state !== 'running') {
      currentState.state = 'running';
      currentState.endTime = Date.now() + currentState.remainingTime;
      await saveState(currentState);
      
      // Notify background to start alarm
      chrome.runtime.sendMessage({ action: 'startAlarm', endTime: currentState.endTime }).catch(() => {});
      
      startDisplayLoop();
    }
  });

  pauseBtn.addEventListener('click', async () => {
    const currentState = await getState();
    if (currentState.state === 'running') {
      currentState.state = 'paused';
      currentState.remainingTime = Math.max(0, currentState.endTime - Date.now());
      await saveState(currentState);
      
      chrome.runtime.sendMessage({ action: 'clearAlarm' }).catch(() => {});
      stopDisplayLoop();
      await updateDisplay(currentState);
    }
  });

  resetBtn.addEventListener('click', async () => {
    const currentState = await getState();
    currentState.state = 'stopped';
    currentState.phase = 'focus';
    currentState.cycle = 0;
    currentState.remainingTime = currentState.settings.focus * 60 * 1000;
    await saveState(currentState);
    
    chrome.runtime.sendMessage({ action: 'clearAlarm' }).catch(() => {});
    stopDisplayLoop();
    await updateDisplay(currentState);
  });

  saveBtn.addEventListener('click', async () => {
    const currentState = await getState();
    currentState.settings.focus = parseInt(focusTimeInput.value, 10);
    currentState.settings.break = parseInt(breakTimeInput.value, 10);
    currentState.settings.longBreak = parseInt(longBreakTimeInput.value, 10);
    currentState.settings.cycles = parseInt(cyclesInput.value, 10);
    
    if (currentState.state === 'stopped') {
      if (currentState.phase === 'focus') currentState.remainingTime = currentState.settings.focus * 60 * 1000;
      else if (currentState.phase === 'break') currentState.remainingTime = currentState.settings.break * 60 * 1000;
      else if (currentState.phase === 'longBreak') currentState.remainingTime = currentState.settings.longBreak * 60 * 1000;
    }
    
    await saveState(currentState);
    await updateDisplay(currentState);
  });
}

function startDisplayLoop() {
  if (displayInterval) return;
  displayInterval = window.setInterval(async () => {
    const state = await getState();
    if (state.state === 'running') {
      await updateDisplay(state);
    } else {
      stopDisplayLoop();
    }
  }, 1000);
}

function stopDisplayLoop() {
  if (displayInterval) {
    clearInterval(displayInterval);
    displayInterval = null;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'stateUpdated') {
    getState().then(state => {
      updateDisplay(state);
      if (state.state === 'stopped') {
        stopDisplayLoop();
      }
    });
  }
});

init();