/// <reference types="chrome" />
import { getMessage, initI18n } from './i18n';

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

type StreamPinEdge = 'none' | 'top' | 'bottom';

const ALARM_NAME = 'ketchupTimerAlarm';
const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

// Service Worker が js/background.js 配下で動作するため、拡張機能ルート基準のパスを指定する
const STATIC_FULL_ICON_PATHS: Record<string, string> = {
  '16': '/images/icon-16.png',
  '32': '/images/icon-32.png'
};

const STATIC_EMPTY_ICON_PATHS: Record<string, string> = {
  '16': '/images/icon-empty-16.png',
  '32': '/images/icon-empty-32.png'
};

let isCreatingOffscreen = false;
let lastStaticIconMode: 'full' | 'empty' | null = null;

// メッセージハンドラ
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.action === 'startAlarm') {
    chrome.alarms.create(ALARM_NAME, { when: message.endTime });
    void updateIcon();
  } else if (message.action === 'clearAlarm') {
    chrome.alarms.clear(ALARM_NAME);
    void updateIcon();
  } else if (message.action === 'heartbeat') {
    void updateIcon();
  } else if (message.action === 'offscreenReady') {
    void updateIcon();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await handlePhaseEnd();
  }
});

/**
 * フェーズ終了時の状態遷移およびシステム通知の表示を行う
 * @returns 処理完了を示す Promise
 */
async function handlePhaseEnd(): Promise<void> {
  // Service Worker 復帰直後や言語変更直後でも最新設定を反映するため、通知生成前に言語をロードする
  await initI18n();

  const data = await chrome.storage.local.get('timerState');
  if (!data.timerState) return;

  const state = data.timerState as TimerState;
  state.state = 'stopped';

  let notificationTitle = '';
  let notificationMessage = '';
  let notificationIcon = 'images/icon-128.png';

  if (state.phase === 'focus') {
    state.cycle += 1;
    // 集中時間を記録する
    await recordFocusTime(state.settings.focus);

    if (state.cycle >= state.settings.cycles) {
      state.phase = 'longBreak';
      state.remainingTime = state.settings.longBreak * 60 * 1000;
      notificationTitle = getMessage('notifFocusCompleteTitle', undefined, 'Focus Complete!');
      notificationMessage = getMessage(
        'notifLongBreakMessage',
        undefined,
        'Time for a long break. Ketchup bottle is refilling...'
      );
      notificationIcon = 'images/icon-empty-128.png';
    } else {
      state.phase = 'break';
      state.remainingTime = state.settings.break * 60 * 1000;
      notificationTitle = getMessage('notifFocusCompleteTitle', undefined, 'Focus Complete!');
      notificationMessage = getMessage(
        'notifShortBreakMessage',
        undefined,
        'Take a short break. Ketchup bottle is refilling...'
      );
      notificationIcon = 'images/icon-empty-128.png';
    }
  } else {
    const wasLongBreak = state.phase === 'longBreak';
    state.phase = 'focus';
    state.remainingTime = state.settings.focus * 60 * 1000;
    if (wasLongBreak) {
      state.cycle = 0;
    }
    notificationTitle = getMessage('notifBreakCompleteTitle', undefined, 'Break Complete!');
    notificationMessage = getMessage(
      'notifBreakCompleteMessage',
      undefined,
      'Ready to focus? The ketchup is full!'
    );
    notificationIcon = 'images/icon-128.png';
  }

  await chrome.storage.local.set({ timerState: state });

  chrome.notifications.create('', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL(notificationIcon),
    title: notificationTitle,
    message: notificationMessage,
    buttons: [{ title: getMessage('notifNextPhaseButton', undefined, 'OK - Start Next Phase') }],
    requireInteraction: true
  });

  chrome.runtime.sendMessage({ action: 'stateUpdated' }).catch(() => {});
  await updateIcon();
}

