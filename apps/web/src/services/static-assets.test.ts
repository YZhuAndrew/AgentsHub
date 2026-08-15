import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Hono } from 'hono';
import { registerStaticClientRoutes } from './static-assets.js';

function buildClientDist(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prompthub-static-'));
  const clientDir = path.join(root, 'client');
  fs.mkdirSync(path.join(clientDir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(clientDir, 'index.html'), '<!doctype html><html><body>home</body></html>');
  fs.writeFileSync(path.join(clientDir, 'assets', 'index-abc123.js'), 'console.log("entry");');
  fs.writeFileSync(path.join(clientDir, 'assets', 'index-abc123.css'), 'body{color:red}');
  fs.writeFileSync(path.join(clientDir, 'favicon.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  return clientDir;
}

describe('registerStaticClientRoutes caching behavior', () => {
  let clientDist: string;
  let app: Hono;

  beforeEach(() => {
    clientDist = buildClientDist();
    app = new Hono();
    registerStaticClientRoutes(app, clientDist);
  });

  afterEach(() => {
    fs.rmSync(path.dirname(clientDist), { recursive: true, force: true });
  });

  it('serves hashed assets with immutable year-long caching', async () => {
    const response = await app.request('http://local/assets/index-abc123.js');

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/javascript; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(response.headers.get('Vary')).toBe('Accept-Encoding');
    expect(await response.text()).toBe('console.log("entry");');
  });

  it('serves the HTML entry with no-cache plus a revalidation ETag', async () => {
    const response = await app.request('http://local/');

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    const etag = response.headers.get('ETag');
    expect(etag).toMatch(/^W\//);
    expect(await response.text()).toContain('home');
  });

  it('answers 304 when If-None-Match matches the current ETag', async () => {
    const first = await app.request('http://local/');
    const etag = first.headers.get('ETag')!;

    const revalidated = await app.request('http://local/', {
      headers: { 'If-None-Match': etag },
    });

    expect(revalidated.status).toBe(304);
    expect(revalidated.headers.get('ETag')).toBe(etag);
    expect(await revalidated.text()).toBe('');
  });

  it('re-serves the file when the content changed (new ETag)', async () => {
    const first = await app.request('http://local/');
    const staleEtag = first.headers.get('ETag')!;

    const updatedHtml = '<!doctype html><html><body>home v2</body></html>';
    fs.writeFileSync(path.join(clientDist, 'index.html'), updatedHtml);

    const second = await app.request('http://local/', {
      headers: { 'If-None-Match': staleEtag },
    });

    expect(second.status).toBe(200);
    expect(second.headers.get('ETag')).not.toBe(staleEtag);
    expect(await second.text()).toContain('home v2');
  });

  it('falls back to the SPA entry for unknown routes with revalidation headers', async () => {
    const response = await app.request('http://local/prompts/42');

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    expect(await response.text()).toContain('home');
  });

  it('does not register any static route when the client bundle is absent', async () => {
    const emptyApp = new Hono();
    const missingDir = path.join(path.dirname(clientDist), 'missing-client');
    registerStaticClientRoutes(emptyApp, missingDir);

    const response = await emptyApp.request('http://local/assets/index-abc123.js');
    expect(response.status).toBe(404);
  });
});
