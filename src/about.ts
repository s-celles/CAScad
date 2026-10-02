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

/** Libraries shown in the About window, with their licences. */
const LIBRARIES: { name: string; author: string; license: string; url: string }[] = [
  { name: 'Giac', author: 'Bernard Parisse', license: 'GPL-3.0', url: 'https://www-fourier.univ-grenoble-alpes.fr/~parisse/giac.html' },
  { name: 'MathLive', author: 'Arno Gourdol', license: 'MIT', url: 'https://mathlive.io/' },
  { name: 'CortexJS Compute Engine', author: 'Arno Gourdol', license: 'MIT', url: 'https://cortexjs.io/compute-engine/' },
  { name: 'KaTeX', author: 'Khan Academy', license: 'MIT', url: 'https://katex.org/' },
  { name: 'JSXGraph', author: 'Alfred Wassermann et al.', license: 'LGPL/MIT', url: 'https://jsxgraph.org/' },
  { name: 'Observable Runtime', author: 'Observable Inc.', license: 'ISC', url: 'https://github.com/observablehq/runtime' },
  { name: 'Mermaid', author: 'Knut Sveidqvist et al.', license: 'MIT', url: 'https://mermaid.js.org/' },
  { name: 'Lit', author: 'Google', license: 'BSD-3-Clause', url: 'https://lit.dev/' },
  { name: 'lean-qr', author: 'David Evans', license: 'MIT', url: 'https://github.com/davidje13/lean-qr' },
  { name: '@cheprasov/qrcode', author: 'Alexander Cheprasov', license: 'MIT', url: 'https://github.com/cheprasov/js-qrcode' },
];

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
  const libraries = h(
    'table',
    { class: 'about-libraries' },
    h('thead', {}, h('tr', {}, h('th', {}, t('aboutColLib')), h('th', {}, t('aboutColAuthor')), h('th', {}, t('aboutColLicense')))),
    h('tbody', {}, ...LIBRARIES.map((lib) => h('tr', {}, h('td', {}, link(lib.url, lib.name)), h('td', {}, lib.author), h('td', {}, lib.license)))),
  );
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
    ),
    h('p', { class: 'hint' }, t('aboutPrivacy')),
    h('p', { class: 'hint' }, t('aboutCreditsText')),
    h('details', { class: 'about-details' }, h('summary', {}, t('aboutLibraries')), libraries),
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
