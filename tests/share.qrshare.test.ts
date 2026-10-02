import { beforeEach, describe, expect, it } from 'bun:test';
import {
  DEFAULT_QRSHARE_URL,
  handoffSendUrl,
  loadShareSettings,
  prepareTransferUrl,
  probeHandoff,
  type FetchFn,
  qrshareOrigin,
  receiveUrl,
  saveShareSettings,
  sendTextUrl,
} from '../src/share/qrshare';

/** In-memory localStorage. */
class MemoryStorage {
  private items = new Map<string, string>();
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
  clear(): void {
    this.items.clear();
  }
}

const fetchJson = (body: unknown, ok = true): FetchFn => async () => ({ ok, json: async () => body });

describe('QRShare settings', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage();
  });

  it('defaults to the public QRShare, preferring air-gapped transfers', () => {
    expect(loadShareSettings()).toEqual({ url: DEFAULT_QRSHARE_URL, policy: 'prefer-airgap' });
  });

  it('remembers a valid address and policy', () => {
    saveShareSettings({ url: 'https://qr.example/app/', policy: 'airgap' });
    expect(loadShareSettings()).toEqual({ url: 'https://qr.example/app/', policy: 'airgap' });
  });

  it('ignores an invalid address or policy', () => {
    localStorage.setItem('cascad.share', JSON.stringify({ url: 'javascript:alert(1)', policy: 'teleport' }));
    expect(loadShareSettings()).toEqual({ url: DEFAULT_QRSHARE_URL, policy: 'prefer-airgap' });
    localStorage.setItem('cascad.share', '{not json');
    expect(loadShareSettings()).toEqual({ url: DEFAULT_QRSHARE_URL, policy: 'prefer-airgap' });
  });
});

describe('QRShare routes', () => {
  it('builds the send, receive and prepare routes', () => {
    expect(handoffSendUrl('https://example.org/qr/#/old', 'any')).toBe('https://example.org/qr/#/send?handoff=1&policy=any');
    expect(receiveUrl('https://example.org/qr/', 'airgap', 'https://cascad.example/?handoff=qrshare')).toBe(
      'https://example.org/qr/#/receive/qr?policy=airgap&return=https%3A%2F%2Fcascad.example%2F%3Fhandoff%3Dqrshare',
    );
    expect(receiveUrl('https://example.org/qr/', 'any')).toBe('https://example.org/qr/#/receive/qr?policy=any');
    expect(prepareTransferUrl('https://example.org/qr/')).toBe('https://example.org/qr/#/create/url');
    expect(sendTextUrl('https://example.org/qr/', 'a b', 'prefer-airgap')).toBe('https://example.org/qr/#/send?data=a+b&policy=prefer-airgap');
    expect(qrshareOrigin('https://example.org/qr/')).toBe('https://example.org');
  });

  it('reads handoff support from the QRShare manifest', async () => {
    expect(await probeHandoff('https://example.org/qr/', fetchJson({ qrshare_handoff: { versions: [1] } }))).toBe(true);
    expect(await probeHandoff('https://example.org/qr/', fetchJson({ name: 'QRShare' }))).toBe(false);
    expect(await probeHandoff('https://example.org/qr/', fetchJson({}, false))).toBeNull();
    expect(await probeHandoff('https://example.org/qr/', async () => { throw new TypeError('offline'); })).toBeNull();
  });
});
