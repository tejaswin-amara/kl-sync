import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

type WorkerEventHandler = (event: {
  request?: {
    url: string;
    method: string;
    mode?: string;
    destination?: string;
  };
  waitUntil?: (promise: Promise<unknown>) => void;
  respondWith?: (promise: Promise<unknown>) => void;
}) => void;

async function createWorkerHarness() {
  const source = await readFile(join(process.cwd(), 'public/sw.js'), 'utf8');
  const handlers = new Map<string, WorkerEventHandler>();
  const precachedAssets: string[] = [];
  const openedCaches: string[] = [];
  const deletedCaches: string[] = [];

  const cache = {
    addAll: async (assets: string[]) => {
      precachedAssets.push(...Array.from(assets));
    },
    match: async () => undefined,
    put: async () => undefined,
  };

  const self = {
    location: { origin: 'https://kl-sync.example' },
    clients: { claim: async () => undefined },
    addEventListener: (type: string, handler: WorkerEventHandler) => {
      handlers.set(type, handler);
    },
    skipWaiting: async () => undefined,
  };

  const caches = {
    open: async (name: string) => {
      openedCaches.push(name);
      return cache;
    },
    keys: async () => ['kl-sync-cache-v2', 'unrelated-app-cache'],
    delete: async (name: string) => {
      deletedCaches.push(name);
      return true;
    },
  };

  runInNewContext(source, {
    self,
    caches,
    URL,
    fetch: async () => {
      throw new Error('Unexpected network request in this test');
    },
  });

  return { handlers, precachedAssets, openedCaches, deletedCaches };
}

test('service worker precaches public assets but never the HTML document', async () => {
  const worker = await createWorkerHarness();
  let installPromise: Promise<unknown> | undefined;

  worker.handlers.get('install')?.({
    waitUntil: (promise) => {
      installPromise = promise;
    },
  });

  assert.ok(installPromise, 'install handler must register its lifecycle work');
  await installPromise;

  assert.deepEqual(worker.openedCaches, ['kl-sync-cache-v3']);
  assert.deepEqual(worker.precachedAssets, [
    '/manifest.json',
    '/logo.webp',
    '/icon-192.png',
    '/icon-512.png',
  ]);
  assert.equal(worker.precachedAssets.includes('/'), false);
});

test('service worker activation removes only obsolete KL Sync caches', async () => {
  const worker = await createWorkerHarness();
  let activationPromise: Promise<unknown> | undefined;

  worker.handlers.get('activate')?.({
    waitUntil: (promise) => {
      activationPromise = promise;
    },
  });

  assert.ok(activationPromise, 'activate handler must register its lifecycle work');
  await activationPromise;

  assert.deepEqual(worker.deletedCaches, ['kl-sync-cache-v2']);
});

test('service worker leaves document navigations on the network', async () => {
  const worker = await createWorkerHarness();
  let intercepted = false;

  worker.handlers.get('fetch')?.({
    request: {
      url: 'https://kl-sync.example/',
      method: 'GET',
      mode: 'navigate',
      destination: 'document',
    },
    respondWith: () => {
      intercepted = true;
    },
  });

  assert.equal(intercepted, false);
});
