/**
 * Chrome ウェブストア用スクリーンショット画像の多言語スライド文言定義
 *
 * 各言語の UI ラベルは package/_locales/<locale>/messages.json から自動で読み込み、
 * 見出し・補足文と組み合わせて 5 枚のスライドデータを構築します。
 */

/**
 * 言語ごとのシステムフォントスタック定義
 * 日中韓の字形混在や文字化けを防ぐため、各言語に適したフォントを優先指定します。
 */
export const FONT_STACKS = {
  en: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  ja: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif',
  'zh-CN': '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", sans-serif',
  'zh-TW': '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif',
  ko: '"Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif'
};

/**
 * 言語ごとのスライドコピー定義（1 スライド 1 メッセージ、縮小表示でも読みやすい短文設計）
 */
const COPY_BY_LANG = {
  en: {
    slide01: {
      headline: ['Focus with a', 'Ketchup Bottle'],
      subtitle: 'A clean Pomodoro timer that turns every session into intuitive visual progress.'
    },
    slide02: {
      headline: ['Track Time Right on', 'Your Toolbar'],
      subtitle: 'Ketchup pours out during Focus and refills during Break.',
      focusCaption: 'Pours out as time elapses',
      breakCaption: 'Refills during your break'
    },
    slide03: {
      headline: ['Daily, Weekly &', 'Monthly Charts'],
      subtitle: 'Log focus minutes automatically and browse past periods.',
      periodRange: '11-21 - 11-27',
      unitSuffix: 'm'
    },
    slide04: {
      headline: ['One-Click Phase', 'Transitions'],
      subtitle: 'Start your next Focus or Break directly from the completion alert.',
      notifAppLabel: 'Ketchup Timer',
      notifTimeLabel: 'now'
    },
    slide05: {
      headline: ['Custom Cycles &', '5 Languages'],
      subtitle: 'Set your own durations and switch display languages anytime.',
      activeLangLabel: 'English'
    }
  },
  ja: {
    slide01: {
      headline: ['ケチャップで', '直感的に集中管理'],
      subtitle: '残り時間をボトルの残量で伝える、シンプルなポモドーロタイマー。'
    },
    slide02: {
      headline: ['ツールバーで一目で', 'わかる残り時間'],
      subtitle: '集中中はケチャップが減り、休憩中は上から補充されます。',
      focusCaption: '集中中：減っていく',
      breakCaption: '休憩中：補充される'
    },
    slide03: {
      headline: ['日々の集中時間を', 'グラフで見える化'],
      subtitle: '日間・週間・月間の棒グラフで過去の履歴も振り返れます。',
      periodRange: '11-21 - 11-27',
      unitSuffix: '分'
    },
    slide04: {
      headline: ['通知をクリックで', '次のフェーズへ'],
      subtitle: '終了通知のボタンを押すだけで、作業の流れを止めずに移行。',
      notifAppLabel: 'Ketchup Timer',
      notifTimeLabel: 'たった今'
    },
    slide05: {
      headline: ['好みの時間設定と', '5言語切り替え'],
      subtitle: 'フェーズ時間やサイクル数を調整でき、表示言語も即時変更。',
      activeLangLabel: '日本語'
    }
  },
  'zh-CN': {
    slide01: {
      headline: ['用番茄酱瓶', '轻松掌控专注'],
      subtitle: '简洁直观的番茄钟计时器，让专注进度一目了然。'
    },
    slide02: {
      headline: ['工具栏图标', '实时呈现进度'],
      subtitle: '专注时流出减少，休息时从上方持续补充。',
      focusCaption: '专注中：逐渐流出',
      breakCaption: '休息中：持续补充'
    },
    slide03: {
      headline: ['每日、每周、每月', '专注数据可视化'],
      subtitle: '自动记录专注分钟数，随时翻看历史周期柱状图。',
      periodRange: '11-21 - 11-27',
      unitSuffix: '分'
    },
    slide04: {
      headline: ['系统通知一键', '进入下一阶段'],
      subtitle: '阶段结束时点击通知按钮，无需打开弹窗即可无缝衔接。',
      notifAppLabel: 'Ketchup Timer',
      notifTimeLabel: '刚刚'
    },
    slide05: {
      headline: ['灵活自定义时长', '支持五种语言'],
      subtitle: '自由设定周期参数，随时在弹窗内即时切换界面语言。',
      activeLangLabel: '简体中文'
    }
  },
  'zh-TW': {
    slide01: {
      headline: ['用番茄醬瓶', '輕鬆掌握專注'],
      subtitle: '簡潔直覺的番茄鐘計時器，讓專注進度一目了然。'
    },
    slide02: {
      headline: ['工具列圖示', '即時呈現進度'],
      subtitle: '專注時流出減少，休息時從上方持續補充。',
      focusCaption: '專注中：逐漸流出',
      breakCaption: '休息中：持續補充'
    },
    slide03: {
      headline: ['每日、每週、每月', '專注數據視覺化'],
      subtitle: '自動記錄專注分鐘數，隨時回顧歷史區間長條圖。',
      periodRange: '11-21 - 11-27',
      unitSuffix: '分'
    },
    slide04: {
      headline: ['系統通知一鍵', '進入下一階段'],
      subtitle: '階段結束時點擊通知按鈕，無需開啟視窗即可順暢銜接。',
      notifAppLabel: 'Ketchup Timer',
      notifTimeLabel: '剛剛'
    },
    slide05: {
      headline: ['彈性自訂時長', '支援五種語言'],
      subtitle: '自由調整週期參數，隨時於彈出視窗即時切換顯示語言。',
      activeLangLabel: '繁體中文'
    }
  },
  ko: {
    slide01: {
      headline: ['케첩 병으로 직관적인', '뽀모도로 집중'],
      subtitle: '남은 시간을 한눈에 보여주는 깔끔한 포커스 타이머입니다.'
    },
    slide02: {
      headline: ['툴바 아이콘으로', '실시간 진행 확인'],
      subtitle: '집중할 때 줄어들고, 휴식할 때 다시 채워집니다.',
      focusCaption: '집중 중: 케첩 감소',
      breakCaption: '휴식 중: 케첩 보충'
    },
    slide03: {
      headline: ['일간·주간·월간', '집중 시간 시각화'],
      subtitle: '집중 기록을 자동 집계하고 과거 기간도 간편하게 조회합니다.',
      periodRange: '11-21 - 11-27',
      unitSuffix: '분'
    },
    slide04: {
      headline: ['알림에서 원클릭으로', '다음 단계 시작'],
      subtitle: '단계 종료 알림 버튼을 눌러 끊김 없이 다음 단계로 이동합니다.',
      notifAppLabel: 'Ketchup Timer',
      notifTimeLabel: '방금 전'
    },
    slide05: {
      headline: ['맞춤 시간 설정 및', '5개 언어 즉시 전환'],
      subtitle: '단계별 시간과 사이클을 조정하고 언어를 언제든 변경합니다.',
      activeLangLabel: '한국어'
    }
  }
};

