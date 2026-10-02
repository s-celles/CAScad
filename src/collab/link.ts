/**
 * Invitation links for real-time collaboration (COLLAB-001), as in Progressive
 * Web Office: `#collab=n.<room>.<secret>` — the room name lets participants
 * find each other, the secret encrypts the connection set-up and never leaves
 * the link (the fragment is not sent to any server).
 */

export interface CollabLink {
  /** Public room name used to find each other. */
  room: string;
  /** Shared secret encrypting the connection set-up. */
  secret: string;
}

const PREFIX = '#collab=';

function randomId(bytes: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function newCollabLink(): CollabLink {
  return { room: randomId(9), secret: randomId(18) };
}

export function collabHash(link: CollabLink): string {
  return `${PREFIX}n.${link.room}.${link.secret}`;
}

/** The invitation URL for the app at `base`. */
export function collabUrl(base: string, link: CollabLink): string {
  return `${base.replace(/#.*$/, '')}${collabHash(link)}`;
}

/** The link carried by an address fragment, or null. */
export function decodeCollabLink(hash: string): CollabLink | null {
  if (!hash.startsWith(PREFIX)) return null;
  const m = /^n\.([\w-]{8,64})\.([\w-]{16,128})$/.exec(hash.slice(PREFIX.length));
  return m ? { room: m[1]!, secret: m[2]! } : null;
}
