#!/usr/bin/env node
/**
 * Chrome ウェブストア用 多言語スクリーンショット画像生成スクリプト
 *
 * 概要:
 * - プロジェクト内の `_locales`（`package/_locales/` を最優先）から対応言語を自動判定します。
 * - HTML/CSS テンプレートをローカルの Google Chrome（ヘッドレスモード + CDP）で描画し、
 *   `sharp` を通して指定サイズかつ透過なし 24-bit RGB PNG（または JPEG）として `images/` 直下に出力します。
 *
 * 実行例:
 *   node scripts/generate-store-images.mjs
 *   node scripts/generate-store-images.mjs --size=640x400
 *   node scripts/generate-store-images.mjs --lang=ja,en
 *   node scripts/generate-store-images.mjs --format=jpg
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { buildSlidesForLang } from './store-images/slides-data.mjs';
import { renderSlideHtml } from './store-images/template.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_DIR = path.join(PROJECT_ROOT, 'images');

/** サポートする出力サイズ一覧 */
const ALLOWED_SIZES = new Map([
  ['1280x800', { width: 1280, height: 800 }],
  ['640x400', { width: 640, height: 400 }]
]);

/**
 * コマンドライン引数を解析する
 *
 * @param {string[]} argv
 * @returns {{ width: number, height: number, sizeKey: string, langs: string[] | null, format: 'png' | 'jpg', chromePath: string | null }}
 */
function parseArgs(argv) {
  let sizeKey = '1280x800';
  let langs = null;
  let format = 'png';
  let chromePath = process.env.CHROME_PATH || null;

  for (const arg of argv) {
    if (arg.startsWith('--size=')) {
      sizeKey = arg.slice('--size='.length).trim();
    } else if (arg.startsWith('--lang=')) {
      langs = arg
        .slice('--lang='.length)
        .split(',')
        .map((s) => s.trim().replace(/_/g, '-'))
        .filter(Boolean);
    } else if (arg.startsWith('--format=')) {
      const f = arg.slice('--format='.length).trim().toLowerCase();
      if (f === 'jpeg') format = 'jpg';
      else if (f === 'png' || f === 'jpg') format = f;
      else throw new Error(`未対応の出力形式です: ${f}（png または jpg を指定してください）`);
    } else if (arg.startsWith('--chrome=')) {
      chromePath = arg.slice('--chrome='.length).trim();
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        [
          '使い方: node scripts/generate-store-images.mjs [オプション]',
          '  --size=1280x800|640x400  出力画像サイズ（既定: 1280x800）',
          '  --lang=en,ja,...         生成対象言語をカンマ区切りで絞り込み（未指定時は _locales から自動判定）',
          '  --format=png|jpg         出力形式（既定: png［透過なし 24-bit RGB］）',
          '  --chrome=/path/to/chrome 使用する Chrome / Chromium 実行ファイルのパス'
        ].join('\n')
      );
      process.exit(0);
    }
  }

  const size = ALLOWED_SIZES.get(sizeKey);
  if (!size) {
    throw new Error(`未対応のサイズです: ${sizeKey}（1280x800 または 640x400 を指定してください）`);
  }

  return { width: size.width, height: size.height, sizeKey, langs, format, chromePath };
}

/**
 * プロジェクト内の `_locales` ディレクトリを優先順位に従って探索し、有効な言語一覧を取得する
 *
 * @returns {{ localesDir: string | null, locales: Array<{ folder: string, lang: string, messagesPath: string | null }> }}
 */
function discoverLocales() {
  const candidates = [
    path.join(PROJECT_ROOT, 'package', '_locales'),
    path.join(PROJECT_ROOT, '_locales'),
    path.join(PROJECT_ROOT, 'public', '_locales'),
    path.join(PROJECT_ROOT, 'src', '_locales')
  ];

  for (const dir of candidates) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;

    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => {
        const messagesPath = path.join(dir, entry.name, 'messages.json');
        return {
          folder: entry.name,
          lang: entry.name.replace(/_/g, '-'),
          messagesPath: fs.existsSync(messagesPath) ? messagesPath : null
        };
      })
      .filter((item) => item.messagesPath !== null)
      .sort((a, b) => a.lang.localeCompare(b.lang));

    if (entries.length > 0) {
      return { localesDir: dir, locales: entries };
    }
  }

  // _locales が見つからない場合は既定の英語・日本語にフォールバックする
  return {
    localesDir: null,
    locales: [
      { folder: 'en', lang: 'en', messagesPath: null },
      { folder: 'ja', lang: 'ja', messagesPath: null }
    ]
  };
}

/**
 * ローカル環境にインストールされている Chrome / Chromium の実行パスを検出する
 *
 * @param {string | null} customPath
 * @returns {string}
 */
function findChromeExecutable(customPath) {
  const candidates = [
    customPath,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'ローカルの Google Chrome / Chromium が見つかりませんでした。--chrome=/path/to/chrome または CHROME_PATH を指定してください。'
  );
}

/**
 * ローカル SVG ファイルを Data URI 文字列へ変換する（外部ネットワーク非依存）
 *
 * @param {string} filePath
 * @returns {string}
 */
function loadSvgAsDataUri(filePath) {
  const svg = fs.readFileSync(filePath, 'utf8');
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

/**
 * Chrome DevTools Protocol (CDP) を扱う軽量クライアント
 */
class CdpClient {
  /**
   * @param {WebSocket} ws
   */
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) {
          reject(new Error(`CDP Error (${msg.error.code}): ${msg.error.message}`));
        } else {
          resolve(msg.result);
        }
      }
    });
  }

  /**
   * CDP コマンドを送信して結果を待つ
   *
   * @param {string} method
   * @param {Record<string, unknown>} [params]
   * @returns {Promise<Record<string, unknown>>}
   */
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

