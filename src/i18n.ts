/// <reference types="chrome" />

/**
 * 指定されたキーに対応するローカライズ済みメッセージを取得する
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
  try {
    const localized = chrome.i18n.getMessage(key, substitutions);
    if (localized) {
      return localized;
    }
  } catch (error: unknown) {
    // テスト環境や API 未初期化時のエラーを握りつぶしフォールバックへ移行する
    console.warn(`[i18n] メッセージ取得に失敗しました (key: ${key}):`, error);
  }
  return fallback ?? key;
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
  return 'en';
}

/**
 * ドキュメント内の data-i18n 属性を持つ要素を一括でローカライズする
 * @param root - ローカライズ対象のルートノード（既定は document）
 * @returns なし
 */
export function localizeDocument(root: ParentNode = document): void {
  // HTML ルートの lang 属性を現在のブラウザ言語に合わせて更新する
  if (document.documentElement) {
    document.documentElement.lang = getUiLanguage();
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
