/**
 * Web Push subscribe flow (spec §5, §5.1). Pure/functional helpers plus one
 * effectful `subscribeToPush`: request Notification permission, subscribe
 * via the browser's PushManager, and POST the resulting subscription to the
 * sidecar's `/push/subscribe` endpoint. No server/sidecar code lives here —
 * this is the client half only. The sidecar (Node, `knowledge-substrate`
 * repo, built by a sibling leaf) owns `/push/subscribe` + `/push/send` per
 * the shared contract; only the former is called from here.
 *
 * Configuration is intentionally NOT hardcoded — both the VAPID public key
 * and the sidecar's base URL are unknown at the time this client code was
 * written (the sidecar is being built in parallel). Callers thread both
 * values in explicitly (see `client/editor_ui.tsx`'s push toggle), sourced
 * from `BootConfig.vapidPublicKey` / `BootConfig.pushSidecarUrl`
 * (`client/types/ui.ts`), which are populated at build time from the
 * `VAPID_PUBLIC_KEY` / `PUSH_SIDECAR_URL` env vars — see
 * `build/build_client.ts`'s `patchPushConfig()` and `augmentBootConfig` in
 * `client/boot.ts`. Until those env vars are set, both fields are "" and
 * the toggle renders as "not configured" rather than guessing a key.
 */

/** Why a subscribe (or an availability check) didn't result in an active subscription. */
export type PushUnavailableReason =
  | "unsupported"
  | "not-configured"
  | "denied";

export type PushSubscribeResult =
  | { ok: true }
  | {
    ok: false;
    reason: PushUnavailableReason | "subscribe-failed" | "post-failed";
    detail?: string;
  };

/** Whether this browser/context can possibly support Web Push at all. */
export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in globalThis &&
    "Notification" in globalThis
  );
}

/**
 * Decode a base64url-encoded VAPID public key into the raw byte array
 * `PushManager.subscribe`'s `applicationServerKey` requires. Standard
 * conversion for the Web Push VAPID flow (spec §5.1) — browsers accept only
 * a `Uint8Array`/`ArrayBuffer`, never the base64url string form the key is
 * normally distributed in.
 */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

/** Does the given registration currently have an active push subscription? */
export async function getPushSubscriptionState(
  registration: ServiceWorkerRegistration,
): Promise<"subscribed" | "unsubscribed"> {
  const existing = await registration.pushManager.getSubscription();
  return existing ? "subscribed" : "unsubscribed";
}

/** Local unsubscribe — does not notify the sidecar (no such endpoint in the contract). */
export async function unsubscribeFromPush(
  registration: ServiceWorkerRegistration,
): Promise<boolean> {
  const existing = await registration.pushManager.getSubscription();
  if (!existing) return true;
  return existing.unsubscribe();
}

/**
 * The one-time subscribe flow: request permission, subscribe, POST to the
 * sidecar. Never throws — every failure mode (unsupported browser, denied
 * permission, missing config, subscribe failure, network failure posting to
 * the sidecar) comes back as a typed `{ ok: false, reason, detail? }`
 * instead, so callers can render a clear disabled/unavailable state rather
 * than crash.
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  options: { vapidPublicKey: string; sidecarUrl: string },
): Promise<PushSubscribeResult> {
  if (!isPushSupported()) {
    return { ok: false, reason: "unsupported" };
  }
  if (!options.vapidPublicKey || !options.sidecarUrl) {
    return { ok: false, reason: "not-configured" };
  }

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: "denied" };
  }

  let subscription: PushSubscription;
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast: lib.dom's `BufferSource` excludes `SharedArrayBuffer`-backed
      // views, which `Uint8Array<ArrayBufferLike>`'s generic can't rule out
      // structurally even though this one is always a plain `ArrayBuffer`
      // (built fresh by `Uint8Array.from` above, never shared).
      applicationServerKey: urlBase64ToUint8Array(
        options.vapidPublicKey,
      ) as BufferSource,
    });
  } catch (e: any) {
    return { ok: false, reason: "subscribe-failed", detail: e?.message };
  }

  try {
    const resp = await fetch(
      `${options.sidecarUrl.replace(/\/$/, "")}/push/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      },
    );
    if (!resp.ok) {
      return { ok: false, reason: "post-failed", detail: `HTTP ${resp.status}` };
    }
  } catch (e: any) {
    return { ok: false, reason: "post-failed", detail: e?.message };
  }

  return { ok: true };
}
