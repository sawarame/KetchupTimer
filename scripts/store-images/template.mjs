/**
 * Chrome ウェブストア用スクリーンショット画像の HTML / CSS テンプレート
 *
 * 基準キャンバスは 1280x800 とし、640x400 出力時はルートステージを 0.5 倍へ
 * 等倍スケーリングすることで、全サイズでレイアウト崩れのない出力を保証します。
 */

/**
 * HTML 特殊文字をエスケープする
 *
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 見出し配列を <br> で連結した HTML に変換する
 *
 * @param {string[]} lines
 * @returns {string}
 */
function renderLines(lines) {
  return lines.map((line) => escapeHtml(line)).join('<br>');
}

/**
 * 動的ツールバーアイコン（集中中・反転／休憩中・正位置）を再現したインライン SVG を生成する
 * src/background.ts のモダンケチャップボトル造形と連続ストリーム表現に準拠しています。
 *
 * @param {'focus' | 'break'} mode
 * @param {number} size
 * @returns {string}
 */
function renderDynamicBottleSvg(mode, size) {
  const uid = `dyn-${mode}-${size}`;

  if (mode === 'focus') {
    // 集中フェーズ: 反転ボトル + ノズルから流れ出る連続ストリーム（残量約 58%）
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 156" width="${size}" height="${Math.round(size * 1.3)}" aria-hidden="true">
        <defs>
          <linearGradient id="${uid}-liq" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ff7d7d" />
            <stop offset="50%" stop-color="#ff4d4d" />
            <stop offset="100%" stop-color="#cf2334" />
          </linearGradient>
          <linearGradient id="${uid}-cap" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ffe57f" />
            <stop offset="55%" stop-color="#ffc928" />
            <stop offset="100%" stop-color="#e0a000" />
          </linearGradient>
          <clipPath id="${uid}-clip">
            <path d="M 46 31 L 74 31 L 78 40 C 88 45, 93 54, 93 65 L 93 99 C 93 109, 85 115, 75 115 L 45 115 C 35 115, 27 109, 27 99 L 27 65 C 27 54, 32 45, 42 40 Z" />
          </clipPath>
        </defs>

        <!-- ノズル先端から下方向へ波打ちながら流れる連続ケチャップストリーム -->
        <path
          d="M 55.5 104 C 53 116, 61 124, 57 136 C 54 144, 58 150, 56 155 L 65 155 C 67 148, 63 142, 66 134 C 70 123, 62 115, 64.5 104 Z"
          fill="url(#${uid}-liq)"
        />
        <path
          d="M 58.2 108 C 56.8 118, 62 126, 59.5 137 C 58 144, 60.2 149, 59 153"
          fill="none"
          stroke="rgba(255,255,255,0.48)"
          stroke-width="2.4"
          stroke-linecap="round"
        />

        <!-- 反転したボトル本体（上下反転） -->
        <g transform="translate(60, 60) rotate(180) translate(-60, -60)">
          <path
            d="M 46 31 L 74 31 L 78 40 C 88 45, 93 54, 93 65 L 93 99 C 93 109, 85 115, 75 115 L 45 115 C 35 115, 27 109, 27 99 L 27 65 C 27 54, 32 45, 42 40 Z"
            fill="#ffffff"
          />
          <g clip-path="url(#${uid}-clip)">
            <!-- 重力でノズル側（ローカル上端）に集まった液体（約58%） -->
            <path
              d="M 24 28 L 96 28 L 96 78 Q 60 85 24 78 Z"
              fill="url(#${uid}-liq)"
            />
            <path
              d="M 38 48 C 35.5 53, 35 59, 35 66 L 35 94"
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              stroke-width="5.2"
              stroke-linecap="round"
            />
          </g>
          <path
            d="M 46 31 L 74 31 L 78 40 C 88 45, 93 54, 93 65 L 93 99 C 93 109, 85 115, 75 115 L 45 115 C 35 115, 27 109, 27 99 L 27 65 C 27 54, 32 45, 42 40 Z"
            fill="none"
            stroke="#b81d2c"
            stroke-width="4.2"
            stroke-linejoin="round"
          />
          <!-- ノズル & キャップ -->
          <path d="M 55 7 L 65 7 L 69 20 L 51 20 Z" fill="url(#${uid}-cap)" stroke="#b88200" stroke-width="3" stroke-linejoin="round" />
          <rect x="42" y="19" width="36" height="13" rx="4.5" fill="url(#${uid}-cap)" stroke="#b88200" stroke-width="3" />
        </g>
      </svg>
    `;
  }

  // 休憩フェーズ: 正位置ボトル + 上から液面へ注ぎ込まれる連続ストリーム（補充率約 62%）
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 156" width="${size}" height="${Math.round(size * 1.3)}" aria-hidden="true">
      <defs>
        <linearGradient id="${uid}-liq" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ff7d7d" />
          <stop offset="50%" stop-color="#ff4d4d" />
          <stop offset="100%" stop-color="#cf2334" />
        </linearGradient>
        <linearGradient id="${uid}-cap" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffe57f" />
          <stop offset="55%" stop-color="#ffc928" />
          <stop offset="100%" stop-color="#e0a000" />
        </linearGradient>
        <clipPath id="${uid}-clip">
          <path d="M 46 65 L 74 65 L 78 74 C 88 79, 93 88, 93 99 L 93 133 C 93 143, 85 149, 75 149 L 45 149 C 35 149, 27 143, 27 133 L 27 99 C 27 88, 32 79, 42 74 Z" />
        </clipPath>
      </defs>

      <!-- 上端からボトル口元へ注がれる連続ストリーム -->
      <path
        d="M 55.5 2 C 53 14, 62 22, 57 34 C 55 39, 56 42, 56 46 L 64 46 C 64 41, 66 37, 64 31 C 69 20, 61 12, 64.5 2 Z"
        fill="url(#${uid}-liq)"
      />
      <path
        d="M 58.2 5 C 57 15, 62 23, 59.5 34 L 59 42"
        fill="none"
        stroke="rgba(255,255,255,0.48)"
        stroke-width="2.4"
        stroke-linecap="round"
      />

      <!-- 正位置のボトル本体 -->
      <path
        d="M 46 65 L 74 65 L 78 74 C 88 79, 93 88, 93 99 L 93 133 C 93 143, 85 149, 75 149 L 45 149 C 35 149, 27 143, 27 133 L 27 99 C 27 88, 32 79, 42 74 Z"
        fill="#ffffff"
      />
      <g clip-path="url(#${uid}-clip)">
        <!-- ボトル内部の注ぎ込みストリーム -->
        <path
          d="M 56.5 64 C 54.5 76, 62 84, 57.5 99 L 63.5 99 C 66 85, 60 76, 63.5 64 Z"
          fill="url(#${uid}-liq)"
        />
        <!-- 下端から補充されて上昇中の液体（約62%） -->
        <path
          d="M 24 98 Q 60 91 96 98 L 96 152 L 24 152 Z"
          fill="url(#${uid}-liq)"
        />
        <path
          d="M 38 82 C 35.5 87, 35 93, 35 100 L 35 128"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          stroke-width="5.2"
          stroke-linecap="round"
        />
      </g>
      <path
        d="M 46 65 L 74 65 L 78 74 C 88 79, 93 88, 93 99 L 93 133 C 93 143, 85 149, 75 149 L 45 149 C 35 149, 27 143, 27 133 L 27 99 C 27 88, 32 79, 42 74 Z"
        fill="none"
        stroke="#b81d2c"
        stroke-width="4.2"
        stroke-linejoin="round"
      />
      <!-- ノズル & キャップ -->
      <path d="M 55 41 L 65 41 L 69 54 L 51 54 Z" fill="url(#${uid}-cap)" stroke="#b88200" stroke-width="3" stroke-linejoin="round" />
      <rect x="42" y="53" width="36" height="13" rx="4.5" fill="url(#${uid}-cap)" stroke="#b88200" stroke-width="3" />
    </svg>
  `;
}

/**
 * スライド 01: コア価値 & メインタイマーポップアップ（左右 2 カラム型）
 */
function renderHeroPopupSlide(data, assets) {
  const { copy, ui } = data;
  return `
    <div class="layout-split">
      <div class="col-copy">
        <div class="brand-pill">
          <img src="${assets.iconFullDataUri}" alt="" class="brand-pill-icon" />
          <span>Ketchup Timer</span>
        </div>
        <h1 class="headline">${renderLines(copy.headline)}</h1>
        <p class="subtitle">${escapeHtml(copy.subtitle)}</p>
      </div>
      <div class="col-visual">
        <div class="popup-card popup-main">
          <div class="popup-header">
            <img src="${assets.iconFullDataUri}" alt="" class="popup-header-icon" />
            <div class="popup-title">Ketchup Timer</div>
          </div>
          <div class="popup-timer">25:00</div>
          <div class="popup-phase">${escapeHtml(ui.phaseWithCycleFocus)}</div>
          <div class="popup-controls">
            <div class="btn btn-start">${escapeHtml(ui.btnStart)}</div>
            <div class="btn btn-reset">${escapeHtml(ui.btnReset)}</div>
          </div>
          <div class="popup-settings-preview">
            <div class="setting-row">
              <span>${escapeHtml(ui.labelFocusMinutes)}</span>
              <span class="input-pill">25</span>
            </div>
            <div class="setting-row">
              <span>${escapeHtml(ui.labelBreakMinutes)}</span>
              <span class="input-pill">5</span>
            </div>
            <div class="setting-row">
              <span>${escapeHtml(ui.labelLongBreakMinutes)}</span>
              <span class="input-pill">15</span>
            </div>
          </div>
          <div class="popup-footer-link">${escapeHtml(ui.linkViewStats)}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * スライド 02: 動的ツールバーアイコン（上下 2 段型・Focus / Break 比較）
 */
function renderDynamicIconSlide(data) {
  const { copy, ui } = data;
  return `
    <div class="layout-stacked">
      <div class="top-copy">
        <h1 class="headline headline-center">${renderLines(copy.headline)}</h1>
        <p class="subtitle subtitle-center">${escapeHtml(copy.subtitle)}</p>
      </div>
      <div class="bottom-visual">
        <div class="compare-grid">
          <div class="state-card state-focus">
            <div class="mini-toolbar">
              <div class="toolbar-dots"><span></span><span></span><span></span></div>
              <div class="toolbar-address"></div>
              <div class="toolbar-icon-slot active-slot">
                ${renderDynamicBottleSvg('focus', 26)}
              </div>
            </div>
            <div class="state-body">
              <div class="bottle-stage">
                ${renderDynamicBottleSvg('focus', 112)}
              </div>
              <div class="state-info">
                <div class="phase-badge badge-focus">${escapeHtml(ui.phaseFocus)}</div>
                <div class="state-time">14:20</div>
                <div class="state-caption">${escapeHtml(copy.focusCaption)}</div>
              </div>
            </div>
          </div>

          <div class="state-card state-break">
            <div class="mini-toolbar">
              <div class="toolbar-dots"><span></span><span></span><span></span></div>
              <div class="toolbar-address"></div>
              <div class="toolbar-icon-slot active-slot">
                ${renderDynamicBottleSvg('break', 26)}
              </div>
            </div>
            <div class="state-body">
              <div class="bottle-stage">
                ${renderDynamicBottleSvg('break', 112)}
              </div>
              <div class="state-info">
                <div class="phase-badge badge-break">${escapeHtml(ui.phaseBreak)}</div>
                <div class="state-time state-time-break">03:40</div>
                <div class="state-caption">${escapeHtml(copy.breakCaption)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * スライド 03: 集中時間の集計グラフ & 期間ナビゲーション（左右 2 カラム型）
 */
function renderStatisticsSlide(data) {
  const { copy, ui } = data;
  const bars = [
    { label: '11-21', mins: 75, pct: 50 },
    { label: '11-22', mins: 125, pct: 83 },
    { label: '11-23', mins: 100, pct: 67 },
    { label: '11-24', mins: 150, pct: 100 },
    { label: '11-25', mins: 100, pct: 67 },
    { label: '11-26', mins: 125, pct: 83 },
    { label: '11-27', mins: 150, pct: 100 }
  ];

  const barsHtml = bars
    .map(
      (b) => `
        <div class="bar-col">
          <div class="bar-track">
            <div class="bar-fill" style="height: ${b.pct}%"></div>
          </div>
          <div class="bar-label">${b.label}</div>
        </div>
      `
    )
    .join('');

  return `
    <div class="layout-split">
      <div class="col-copy">
        <h1 class="headline">${renderLines(copy.headline)}</h1>
        <p class="subtitle">${escapeHtml(copy.subtitle)}</p>
      </div>
      <div class="col-visual">
        <div class="popup-card popup-stats">
          <div class="stats-header">${escapeHtml(ui.statsTitle)}</div>
          <div class="stats-tabs">
            <div class="stats-tab active">${escapeHtml(ui.tabDaily)}</div>
            <div class="stats-tab">${escapeHtml(ui.tabWeekly)}</div>
            <div class="stats-tab">${escapeHtml(ui.tabMonthly)}</div>
          </div>
          <div class="stats-nav">
            <div class="nav-circle">&lt;</div>
            <div class="nav-range">${escapeHtml(copy.periodRange)}</div>
            <div class="nav-circle disabled">&gt;</div>
          </div>
          <div class="chart-box">
            <div class="chart-yaxis">
              <span>150</span>
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            <div class="chart-plot">
              <div class="chart-gridlines">
                <span></span><span></span><span></span><span></span>
              </div>
              <div class="chart-bars">
                ${barsHtml}
              </div>
            </div>
          </div>
          <div class="btn-back">${escapeHtml(ui.btnBackToTimer)}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * スライド 04: ワンクリック通知移行（左右 2 カラム型）
 */
function renderNotificationSlide(data, assets) {
  const { copy, ui } = data;
  return `
    <div class="layout-split">
      <div class="col-copy">
        <h1 class="headline">${renderLines(copy.headline)}</h1>
        <p class="subtitle">${escapeHtml(copy.subtitle)}</p>
      </div>
      <div class="col-visual">
        <div class="notif-stack">
          <div class="notif-card notif-primary">
            <div class="notif-top">
              <img src="${assets.iconEmptyDataUri}" alt="" class="notif-icon" />
              <div class="notif-meta">
                <div class="notif-app-row">
                  <span class="notif-app">${escapeHtml(copy.notifAppLabel)}</span>
                  <span class="notif-time">${escapeHtml(copy.notifTimeLabel)}</span>
                </div>
                <div class="notif-title">${escapeHtml(ui.notifFocusCompleteTitle)}</div>
                <div class="notif-body">${escapeHtml(ui.notifShortBreakMessage)}</div>
              </div>
            </div>
            <div class="notif-action-btn">
              <span>${escapeHtml(ui.notifNextPhaseButton)}</span>
            </div>
          </div>

          <div class="notif-card notif-secondary">
            <div class="notif-top">
              <img src="${assets.iconFullDataUri}" alt="" class="notif-icon notif-icon-sm" />
              <div class="notif-meta">
                <div class="notif-title notif-title-sm">${escapeHtml(ui.notifBreakCompleteTitle)}</div>
                <div class="notif-body notif-body-sm">${escapeHtml(ui.notifBreakCompleteMessage)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * スライド 05: カスタマイズ設定 & 5 言語切り替え（左右 2 カラム型）
 */
function renderSettingsI18nSlide(data) {
  const { copy, ui, lang } = data;
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' }
  ];

  const langOptionsHtml = languages
    .map(
      (item) => `
        <div class="lang-option ${item.code === lang ? 'selected' : ''}">
          <span>${item.label}</span>
          ${item.code === lang ? '<span class="check-mark">✓</span>' : ''}
        </div>
      `
    )
    .join('');

  return `
    <div class="layout-split">
      <div class="col-copy">
        <h1 class="headline">${renderLines(copy.headline)}</h1>
        <p class="subtitle">${escapeHtml(copy.subtitle)}</p>
      </div>
      <div class="col-visual">
        <div class="settings-showcase">
          <div class="popup-card popup-settings-card">
            <div class="setting-row-lg">
              <span>${escapeHtml(ui.labelFocusMinutes)}</span>
              <span class="input-pill-lg">25</span>
            </div>
            <div class="setting-row-lg">
              <span>${escapeHtml(ui.labelBreakMinutes)}</span>
              <span class="input-pill-lg">5</span>
            </div>
            <div class="setting-row-lg">
              <span>${escapeHtml(ui.labelLongBreakMinutes)}</span>
              <span class="input-pill-lg">15</span>
            </div>
            <div class="setting-row-lg">
              <span>${escapeHtml(ui.labelCyclesBeforeLongBreak)}</span>
              <span class="input-pill-lg">4</span>
            </div>
            <div class="setting-row-lg setting-row-lang">
              <span>${escapeHtml(ui.labelLanguage)}</span>
              <span class="select-pill-lg">${escapeHtml(copy.activeLangLabel)} ▾</span>
            </div>
          </div>
          <div class="lang-popover">
            ${langOptionsHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 1 枚のスライドに対応する完全な HTML ドキュメントを生成する
 *
 * @param {{
 *   lang: string,
 *   fontFamily: string,
 *   ui: Record<string, string>,
 *   slide: { id: string, type: string, copy: Record<string, unknown> },
 *   width: number,
 *   height: number,
 *   assets: { iconFullDataUri: string, iconEmptyDataUri: string }
 * }} params
 * @returns {string}
 */
export function renderSlideHtml({ lang, fontFamily, ui, slide, width, height, assets }) {
  const scale = width / 1280;
  const slideData = { lang, ui, copy: slide.copy };

  let bodyContent = '';
  switch (slide.type) {
    case 'hero-popup':
      bodyContent = renderHeroPopupSlide(slideData, assets);
      break;
    case 'dynamic-icon':
      bodyContent = renderDynamicIconSlide(slideData);
      break;
    case 'statistics':
      bodyContent = renderStatisticsSlide(slideData);
      break;
    case 'notification':
      bodyContent = renderNotificationSlide(slideData, assets);
      break;
    case 'settings-i18n':
      bodyContent = renderSettingsI18nSlide(slideData);
      break;
    default:
      throw new Error(`未対応のスライド種別です: ${slide.type}`);
  }

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="UTF-8" />
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background-color: #fff6f0;
      font-family: ${fontFamily};
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    .stage {
      width: 1280px;
      height: 800px;
      transform: scale(${scale});
      transform-origin: top left;
      background: linear-gradient(135deg, #fffbf6 0%, #fff0e9 100%);
      position: relative;
      overflow: hidden;
      color: #1f242d;
      padding: 64px 72px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ごく控えめな背景アクセント円（視認性を妨げない低コントラスト） */
    .stage::before {
      content: "";
      position: absolute;
      width: 560px;
      height: 560px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 77, 77, 0.08) 0%, rgba(255, 77, 77, 0) 72%);
      top: -160px;
      right: -120px;
      pointer-events: none;
    }

    .stage::after {
      content: "";
      position: absolute;
      width: 440px;
      height: 440px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 201, 40, 0.11) 0%, rgba(255, 201, 40, 0) 70%);
      bottom: -150px;
      left: -100px;
      pointer-events: none;
    }

    /* 左右 2 カラム型（標準） */
    .layout-split {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 56px;
    }

    .col-copy {
      width: 45%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 24px;
    }

    .col-visual {
      width: 55%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 上下 2 段型（比較表示向け） */
    .layout-stacked {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
    }

    .top-copy {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      text-align: center;
    }

    .bottom-visual {
      width: 100%;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* タイポグラフィ（縮小表示でも読みやすい大きめ設計） */
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      align-self: flex-start;
      background: #ffffff;
      border: 2px solid #f5d8d0;
      border-radius: 999px;
      padding: 10px 22px 10px 14px;
      font-size: 24px;
      font-weight: 700;
      color: #cc2936;
      box-shadow: 0 8px 20px rgba(204, 41, 54, 0.08);
    }

    .brand-pill-icon {
      width: 34px;
      height: 34px;
      display: block;
    }

    .headline {
      font-size: 58px;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.02em;
      color: #1f242d;
      overflow-wrap: break-word;
    }

    html[lang="ko"] .headline,
    html[lang="ko"] .subtitle {
      word-break: keep-all;
    }

    .headline-center {
      font-size: 56px;
    }

    .subtitle {
      font-size: 27px;
      font-weight: 500;
      line-height: 1.48;
      color: #4d5563;
      overflow-wrap: break-word;
    }

    .subtitle-center {
      max-width: 920px;
    }

    /* 共通ポップアップカード（実 UI の #fffaf0 を忠実に再現） */
    .popup-card {
      background: #fffaf0;
      border: 2px solid #f0dcd2;
      border-radius: 24px;
      box-shadow: 0 26px 64px rgba(168, 34, 44, 0.13);
      color: #333333;
    }

    /* Slide 01: メインポップアップ */
    .popup-main {
      width: 500px;
      padding: 30px 34px 26px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .popup-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin-bottom: 14px;
    }

    .popup-header-icon {
      width: 48px;
      height: 48px;
      display: block;
    }

    .popup-title {
      font-size: 36px;
      font-weight: 800;
      color: #ff4d4d;
      line-height: 1.2;
    }

    .popup-timer {
      font-size: 86px;
      font-weight: 800;
      color: #cc0000;
      line-height: 1.05;
      letter-spacing: 0.02em;
      font-variant-numeric: tabular-nums;
      margin-bottom: 8px;
    }

    .popup-phase {
      font-size: 26px;
      font-weight: 700;
      color: #5f6672;
      margin-bottom: 24px;
      text-align: center;
    }

    .popup-controls {
      display: flex;
      gap: 14px;
      margin-bottom: 26px;
    }

    .btn {
      min-width: 142px;
      padding: 13px 24px;
      border-radius: 10px;
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      text-align: center;
      white-space: nowrap;
    }

    .btn-start {
      background: #28a745;
    }

    .btn-reset {
      background: #dc3545;
    }

    .popup-settings-preview {
      width: 100%;
      border-top: 2px solid #eadfd6;
      padding-top: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 22px;
      font-weight: 600;
      color: #3a404a;
      gap: 12px;
    }

    .input-pill {
      min-width: 82px;
      padding: 6px 14px;
      border-radius: 8px;
      border: 2px solid #d5cbc4;
      background: #ffffff;
      text-align: center;
      font-size: 22px;
      font-weight: 700;
      color: #2b303a;
    }

    .popup-footer-link {
      width: 100%;
      margin-top: 18px;
      padding-top: 14px;
      border-top: 2px solid #efe6de;
      text-align: center;
      font-size: 22px;
      font-weight: 700;
      color: #0b63ce;
      text-decoration: underline;
    }

    /* Slide 02: Focus / Break 比較カード */
    .compare-grid {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      align-items: stretch;
    }

    .state-card {
      background: #ffffff;
      border: 2px solid #f0dcd2;
      border-radius: 26px;
      overflow: hidden;
      box-shadow: 0 22px 52px rgba(168, 34, 44, 0.1);
      display: flex;
      flex-direction: column;
    }

    .mini-toolbar {
      background: #f3f4f6;
      border-bottom: 1.5px solid #e2e5ea;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .toolbar-dots {
      display: flex;
      gap: 8px;
    }

    .toolbar-dots span {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #d0d5dd;
    }

    .toolbar-address {
      flex: 1;
      height: 30px;
      border-radius: 999px;
      background: #ffffff;
      border: 1.5px solid #dfe3e8;
    }

    .toolbar-icon-slot {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: #ffffff;
      border: 2.5px solid #ff4d4d;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 6px rgba(255, 77, 77, 0.14);
    }

    .state-body {
      flex: 1;
      padding: 36px 36px 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 36px;
      background: #fffdf9;
    }

    .bottle-stage {
      width: 170px;
      height: 196px;
      border-radius: 24px;
      background: #fff3ee;
      border: 2px solid #fadcd4;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .state-break .bottle-stage {
      background: #f2fbf4;
      border-color: #d2eed8;
    }

    .state-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .phase-badge {
      padding: 8px 20px;
      border-radius: 999px;
      font-size: 24px;
      font-weight: 800;
      white-space: nowrap;
    }

    .badge-focus {
      background: #ffe5e5;
      color: #c81e30;
    }

    .badge-break {
      background: #e1f6e7;
      color: #1c7c3a;
    }

    .state-time {
      font-size: 62px;
      font-weight: 800;
      color: #cc0000;
      line-height: 1.05;
      font-variant-numeric: tabular-nums;
    }

    .state-time-break {
      color: #1f7a3e;
    }

    .state-caption {
      font-size: 24px;
      font-weight: 600;
      color: #4d5563;
      line-height: 1.35;
    }

    /* Slide 03: 統計画面 */
    .popup-stats {
      width: 590px;
      padding: 30px 34px 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
    }

    .stats-header {
      font-size: 34px;
      font-weight: 800;
      color: #ff4d4d;
    }

    .stats-tabs {
      display: flex;
      gap: 10px;
      width: 100%;
      justify-content: center;
    }

    .stats-tab {
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 21px;
      font-weight: 700;
      border: 2px solid #d7cfc9;
      background: #f2efec;
      color: #444444;
      white-space: nowrap;
    }

    .stats-tab.active {
      background: #ff4d4d;
      border-color: #ff4d4d;
      color: #ffffff;
    }

    .stats-nav {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px;
    }

    .nav-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #f0f0f0;
      border: 2px solid #cccccc;
      color: #333333;
      font-size: 24px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-circle.disabled {
      opacity: 0.35;
    }

    .nav-range {
      font-size: 23px;
      font-weight: 700;
      color: #4f5662;
      font-variant-numeric: tabular-nums;
    }

    .chart-box {
      width: 100%;
      height: 270px;
      background: #ffffff;
      border: 1.5px solid #eee4dc;
      border-radius: 16px;
      padding: 22px 20px 16px 14px;
      display: flex;
      gap: 12px;
    }

    .chart-yaxis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding-bottom: 28px;
      font-size: 18px;
      font-weight: 600;
      color: #6c7380;
      text-align: right;
      min-width: 38px;
      font-variant-numeric: tabular-nums;
    }

    .chart-plot {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .chart-gridlines {
      position: absolute;
      inset: 8px 0 34px 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      pointer-events: none;
    }

    .chart-gridlines span {
      display: block;
      width: 100%;
      height: 1.5px;
      background: #eef0f3;
    }

    .chart-bars {
      position: relative;
      z-index: 1;
      flex: 1;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 12px;
      padding-top: 8px;
    }

    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }

    .bar-track {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .bar-fill {
      width: 82%;
      background: #ff4d4d;
      border-radius: 8px 8px 0 0;
    }

    .bar-label {
      margin-top: 10px;
      font-size: 17px;
      font-weight: 600;
      color: #5c6370;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .btn-back {
      width: 100%;
      padding: 14px 20px;
      border-radius: 10px;
      background: #666666;
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      text-align: center;
    }

    /* Slide 04: 通知カード */
    .notif-stack {
      width: 580px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .notif-card {
      background: #ffffff;
      border: 2px solid #ecd9d1;
      border-radius: 24px;
      padding: 28px 30px;
      box-shadow: 0 24px 56px rgba(168, 34, 44, 0.12);
    }

    .notif-secondary {
      opacity: 0.92;
      padding: 22px 28px;
      box-shadow: 0 14px 36px rgba(31, 36, 45, 0.08);
    }

    .notif-top {
      display: flex;
      align-items: flex-start;
      gap: 22px;
    }

    .notif-icon {
      width: 84px;
      height: 84px;
      flex-shrink: 0;
      display: block;
    }

    .notif-icon-sm {
      width: 66px;
      height: 66px;
    }

    .notif-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .notif-app-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 20px;
      font-weight: 600;
      color: #6c7380;
    }

    .notif-title {
      font-size: 32px;
      font-weight: 800;
      color: #1f242d;
      line-height: 1.2;
    }

    .notif-title-sm {
      font-size: 26px;
    }

    .notif-body {
      font-size: 23px;
      font-weight: 500;
      color: #4d5563;
      line-height: 1.4;
    }

    .notif-body-sm {
      font-size: 21px;
    }

    .notif-action-btn {
      margin-top: 24px;
      background: #ff4d4d;
      color: #ffffff;
      border-radius: 14px;
      padding: 18px 24px;
      text-align: center;
      font-size: 25px;
      font-weight: 800;
      box-shadow: 0 10px 24px rgba(255, 77, 77, 0.28);
    }

    /* Slide 05: 設定 + 言語ドロップダウン */
    .settings-showcase {
      width: 590px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }

    .popup-settings-card {
      width: 100%;
      padding: 22px 30px;
      display: flex;
      flex-direction: column;
      gap: 13px;
    }

    .setting-row-lg {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      font-size: 23px;
      font-weight: 700;
      color: #2f3540;
    }

    .setting-row-lang {
      padding-top: 12px;
      border-top: 2px solid #eadfd6;
    }

    .input-pill-lg {
      min-width: 92px;
      padding: 7px 14px;
      border-radius: 10px;
      border: 2px solid #d5cbc4;
      background: #ffffff;
      text-align: center;
      font-size: 22px;
      font-weight: 800;
      color: #222730;
    }

    .select-pill-lg {
      min-width: 190px;
      padding: 8px 16px;
      border-radius: 10px;
      border: 2.5px solid #ff4d4d;
      background: #ffffff;
      text-align: center;
      font-size: 22px;
      font-weight: 800;
      color: #1f242d;
      box-shadow: 0 0 0 4px rgba(255, 77, 77, 0.14);
    }

    .lang-popover {
      margin-right: 30px;
      width: 226px;
      background: #ffffff;
      border: 2px solid #f0c7be;
      border-radius: 16px;
      padding: 8px;
      box-shadow: 0 18px 40px rgba(31, 36, 45, 0.14);
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .lang-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 14px;
      border-radius: 10px;
      font-size: 20px;
      font-weight: 700;
      color: #363d49;
    }

    .lang-option.selected {
      background: #fff0ed;
      color: #cc2233;
    }

    .check-mark {
      font-weight: 800;
      color: #ff4d4d;
    }
  </style>
</head>
<body>
  <div class="stage">
    ${bodyContent}
  </div>
</body>
</html>`;
}
