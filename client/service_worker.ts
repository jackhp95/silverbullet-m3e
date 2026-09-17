import { initLogger } from "./lib/logger.ts";
import { ProxyRouter } from "./service_worker/proxy_router.ts";

import { SyncEngine } from "./service_worker/sync_engine.ts";
import type {
  ServiceWorkerSourceMessage,
  ServiceWorkerTargetMessage,
} from "./types/ui.ts";
import {
  deriveDbName,
  exportKey,
  importKey,
} from "@silverbulletmd/silverbullet/lib/crypto";
import { IndexedDBKvPrimitives } from "./data/indexeddb_kv_primitives.ts";
import { fsEndpoint } from "./spaces/constants.ts";
import { DataStoreSpacePrimitives } from "./spaces/datastore_space_primitives.ts";
import { HttpSpacePrimitives } from "./spaces/http_space_primitives.ts";
import { throttleImmediately } from "@silverbulletmd/silverbullet/lib/async";
import { wrongSpacePathError } from "@silverbulletmd/silverbullet/constants";
import type { KvPrimitives } from "./data/kv_primitives.ts";
import { EncryptedKvPrimitives } from "./data/encrypted_kv_primitives.ts";

const logger = initLogger("[Service Worker]");

// Note: the only thing cached here is SilverBullet client assets, files are kept in IndexedDB
const CACHE_NAME = "{{CACHE_NAME}}";

//`location.href` minus this worker's filename will be our base URL, including any URL prefix
//(-1 is to remove the trailing '/')
const workerFilename = location.pathname.substring(
  location.pathname.lastIndexOf("/") + 1,
);
const baseURI = location.href.substring(
  0,
  location.href.length - workerFilename.length - 1,
);
const basePathName = location.pathname.substring(
  0,
  location.pathname.length - workerFilename.length - 1,
);

const precacheFiles = Object.fromEntries(
  // Dynamically replaced during build
  "{{PRECACHE_FILES}}"
    .split(",")
    .map((path) => [path, `${baseURI}${path}?v=${CACHE_NAME}`, path]),
); // Cache busting

// Initially set to undefined, resulting in all "fetch" being proxied.
// Once the service worker is configured, this will be set and the proxy will handle fetches.
const proxyRouter = new ProxyRouter(basePathName, baseURI, precacheFiles);

// Configuration mutex
let configuring = false;

// @ts-expect-error: debugging
globalThis.proxyRouter = proxyRouter;

// This is the in-memory store of an encryption key that SB clients and the index engine can share without asking for it constantly
let encryptionKeyMemoryStore: CryptoKey | undefined;

// Let's clean this encryptionKey if there's no more clients left for a little while, asking to re-enter
setInterval(() => {
  // @ts-expect-error: service worker API
  globalThis.clients.matchAll().then((clients) => {
    if (clients.length === 0 && encryptionKeyMemoryStore) {
      console.info("No more clients, flushing encryption key");
      encryptionKeyMemoryStore = undefined;
    }
  });
}, 5000); // little while is 5s

