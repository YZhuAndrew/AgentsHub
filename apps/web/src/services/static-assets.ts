import { existsSync } from 'node:fs';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import type { Context, Hono } from 'hono';

// Vite emits content-hashed filenames under assets/, so they can be cached
// immutably; the HTML entry must always revalidate or users would be pinned
// to a stale bundle after a deploy.
// Vite 的 assets/ 下都是带内容 hash 的文件名，可以永久缓存；HTML 入口
// 必须每次重校验，否则部署后用户会被旧 bundle 卡住。
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const REVALIDATE_CACHE_CONTROL = 'no-cache';

function contentTypeFor(extension: string): string {
  switch (extension) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}

function staticHeaders(contentType: string, cacheControl: string): Record<string, string> {
  return {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    // Compressed variants must not be reused for a client that did not ask
    // for compression.
    // 压缩变体不能被复用给未请求压缩的客户端。
    Vary: 'Accept-Encoding',
  };
}

async function computeEtag(filePath: string): Promise<string> {
  const fileStat = await stat(filePath);
  return `W/"${fileStat.size}-${Math.round(fileStat.mtimeMs)}"`;
}

async function serveStaticFile(
  c: Context,
  targetPath: string,
  isHashedAsset: boolean,
): Promise<Response> {
  const headers = staticHeaders(
    contentTypeFor(path.extname(targetPath).toLowerCase()),
    isHashedAsset ? IMMUTABLE_CACHE_CONTROL : REVALIDATE_CACHE_CONTROL,
  );

  if (!isHashedAsset) {
    const etag = await computeEtag(targetPath);
    headers.ETag = etag;
    if (c.req.header('If-None-Match') === etag) {
      return new Response(null, { status: 304, headers });
    }
  }

  const file = await readFile(targetPath);
  return new Response(file, { status: 200, headers });
}

/**
 * Serve the built client bundle with deploy-safe caching:
 * - hashed `/assets/*` files are immutable for a year
 * - the HTML entry (and SPA fallback) revalidates via ETag with 304 support
 */
export function registerStaticClientRoutes(app: Hono, clientDistDir: string): void {
  const clientIndexPath = path.join(clientDistDir, 'index.html');
  if (!existsSync(clientIndexPath)) {
    return;
  }

  app.get('*', async (c) => {
    const requestPath = c.req.path === '/' ? '/index.html' : c.req.path;
    const normalizedPath = requestPath.replace(/^\//, '');
    const targetPath = path.resolve(clientDistDir, normalizedPath);

    if (targetPath.startsWith(clientDistDir) && existsSync(targetPath)) {
      return serveStaticFile(c, targetPath, normalizedPath.startsWith('assets/'));
    }

    return serveStaticFile(c, clientIndexPath, false);
  });
}