/**
 * messages.json のエントリから文字列を取り出し、簡易プレースホルダを置換する
 *
 * @param {Record<string, { message: string, placeholders?: Record<string, { content: string }> }>} messages
 * @param {string} key
 * @param {string[]} [subs]
 * @param {string} [fallback]
 * @returns {string}
 */
function msg(messages, key, subs = [], fallback = '') {
  const entry = messages?.[key];
  if (!entry || typeof entry.message !== 'string') {
    return fallback;
  }

  const resolvedNamed = new Map();
  if (entry.placeholders) {
    for (const [name, ph] of Object.entries(entry.placeholders)) {
      if (ph && typeof ph.content === 'string') {
        const val = ph.content.replace(/\$([1-9])/g, (_, n) => subs[Number(n) - 1] ?? '');
        resolvedNamed.set(name.toLowerCase(), val);
      }
    }
  }

  return entry.message.replace(/\$\$|\$([1-9])|\$([A-Za-z0-9_@]+)\$/g, (m, idx, named) => {
    if (m === '$$') return '$';
    if (idx !== undefined) return subs[Number(idx) - 1] ?? '';
    if (named !== undefined) return resolvedNamed.get(named.toLowerCase()) ?? m;
    return m;
  });
}

/**
 * 指定言語と messages.json の内容から、全 5 枚のスライドデータを生成する
 *
 * @param {string} lang - 正規化済み言語コード（例: "en", "ja", "zh-CN", "zh-TW", "ko"）
 * @param {Record<string, { message: string }>} messages - 該当言語の messages.json
 * @returns {{
 *   lang: string,
 *   fontFamily: string,
 *   extensionName: string,
 *   ui: Record<string, string>,
 *   slides: Array<{ id: string, type: string, copy: Record<string, unknown> }>
 * }}
 */
