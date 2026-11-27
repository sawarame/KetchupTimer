/// <reference types="chrome" />

/**
 * 拡張機能で対応しているロケールコード一覧
 */
export const SUPPORTED_LOCALES = ['en', 'ja', 'ko', 'zh_CN', 'zh_TW'] as const;

/**
 * 対応ロケールコード型
 */
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * 非対応言語時のフォールバック既定ロケール
 */
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * chrome.storage.local に言語設定を保存する際のキー名
 */
export const LANGUAGE_STORAGE_KEY = 'language';

/**
 * 言語選択 UI 向けの選択肢情報
 */
export interface LanguageOption {
  code: SupportedLocale;
  label: string;
}

/**
 * セレクトボックスに表示する言語一覧（ネイティブ表記）
 */
export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh_CN', label: '简体中文' },
  { code: 'zh_TW', label: '繁體中文' }
];

interface MessagePlaceholder {
  content: string;
  example?: string;
}

interface MessageEntry {
  message: string;
  description?: string;
  placeholders?: Record<string, MessagePlaceholder>;
}

type MessageCatalog = Record<string, MessageEntry>;

const catalogCache = new Map<SupportedLocale, MessageCatalog>();
let activeLocale: SupportedLocale = DEFAULT_LOCALE;
let isInitialized = false;

/**
 * 指定された値が対応ロケールコードかどうかを判定する型ガード
 * @param value - 判定対象の値
 * @returns 対応ロケールコードであれば true
 */
export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * 現在のブラウザ UI 言語コードを取得する
 * @returns UI 言語コード（取得できない場合は既定の "en"）
 */
export function getUiLanguage(): string {
  try {
    const uiLang = chrome.i18n.getUILanguage();
    if (uiLang) {
      return uiLang;
    }
  } catch (error: unknown) {
    // 取得失敗時は既定ロケールへフォールバックする
    console.warn('[i18n] UI 言語の取得に失敗しました:', error);
  }
  return DEFAULT_LOCALE;
}

/**
 * ブラウザ言語コードを拡張機能の対応ロケールコードへ正規化する
 * 対応していない言語の場合は英語（"en"）へフォールバックする
 * @param rawLocale - 正規化対象の言語コード（省略時はブラウザ UI 言語を使用）
 * @returns 対応ロケールコード
 */
export function resolveBrowserLocale(rawLocale?: string): SupportedLocale {
  const source = (rawLocale ?? getUiLanguage()).trim();
  if (!source) {
    return DEFAULT_LOCALE;
  }

  const normalized = source.toLowerCase().replace(/_/g, '-');
  const parts = normalized.split('-');
  const primary = parts[0];

  if (primary === 'ja') {
    return 'ja';
  }
  if (primary === 'ko') {
    return 'ko';
  }
  if (primary === 'zh') {
    // 繁体字系（zh-TW / zh-HK / zh-MO / zh-Hant*）は zh_TW、それ以外の中国語は zh_CN へ割り当てる
    const isTraditional = parts.some(
      (part) => part === 'hant' || part === 'tw' || part === 'hk' || part === 'mo'
    );
    return isTraditional ? 'zh_TW' : 'zh_CN';
  }
  if (primary === 'en') {
    return 'en';
  }

  return DEFAULT_LOCALE;
}

/**
 * ロケールコードを HTML の lang 属性に適した BCP 47 形式へ変換する
 * @param locale - 対応ロケールコード
 * @returns BCP 47 形式の言語タグ（例: "zh-CN"）
 */
export function toHtmlLang(locale: SupportedLocale): string {
  return locale.replace('_', '-');
}

/**
 * ストレージに保存されているユーザー選択言語を取得する
 * @returns 保存済みの有効なロケールコード（未設定または不正値の場合は null）
 */
export async function getStoredLocale(): Promise<SupportedLocale | null> {
  try {
    const data = await chrome.storage.local.get(LANGUAGE_STORAGE_KEY);
    const stored = data[LANGUAGE_STORAGE_KEY];
    if (isSupportedLocale(stored)) {
      return stored;
    }
  } catch (error: unknown) {
    console.warn('[i18n] 保存済み言語設定の取得に失敗しました:', error);
  }
  return null;
}

/**
 * 指定ロケールの messages.json を読み込み、メモリへキャッシュする
 * @param locale - 読み込み対象のロケールコード
 * @returns 読み込んだメッセージ辞書（失敗時は null）
 */
