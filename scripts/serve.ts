#!/usr/bin/env bun
/** Serves the built app (dist/) for local testing. */
import { join, normalize } from 'path';

const DIST = join(import.meta.dir, '..', 'dist');
const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || 'localhost';

Bun.serve({
  port,
  hostname,
  async fetch(req) {
    const pathname = decodeURIComponent(new URL(req.url).pathname);
    const path = normalize(join(DIST, pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!path.startsWith(DIST)) return new Response('Forbidden', { status: 403 });
    const file = Bun.file(path);
    return (await file.exists()) ? new Response(file) : new Response('Not found', { status: 404 });
  },
});

console.log(`Serving dist/ at http://${hostname}:${port}`);
