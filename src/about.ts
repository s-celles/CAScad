/**
 * About window, modelled on the ones of QRShare and Progressive Web Office:
 * version and build, QR code of the app, links, privacy and credits.
 */
import { BUILD, knownCommit, shortCommit } from './build-info';
import { button, h, openDialog } from './dom';
import { t } from './i18n';
import { zoomableQr } from './qr';

export const SOURCE_URL = 'https://github.com/s-celles/CAScad';
const CHANGELOG_URL = `${SOURCE_URL}/blob/main/CHANGELOG.md`;
const LICENSE_URL = 'https://www.gnu.org/licenses/agpl-3.0.html';

/** What the About window says about each library (versions come from the build). */
const LIBRARIES: Record<string, { label: string; author: string; license: string; url: string }> = {
  giac: { label: 'Giac', author: 'Bernard Parisse', license: 'GPL-3.0', url: 'https://www-fourier.univ-grenoble-alpes.fr/~parisse/giac.html' },
  mathlive: { label: 'MathLive', author: 'Arno Gourdol', license: 'MIT', url: 'https://mathlive.io/' },
  '@cortex-js/compute-engine': { label: 'CortexJS Compute Engine', author: 'Arno Gourdol', license: 'MIT', url: 'https://cortexjs.io/compute-engine/' },
  katex: { label: 'KaTeX', author: 'Khan Academy', license: 'MIT', url: 'https://katex.org/' },
  jsxgraph: { label: 'JSXGraph', author: 'Alfred Wassermann et al.', license: 'MIT or LGPL-3.0', url: 'https://jsxgraph.org/' },
  '@observablehq/runtime': { label: 'Observable Runtime', author: 'Observable, Inc.', license: 'ISC', url: 'https://github.com/observablehq/runtime' },
  mermaid: { label: 'Mermaid', author: 'Knut Sveidqvist et al.', license: 'MIT', url: 'https://mermaid.js.org/' },
  lit: { label: 'Lit', author: 'Google LLC', license: 'BSD-3-Clause', url: 'https://lit.dev/' },
  marked: { label: 'marked', author: 'Christopher Jeffrey et al.', license: 'MIT', url: 'https://marked.js.org/' },
  'lean-qr': { label: 'lean-qr', author: 'David Evans', license: 'MIT', url: 'https://github.com/davidje13/lean-qr' },
  '@cheprasov/qrcode': { label: '@cheprasov/qrcode', author: 'Alexander Cheprasov', license: 'MIT', url: 'https://github.com/cheprasov/js-qrcode' },
  jsqr: { label: 'jsQR', author: 'Cosmo Wolfe', license: 'Apache-2.0', url: 'https://github.com/cozmo/jsQR' },
  'luby-transform': { label: 'luby-transform', author: 'Anthony Fu', license: 'MIT', url: 'https://github.com/qifi-dev/qrs' },
  'lz-string': { label: 'lz-string', author: 'pieroxy', license: 'MIT', url: 'https://github.com/pieroxy/lz-string' },
  peerjs: { label: 'PeerJS', author: 'PeerJS contributors', license: 'MIT', url: 'https://peerjs.com/' },
};

/** Giac's own version (`version()`), once the engine is ready; null otherwise. */
function giacVersion(): string | null {
  try {
    if (typeof caseval !== 'function' || !window.Module?.ready) return null;
    const text = caseval('version()').replace(/^"|"$/g, '');
    return /^giac\s+\S+/i.test(text) ? text.replace(/^giac\s+/i, '').split(/[\s,]/)[0]! : null;
  } catch {
    return null;
  }
}

/** The libraries table: name, version (and whether it is bundled or loaded from a CDN), licence, author. */
function librariesTable(): HTMLTableElement {
  const giac = giacVersion();
  const rows: { name: string; version: string; where: string }[] = [
    { name: 'giac', version: giac ?? '—', where: t('aboutSourceLocal') },
    ...BUILD.dependencies.map((d) => ({
      name: d.name,
      version: d.version === 'latest' ? t('aboutVersionLatest') : d.version,
      where: t(d.source === 'bundled' ? 'aboutSourceBundled' : 'aboutSourceCdn'),
    })),
  ];
  return h(
    'table',
    { class: 'about-libraries' },
    h('thead', {}, h('tr', {}, h('th', {}, t('aboutColLib')), h('th', {}, t('aboutColVersion')), h('th', {}, t('aboutColLicense')), h('th', {}, t('aboutColAuthor')))),
    h(
      'tbody',
      {},
      ...rows.map((row) => {
        const info = LIBRARIES[row.name];
        return h(
          'tr',
          {},
          h('td', {}, info ? link(info.url, info.label) : row.name),
          h('td', {}, h('span', { class: 'mono' }, row.version), ' ', h('span', { class: 'hint' }, `(${row.where})`)),
          h('td', {}, info?.license ?? '—'),
          h('td', {}, info?.author ?? '—'),
        );
      }),
    ),
  );
}