// Message received from client
self.addEventListener("message", async (event: any) => {
  const message: ServiceWorkerTargetMessage = event.data;
  switch (message.type) {
    case "skip-waiting": {
      // @ts-expect-error: Skip waiting to activate this service worker immediately
      self.skipWaiting();
      break;
    }
    case "shutdown": {
      proxyRouter.reset();
      break;
    }
    case "flush-cache": {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Removing cache", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
      broadcastMessage({
        type: "cacheFlushed",
      });
      break;
    }
    case "wipe-data": {
      if (proxyRouter.syncEngine) {
        await proxyRouter.syncEngine.wipe();
        broadcastMessage({
          type: "dataWiped",
        });
      } else {
        console.warn("Not performing sync data wipe, sync engine not started");
      }
      break;
    }
    case "perform-file-sync": {
      if (proxyRouter.syncEngine) {
        await proxyRouter.syncEngine.syncSingleFile(message.path);
      } else {
        console.warn(
          "Ignoring perform-file-sync request, proxy not configured yet",
        );
      }

      break;
    }
    case "perform-space-sync": {
      if (proxyRouter.syncEngine) {
        await proxyRouter.syncEngine.syncSpace();
      } else {
        console.warn(
          "Ignoring perform-space-sync request, proxy not configured yet",
        );
      }
      break;
    }
    case "get-encryption-key": {
      event.source.postMessage({
        type: "encryption-key",
        key:
          encryptionKeyMemoryStore &&
          (await exportKey(encryptionKeyMemoryStore)),
      } as ServiceWorkerSourceMessage);
      break;
    }
    case "set-encryption-key": {
      encryptionKeyMemoryStore = await importKey(message.key);
      console.info("Encryption phrase set");
      event.ports[0]?.postMessage({ type: "encryption-key-set" });
      break;
    }
    case "config": {
      const config = message.config;
      // Configure the service worker if it hasn't been already
      if (isConfigured()) {
        console.info(
          "Service worker already configured, just updating configs",
        );
        proxyRouter.syncEngine!.setSyncConfig({
          syncDocuments: config.syncDocuments,
          syncIgnore: config.syncIgnore,
        });

        return;
      } else {
        console.info("Service being configured with", config);
      }
      if (configuring) {
        console.info("Configuration already in progress, skipping");
        return;
      }
      // Lock configuration mutex
      configuring = true;
      // Put a timeout on it, just in case
      setTimeout(() => {
        configuring = false;
      }, 5000);
      try {
        if (config.enableClientEncryption) {
          if (!encryptionKeyMemoryStore) {
            console.error(
              "Supposed to use encryption, but no phrase set yet, auth error",
            );
            broadcastMessage({
              type: "auth-error",
              message: "Re-authentication required, redirecting...",
              actionOrRedirectHeader: ".auth",
            });
            // ABORT
            return;
          }
        }

        const spaceFolderPath = config.spaceFolderPath;
        const dbName = await deriveDbName(
          "files",
          spaceFolderPath,
          baseURI,
          encryptionKeyMemoryStore,
        );

        if (config.logPush) {
          setInterval(() => {
            void logger.postToServer(".logs", "service_worker");
          }, 1000);
        }

        // Setup KV (database) for store synced files
        let kv: KvPrimitives = new IndexedDBKvPrimitives(dbName);
        await (kv as IndexedDBKvPrimitives).init();
        console.log("Using IndexedDB database", dbName);

        if (encryptionKeyMemoryStore) {
          kv = new EncryptedKvPrimitives(kv, encryptionKeyMemoryStore);
          await (kv as EncryptedKvPrimitives).init();
          console.log("Enabled client-side encryption for synced files");
        }

        // And use that to power the IndexedDB backed local storage
        const local = new DataStoreSpacePrimitives(kv);

        // Which we'll sync with the remote server
        const remote = new HttpSpacePrimitives(
          basePathName + fsEndpoint,
          spaceFolderPath,
          (message, actionOrRedirectHeader) => {
            // And auth error occured
            console.error(
              "[service proxy error]",
              message,
              actionOrRedirectHeader,
            );
            if (message === wrongSpacePathError.message) {
              proxyRouter.reset();
            }
            broadcastMessage({
              type: "auth-error",
              message,
              actionOrRedirectHeader,
            });
          },
        );

        // Now let's setup sync
        const syncEngine = new SyncEngine(kv, local, remote);
        syncEngine.setSyncConfig({
          syncDocuments: config.syncDocuments,
          syncIgnore: config.syncIgnore,
        });
        await syncEngine.start();

        // Ok, we're ready to go, let's plug in the proxy router
        proxyRouter.configure(syncEngine);

        // And wire up some events
        proxyRouter.on({
          observedRequest: (path) => {
            // This is triggered for the currently open file, we want to proactively sync it to keep it up to date
            void syncEngine.syncSingleFile(path);
          },
          onlineStatusUpdated: (isOnline) => {
            broadcastMessage({
              type: "online-status",
              isOnline,
            });
          },
        });
        syncEngine.on({
          syncProgress: (status) => {
            broadcastMessage({
              type: "sync-status",
              status,
            });
          },
          syncConflict: (path) => {
            console.warn("Sync conflict detected:", path);
            broadcastMessage({
              type: "sync-conflict",
              path,
            });
          },
          spaceSyncComplete: (operations) => {
            broadcastMessage({
              type: "space-sync-complete",
              operations,
            });
          },
          fileSyncComplete: (path, operations) => {
            broadcastMessage({
              type: "file-sync-complete",
              path,
              operations,
            });
          },
          syncError: (error, path) => {
            broadcastMessage({
              type: "sync-error",
              message: error.message,
              path,
            });
          },
        });
      } finally {
        // Unlock mutex
        configuring = false;
      }
      break;
    }
  }
});

