/**
 * Device-to-device exchange through QRShare (https://github.com/s-celles/QRShare,
 * AGPL-3.0), a separate PWA: CAScad only links to its public routes and to the
 * Web Share API, as Progressive Web Office does.
 */

export type SendPolicy = 'airgap' | 'prefer-airgap' | 'any';

export const SEND_POLICIES: SendPolicy[] = ['airgap', 'prefer-airgap', 'any'];
export const DEFAULT_QRSHARE_URL = 'https://s-celles.github.io/QRShare/';

export interface ShareSettings {
  url: string;
  policy: SendPolicy;
}

const KEY = 'cascad.share';

const isHttpUrl = (url: string): boolean => {
  try {
    return ['https:', 'http:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

export function loadShareSettings(): ShareSettings {
  let raw: Partial<ShareSettings> = {};
  try {
    raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<ShareSettings>;
  } catch {
    /* defaults */
  }
  return {
    url: typeof raw.url === 'string' && isHttpUrl(raw.url) ? raw.url : DEFAULT_QRSHARE_URL,
    policy: SEND_POLICIES.includes(raw.policy as SendPolicy) ? (raw.policy as SendPolicy) : 'prefer-airgap',
  };
}

export function saveShareSettings(settings: ShareSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ url: isHttpUrl(settings.url) ? settings.url : DEFAULT_QRSHARE_URL, policy: settings.policy }));
  } catch {
    /* storage unavailable */
  }
}

const base = (url: string): string => url.split('#', 1)[0]!;

/** QRShare sending `text` (a link, for instance) as a QR code. */
export function sendTextUrl(url: string, text: string, policy: SendPolicy): string {
  return `${base(url)}#/send?${new URLSearchParams({ data: text, policy }).toString()}`;
}

/** QRShare's receive screen; `returnUrl` lets QRShare hand the received file back. */
export function receiveUrl(url: string, policy: SendPolicy, returnUrl?: string): string {
  return `${base(url)}#/receive/qr?policy=${policy}${returnUrl ? `&return=${encodeURIComponent(returnUrl)}` : ''}`;
}

/** QRShare's transfer chooser waiting for a file handed over with postMessage. */
export function handoffSendUrl(url: string, policy: SendPolicy): string {
  return `${base(url)}#/send?handoff=1&policy=${policy}`;
}

/** QRShare's "Prepare a transfer" screen, where local files are selected. */
export function prepareTransferUrl(url: string): string {
  return `${base(url)}#/create/url`;
}

/**
 * Whether the QRShare at `url` speaks the handoff protocol v1, read from the
 * `qrshare_handoff` member of its web app manifest. Null when unknown.
 */
/** The part of `fetch` used here (injectable for tests). */
export type FetchFn = (input: string, init?: RequestInit) => Promise<Pick<Response, 'ok' | 'json'>>;

export async function probeHandoff(url: string, fetchFn: FetchFn = (input, init) => fetch(input, init)): Promise<boolean | null> {
  try {
    const res = await fetchFn(new URL('manifest.webmanifest', base(url)).href, { cache: 'no-store' });
    if (!res.ok) return null;
    const manifest = (await res.json()) as { qrshare_handoff?: { versions?: unknown } };
    const versions = manifest.qrshare_handoff?.versions;
    return Array.isArray(versions) && versions.includes(1);
  } catch {
    return null;
  }
}

/** Origin of the configured QRShare, the only one allowed to hand files back. */
export function qrshareOrigin(url: string): string {
  return new URL(url).origin;
}

export function canShareFiles(file: File): boolean {
  try {
    return typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}