/** Whether the app runs installed (standalone window) rather than in a browser tab. */
function installed(): boolean {
  try {
    return matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

const offlineReady = (): boolean => !!navigator.serviceWorker?.controller;

const yesNo = (value: boolean): string => t(value ? 'aboutYes' : 'aboutNo');

/** "v0.1.3 (b271dda)", as QRShare and PWO show it. */
export const versionLabel = (): string => `v${BUILD.version} (${shortCommit()})`;

/** Plain-text details to paste into a bug report. */
export function debugReport(appUrl: string): string {
  return [
    `CAScad ${BUILD.version} (${shortCommit()}${BUILD.date ? `, ${BUILD.date.slice(0, 10)}` : ''})`,
    appUrl,
    navigator.userAgent,
    `${t('aboutLanguage')}: ${document.documentElement.lang || navigator.language}`,
    `${t('aboutInstalled')}: ${yesNo(installed())} · ${t('aboutOffline')}: ${yesNo(offlineReady())}`,
  ].join('\n');
}

const link = (href: string, text: string): HTMLAnchorElement => h('a', { href, target: '_blank', rel: 'noopener' }, text);

/** The content of the About window for the app published at `appUrl`. */
export function aboutContent(appUrl: string): HTMLElement {
  const date = new Date(BUILD.date);
  const commit = knownCommit() ? link(`${SOURCE_URL}/commit/${BUILD.commit}`, shortCommit()) : h('span', {}, shortCommit());
  commit.classList.add('mono');
  const facts: [string, Node | string][] = [
    [t('aboutVersion'), link(CHANGELOG_URL, BUILD.version)],
    [t('aboutCommit'), commit],
    [t('aboutBuilt'), BUILD.date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : '—'],
    [t('aboutLicenseLabel'), link(LICENSE_URL, 'GNU AGPL-3.0-or-later')],
    [t('aboutInstalled'), yesNo(installed())],
    [t('aboutOffline'), yesNo(offlineReady())],
  ];
  return h(
    'div',
    { class: 'about' },
    h(
      'div',
      { class: 'about-head' },
      h('img', { class: 'about-logo', src: new URL('assets/icon-192.png', appUrl).href, alt: '', width: 56, height: 56 }),
      h('div', {}, h('p', { class: 'about-name' }, 'CAScad'), h('p', { class: 'hint' }, t('aboutDesc'))),
    ),
    h(
      'div',
      { class: 'about-body' },
      h('dl', { class: 'about-facts' }, ...facts.flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])),
      h(
        'figure',
        { class: 'about-qr-figure' },
        // A click enlarges it, to scan from a distance or with a poor camera.
        zoomableQr(appUrl, t('aboutQrAlt', { url: appUrl }), 160, 'about-qr'),
        h('figcaption', { class: 'hint' }, t('aboutQrCaption'), h('br'), h('span', { class: 'mono' }, appUrl)),
      ),
    ),
    h(
      'ul',
      { class: 'about-links' },
      h('li', {}, link(`${SOURCE_URL}#readme`, t('aboutGettingStarted'))),
      h('li', {}, link(SOURCE_URL, t('aboutSource'))),
      h('li', {}, link(CHANGELOG_URL, t('aboutChangelog'))),
      h('li', {}, link(`${SOURCE_URL}/issues/new`, t('aboutReport'))),
      h(
        'li',
        {},
        h('a', {
          href: '#',
          onclick: ((e: Event) => {
            e.preventDefault();
            void import('./requirements').then((m) => m.showRequirements());
          }) as EventListener,
        }, t('aboutRequirements')),
      ),
    ),
    h('p', { class: 'hint' }, t('aboutPrivacy')),
    h('p', { class: 'hint' }, t('aboutCreditsText')),
    h('details', { class: 'about-details' }, h('summary', {}, t('aboutLibraries')), librariesTable(), h('p', { class: 'hint' }, t('aboutVersionsHint'))),
  );
}

/** Open the About window. */
export function showAbout(): void {
  if (document.querySelector('.about-dialog')) return;
  const appUrl = new URL('./', document.baseURI).href;
  const dialog = h('dialog', { class: 'dialog about-dialog', 'aria-labelledby': 'about-title' });
  const status = h('span', { class: 'hint', role: 'status' });
  const closeButton = button(t('commonClose'), () => dialog.close(), { className: 'primary' });
  dialog.append(
    h('h2', { id: 'about-title' }, t('aboutTitle')),
    aboutContent(appUrl),
    h(
      'div',
      { class: 'dialog-actions' },
      status,
      button(
        t('aboutCopyDetails'),
        () => {
          void navigator.clipboard?.writeText(debugReport(appUrl)).then(
            () => (status.textContent = t('aboutCopied')),
            () => (status.textContent = ''),
          );
        },
        { title: t('aboutCopyDetailsTitle') },
      ),
      closeButton,
    ),
  );
  openDialog(dialog);
  closeButton.focus();
}
