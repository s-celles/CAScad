import { describe, expect, it } from 'bun:test';
import * as Y from 'yjs';
import { CollabBinding, type CollabAdapter } from '../src/collab/binding';
import { collabUrl, decodeCollabLink, newCollabLink } from '../src/collab/link';
import { notebookParts, partsNotebook, stableStringify, type CollabParts } from '../src/collab/parts';

/** Two Yjs documents wired together, like two peers; `hold()` delays delivery until `flush()`. */
function linked(): [Y.Doc, Y.Doc, { hold(): void; flush(): void }] {
  const a = new Y.Doc();
  const b = new Y.Doc();
  let held: (() => void)[] | null = null;
  const send = (to: Y.Doc) => (u: Uint8Array, origin: unknown) => {
    if (origin === 'net') return;
    const deliver = () => Y.applyUpdate(to, u, 'net');
    if (held) held.push(deliver);
    else deliver();
  };
  a.on('update', send(b));
  b.on('update', send(a));
  return [a, b, { hold: () => void (held = []), flush: () => { const q = held ?? []; held = null; q.forEach((f) => f()); } }];
}

class Fake implements CollabAdapter {
  writes = 0;
  constructor(public parts: CollabParts) {}
  read(): CollabParts {
    return structuredClone(this.parts);
  }
  write(parts: CollabParts): void {
    this.writes++;
    this.parts = structuredClone(parts);
  }
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('COLLAB-002 notebook parts', () => {
  it('gives one part per cell, in order, with stable JSON', () => {
    const cells = [
      { uid: 'u1', cell: { type: 'math', mode: 'math', latex: '2+3', hidden: false } },
      { uid: 'u2', cell: { type: 'raw', content: 'factor(x^4-1)' } },
    ];
    const parts = notebookParts(cells);
    expect(parts.list).toEqual(['u1', 'u2']);
    expect(parts.keys['c:u1']).toBe('{"hidden":false,"latex":"2+3","mode":"math","type":"math"}');
    expect(partsNotebook(parts)).toEqual(cells);
    expect(stableStringify({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } })).toBe('{"a":{"c":[3,{"e":5,"f":4}],"d":2},"b":1}');
  });

  it('skips list entries without a part, duplicates and damaged parts', () => {
    expect(partsNotebook({ keys: { 'c:a': '{"type":"raw"}', 'c:b': '{oops' }, list: ['a', 'x', 'a', 'b'] })).toEqual([{ uid: 'a', cell: { type: 'raw' } }]);
  });
});

