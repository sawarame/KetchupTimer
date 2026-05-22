/// <reference types="chrome" />
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

type Phase = 'focus' | 'break' | 'longBreak';
type State = 'running' | 'paused' | 'stopped';
type Period = 'daily' | 'weekly' | 'monthly';

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
let currentChart: Chart | null = null;

// UI Elements
const mainView = document.getElementById('mainView') as HTMLDivElement;
const statsView = document.getElementById('statsView') as HTMLDivElement;
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

  const isNotStopped = state.state !== 'stopped';
  focusTimeInput.disabled = isNotStopped;
  breakTimeInput.disabled = isNotStopped;
  longBreakTimeInput.disabled = isNotStopped;
  cyclesInput.disabled = isNotStopped;

  if (state.state === 'stopped') {
    startBtn.style.display = '';
    startBtn.textContent = 'Start';
    pauseBtn.style.display = 'none';
  } else if (state.state === 'running') {
    startBtn.style.display = 'none';
    pauseBtn.style.display = '';
  } else if (state.state === 'paused') {
    startBtn.style.display = '';
    startBtn.textContent = 'Resume';
    pauseBtn.style.display = 'none';
  }
}

/**
 * 統計グラフを更新します。
 */
async function updateChart(period: Period) {
  const data = await chrome.storage.local.get('stats');
  const stats = (data.stats || {}) as { [key: string]: number };
  
  const labels: string[] = [];
  const values: number[] = [];
  const now = new Date();
  
  if (period === 'daily') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      labels.push(dateStr.slice(5)); // MM-DD
      values.push(stats[dateStr] || 0);
    }
  } else if (period === 'weekly') {
    for (let i = 3; i >= 0; i--) {
      let weekSum = 0;
      const d = new Date();
      d.setDate(now.getDate() - (i * 7));
      const day = d.getDay() || 7;
      d.setHours(-24 * (day - 1));
      const startStr = d.toISOString().split('T')[0];
      for (let j = 0; j < 7; j++) {
        const dd = new Date(d);
        dd.setDate(d.getDate() + j);
        const ds = dd.toISOString().split('T')[0];
        weekSum += stats[ds] || 0;
      }
      labels.push(`${startStr.slice(5)} week`);
      values.push(weekSum);
    }
  } else if (period === 'monthly') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      let monthSum = 0;
      Object.keys(stats).forEach(date => {
        if (date.startsWith(monthStr)) monthSum += stats[date];
      });
      labels.push(monthStr);
      values.push(monthSum);
    }
  }

  const ctx = document.getElementById('statsChart') as HTMLCanvasElement;
  if (currentChart) {
    currentChart.destroy();
  }

  currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Focus Time (min)',
        data: values,
        backgroundColor: '#ff4d4d',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 10 } }
        },
        x: {
          ticks: { font: { size: 10 } }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
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
      chrome.runtime.sendMessage({ action: 'startAlarm', endTime: currentState.endTime }).catch(() => {});
      await updateDisplay(currentState);
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

  const saveSettings = async () => {
    const currentState = await getState();
    currentState.settings.focus = parseInt(focusTimeInput.value, 10) || defaultSettings.focus;
    currentState.settings.break = parseInt(breakTimeInput.value, 10) || defaultSettings.break;
    currentState.settings.longBreak = parseInt(longBreakTimeInput.value, 10) || defaultSettings.longBreak;
    currentState.settings.cycles = parseInt(cyclesInput.value, 10) || defaultSettings.cycles;
    
    if (currentState.state === 'stopped') {
      if (currentState.phase === 'focus') currentState.remainingTime = currentState.settings.focus * 60 * 1000;
      else if (currentState.phase === 'break') currentState.remainingTime = currentState.settings.break * 60 * 1000;
      else if (currentState.phase === 'longBreak') currentState.remainingTime = currentState.settings.longBreak * 60 * 1000;
    }
    await saveState(currentState);
    await updateDisplay(currentState);
  };

  focusTimeInput.addEventListener('input', saveSettings);
  breakTimeInput.addEventListener('input', saveSettings);
  longBreakTimeInput.addEventListener('input', saveSettings);
  cyclesInput.addEventListener('input', saveSettings);

  // 画面遷移イベント
  document.getElementById('viewStats')?.addEventListener('click', (e) => {
    e.preventDefault();
    mainView.classList.remove('active');
    statsView.classList.add('active');
    updateChart('daily');
  });

  document.getElementById('backToTimer')?.addEventListener('click', () => {
    statsView.classList.remove('active');
    mainView.classList.add('active');
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      target.classList.add('active');
      updateChart(target.dataset.period as Period);
    });
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