async function loadCatalog(locale: SupportedLocale): Promise<MessageCatalog | null> {
  const cached = catalogCache.get(locale);
  if (cached) {
    return cached;
  }

  try {
    const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[i18n] 言語ファイルの取得に失敗しました (${locale}, status: ${response.status})`);
      return null;
    }

    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const catalog = parsed as MessageCatalog;
      catalogCache.set(locale, catalog);
      return catalog;
    }
  } catch (error: unknown) {
    console.warn(`[i18n] 言語ファイルの読み込みに失敗しました (${locale}):`, error);
  }

  return null;
}

/**
 * 指定ロケールを現在の表示言語として適用し、必要な辞書ファイルをロードする
 * @param locale - 適用するロケールコード
 * @returns ロード完了を示す Promise
 */
async function applyLocale(locale: SupportedLocale): Promise<void> {
  activeLocale = locale;
  isInitialized = true;

  // キー欠損時に同期的に英語へフォールバックできるよう、英語辞書も並行してキャッシュする
  const tasks: Array<Promise<MessageCatalog | null>> = [loadCatalog(locale)];
  if (locale !== DEFAULT_LOCALE) {
    tasks.push(loadCatalog(DEFAULT_LOCALE));
  }
  await Promise.all(tasks);
}

/**
 * ストレージまたはブラウザ設定から初期言語を解決し、言語辞書を初期化する
 * @returns 適用されたロケールコード
 */
export async function initI18n(): Promise<SupportedLocale> {
  const stored = await getStoredLocale();
  const targetLocale = stored ?? resolveBrowserLocale();
  await applyLocale(targetLocale);
  return targetLocale;
}

/**
 * 選択された言語をストレージへ保存し、現在の言語辞書を切り替える
 * @param locale - ユーザーが選択したロケールコード
 * @returns 実際に適用されたロケールコード
 */
export async function setLanguage(locale: SupportedLocale): Promise<SupportedLocale> {
  const targetLocale = isSupportedLocale(locale) ? locale : resolveBrowserLocale();
  try {
    await chrome.storage.local.set({ [LANGUAGE_STORAGE_KEY]: targetLocale });
  } catch (error: unknown) {
    console.warn('[i18n] 言語設定の保存に失敗しました:', error);
  }
  await applyLocale(targetLocale);
  return targetLocale;
}

/**
 * 現在適用されているロケールコードを取得する
 * @returns 現在のロケールコード
 */
export function getCurrentLocale(): SupportedLocale {
  return activeLocale;
}

/**
 * 文字列内の位置指定プレースホルダ（$1〜$9）とエスケープ（$$）を展開する
 * @param text - 展開対象の文字列
 * @param subs - 置換文字列の配列
 * @returns 展開後の文字列
 */
function replacePositionalPlaceholders(text: string, subs: readonly string[]): string {
  return text.replace(/\$\$|\$([1-9])/g, (match, indexStr?: string) => {
    if (match === '$$') {
      return '$';
    }
    const index = Number(indexStr) - 1;
    return subs[index] ?? '';
  });
}

/**
 * messages.json のエントリに対してプレースホルダ置換を適用する
 * @param entry - メッセージエントリ
 * @param substitutions - 置換文字列またはその配列
 * @returns フォーマット済みメッセージ文字列
 */
export function formatMessage(
  entry: MessageEntry,
  substitutions?: string | string[]
): string {
  const subs: readonly string[] =
    substitutions === undefined
      ? []
      : Array.isArray(substitutions)
        ? substitutions
        : [substitutions];

  // 名前付きプレースホルダの content 側にある $1 等を先に解決する
  const resolvedNamed = new Map<string, string>();
  if (entry.placeholders) {
    for (const [name, placeholder] of Object.entries(entry.placeholders)) {
      if (placeholder && typeof placeholder.content === 'string') {
        resolvedNamed.set(name.toLowerCase(), replacePositionalPlaceholders(placeholder.content, subs));
      }
    }
  }

  // 1 パスで置換することで置換値内の "$" が二重解釈されないようにする
  return entry.message.replace(
    /\$\$|\$([1-9])|\$([A-Za-z0-9_@]+)\$/g,
    (match, indexStr?: string, namedKey?: string) => {
      if (match === '$$') {
        return '$';
      }
      if (indexStr !== undefined) {
        const index = Number(indexStr) - 1;
        return subs[index] ?? '';
      }
      if (namedKey !== undefined) {
        const replacement = resolvedNamed.get(namedKey.toLowerCase());
        return replacement !== undefined ? replacement : match;
      }
      return match;
    }
  );
}

/**
 * 指定されたキーに対応するローカライズ済みメッセージを取得する
 * 優先順位: 選択言語の辞書 → 英語（en）辞書 → chrome.i18n（未初期化時のみ） → fallback → key
 * @param key - messages.json に定義されたメッセージキー
 * @param substitutions - メッセージ内のプレースホルダへ埋め込む置換文字列またはその配列
 * @param fallback - メッセージが取得できなかった場合に返すフォールバック文字列
 * @returns ローカライズされた文字列（取得失敗時はフォールバック文字列またはキー名）
 */
export function getMessage(
  key: string,
  substitutions?: string | string[],
  fallback?: string
): string {
  const activeCatalog = catalogCache.get(activeLocale);
  const activeEntry = activeCatalog?.[key];
  if (activeEntry && typeof activeEntry.message === 'string') {
    return formatMessage(activeEntry, substitutions);
  }

  const defaultCatalog = catalogCache.get(DEFAULT_LOCALE);
  const defaultEntry = defaultCatalog?.[key];
  if (defaultEntry && typeof defaultEntry.message === 'string') {
    return formatMessage(defaultEntry, substitutions);
  }

  if (!isInitialized) {
    try {
      const localized = chrome.i18n.getMessage(key, substitutions);
      if (localized) {
        return localized;
      }
    } catch (error: unknown) {
      // テスト環境や API 未初期化時のエラーを握りつぶしフォールバックへ移行する
      console.warn(`[i18n] メッセージ取得に失敗しました (key: ${key}):`, error);
    }
  }

  return fallback ?? key;
}

/**
 * ドキュメント内の data-i18n 属性を持つ要素を一括でローカライズする
 * @param root - ローカライズ対象のルートノード（既定は document）
 * @returns なし
 */
export function localizeDocument(root: ParentNode = document): void {
  // HTML ルートの lang 属性を現在の選択言語に合わせて更新する
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = toHtmlLang(activeLocale);
  }

  const elements = root.querySelectorAll<HTMLElement>('[data-i18n]');
  elements.forEach((element) => {
    const key = element.dataset.i18n;
    if (!key) return;

    const currentText = element.textContent ?? '';
    const translated = getMessage(key, undefined, currentText);
    element.textContent = translated;
  });
}