describe('COLLAB-002 binding (ported from Progressive Web Office)', () => {
  it('gives a joiner the shared content and never sends its empty notebook first', () => {
    const [a, b] = linked();
    const owner = new Fake({ keys: { 'c:u1': '{"type":"raw","content":"1+1"}' }, list: ['u1'] });
    new CollabBinding(a, owner, { initiator: true });
    const joiner = new Fake({ keys: { 'c:w': '{"type":"text"}' }, list: ['w'] });
    const bound = new CollabBinding(b, joiner, { initiator: false });
    expect(bound.isReady).toBe(true);
    expect(joiner.parts).toEqual(owner.parts);
  });

  it('merges concurrent edits of different cells, and resolves the same cell for everyone', async () => {
    const [a, b, net] = linked();
    const fa = new Fake({ keys: { 'c:x': '1', 'c:y': '1', 'c:z': '1' }, list: ['x', 'y', 'z'] });
    const ba = new CollabBinding(a, fa, { initiator: true });
    const fb = new Fake({ keys: {}, list: [] });
    const bb = new CollabBinding(b, fb, { initiator: false });
    await tick();
    // Two people edit at the same time, each before seeing the other's edit:
    // A edits x and z, B edits y and z and adds a cell w at the end.
    fa.parts = { keys: { 'c:x': '2', 'c:y': '1', 'c:z': 'A' }, list: ['x', 'y', 'z'] };
    fb.parts = { keys: { 'c:x': '1', 'c:y': '3', 'c:z': 'B', 'c:w': 'new' }, list: ['x', 'y', 'z', 'w'] };
    net.hold();
    ba.push();
    bb.push();
    net.flush();
    await tick();
    expect(ba.shared()).toEqual(bb.shared());
    expect(fa.parts).toEqual(fb.parts);
    const shared = ba.shared();
    expect(shared.keys['c:x']).toBe('2');
    expect(shared.keys['c:y']).toBe('3');
    expect(['A', 'B']).toContain(shared.keys['c:z']!);
    expect(shared.list).toEqual(['x', 'y', 'z', 'w']);
  });

  it('never reverts a remote edit that has not reached the notebook yet', async () => {
    const [a, b] = linked();
    const fa = new Fake({ keys: { 'c:x': '1' }, list: ['x', 'y'] });
    const ba = new CollabBinding(a, fa, { initiator: true });
    const fb = new Fake({ keys: {}, list: [] });
    const bb = new CollabBinding(b, fb, { initiator: false });
    fa.parts = { keys: { 'c:x': '2' }, list: ['v', 'x', 'y'] };
    ba.push();
    fb.parts = { keys: { 'c:x': '1', 'c:y': 'b' }, list: ['x', 'y', 'z'] };
    bb.push();
    await tick();
    const expected = { keys: { 'c:x': '2', 'c:y': 'b' }, list: ['v', 'x', 'y', 'z'] };
    expect(ba.shared()).toEqual(expected);
    expect(fb.parts).toEqual(expected);
  });

  it('keeps a local edit not sent yet when a remote change arrives', async () => {
    const [a, b] = linked();
    const fa = new Fake({ keys: { 'c:x': '1', 'c:y': '1' }, list: ['x', 'y'] });
    const ba = new CollabBinding(a, fa, { initiator: true });
    const fb = new Fake({ keys: {}, list: [] });
    new CollabBinding(b, fb, { initiator: false });
    await tick();
    // B has edited y, but its notebook has not reported it yet when A's edit of x arrives.
    fb.parts = { keys: { 'c:x': '1', 'c:y': 'B' }, list: ['x', 'y'] };
    fa.parts = { keys: { 'c:x': 'A', 'c:y': '1' }, list: ['x', 'y'] };
    ba.push();
    await tick();
    const expected = { keys: { 'c:x': 'A', 'c:y': 'B' }, list: ['x', 'y'] };
    expect(fb.parts).toEqual(expected);
    expect(fa.parts).toEqual(expected);
  });

  it('removes deleted cells and does not echo its own edits back to the notebook', async () => {
    const [a] = linked();
    const fa = new Fake({ keys: { 'c:a': '1', 'c:b': '2' }, list: ['a', 'b', 'c'] });
    const ba = new CollabBinding(a, fa, { initiator: true });
    fa.parts = { keys: { 'c:a': '1' }, list: ['a', 'c'] };
    ba.push();
    await tick();
    expect(ba.shared()).toEqual({ keys: { 'c:a': '1' }, list: ['a', 'c'] });
    expect(fa.writes).toBe(0);
  });
});

describe('COLLAB-001 invitation links', () => {
  it('round-trips the room and secret, and rejects damaged links', () => {
    const link = newCollabLink();
    const url = collabUrl('https://example.org/CAScad/#nb=old', link);
    expect(url).toMatch(/^https:\/\/example\.org\/CAScad\/#collab=n\.[\w-]{12}\.[\w-]{24}$/);
    expect(decodeCollabLink(new URL(url).hash)).toEqual(link);
    expect(decodeCollabLink('#collab=x.abc.def')).toBeNull();
    expect(decodeCollabLink('#nb=abc')).toBeNull();
    expect(newCollabLink().secret).not.toBe(link.secret);
  });
});