export function buildSlidesForLang(lang, messages) {
  const copy = COPY_BY_LANG[lang] ?? COPY_BY_LANG.en;
  const fontFamily = FONT_STACKS[lang] ?? FONT_STACKS.en;

  const phaseFocus = msg(messages, 'phaseFocus', [], 'Focus');
  const phaseBreak = msg(messages, 'phaseBreak', [], 'Break');
  const phaseLongBreak = msg(messages, 'phaseLongBreak', [], 'Long Break');

  const ui = {
    extensionName: msg(messages, 'extensionName', [], 'Ketchup Timer'),
    phaseFocus,
    phaseBreak,
    phaseLongBreak,
    phaseWithCycleFocus: msg(messages, 'phaseWithCycle', [phaseFocus, '1', '4'], `${phaseFocus} (Cycle: 1/4)`),
    phaseWithCycleBreak: msg(messages, 'phaseWithCycle', [phaseBreak, '1', '4'], `${phaseBreak} (Cycle: 1/4)`),
    btnStart: msg(messages, 'btnStart', [], 'Start'),
    btnPause: msg(messages, 'btnPause', [], 'Pause'),
    btnReset: msg(messages, 'btnReset', [], 'Reset'),
    labelFocusMinutes: msg(messages, 'labelFocusMinutes', [], 'Focus (min):'),
    labelBreakMinutes: msg(messages, 'labelBreakMinutes', [], 'Break (min):'),
    labelLongBreakMinutes: msg(messages, 'labelLongBreakMinutes', [], 'Long Break (min):'),
    labelCyclesBeforeLongBreak: msg(messages, 'labelCyclesBeforeLongBreak', [], 'Cycles before Long Break:'),
    labelLanguage: msg(messages, 'labelLanguage', [], 'Language:'),
    linkViewStats: msg(messages, 'linkViewStats', [], 'View Statistics'),
    statsTitle: msg(messages, 'statsTitle', [], 'Statistics'),
    tabDaily: msg(messages, 'tabDaily', [], 'Daily'),
    tabWeekly: msg(messages, 'tabWeekly', [], 'Weekly'),
    tabMonthly: msg(messages, 'tabMonthly', [], 'Monthly'),
    btnBackToTimer: msg(messages, 'btnBackToTimer', [], 'Back to Timer'),
    chartFocusTimeLabel: msg(messages, 'chartFocusTimeLabel', [], 'Focus Time (min)'),
    notifFocusCompleteTitle: msg(messages, 'notifFocusCompleteTitle', [], 'Focus Complete!'),
    notifShortBreakMessage: msg(
      messages,
      'notifShortBreakMessage',
      [],
      'Take a short break. Ketchup bottle is refilling...'
    ),
    notifBreakCompleteTitle: msg(messages, 'notifBreakCompleteTitle', [], 'Break Complete!'),
    notifBreakCompleteMessage: msg(
      messages,
      'notifBreakCompleteMessage',
      [],
      'Ready to focus? The ketchup is full!'
    ),
    notifNextPhaseButton: msg(messages, 'notifNextPhaseButton', [], 'OK - Start Next Phase')
  };

  return {
    lang,
    fontFamily,
    extensionName: ui.extensionName,
    ui,
    slides: [
      { id: '01', type: 'hero-popup', copy: copy.slide01 },
      { id: '02', type: 'dynamic-icon', copy: copy.slide02 },
      { id: '03', type: 'statistics', copy: copy.slide03 },
      { id: '04', type: 'notification', copy: copy.slide04 },
      { id: '05', type: 'settings-i18n', copy: copy.slide05 }
    ]
  };
}