/**
 * ヘッドレス Chrome を起動して CDP 接続を確立する
 *
 * @param {string} chromeExec
 * @param {number} width
 * @param {number} height
 * @returns {Promise<{ proc: import('node:child_process').ChildProcess, cdp: CdpClient, cleanup: () => void }>}
 */
async function launchHeadlessChrome(chromeExec, width, height) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ketchup-store-img-'));
  const proc = spawn(
    chromeExec,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      `--window-size=${width},${height}`,
      'about:blank'
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );

  // stderr に出力される "DevTools listening on ws://127.0.0.1:<port>/..." からポートを取得する
  const port = await new Promise((resolve, reject) => {
    let stderrBuf = '';
    const timer = setTimeout(() => {
      reject(new Error(`Chrome の起動がタイムアウトしました。\n${stderrBuf}`));
    }, 15000);

    proc.stderr.on('data', (chunk) => {
      stderrBuf += chunk.toString('utf8');
      const match = stderrBuf.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
      if (match) {
        clearTimeout(timer);
        resolve(Number(match[1]));
      }
    });

    proc.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome が予期せず終了しました (code=${code})。\n${stderrBuf}`));
    });
  });

  // ページターゲットの WebSocket URL を取得する
  const targetsRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!pageTarget) {
    throw new Error('Chrome のページターゲットを取得できませんでした。');
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  const cdp = new CdpClient(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  // HiDPI 環境でも 1:1 の実ピクセル寸法となるよう deviceScaleFactor: 1 を明示する
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false
  });

  const cleanup = () => {
    try {
      cdp.close();
    } catch {
      // 終了時の接続エラーは無視する
    }
    try {
      proc.kill('SIGKILL');
    } catch {
      // 既に終了している場合は無視する
    }
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // 一時ディレクトリ削除失敗時は無視する
    }
  };

  return { proc, cdp, cleanup };
}

/**
 * メイン処理
 */
async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { localesDir, locales } = discoverLocales();

  const targetLocales = options.langs
    ? options.langs.map((lang) => {
        const matched = locales.find((item) => item.lang.toLowerCase() === lang.toLowerCase());
        return matched ?? { folder: lang.replace(/-/g, '_'), lang, messagesPath: null };
      })
    : locales;

  if (targetLocales.length === 0) {
    throw new Error('生成対象となる言語が見つかりませんでした。');
  }

  const chromeExec = findChromeExecutable(options.chromePath);
  const assets = {
    iconFullDataUri: loadSvgAsDataUri(path.join(PROJECT_ROOT, 'src', 'icon.svg')),
    iconEmptyDataUri: loadSvgAsDataUri(path.join(PROJECT_ROOT, 'src', 'icon-empty.svg'))
  };

  fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });

  console.log(`参照 _locales: ${localesDir ? path.relative(PROJECT_ROOT, localesDir) : '(フォールバック: en, ja)'}`);
  console.log(`対象言語: ${targetLocales.map((l) => l.lang).join(', ')}`);
  console.log(`出力サイズ: ${options.width}x${options.height} / 形式: ${options.format}`);

  const { cdp, cleanup } = await launchHeadlessChrome(chromeExec, options.width, options.height);

  try {
    const { frameTree } = await cdp.send('Page.getFrameTree');
    const frameId = frameTree.frame.id;
    let generatedCount = 0;

    for (const localeInfo of targetLocales) {
      const messages = localeInfo.messagesPath
        ? JSON.parse(fs.readFileSync(localeInfo.messagesPath, 'utf8'))
        : {};
      const langBundle = buildSlidesForLang(localeInfo.lang, messages);

      for (const slide of langBundle.slides) {
        const html = renderSlideHtml({
          lang: langBundle.lang,
          fontFamily: langBundle.fontFamily,
          ui: langBundle.ui,
          slide,
          width: options.width,
          height: options.height,
          assets
        });

        await cdp.send('Page.setDocumentContent', { frameId, html });
        // フォント・画像の描画完了を待機する
        await cdp.send('Runtime.evaluate', {
          expression: `
            new Promise((resolve) => {
              const waitImages = Promise.all(
                Array.from(document.images).map((img) =>
                  img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; })
                )
              );
              Promise.all([document.fonts.ready, waitImages]).then(() => {
                requestAnimationFrame(() => requestAnimationFrame(resolve));
              });
            })
          `,
          awaitPromise: true
        });

        const { data: base64Png } = await cdp.send('Page.captureScreenshot', {
          format: 'png',
          fromSurface: true
        });

        const rawBuffer = Buffer.from(base64Png, 'base64');
        const ext = options.format === 'jpg' ? 'jpg' : 'png';
        const outFile = path.join(DEFAULT_OUTPUT_DIR, `store-${slide.id}.${langBundle.lang}.${ext}`);

        // 透過なし 24-bit RGB PNG（または JPEG）かつ正確な実ピクセル寸法で書き出す
        const pipeline = sharp(rawBuffer)
          .resize(options.width, options.height, { fit: 'fill' })
          .flatten({ background: '#fff6f0' })
          .removeAlpha();

        if (options.format === 'jpg') {
          await pipeline.jpeg({ quality: 92 }).toFile(outFile);
        } else {
          await pipeline.png({ compressionLevel: 9 }).toFile(outFile);
        }

        generatedCount += 1;
        console.log(`生成完了: ${path.relative(PROJECT_ROOT, outFile)}`);
      }
    }

    console.log(`\n全 ${generatedCount} 枚のストア画像を生成しました。`);
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error('[エラー] ストア画像の生成に失敗しました:', err);
  process.exit(1);
});