chrome.notifications.onButtonClicked.addListener(async (_notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    const data = await chrome.storage.local.get('timerState');
    if (!data.timerState) return;

    const state = data.timerState as TimerState;
    state.state = 'running';
    state.endTime = Date.now() + state.remainingTime;

    await chrome.storage.local.set({ timerState: state });
    chrome.alarms.create(ALARM_NAME, { when: state.endTime });
    chrome.runtime.sendMessage({ action: 'stateUpdated' }).catch(() => {});
    await updateIcon();
  }
});

/**
 * ハートビート送信用 Offscreen Document を必要に応じて作成する
 */
async function setupOffscreenDocument(): Promise<void> {
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
 * タイマー非稼働時に不要な Offscreen Document を閉じる
 */
async function closeOffscreenDocument(): Promise<void> {
  try {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
    });
    if (existingContexts.length > 0) {
      await chrome.offscreen.closeDocument();
    }
  } catch (e) {
    console.error(e);
  }
}

/**
 * 静的アイコンをツールバーに設定する（重複設定を抑制）
 * @param mode - 満タン（full）または空（empty）
 */
async function setStaticToolbarIcon(mode: 'full' | 'empty'): Promise<void> {
  if (lastStaticIconMode === mode) return;
  try {
    await chrome.action.setIcon({
      path: mode === 'full' ? STATIC_FULL_ICON_PATHS : STATIC_EMPTY_ICON_PATHS
    });
    lastStaticIconMode = mode;
  } catch (e) {
    console.error('[Icon Error] Failed to set static toolbar icon:', e);
  }
}

/**
 * 現在のタイマー状態に応じてツールバーアイコンを更新する
 */
async function updateIcon(): Promise<void> {
  const data = await chrome.storage.local.get('timerState');
  if (!data.timerState) {
    await closeOffscreenDocument();
    await setStaticToolbarIcon('full');
    return;
  }

  const state = data.timerState as TimerState;

  // 停止中はタイマーリング付きの新しい静的アイコンを表示する
  if (state.state === 'stopped') {
    await closeOffscreenDocument();
    const iconMode: 'full' | 'empty' = state.phase === 'focus' ? 'full' : 'empty';
    await setStaticToolbarIcon(iconMode);
    return;
  }

  // 動作中・一時停止中は動的描画へ切り替えるため静的アイコンキャッシュを解除
  lastStaticIconMode = null;

  if (state.state === 'running') {
    await setupOffscreenDocument();
  } else {
    await closeOffscreenDocument();
  }

  const totalMs = state.phase === 'focus'
    ? state.settings.focus * 60 * 1000
    : state.phase === 'break'
      ? state.settings.break * 60 * 1000
      : state.settings.longBreak * 60 * 1000;
  const safeTotalMs = Math.max(1, totalMs);
  const remainingMs = state.state === 'running'
    ? Math.max(0, state.endTime - Date.now())
    : state.remainingTime;
  const rawRatio = state.phase === 'focus'
    ? remainingMs / safeTotalMs
    : 1 - (remainingMs / safeTotalMs);
  const ratio = Math.max(0, Math.min(1, rawRatio));

  const inverted = state.phase === 'focus';
  const isAnimating = state.state === 'running';
  const now = Date.now();

  const imageData16 = renderIconInSW(ratio, 16, inverted, isAnimating, now);
  const imageData32 = renderIconInSW(ratio, 32, inverted, isAnimating, now);

  if (imageData16 && imageData32) {
    try {
      await chrome.action.setIcon({
        imageData: { '16': imageData16, '32': imageData32 }
      });
    } catch (e) {
      console.error('[Icon Error] Failed to set dynamic toolbar icon:', e);
    }
  }
}

/**
 * 途切れずに波打ち・脈打ちながら流れるケチャップの連続ストリームを描画する
 * （32x32 論理座標系）
 *
 * @param ctx - 描画先 2D コンテキスト
 * @param centerX - ストリーム基準 X 座標
 * @param startY - ストリーム開始 Y 座標（上端）
 * @param endY - ストリーム終了 Y 座標（下端）
 * @param time - アニメーション基準時刻（ミリ秒）
 * @param baseHalfWidth - ストリームの基本半幅
 * @param pinEdge - ノズル口元に自然接続するため横揺れを抑える端点
 */
