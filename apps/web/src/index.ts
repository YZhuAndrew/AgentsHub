import { serve } from '@hono/node-server';
import path from 'node:path';
import { config } from './config.js';
import { createApp } from './app.js';
import { registerStaticClientRoutes } from './services/static-assets.js';

const app = createApp();
const clientDistDir = path.resolve(process.cwd(), 'dist/client');

registerStaticClientRoutes(app, clientDistDir);

serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  (info) => {
    console.log(`PromptHub server listening on http://${info.address}:${info.port}`);
  },
);
