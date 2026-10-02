/**
 * "Send to another device" and "Receive from another device" through QRShare,
 * as in Progressive Web Office: the notebook is handed to QRShare inside the
 * browser (postMessage), and a received file comes back the same way.
 */
import { button, h, openDialog } from '../dom';
import { t } from '../i18n';
import { receiveFromOpener, sendFileToWindow, type WindowLike } from './handoff';
import { canShareFiles, handoffSendUrl, loadShareSettings, prepareTransferUrl, probeHandoff, qrshareOrigin, receiveUrl, saveShareSettings, SEND_POLICIES, type SendPolicy } from './qrshare';

/** How long to wait for QRShare to announce it is ready before falling back. */
export const HANDOFF_TIMEOUT_MS = 15_000;
/** Longer links may be cut by some messaging apps or mail clients. */
const LINK_WARN_LENGTH = 8000;
/** The query parameter QRShare's "Open in…" button comes back with. */
const HANDOFF_PARAM = 'handoff';

/** A short message at the bottom of the window. */
export function notify(message: string): void {
  document.querySelector('.toast')?.remove();
  const toast = h('div', { class: 'toast', role: 'status' }, message);
  document.body.append(toast);
  setTimeout(() => toast.remove(), 6000);
}

function download(file: File): void {
  const url = URL.createObjectURL(file);
  const a = h('a', { href: url, download: file.name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** The open notebook as a .cascad.json file. */
function notebookFile(): File {
  const json = JSON.stringify(window.buildNotebookData(), null, 2);
  return new File([json], 'notebook.cascad.json', { type: 'application/json' });
}

/** A link carrying the notebook itself (`#nb=…`), or null when it cannot be made. */
async function notebookLink(): Promise<string | null> {
  try {
    return window.generateNotebookURL(await window.compressNotebook(), false);
  } catch {
    return null;
  }
}

/** Hand the open notebook to QRShare (or another app, or a link). */
export async function sendToDevice(): Promise<void> {
  if (document.querySelector('.share-dialog')) return;
  const file = notebookFile();
  // Prepared up front so that copying runs within the click.
  const link = await notebookLink();
  const settings = loadShareSettings();
  const dialog = h('dialog', { class: 'dialog share-dialog', 'aria-labelledby': 'share-title' });
  const policy = h('select', { 'aria-label': t('sharePolicy') }, ...SEND_POLICIES.map((p) => h('option', { value: p, selected: p === settings.policy }, t(`sharePolicy_${p}`))));
  const url = h('input', { type: 'url', value: settings.url, 'aria-label': t('shareQrshareUrl'), spellcheck: 'false' });
  // Does this QRShare accept files from apps? Checked ahead of the click,
  // which must open the window synchronously. Null while unknown.
  let supportsHandoff: boolean | null = null;
  const probe = (): void => {
    supportsHandoff = null;
    const probed = url.value.trim();
    void probeHandoff(probed).then((result) => {
      if (url.value.trim() === probed) supportsHandoff = result;
    });
  };
  url.addEventListener('change', probe);
  probe();

  // Window opening and the share sheet need the click's user activation:
  // everything up to window.open/navigator.share runs synchronously.
  const send = (): void => {
    const chosen = { url: url.value.trim(), policy: policy.value as SendPolicy };
    saveShareSettings(chosen);
    const target = loadShareSettings().url;
    if (supportsHandoff === false) {
      // An older QRShare: download and open "Prepare a transfer" right away.
      download(file);
      window.open(prepareTransferUrl(target), '_blank', 'noopener');
      notify(t('shareDownloadFallback'));
    } else {
      // Keep `opener`: QRShare announces it is ready through it.
      const win = window.open(handoffSendUrl(target, chosen.policy), '_blank');
      if (!win) {
        notify(t('sharePopupBlocked'));
      } else {
        void sendFileToWindow(window as unknown as WindowLike, win as unknown as WindowLike, qrshareOrigin(target), file, HANDOFF_TIMEOUT_MS).then((result) => {
          if (result === 'sent') return;
          // Older QRShare without handoff: download and open "Prepare a transfer".
          download(file);
          win.location.href = prepareTransferUrl(target);
          notify(t('shareHandoffFallback'));
        });
      }
    }
    dialog.close();
  };

  const actions = h('div', { class: 'dialog-actions' }, button(t('commonCancel'), () => dialog.close()));
  if (canShareFiles(file)) {
    actions.append(
      button(t('shareOtherApp'), () => {
        navigator.share({ files: [file], title: file.name }).catch(() => undefined);
        dialog.close();
      }),
    );
  }
  actions.append(button(t('shareSendButton'), send, { className: 'primary' }));

  let linkSection: HTMLElement;
  if (link) {
    const linkField = h('input', { type: 'text', readonly: true, class: 'share-link', value: link, 'aria-label': t('shareLink'), spellcheck: 'false' });
    linkField.addEventListener('focus', () => linkField.select());
    linkSection = h(
      'div',
      { class: 'share-link-section' },
      h('p', {}, t('shareLinkIntro', { size: `${Math.max(1, Math.round(link.length / 1024))} KB` })),
      h(
        'div',
        { class: 'share-row' },
        linkField,
        button(t('shareCopyLink'), () => {
          linkField.select();
          void navigator.clipboard
            ?.writeText(link)
            .then(() => notify(link.length > LINK_WARN_LENGTH ? t('shareLinkCopiedLong') : t('shareLinkCopied')))
            .catch(() => notify(t('shareLinkCopyFailed')));
          dialog.close();
        }),
      ),
      link.length > LINK_WARN_LENGTH ? h('p', { class: 'hint' }, t('shareLinkLong')) : null,
    );
  } else {
    linkSection = h('p', { class: 'hint' }, t('shareLinkUnavailable'));
  }

  dialog.append(
    h('h2', { id: 'share-title' }, t('shareDialogTitle')),
    h('p', {}, t('shareIntro')),
    h('p', { class: 'share-file' }, `📄 ${file.name}`),
    h('label', { class: 'share-row' }, t('sharePolicy'), ' ', policy),
    h('details', {}, h('summary', {}, t('shareAdvanced')), h('label', { class: 'share-row' }, t('shareQrshareUrl'), ' ', url)),
    actions,
    linkSection,
  );
  openDialog(dialog);
  policy.focus();
}

/** Open QRShare's receive screen; QRShare hands the received file back to this address. */
export function receiveFromDevice(): void {
  const settings = loadShareSettings();
  const back = new URL(location.pathname, location.origin);
  back.searchParams.set(HANDOFF_PARAM, 'qrshare');
  window.open(receiveUrl(settings.url, settings.policy, back.href), '_blank', 'noopener');
}

/**
 * Opened by QRShare's "Open in …" button: announce readiness to the opener and
 * open the notebook it hands over, from the configured QRShare only.
 */
export async function openHandedOffNotebook(): Promise<void> {
  const params = new URLSearchParams(location.search);
  if (params.get(HANDOFF_PARAM) !== 'qrshare') return;
  params.delete(HANDOFF_PARAM);
  const query = params.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  if (!window.opener) return;
  const received = await receiveFromOpener(window as unknown as WindowLike, [qrshareOrigin(loadShareSettings().url)], 60_000);
  if (!received) return;
  try {
    const data = JSON.parse(await received.file.text()) as { type?: string };
    if (data.type && !['cascad-notebook', 'giac-notebook', 'xcas-notebook'].includes(data.type)) throw new Error('not a notebook');
    window.loadNotebookData(data);
    notify(t('shareReceived', { name: received.file.name }));
  } catch {
    alert(t('shareNotNotebook', { name: received.file.name }));
  }
}