function broadcastMessage(message: ServiceWorkerSourceMessage) {
  // @ts-expect-error: service worker API
  const clients: any = self.clients;
  // Find all windows attached to this service worker
  clients
    .matchAll({
      type: "window",
    })
    .then((clients: any[]) => {
      clients.forEach((client) => {
        client.postMessage(message);
      });
      if (clients.length === 0) {
        console.info(
          "No clients are listening for messages, dropping message",
          message,
        );
      }
    });
}

const throttledServiceWorkerStarted = throttleImmediately(() => {
  broadcastMessage({
    type: "service-worker-started",
  });
}, 100);

self.addEventListener("fetch", (event: any) => {
  if (!isConfigured()) {
    throttledServiceWorkerStarted();
  }

  // Always delegate to the proxy router
  proxyRouter.onFetch(event);
});

// Service worker lifecycle management
self.addEventListener("install", (event: any) => {
  console.log("Installing service worker...");
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log("Now pre-caching client files");
      await cache.addAll(
        Object.values<string>(precacheFiles).map(
          (url) => new Request(url, { cache: "reload" }),
        ),
      );
      console.log(Object.keys(precacheFiles).length, "client files cached");
      // @ts-expect-error: Force the waiting service worker to become the active service worker
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event: any) => {
  console.log("Activating new service worker!");

  if (!isConfigured()) {
    throttledServiceWorkerStarted();
  }

  event.waitUntil(
    (async () => {
      // Flush old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Removing old cache", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
      // @ts-expect-error: Take control of all clients as soon as the service worker activates
      await clients.claim();
    })(),
  );
});

// Web Push (spec §5, §5.1). The sidecar's `push/send` (a separate repo,
// `knowledge-substrate`, built by a sibling leaf) delivers `{title, body,
// url}` as the push message's JSON payload — this just renders it and
// routes a click on the resulting notification back into the app. The
// one-time subscribe flow that registers for push in the first place lives
// client-side in `client/lib/push_subscribe.ts`, wired up from
// `client/editor_ui.tsx`'s floating-toolbar toggle; nothing about that
// subscribe step happens here.
self.addEventListener("push", (event: any) => {
  let payload: { title?: string; body?: string; url?: string } = {};
  try {
    payload = event.data?.json() ?? {};
  } catch (e) {
    // Not JSON (or no data at all) — fall back to a generic notification
    // rather than dropping the push silently.
    console.warn("Push event had no parseable JSON payload", e);
  }
  const title = payload.title || "SilverBullet";
  event.waitUntil(
    // @ts-expect-error: service worker API
    self.registration.showNotification(title, {
      body: payload.body,
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const url: string = event.notification.data?.url || "/";
  event.waitUntil(
    (async () => {
      // @ts-expect-error: service worker API
      const allClients: any[] = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const targetHref = new URL(url, self.location.origin).href;
      const existing = allClients.find((c) => c.url === targetHref);
      if (existing) {
        await existing.focus();
        return;
      }
      // @ts-expect-error: service worker API
      await self.clients.openWindow(url);
    })(),
  );
});

console.log("Service worker loaded");

function isConfigured() {
  return !!proxyRouter.syncEngine;
}
