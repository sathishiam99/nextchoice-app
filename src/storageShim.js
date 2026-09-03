// NextChoice was originally built as a Claude.ai artifact, where persistence
// is provided by a host-injected `window.storage` API (get/set/delete/list,
// each scoped by a `shared` boolean). Outside of Claude.ai there's no host to
// inject that API, so this shim recreates the same shape on top of the
// browser's built-in localStorage. App.jsx is unmodified — it just keeps
// calling `window.storage.get(...)` / `.set(...)` as before.
//
// Only `shared: false` (personal, per-device) storage is used by this app,
// so this shim keeps everything in plain localStorage under a prefixed key.

const PREFIX = "nextchoice:";

function storageKey(key, shared) {
  return `${PREFIX}${shared ? "shared:" : "personal:"}${key}`;
}

const storage = {
  async get(key, shared = false) {
    const raw = localStorage.getItem(storageKey(key, shared));
    if (raw === null) return null;
    return { key, value: raw, shared };
  },

  async set(key, value, shared = false) {
    localStorage.setItem(storageKey(key, shared), value);
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    const k = storageKey(key, shared);
    const existed = localStorage.getItem(k) !== null;
    localStorage.removeItem(k);
    return { key, deleted: existed, shared };
  },

  async list(prefix = "", shared = false) {
    const fullPrefix = storageKey(prefix, shared);
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(fullPrefix)) {
        keys.push(k.slice(storageKey("", shared).length));
      }
    }
    return { keys, prefix, shared };
  },
};

if (typeof window !== "undefined") {
  window.storage = storage;
}

export default storage;
