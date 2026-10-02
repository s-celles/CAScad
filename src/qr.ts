/** QR codes as images (About window, invitations), with lean-qr as in QRShare and PWO. */
import { correction, generate } from 'lean-qr';
import { toSvgDataURL } from 'lean-qr/extras/svg';
import { button, h, openDialog } from './dom';
import { t } from './i18n';

/** A `data:` SVG URL of a QR code for `text`, black on white with a quiet zone. */
export function qrDataUrl(text: string): string {
  return toSvgDataURL(generate(text, { minCorrectionLevel: correction.M }), { on: 'black', off: 'white', padX: 4, padY: 4 });
}

export function qrImage(text: string, alt: string, size: number, className: string): HTMLImageElement {
  return h('img', { class: className, src: qrDataUrl(text), alt, width: size, height: size });
}

/** The QR code full screen, easy to scan from a distance (click, Escape or Close to leave). */
export function showQrFullScreen(text: string, alt: string): void {
  const overlay = h('dialog', { class: 'qr-full', 'aria-label': t('qrFullScreen') });
  const closeButton = button(t('commonClose'), () => overlay.close(), { className: 'primary' });
  overlay.append(qrImage(text, alt, 640, 'qr-full-image'), h('p', { class: 'qr-full-text' }, text), closeButton);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || (e.target as HTMLElement).classList.contains('qr-full-image')) overlay.close();
  });
  openDialog(overlay);
  closeButton.focus();
}

/** A QR code that opens full screen when clicked (or activated with the keyboard). */
export function zoomableQr(text: string, alt: string, size: number, className: string): HTMLButtonElement {
  const b = button('', () => showQrFullScreen(text, alt), { className: 'qr-zoom', title: t('qrEnlargeTitle') });
  b.replaceChildren(qrImage(text, alt, size, className));
  b.setAttribute('aria-label', t('qrEnlarge'));
  return b;
}