function drawContinuousStream(
  ctx: OffscreenCanvasRenderingContext2D,
  centerX: number,
  startY: number,
  endY: number,
  time: number,
  baseHalfWidth: number,
  pinEdge: StreamPinEdge
): void {
  const length = endY - startY;
  if (length <= 0.5) return;

  const steps = Math.max(8, Math.ceil(length));
  const leftPoints: Array<{ x: number; y: number }> = [];
  const rightPoints: Array<{ x: number; y: number }> = [];
  const highlightPoints: Array<{ x: number; y: number }> = [];

  // 時間経過で位相が下方向へ流れるようにオフセットを算出
  const timePhase = time / 105;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = startY + length * t;
    const wavePhase = y * 0.58 - timePhase;

    // ノズル接続端は横揺れを抑え、自由端に向かって柔らかい波打ちを強める
    let swayWeight = 0.75;
    if (pinEdge === 'top') {
      swayWeight = Math.min(1, t * 2.4);
    } else if (pinEdge === 'bottom') {
      swayWeight = Math.min(1, (1 - t) * 2.4);
    }
    const sway = Math.sin(wavePhase) * 1.05 * swayWeight;

    // ニュルッと押し出されるような太さの脈動
    const pulse = Math.sin(wavePhase * 1.35 + 0.9) * (baseHalfWidth * 0.28);
    let taper = 1.0;
    if (pinEdge === 'top') {
      taper = 0.8 + 0.2 * Math.min(1, t * 3);
    } else if (pinEdge === 'bottom') {
      taper = 0.75 + 0.25 * Math.min(1, (1 - t) * 3);
    }
    const halfWidth = Math.max(0.85, (baseHalfWidth + pulse) * taper);

    const cx = centerX + sway;
    leftPoints.push({ x: cx - halfWidth, y });
    rightPoints.push({ x: cx + halfWidth, y });
    highlightPoints.push({ x: cx - halfWidth * 0.35, y });
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
  for (let i = 1; i < leftPoints.length; i++) {
    ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
  }
  for (let i = rightPoints.length - 1; i >= 0; i--) {
    ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
  }
  ctx.closePath();

  const streamGrad = ctx.createLinearGradient(centerX - baseHalfWidth * 1.4, 0, centerX + baseHalfWidth * 1.4, 0);
  streamGrad.addColorStop(0, '#ff7878');
  streamGrad.addColorStop(0.5, '#ff4d4d');
  streamGrad.addColorStop(1, '#c81e30');
  ctx.fillStyle = streamGrad;
  ctx.fill();

  // ストリームのツヤ表現（細いハイライト）
  ctx.beginPath();
  ctx.moveTo(highlightPoints[0].x, highlightPoints[0].y);
  for (let i = 1; i < highlightPoints.length; i++) {
    ctx.lineTo(highlightPoints[i].x, highlightPoints[i].y);
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = Math.max(0.6, baseHalfWidth * 0.32);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

/**
 * モダンなケチャップボトル本体と液面・キャップを描画する
 * 基準座標（正位置）: X=8..24（中心16）, キャップ Y=1..7, ボトル胴体 Y=7..28
 *
 * @param ctx - 描画先 2D コンテキスト
 * @param ratio - 液面割合（0.0〜1.0）
 * @param isInverted - true のときは集中フェーズ（反転表示）
 * @param isAnimating - true のときはタイマー稼働中
 * @param time - アニメーション基準時刻（ミリ秒）
 */
function drawModernBottle(
  ctx: OffscreenCanvasRenderingContext2D,
  ratio: number,
  isInverted: boolean,
  isAnimating: boolean,
  time: number
): void {
  const bottleTop = 7;
  const bottleBottom = 27.5;
  const bottleHeight = bottleBottom - bottleTop;

  // 新アイコン（src/icon.svg）と造形を統一したモダンなスクイーズボトルパス
  const bottlePath = new Path2D(
    'M 12.6 7 L 19.4 7 L 20.3 9.2 C 22.8 10.4, 24 12.6, 24 15.4 L 24 23.6 C 24 26, 22 27.5, 19.6 27.5 L 12.4 27.5 C 10 27.5, 8 26, 8 23.6 L 8 15.4 C 8 12.6, 9.2 10.4, 11.7 9.2 Z'
  );

  // ボトル下地（ダークテーマでも浮き立つクリーンホワイト）
  ctx.fillStyle = '#ffffff';
  ctx.fill(bottlePath);

  // 内部のケチャップ液体とハイライト
  ctx.save();
  ctx.clip(bottlePath);

  let currentRatio = ratio;
  if (isAnimating) {
    const waveAmp = isInverted ? 0.012 : 0.02;
    currentRatio = Math.max(0, Math.min(1, ratio + Math.sin(time / 180) * waveAmp));
  }

  const fillHeight = bottleHeight * currentRatio;
  const liquidGrad = ctx.createLinearGradient(8, 0, 24, 0);
  liquidGrad.addColorStop(0, '#ff7d7d');
  liquidGrad.addColorStop(0.5, '#ff4d4d');
  liquidGrad.addColorStop(1, '#cf2334');
  ctx.fillStyle = liquidGrad;

  if (isInverted) {
    // 反転時は重力でノズル側（ローカル座標の上端: bottleTop）に液体が集まる
    const liquidEndY = bottleTop + fillHeight;
    ctx.fillRect(7, bottleTop - 0.5, 18, fillHeight + 0.5);

    // 液面の柔らかな波打ち（空・満タン付近を除く）
    if (isAnimating && currentRatio > 0.03 && currentRatio < 0.97) {
      ctx.beginPath();
      ctx.moveTo(7, liquidEndY);
      const waveOffset = Math.sin(time / 150) * 0.7;
      ctx.quadraticCurveTo(16, liquidEndY + waveOffset, 25, liquidEndY);
      ctx.lineTo(25, bottleTop);
      ctx.lineTo(7, bottleTop);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // 正位置時は下端（bottleBottom）から上に向かって液体が貯まる
    const liquidY = bottleBottom - fillHeight;
    ctx.fillRect(7, liquidY, 18, fillHeight + 1);

    // 休憩中の稼働時は、ボトル口元から現在の液面まで連続ストリームを接続して注ぎ込む
    if (isAnimating && currentRatio < 0.98) {
      drawContinuousStream(ctx, 16, bottleTop - 1, liquidY + 1.2, time, 1.35, 'top');
    }

    // 液面の柔らかな波打ち
    if (isAnimating && currentRatio > 0.03 && currentRatio < 0.97) {
      ctx.fillStyle = liquidGrad;
      ctx.beginPath();
      const waveOffset = Math.sin(time / 160) * 0.8;
      ctx.moveTo(7, liquidY);
      ctx.quadraticCurveTo(16, liquidY - waveOffset, 25, liquidY);
      ctx.lineTo(25, bottleBottom + 1);
      ctx.lineTo(7, bottleBottom + 1);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 左側面ハイライト（モダンな光沢感）
  ctx.beginPath();
  ctx.moveTo(10.8, 12);
  ctx.quadraticCurveTo(10.1, 14, 10.1, 16.5);
  ctx.lineTo(10.1, 23);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();

  // ボトルの輪郭線（ライト・ダークテーマ両方でくっきり視認できるように締める）
  ctx.strokeStyle = ratio > 0.05 ? '#b81d2c' : '#ff4d4d';
  ctx.lineWidth = 1.2;
  ctx.lineJoin = 'round';
  ctx.stroke(bottlePath);

  // モダンなマスタードゴールドのキャップ＆ノズル
  const capGrad = ctx.createLinearGradient(11, 0, 21, 0);
  capGrad.addColorStop(0, '#ffe57f');
  capGrad.addColorStop(0.55, '#ffc928');
  capGrad.addColorStop(1, '#e0a000');

  // ノズル（台形）
  ctx.beginPath();
  ctx.moveTo(14.8, 0.8);
  ctx.lineTo(17.2, 0.8);
  ctx.lineTo(18.2, 4);
  ctx.lineTo(13.8, 4);
  ctx.closePath();
  ctx.fillStyle = capGrad;
  ctx.fill();
  ctx.strokeStyle = '#b88200';
  ctx.lineWidth = 0.85;
  ctx.stroke();

  // キャップベース（角丸）
  ctx.beginPath();
  ctx.roundRect(11.6, 3.8, 8.8, 3.4, 1.2);
  ctx.fillStyle = capGrad;
  ctx.fill();
  ctx.strokeStyle = '#b88200';
  ctx.lineWidth = 0.85;
  ctx.stroke();
}

/**
 * 動作中・一時停止中のツールバー動的アイコンを描画する
 * （外周タイマーリングは描画せず、ボトル本体と連続ストリームを大きく鮮明に表示）
 *
 * @param ratio - 液面割合（0.0〜1.0）
 * @param size - 出力アイコンサイズ（16 または 32）
 * @param inverted - 集中フェーズの反転フラグ
 * @param isAnimating - タイマー稼働中フラグ
 * @param time - アニメーション基準時刻（ミリ秒）
 * @returns 描画した ImageData（コンテキスト取得失敗時は null）
 */
function renderIconInSW(
  ratio: number,
  size: number,
  inverted: boolean = false,
  isAnimating: boolean = false,
  time: number = Date.now()
): ImageData | null {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);

  // 32x32 の論理座標系に統一してスケーリングする
  const scale = size / 32;
  ctx.scale(scale, scale);

  if (inverted) {
    // 集中フェーズ（Focus）:
    // ボトルを反転して上寄せ配置し、ノズル先端から下端へ途切れないストリームを流す
    const bottleScale = isAnimating ? 0.78 : 0.96;
    const nozzleWorldY = isAnimating ? 22.0 : 28.6;

    // 稼働中は先に連続ストリームを描画し、ノズル先端と自然に接続させる
    if (isAnimating) {
      drawContinuousStream(ctx, 16, nozzleWorldY - 0.8, 32, time, 1.9, 'top');
    }

    ctx.save();
    // 変換後、ローカル Y=0.8（ノズル先端）が nozzleWorldY に来るように配置
    ctx.translate(16, nozzleWorldY + 0.8 * bottleScale);
    ctx.rotate(Math.PI);
    ctx.scale(bottleScale, bottleScale);
    ctx.translate(-16, 0);
    drawModernBottle(ctx, ratio, true, isAnimating, time);
    ctx.restore();
  } else {
    // 休憩フェーズ（Break / Long Break）:
    // ボトルを正位置で下寄せ配置し、上端からボトルへ途切れないストリームを注ぎ込む
    const bottleScale = isAnimating ? 0.82 : 0.96;
    const bottleBottomWorldY = 30.8;
    const nozzleWorldY = bottleBottomWorldY - (27.5 - 0.8) * bottleScale;

    if (isAnimating && ratio < 0.98) {
      // 画面上端からボトルのノズル口元へ連続して注ぎ込むストリーム
      drawContinuousStream(ctx, 16, 0, nozzleWorldY + 1.2, time, 1.75, 'bottom');
    }

    ctx.save();
    ctx.translate(16, bottleBottomWorldY - 27.5 * bottleScale);
    ctx.scale(bottleScale, bottleScale);
    ctx.translate(-16, 0);
    drawModernBottle(ctx, ratio, false, isAnimating, time);
    ctx.restore();
  }

  return ctx.getImageData(0, 0, size, size);
}

/**
 * 集中時間を記録します（分単位）。
 * @param minutes - 記録する集中時間（分）
 */
async function recordFocusTime(minutes: number): Promise<void> {
  try {
    const now = new Date();
    // ローカルタイムでの YYYY-MM-DD 形式を取得
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const data = await chrome.storage.local.get('stats');
    const stats = (data.stats || {}) as { [key: string]: number };

    stats[today] = (stats[today] || 0) + minutes;
    await chrome.storage.local.set({ stats });
    console.log(`[Stats] Recorded ${minutes}min for ${today}. Total: ${stats[today]}min`);
  } catch (e) {
    console.error('[Stats Error] Failed to record focus time:', e);
  }
}

// 初期化
void updateIcon();
